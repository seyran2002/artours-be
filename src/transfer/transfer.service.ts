import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class TransferService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }


    async create(
        dto: CreateTransferDto,

        files?: { mainImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
    ) {
        let mainImageUrl: string | undefined = dto.mainImage;
        if (files?.mainImage && files.mainImage.length > 0) {
            const uploadResult = await this.cloudinaryService.uploadImage(files.mainImage[0]);
            mainImageUrl = uploadResult.secureUrl || '';
        }
        if (!mainImageUrl) {
            throw new BadRequestException('mainImage is required');
        }

        let imageUrls: string[] = [];
        if (files?.images && files.images.length > 0) {
            imageUrls = await this.cloudinaryService.uploadMultipleAndGetUrls(files.images);
        }

        let dtoImages: string[] = [];
        if (dto.images) {
            if (typeof dto.images === 'string') {
                try {
                    dtoImages = JSON.parse(dto.images);
                } catch {
                    dtoImages = [dto.images];
                }
            } else if (Array.isArray(dto.images)) {
                dtoImages = dto.images;
            }
        }
        const finalImages = [...dtoImages, ...imageUrls];

        const { fromCity, toCity, tagIds, entranceFees, mainImage, images, ...rest } = dto;

        const distanceFromYerevan = rest.distanceFromYerevan !== undefined ? Number(rest.distanceFromYerevan) : undefined;
        const minimumPrice = rest.minimumPrice !== undefined ? Number(rest.minimumPrice) : 0;
        const parsedTagIds = typeof tagIds === 'string' ? JSON.parse(tagIds) : tagIds;

        const slugFrom = (fromCity || 'from')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const slugTo = (toCity || 'to')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const slug = `${slugFrom}-${slugTo}-transfer`;

        return this.prisma.transfer.create({
            data: {
                ...rest,
                fromLat: Number(rest.fromLat),
                fromLng: Number(rest.fromLng),
                toLat: Number(rest.toLat),
                toLng: Number(rest.toLng),
                distanceFromYerevan,
                minimumPrice,
                mainImage: mainImageUrl,
                images: finalImages,
                slug,

                ...(entranceFees?.length && {
                    entranceFees: entranceFees,
                }),

                ...(parsedTagIds?.length && {
                    tags: {
                        connect: parsedTagIds.map(id => ({ id })),
                    },
                }),
            },
        });
    }

    async findAll() {
        return this.prisma.transfer.findMany({
            include: {
                tags: true,
            },
        });
    }

    async findOne(id: string) {
        const transfer = await this.prisma.transfer.findUnique({
            where: { id },
            include: {
                tags: true,
            },
        })

        if (!transfer) {
            throw new NotFoundException('Transfer not found')
        }

        return transfer
    }

    async findPopular() {
        return this.prisma.transfer.findMany({
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
            },
        })
    }

    async update(
        id: string,
        dto: UpdateTransferDto,
        files?: { mainImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
    ) {
        const existing = await this.prisma.transfer.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new BadRequestException(`Transfer with ID ${id} not found`);
        }

        let mainImageUrl = existing.mainImage;
        if (files?.mainImage && files.mainImage.length > 0) {
            const uploadResult = await this.cloudinaryService.uploadImage(files.mainImage[0]);
            mainImageUrl = uploadResult.secureUrl;
        } else if (dto.mainImage !== undefined) {
            mainImageUrl = dto.mainImage;
        }

        let existingImagesKept: string[] | Express.Multer.File[] = [];
        if (dto.images !== undefined) {
            if (typeof dto.images === 'string') {
                try {
                    existingImagesKept = JSON.parse(dto.images);
                } catch {
                    existingImagesKept = [dto.images];
                }
            } else if (Array.isArray(dto.images)) {
                existingImagesKept = dto.images;
            }
        } else {
            existingImagesKept = existing.images || [];
        }

        let newImageUrls: string[] = [];
        if (files?.images && files.images.length > 0) {
            newImageUrls = await this.cloudinaryService.uploadMultipleAndGetUrls(files.images);
        }
        const finalImages = [...existingImagesKept, ...newImageUrls];

        const { fromCity, toCity, tagIds, entranceFees, mainImage, images, ...rest } = dto;

        const parsedTagIds = typeof tagIds === 'string' ? JSON.parse(tagIds) : tagIds;

        const updateData: any = {
            ...rest,
            mainImage: mainImageUrl,
            images: finalImages,
            ...(entranceFees?.length && {
                entranceFees: entranceFees,
            }),
            ...(parsedTagIds?.length && {
                tags: {
                    set: parsedTagIds.map(id => ({ id })),
                },
            }),
        };

        if (rest.fromLat !== undefined) {
            updateData.fromLat = rest.fromLat !== null ? Number(rest.fromLat) : null;
        }
        if (rest.fromLng !== undefined) {
            updateData.fromLng = rest.fromLng !== null ? Number(rest.fromLng) : null;
        }
        if (rest.toLat !== undefined) {
            updateData.toLat = rest.toLat !== null ? Number(rest.toLat) : null;
        }
        if (rest.toLng !== undefined) {
            updateData.toLng = rest.toLng !== null ? Number(rest.toLng) : null;
        }

        if (rest.distanceFromYerevan !== undefined) {
            updateData.distanceFromYerevan = rest.distanceFromYerevan !== null ? Number(rest.distanceFromYerevan) : null;
        }
        if (rest.minimumPrice !== undefined) {
            updateData.minimumPrice = rest.minimumPrice !== null ? Number(rest.minimumPrice) : null;
        }

        return this.prisma.transfer.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(id: string) {
        return this.prisma.transfer.delete({
            where: { id },
        });
    }

    async search(q: string, limit: number, skip: number) {
        return await this.prisma.transfer.findMany({
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
        return this.prisma.transfer.count({
            where: {
                OR: [
                    { enTitle: { contains: q, mode: 'insensitive' } },
                    { ruTitle: { contains: q, mode: 'insensitive' } },
                ],
            },
        });
    }
}
