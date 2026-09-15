import { formatLocationResponse } from 'src/location/location.service';
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Prisma, TourType } from '@prisma/client';
import { TourWithLocations } from 'src/types/tour.type';
import { type } from 'os';

type UploadFiles = {
    mainImage?: Express.Multer.File[];
    images?: Express.Multer.File[];
};

export function formatTourResponse(tour: any) {
    if (!tour) return tour;

    const locations = tour.locations?.map((tl: any) => ({
        ...tl,
        location: tl.location ? formatLocationResponse(tl.location) : tl.location,
    }));

    return {
        ...tour,
        ...(locations ? { locations } : {}),
    };
}

@Injectable()
export class TourService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    private extractWaypoints(locationSlug: string): string[] {
        const withoutSuffix = locationSlug.replace(/-(transfer|location)$/, '');
        const parts = withoutSuffix.split('-');
        if (parts.length === 0) return [];

        const origin = parts[0];
        return parts.filter((p) => p !== origin);
    }

    private buildBaseSlug(locationSlugs: string[]): string {
        const allWaypoints = locationSlugs.flatMap((s) =>
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
            });

            if (!existing) return candidate;

            counter++;
            candidate = `${base}-${counter}`;
        }
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    /**
     * Create a Tour:
     *  1. Upload mainImage and additional images to Cloudinary (folder: "tours").
     *  2. Validate all locationIds exist and fetch their slugs.
     *  3. Generate a unique tour slug from the location slugs.
     *  4. Wrap Tour + TourLocation creation in a Prisma transaction.
     */
    async create(
        dto: CreateTourDto,
        files?: UploadFiles,
    ): Promise<TourWithLocations> {
        const { locationIds, transferIds, mainImage, tagIds, images, minimumPrice, entranceFees, features, starRating: dtoStarRating, mealOptions: dtoMealOptions, ...rest } = dto as any;
        const targetLocationIds = locationIds || transferIds || [];

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

        // ── Validate & order locations ───────────────────────────────────────
        const locations = await this.prisma.location.findMany({
            where: { id: { in: targetLocationIds } },
            select: { id: true, slug: true },
        });

        if (locations.length !== targetLocationIds.length) {
            const foundIds = new Set(locations.map((t) => t.id));
            const missing = targetLocationIds.filter((id: string) => !foundIds.has(id));
            throw new BadRequestException(
                `Locations not found: ${missing.join(', ')}`,
            );
        }

        // Preserve caller-supplied order
        const orderedLocations = targetLocationIds.map(
            (id: string) => locations.find((t) => t.id === id)!,
        );

        // ── Generate unique slug ─────────────────────────────────────────────
        const baseSlug = this.buildBaseSlug(orderedLocations.map((t) => t.slug));
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
                    ...(entranceFees  !== undefined ? { entranceFees } : {}),
                    ...(features !== undefined ? { features } : {}),

                    ...(parsedTagIds?.length && {
                        tags: {
                            connect: parsedTagIds.map((id: string) => ({ id })),
                        },
                    }),
                },
            });

            await tx.tourLocation.createMany({
                data: orderedLocations.map((t, index) => ({
                    tourId: created.id,
                    locationId: t.id,
                    order: index + 1,
                })),
            });

            return tx.tour.findUniqueOrThrow({
                where: { id: created.id },
                include: {
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                },
            });
        });

        return formatTourResponse(tour) as TourWithLocations;
    }

    async findAll(): Promise<TourWithLocations[]> {
        try {
            const tours = await this.prisma.tour.findMany({
                include: {
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                    tags: true,
                },
            });
            return tours.map((t) => formatTourResponse(t)) as TourWithLocations[];
        } catch (error: any) {
            console.error('Error in TourService.findAll:', error);
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch tours',
            );
        }
    }

    async findByType(type: TourType): Promise<TourWithLocations[]> {
        if (!Object.values(TourType).includes(type)) {
            throw new BadRequestException(
                `Invalid tour type "${type}". Supported types are: ${Object.values(TourType).join(', ')}`,
            );
        }

        try {
            const tours = await this.prisma.tour.findMany({
                where: { type },
                include: {
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                    tags: true,
                },
            });
            return tours.map((t) => formatTourResponse(t)) as TourWithLocations[];
        } catch (error: any) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error in TourService.findByType:', error);
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch tours by type',
            );
        }
    }

    async findOne(id: string): Promise<TourWithLocations> {
        try {
            let tour = await this.prisma.tour.findUnique({
                where: { id },
                include: {
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                    tags: true,
                },
            }).catch(() => null);

            if (!tour) {
                tour = await this.prisma.tour.findFirst({
                    where: { slug: id },
                    include: {
                        locations: {
                            orderBy: { order: 'asc' },
                            include: { location: true },
                        },
                        tags: true,
                    },
                });
            }

            if (!tour) {
                throw new NotFoundException(`Tour with id "${id}" not found`);
            }

            return formatTourResponse(tour) as TourWithLocations;
        } catch (error: any) {
            if (error instanceof NotFoundException) throw error;
            console.error(`Error in TourService.findOne(${id}):`, error);
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch tour',
            );
        }
    }

    async findBySlug(slug: string): Promise<TourWithLocations> {
        try {
            const tour = await this.prisma.tour.findFirst({
                where: { slug },
                include: {
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                    tags: true,
                },
            });

            if (!tour) {
                throw new NotFoundException(`Tour with slug "${slug}" not found`);
            }

            return formatTourResponse(tour) as TourWithLocations;
        } catch (error: any) {
            if (error instanceof NotFoundException) throw error;
            console.error(`Error in TourService.findBySlug(${slug}):`, error);
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch tour',
            );
        }
    }

    async findPopular(): Promise<TourWithLocations[]> {
        try {
            const tours = await this.prisma.tour.findMany({
                where: {
                    tags: {
                        some: {
                            enName: 'Popular',
                        },
                    },
                    type: TourType.TOUR,
                },
                take: 4,
                include: {
                    tags: true,
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                },
            });
            return tours.map((t) => formatTourResponse(t)) as TourWithLocations[];
        } catch (error: any) {
            console.error('Error in TourService.findPopular:', error);
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch popular tours',
            );
        }
    }

    async update(
        id: string,
        dto: UpdateTourDto,
        files?: UploadFiles,
    ): Promise<TourWithLocations> {
        const existing = await this.prisma.tour.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException(`Tour with id "${id}" not found`);
        }

        const { locationIds, transferIds, mainImage, tagIds, images, minimumPrice, entranceFees, features, starRating: dtoStarRating, mealOptions: dtoMealOptions, ...rest } = dto as any;
        const targetLocationIds = locationIds || transferIds;

        // Compute isOvernight and clean starRating/mealOptions if necessary
        const durationStr = dto.duration !== undefined ? dto.duration : (existing as any).duration;
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
        //    then keeps the existing DB value ─────────────────────────────────
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
            existingImagesKept = (existing.images as string[]) || [];
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

            if (targetLocationIds && targetLocationIds.length > 0) {
                const locations = await tx.location.findMany({
                    where: { id: { in: targetLocationIds } },
                    select: { id: true, slug: true },
                });

                if (locations.length !== targetLocationIds.length) {
                    const foundIds = new Set(locations.map((t) => t.id));
                    const missing = targetLocationIds.filter((tid: string) => !foundIds.has(tid));
                    throw new BadRequestException(
                        `Locations not found: ${missing.join(', ')}`,
                    );
                }

                const ordered = targetLocationIds.map(
                    (tid: string) => locations.find((t) => t.id === tid)!,
                );

                const base = this.buildBaseSlug(ordered.map((t) => t.slug));
                slug = await this.ensureUniqueSlug(base, id);

                await tx.tourLocation.deleteMany({ where: { tourId: id } });
                await tx.tourLocation.createMany({
                    data: ordered.map((t, index) => ({
                        tourId: id,
                        locationId: t.id,
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
                    ...(features !== undefined ? { features } : {}),
                    ...(parsedTagIds?.length && {
                        tags: {
                            set: parsedTagIds.map((id: string) => ({ id })),
                        },
                    }),
                },
                include: {
                    locations: {
                        orderBy: { order: 'asc' },
                        include: { location: true },
                    },
                },
            });
        });

        return tour as TourWithLocations;
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
        const tours = await this.prisma.tour.findMany({
            where: {
                OR: [
                    { enTitle: { contains: q, mode: 'insensitive' } },
                    { ruTitle: { contains: q, mode: 'insensitive' } },
                    { hyTitle: { contains: q, mode: 'insensitive' } },
                ],
            },
            skip,
            take: limit,
            select: {
                id: true,
                slug: true,
                enTitle: true,
                ruTitle: true,
                hyTitle: true,
                mainImage: true,
                type: true,
            },
        });
        return tours.map((t) => formatTourResponse(t));
    }

    async searchCount(q: string): Promise<number> {
        return this.prisma.tour.count({
            where: {
                OR: [
                    { enTitle: { contains: q, mode: 'insensitive' } },
                    { ruTitle: { contains: q, mode: 'insensitive' } },
                    { hyTitle: { contains: q, mode: 'insensitive' } },
                ],
            },
        });
    }
}
