import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class LocationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    private parsePlaceField(field: any) {
        if (!field) return null;
        if (typeof field === 'string') {
            try {
                return JSON.parse(field);
            } catch {
                return field;
            }
        }
        return field;
    }

    private extractPlaceData(dto: any) {
        const fromPlaceObj = this.parsePlaceField(dto.fromPlace);
        const toPlaceObj = this.parsePlaceField(dto.toPlace);
        const nameObj = this.parsePlaceField(dto.name);
        const addressObj = this.parsePlaceField(dto.address);
        const locationObj = this.parsePlaceField(dto.location);

        // FROM fields
        const fromPlaceId = dto.fromPlaceId ?? fromPlaceObj?.placeId ?? dto.placeId ?? '';
        const fromAddressText = dto.fromAddressText ?? fromPlaceObj?.address?.en ?? addressObj?.en ?? '';
        const fromLat = dto.fromLat !== undefined && dto.fromLat !== null ? Number(dto.fromLat) : (fromPlaceObj?.location?.lat ?? locationObj?.lat ?? 0);
        const fromLng = dto.fromLng !== undefined && dto.fromLng !== null ? Number(dto.fromLng) : (fromPlaceObj?.location?.lng ?? locationObj?.lng ?? 0);

        const fromAddressEn = dto.fromAddressEn ?? fromPlaceObj?.address?.en ?? addressObj?.en ?? (fromAddressText || null);
        const fromAddressRu = dto.fromAddressRu ?? fromPlaceObj?.address?.ru ?? addressObj?.ru ?? null;
        const fromAddressHy = dto.fromAddressHy ?? fromPlaceObj?.address?.hy ?? addressObj?.hy ?? null;

        const fromNameEn = dto.fromNameEn ?? fromPlaceObj?.name?.en ?? nameObj?.en ?? null;
        const fromNameRu = dto.fromNameRu ?? fromPlaceObj?.name?.ru ?? nameObj?.ru ?? null;
        const fromNameHy = dto.fromNameHy ?? fromPlaceObj?.name?.hy ?? nameObj?.hy ?? null;

        // TO fields
        const toPlaceId = dto.toPlaceId ?? toPlaceObj?.placeId ?? '';
        const toAddressText = dto.toAddressText ?? toPlaceObj?.address?.en ?? '';
        const toLat = dto.toLat !== undefined && dto.toLat !== null ? Number(dto.toLat) : (toPlaceObj?.location?.lat ?? 0);
        const toLng = dto.toLng !== undefined && dto.toLng !== null ? Number(dto.toLng) : (toPlaceObj?.location?.lng ?? 0);

        const toAddressEn = dto.toAddressEn ?? toPlaceObj?.address?.en ?? null;
        const toAddressRu = dto.toAddressRu ?? toPlaceObj?.address?.ru ?? null;
        const toAddressHy = dto.toAddressHy ?? toPlaceObj?.address?.hy ?? null;

        const toNameEn = dto.toNameEn ?? toPlaceObj?.name?.en ?? null;
        const toNameRu = dto.toNameRu ?? toPlaceObj?.name?.ru ?? null;
        const toNameHy = dto.toNameHy ?? toPlaceObj?.name?.hy ?? null;

        return {
            fromPlaceId,
            fromAddressText,
            fromLat,
            fromLng,
            fromAddressEn,
            fromAddressRu,
            fromAddressHy,
            fromNameEn,
            fromNameRu,
            fromNameHy,
            toPlaceId,
            toAddressText,
            toLat,
            toLng,
            toAddressEn,
            toAddressRu,
            toAddressHy,
            toNameEn,
            toNameRu,
            toNameHy,
        };
    }

    private formatLocationResponse(location: any) {
        if (!location) return location;

        const fromPlace = {
            placeId: location.fromPlaceId || '',
            name: {
                en: location.fromNameEn ?? null,
                ru: location.fromNameRu ?? null,
                hy: location.fromNameHy ?? null,
            },
            address: {
                en: location.fromAddressEn ?? null,
                ru: location.fromAddressRu ?? null,
                hy: location.fromAddressHy ?? null,
            },
            location: {
                lat: location.fromLat,
                lng: location.fromLng,
            },
        };

        const toPlace = {
            placeId: location.toPlaceId || '',
            name: {
                en: location.toNameEn ?? null,
                ru: location.toNameRu ?? null,
                hy: location.toNameHy ?? null,
            },
            address: {
                en: location.toAddressEn ?? null,
                ru: location.toAddressRu ?? null,
                hy: location.toAddressHy ?? null,
            },
            location: {
                lat: location.toLat,
                lng: location.toLng,
            },
        };

        const name = {
            en: location.fromNameEn ?? location.toNameEn ?? null,
            ru: location.fromNameRu ?? location.toNameRu ?? null,
            hy: location.fromNameHy ?? location.toNameHy ?? null,
        };

        const address = {
            en: location.fromAddressEn ?? location.toAddressEn ?? null,
            ru: location.fromAddressRu ?? location.toAddressRu ?? null,
            hy: location.fromAddressHy ?? location.toAddressHy ?? null,
        };

        return {
            ...location,
            name,
            address,
            placeId: location.fromPlaceId || location.toPlaceId || '',
            location: {
                lat: location.fromLat,
                lng: location.fromLng,
            },
            fromPlace,
            toPlace,
        };
    }

    async create(
        dto: CreateLocationDto,
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

        const {
            fromCity,
            toCity,
            tagIds,
            entranceFees,
            mainImage,
            images,
            placeId,
            name,
            address,
            location,
            fromPlace,
            toPlace,
            fromAddressEn,
            fromAddressRu,
            fromAddressHy,
            fromNameEn,
            fromNameRu,
            fromNameHy,
            toAddressEn,
            toAddressRu,
            toAddressHy,
            toNameEn,
            toNameRu,
            toNameHy,
            ...rest
        } = dto;

        const distanceFromYerevan = rest.distanceFromYerevan !== undefined ? Number(rest.distanceFromYerevan) : undefined;
        const minimumPrice = rest.minimumPrice !== undefined ? Number(rest.minimumPrice) : 0;
        const parsedTagIds = typeof tagIds === 'string' ? JSON.parse(tagIds) : tagIds;

        const placeData = this.extractPlaceData(dto);

        const slugFrom = (fromCity || placeData.fromAddressText || 'from')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const slugTo = (toCity || placeData.toAddressText || 'to')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        const slug = `${slugFrom}-${slugTo}-location`;

        const created = await this.prisma.location.create({
            data: {
                ...rest,
                fromPlaceId: placeData.fromPlaceId,
                fromAddressText: placeData.fromAddressText,
                fromLat: placeData.fromLat,
                fromLng: placeData.fromLng,
                fromAddressEn: placeData.fromAddressEn,
                fromAddressRu: placeData.fromAddressRu,
                fromAddressHy: placeData.fromAddressHy,
                fromNameEn: placeData.fromNameEn,
                fromNameRu: placeData.fromNameRu,
                fromNameHy: placeData.fromNameHy,

                toPlaceId: placeData.toPlaceId,
                toAddressText: placeData.toAddressText,
                toLat: placeData.toLat,
                toLng: placeData.toLng,
                toAddressEn: placeData.toAddressEn,
                toAddressRu: placeData.toAddressRu,
                toAddressHy: placeData.toAddressHy,
                toNameEn: placeData.toNameEn,
                toNameRu: placeData.toNameRu,
                toNameHy: placeData.toNameHy,

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
            include: {
                tags: true,
            },
        });

        return this.formatLocationResponse(created);
    }

    async findAll() {
        const locations = await this.prisma.location.findMany({
            include: {
                tags: true,
            },
        });
        return locations.map(loc => this.formatLocationResponse(loc));
    }

    async findOne(id: string) {
        const location = await this.prisma.location.findUnique({
            where: { id },
            include: {
                tags: true,
            },
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        return this.formatLocationResponse(location);
    }

    async findPopular() {
        const locations = await this.prisma.location.findMany({
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
        });
        return locations.map(loc => this.formatLocationResponse(loc));
    }

    async update(
        id: string,
        dto: UpdateLocationDto,
        files?: { mainImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
    ) {
        const existing = await this.prisma.location.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new BadRequestException(`Location with ID ${id} not found`);
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

        const {
            fromCity,
            toCity,
            tagIds,
            entranceFees,
            mainImage,
            images,
            placeId,
            name,
            address,
            location,
            fromPlace,
            toPlace,
            fromAddressEn,
            fromAddressRu,
            fromAddressHy,
            fromNameEn,
            fromNameRu,
            fromNameHy,
            toAddressEn,
            toAddressRu,
            toAddressHy,
            toNameEn,
            toNameRu,
            toNameHy,
            ...rest
        } = dto;

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

        const extracted = this.extractPlaceData(dto);

        if (dto.fromPlaceId !== undefined || dto.fromPlace !== undefined || dto.placeId !== undefined) {
            updateData.fromPlaceId = extracted.fromPlaceId;
        }
        if (dto.fromAddressText !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) {
            updateData.fromAddressText = extracted.fromAddressText;
        }
        if (dto.fromLat !== undefined || dto.fromPlace !== undefined || dto.location !== undefined) {
            updateData.fromLat = extracted.fromLat;
        }
        if (dto.fromLng !== undefined || dto.fromPlace !== undefined || dto.location !== undefined) {
            updateData.fromLng = extracted.fromLng;
        }

        if (dto.fromAddressEn !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) updateData.fromAddressEn = extracted.fromAddressEn;
        if (dto.fromAddressRu !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) updateData.fromAddressRu = extracted.fromAddressRu;
        if (dto.fromAddressHy !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) updateData.fromAddressHy = extracted.fromAddressHy;
        if (dto.fromNameEn !== undefined || dto.fromPlace !== undefined || dto.name !== undefined) updateData.fromNameEn = extracted.fromNameEn;
        if (dto.fromNameRu !== undefined || dto.fromPlace !== undefined || dto.name !== undefined) updateData.fromNameRu = extracted.fromNameRu;
        if (dto.fromNameHy !== undefined || dto.fromPlace !== undefined || dto.name !== undefined) updateData.fromNameHy = extracted.fromNameHy;

        if (dto.toPlaceId !== undefined || dto.toPlace !== undefined) updateData.toPlaceId = extracted.toPlaceId;
        if (dto.toAddressText !== undefined || dto.toPlace !== undefined) updateData.toAddressText = extracted.toAddressText;
        if (dto.toLat !== undefined || dto.toPlace !== undefined) updateData.toLat = extracted.toLat;
        if (dto.toLng !== undefined || dto.toPlace !== undefined) updateData.toLng = extracted.toLng;

        if (dto.toAddressEn !== undefined || dto.toPlace !== undefined) updateData.toAddressEn = extracted.toAddressEn;
        if (dto.toAddressRu !== undefined || dto.toPlace !== undefined) updateData.toAddressRu = extracted.toAddressRu;
        if (dto.toAddressHy !== undefined || dto.toPlace !== undefined) updateData.toAddressHy = extracted.toAddressHy;
        if (dto.toNameEn !== undefined || dto.toPlace !== undefined) updateData.toNameEn = extracted.toNameEn;
        if (dto.toNameRu !== undefined || dto.toPlace !== undefined) updateData.toNameRu = extracted.toNameRu;
        if (dto.toNameHy !== undefined || dto.toPlace !== undefined) updateData.toNameHy = extracted.toNameHy;

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

        const updated = await this.prisma.location.update({
            where: { id },
            data: updateData,
            include: {
                tags: true,
            },
        });

        return this.formatLocationResponse(updated);
    }

    async remove(id: string) {
        return this.prisma.location.delete({
            where: { id },
        });
    }

    async search(q: string, limit: number, skip: number) {
        const locations = await this.prisma.location.findMany({
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
                fromAddressEn: true,
                fromAddressRu: true,
                fromAddressHy: true,
                fromNameEn: true,
                fromNameRu: true,
                fromNameHy: true,
                toAddressEn: true,
                toAddressRu: true,
                toAddressHy: true,
                toNameEn: true,
                toNameRu: true,
                toNameHy: true,
                fromPlaceId: true,
                fromLat: true,
                fromLng: true,
                toPlaceId: true,
                toLat: true,
                toLng: true,
            },
        });
        return locations.map(loc => this.formatLocationResponse(loc));
    }

    async searchCount(q: string): Promise<number> {
        return this.prisma.location.count({
            where: {
                OR: [
                    { enTitle: { contains: q, mode: 'insensitive' } },
                    { ruTitle: { contains: q, mode: 'insensitive' } },
                    { hyTitle: { contains: q, mode: 'insensitive' } },
                ],
            },
        });
    }

    async getLocationsCount(): Promise<{ count: number }> {
        const count = await this.prisma.location.count();
        return { count };
    }
}

