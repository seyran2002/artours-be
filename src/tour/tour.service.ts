import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Prisma } from '@prisma/client';
import { TourWithTransfers } from 'src/types/tour.type';

type UploadFiles = {
    mainImage?: Express.Multer.File[];
    images?: Express.Multer.File[];
};

@Injectable()
export class TourService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    private extractWaypoints(transferSlug: string): string[] {
        const withoutSuffix = transferSlug.replace(/-transfer$/, '');
        const parts = withoutSuffix.split('-');
        if (parts.length === 0) return [];

        const origin = parts[0];
        return parts.filter((p) => p !== origin);
    }

    private buildBaseSlug(transferSlugs: string[]): string {
        const allWaypoints = transferSlugs.flatMap((s) =>
            this.extractWaypoints(s),
        );

        // Remove consecutive duplicates
        const deduped = allWaypoints.filter(
            (node, i) => i === 0 || node !== allWaypoints[i - 1],
        );

        return deduped.join('-') + '-tour';
    }

    private async ensureUniqueSlug(
        base: string,
        excludeId?: string,
    ): Promise<string> {
        let candidate = base;
        let counter = 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const existing = await this.prisma.tour.findFirst({
                where: {
                    slug: candidate,
                    ...(excludeId ? { NOT: { id: excludeId } } : {}),
                },
                select: { id: true },
            });

            if (!existing) return candidate;

            counter += 1;
            candidate = `${base}-${counter}`;
        }
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /**
     * Create a tour atomically:
     *  1. Upload images to Cloudinary.
     *  2. Validate all transferIds exist and fetch their slugs.
     *  3. Generate a unique tour slug from the transfer slugs.
     *  4. Wrap Tour + TourTransfer creation in a Prisma transaction.
     */
    async create(
        dto: CreateTourDto,
        files?: UploadFiles,
    ): Promise<TourWithTransfers> {
        const { transferIds, mainImage, tagIds, images, minimumPrice, entranceFees, starRating: dtoStarRating, mealOptions: dtoMealOptions, ...rest } = dto;

        // Compute isOvernight and clean starRating/mealOptions if necessary
        let isOvernight = false;
        let starRating: number | null = dtoStarRating ?? null;
        let mealOptions: any = dtoMealOptions ?? null;

        if (dto.duration) {
            try {
                const parsedDuration = typeof dto.duration === 'string' ? JSON.parse(dto.duration) : dto.duration;
                const days = parsedDuration?.days ?? 0;
                isOvernight = days > 1;
            } catch (e) {
                // ignore
            }
        }

        if (!isOvernight) {
            starRating = null;
            mealOptions = Prisma.JsonNull;
        } else {
            mealOptions = mealOptions !== null ? mealOptions : Prisma.JsonNull;
        }

        // ── mainImage: file upload takes priority, falls back to dto value ───
        let mainImageUrl: string | undefined = dto.mainImage;
        if (files?.mainImage && files.mainImage.length > 0) {
            const uploadResult = await this.cloudinaryService.uploadImage(
                files.mainImage[0],
                'tours',
            );
            mainImageUrl = uploadResult.secureUrl || '';
        }
        if (!mainImageUrl) {
            throw new BadRequestException('mainImage is required');
        }

        // ── images: upload new files, merge with any pre-existing URLs ───────
        let imageUrls: string[] = [];
        if (files?.images && files.images.length > 0) {
            imageUrls = await this.cloudinaryService.uploadMultipleAndGetUrls(
                files.images,
                'tours',
            );
        }

        let dtoImages: string[] = [];
        if (images) {
            if (typeof images === 'string') {
                try { dtoImages = JSON.parse(images); } catch { dtoImages = [images]; }
            } else if (Array.isArray(images)) {
                dtoImages = images;
            }
        }
        const finalImages = [...dtoImages, ...imageUrls];

        // ── Validate & order transfers ───────────────────────────────────────
        const transfers = await this.prisma.transfer.findMany({
            where: { id: { in: transferIds } },
            select: { id: true, slug: true },
        });

        if (transfers.length !== transferIds.length) {
            const foundIds = new Set(transfers.map((t) => t.id));
            const missing = transferIds.filter((id) => !foundIds.has(id));
            throw new BadRequestException(
                `Transfers not found: ${missing.join(', ')}`,
            );
        }

        // Preserve caller-supplied order
        const orderedTransfers = transferIds.map(
            (id) => transfers.find((t) => t.id === id)!,
        );

        // ── Generate unique slug ─────────────────────────────────────────────
        const baseSlug = this.buildBaseSlug(orderedTransfers.map((t) => t.slug));
        const slug = await this.ensureUniqueSlug(baseSlug);

        const parsedTagIds = typeof tagIds === 'string' ? JSON.parse(tagIds) : tagIds;

        // ── Atomic transaction ───────────────────────────────────────────────
        const tour = await this.prisma.$transaction(async (tx) => {
            const created = await tx.tour.create({
                data: {
                    ...rest,
                    slug,
                    mainImage: mainImageUrl,
                    images: finalImages,
                    minimumPrice: Number(minimumPrice),
                    isOvernight,
                    starRating,
                    mealOptions,
                    ...(entranceFees ? { entranceFees } : {}),

                    ...(parsedTagIds?.length && {
                        tags: {
                            connect: parsedTagIds.map(id => ({ id })),
                        },
                    }),
                },
            });

            await tx.tourTransfer.createMany({
                data: orderedTransfers.map((t, index) => ({
                    tourId: created.id,
                    transferId: t.id,
                    order: index + 1,
                })),
            });

            return tx.tour.findUniqueOrThrow({
                where: { id: created.id },
                include: {
                    transfers: {
                        orderBy: { order: 'asc' },
                        include: { transfer: true },
                    },
                },
            });
        });

        return tour as TourWithTransfers;
    }

    async findAll(): Promise<TourWithTransfers[]> {
        const tours = await this.prisma.tour.findMany({
            include: {
                transfers: {
                    orderBy: { order: 'asc' },
                    include: { transfer: true },
                },
                tags: true,
            },
        });
        return tours as TourWithTransfers[];
    }

    async findOne(id: string): Promise<TourWithTransfers> {
        const tour = await this.prisma.tour.findUnique({
            where: { id },
            include: {
                transfers: {
                    orderBy: { order: 'asc' },
                    include: { transfer: true },
                },
            },
        });

        if (!tour) {
            throw new NotFoundException(`Tour with id "${id}" not found`);
        }

        return tour as TourWithTransfers;
    }

    async findBySlug(slug: string): Promise<TourWithTransfers> {
        const tour = await this.prisma.tour.findFirst({
            where: { slug },
            include: {
                transfers: {
                    orderBy: { order: 'asc' },
                    include: { transfer: true },
                },
            },
        });

        if (!tour) {
            throw new NotFoundException(`Tour with slug "${slug}" not found`);
        }

        return tour as TourWithTransfers;
    }

    async findPopular(): Promise<TourWithTransfers[]> {
        return await this.prisma.tour.findMany({
            where: {
                tags: {
                    some: {
                        enName: 'Popular',
                    },
                },
            },
            take: 4,
            include: {
                tags: true,
                transfers: {
                    include: { transfer: true },
                },
            },
        }) as TourWithTransfers[];
    }

    async update(
        id: string,
        dto: UpdateTourDto,
        files?: UploadFiles,
    ): Promise<TourWithTransfers> {
        const existing = await this.prisma.tour.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Tour with id "${id}" not found`);
        }

        const { transferIds, mainImage, tagIds, images, minimumPrice, entranceFees, starRating: dtoStarRating, mealOptions: dtoMealOptions, ...rest } = dto;

        // Compute isOvernight and clean starRating/mealOptions if necessary
        const durationStr = dto.duration !== undefined ? dto.duration : existing.duration;
        let isOvernight = existing.isOvernight;
        if (durationStr) {
            try {
                const parsedDuration = typeof durationStr === 'string' ? JSON.parse(durationStr) : durationStr;
                const days = parsedDuration?.days ?? 0;
                isOvernight = days > 1;
            } catch (e) {
                // ignore
            }
        }

        let starRating = existing.starRating;
        let mealOptions = existing.mealOptions;

        if (dtoStarRating !== undefined) {
            starRating = dtoStarRating ?? null;
        }
        if (dtoMealOptions !== undefined) {
            mealOptions = dtoMealOptions ?? null;
        }

        if (!isOvernight) {
            starRating = null;
            mealOptions = null;
        } else {
            mealOptions = mealOptions !== null ? mealOptions : null;
        }

        // ── mainImage: file upload takes priority, falls back to dto value,
        //    then keeps the existing DB value (transfer pattern) ─────────────
        let mainImageUrl = existing.mainImage;
        if (files?.mainImage && files.mainImage.length > 0) {
            const uploadResult = await this.cloudinaryService.uploadImage(
                files.mainImage[0],
                'tours',
            );
            mainImageUrl = uploadResult.secureUrl;
        } else if (mainImage !== undefined) {
            mainImageUrl = mainImage;
        }

        // ── images: keep dto-provided URLs + upload new files ────────────────
        let existingImagesKept: string[] = [];
        if (images !== undefined) {
            if (typeof images === 'string') {
                try { existingImagesKept = JSON.parse(images); } catch { existingImagesKept = [images]; }
            } else if (Array.isArray(images)) {
                existingImagesKept = images;
            }
        } else {
            existingImagesKept = existing.images || [];
        }

        let newImageUrls: string[] = [];
        if (files?.images && files.images.length > 0) {
            newImageUrls = await this.cloudinaryService.uploadMultipleAndGetUrls(
                files.images,
                'tours',
            );
        }
        const finalImages = [...existingImagesKept, ...newImageUrls];

        const tour = await this.prisma.$transaction(async (tx) => {
            let slug = existing.slug;

            if (transferIds && transferIds.length > 0) {
                const transfers = await tx.transfer.findMany({
                    where: { id: { in: transferIds } },
                    select: { id: true, slug: true },
                });

                if (transfers.length !== transferIds.length) {
                    const foundIds = new Set(transfers.map((t) => t.id));
                    const missing = transferIds.filter((tid) => !foundIds.has(tid));
                    throw new BadRequestException(
                        `Transfers not found: ${missing.join(', ')}`,
                    );
                }

                const ordered = transferIds.map(
                    (tid) => transfers.find((t) => t.id === tid)!,
                );

                const base = this.buildBaseSlug(ordered.map((t) => t.slug));
                slug = await this.ensureUniqueSlug(base, id);

                await tx.tourTransfer.deleteMany({ where: { tourId: id } });
                await tx.tourTransfer.createMany({
                    data: ordered.map((t, index) => ({
                        tourId: id,
                        transferId: t.id,
                        order: index + 1,
                    })),
                });
            }

            const parsedTagIds = typeof tagIds === 'string' ? JSON.parse(tagIds) : tagIds;

            return tx.tour.update({
                where: { id },
                data: {
                    ...rest,
                    slug,
                    mainImage: mainImageUrl,
                    images: finalImages,
                    isOvernight,
                    starRating,
                    mealOptions,
                    ...(minimumPrice !== undefined ? { minimumPrice: Number(minimumPrice) } : {}),
                    ...(entranceFees !== undefined ? { entranceFees } : {}),
                    ...(parsedTagIds?.length && {
                        tags: {
                            set: parsedTagIds.map(id => ({ id })),
                        },
                    }),
                },
                include: {
                    transfers: {
                        orderBy: { order: 'asc' },
                        include: { transfer: true },
                    },
                },
            });
        });

        return tour as TourWithTransfers;
    }

    async remove(id: string): Promise<{ id: string }> {
        const existing = await this.prisma.tour.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Tour with id "${id}" not found`);
        }
        await this.prisma.tour.delete({ where: { id } });
        return { id };
    }

    async search(q: string, limit: number, skip: number) {
        return await this.prisma.tour.findMany({
            where: {
                OR: [
                    { enTitle: { contains: q, mode: 'insensitive' } },
                    { ruTitle: { contains: q, mode: 'insensitive' } },
                ],
            },
            skip,
            take: limit,
            select: {
                id: true,
                slug: true,
                enTitle: true,
                ruTitle: true,
                mainImage: true,
            },
        });
    }

    async searchCount(q: string): Promise<number> {
        return this.prisma.tour.count({
            where: {
                OR: [
                    { enTitle: { contains: q, mode: 'insensitive' } },
                    { ruTitle: { contains: q, mode: 'insensitive' } },
                ],
            },
        });
    }
}
