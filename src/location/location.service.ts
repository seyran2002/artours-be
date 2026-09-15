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

        const enFromAddress = dto.enFromAddress ?? fromPlaceObj?.address?.en ?? addressObj?.en ?? (fromAddressText || null);
        const ruFromAddress = dto.ruFromAddress ?? fromPlaceObj?.address?.ru ?? addressObj?.ru ?? null;
        const hyFromAddress = dto.hyFromAddress ?? fromPlaceObj?.address?.hy ?? addressObj?.hy ?? null;

        const enFromName = dto.enFromName ?? fromPlaceObj?.name?.en ?? nameObj?.en ?? null;
        const ruFromName = dto.ruFromName ?? fromPlaceObj?.name?.ru ?? nameObj?.ru ?? null;
        const hyFromName = dto.hyFromName ?? fromPlaceObj?.name?.hy ?? nameObj?.hy ?? null;

        // TO fields
        const toPlaceId = dto.toPlaceId ?? toPlaceObj?.placeId ?? '';
        const toAddressText = dto.toAddressText ?? toPlaceObj?.address?.en ?? '';
        const toLat = dto.toLat !== undefined && dto.toLat !== null ? Number(dto.toLat) : (toPlaceObj?.location?.lat ?? 0);
        const toLng = dto.toLng !== undefined && dto.toLng !== null ? Number(dto.toLng) : (toPlaceObj?.location?.lng ?? 0);

        const enToAddress = dto.enToAddress ?? toPlaceObj?.address?.en ?? null;
        const ruToAddress = dto.ruToAddress ?? toPlaceObj?.address?.ru ?? null;
        const hyToAddress = dto.hyToAddress ?? toPlaceObj?.address?.hy ?? null;

        const enToName = dto.enToName ?? toPlaceObj?.name?.en ?? null;
        const ruToName = dto.ruToName ?? toPlaceObj?.name?.ru ?? null;
        const hyToName = dto.hyToName ?? toPlaceObj?.name?.hy ?? null;

        return {
            fromPlaceId,
            fromAddressText,
            fromLat,
            fromLng,
            enFromAddress,
            ruFromAddress,
            hyFromAddress,
            enFromName,
            ruFromName,
            hyFromName,
            toPlaceId,
            toAddressText,
            toLat,
            toLng,
            enToAddress,
            ruToAddress,
            hyToAddress,
            enToName,
            ruToName,
            hyToName,
        };
    }

    private formatLocationResponse(location: any) {
        if (!location) return location;

        const enFromAddress = location.enFromAddress ?? null;
        const ruFromAddress = location.ruFromAddress ?? null;
        const hyFromAddress = location.hyFromAddress ?? null;

        const enFromName = location.enFromName ?? null;
        const ruFromName = location.ruFromName ?? null;
        const hyFromName = location.hyFromName ?? null;

        const enToAddress = location.enToAddress ?? null;
        const ruToAddress = location.ruToAddress ?? null;
        const hyToAddress = location.hyToAddress ?? null;

        const enToName = location.enToName ?? null;
        const ruToName = location.ruToName ?? null;
        const hyToName = location.hyToName ?? null;

        const fromPlace = {
            placeId: location.fromPlaceId || '',
            name: {
                en: enFromName,
                ru: ruFromName,
                hy: hyFromName,
            },
            address: {
                en: enFromAddress,
                ru: ruFromAddress,
                hy: hyFromAddress,
            },
            location: {
                lat: location.fromLat,
                lng: location.fromLng,
            },
        };

        const toPlace = {
            placeId: location.toPlaceId || '',
            name: {
                en: enToName,
                ru: ruToName,
                hy: hyToName,
            },
            address: {
                en: enToAddress,
                ru: ruToAddress,
                hy: hyToAddress,
            },
            location: {
                lat: location.toLat,
                lng: location.toLng,
            },
        };

        const name = {
            en: enFromName ?? enToName ?? null,
            ru: ruFromName ?? ruToName ?? null,
            hy: hyFromName ?? hyToName ?? null,
        };

        const address = {
            en: enFromAddress ?? enToAddress ?? null,
            ru: ruFromAddress ?? ruToAddress ?? null,
            hy: hyFromAddress ?? hyToAddress ?? null,
        };

        return {
            ...location,
            enFromAddress,
            ruFromAddress,
            hyFromAddress,
            enFromName,
            ruFromName,
            hyFromName,
            enToAddress,
            ruToAddress,
            hyToAddress,
            enToName,
            ruToName,
            hyToName,
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
            features,
            mainImage,
            images,
            placeId,
            name,
            address,
            location,
            fromPlace,
            toPlace,
            enFromAddress,
            ruFromAddress,
            hyFromAddress,
            enFromName,
            ruFromName,
            hyFromName,
            enToAddress,
            ruToAddress,
            hyToAddress,
            enToName,
            ruToName,
            hyToName,
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
                enFromAddress: placeData.enFromAddress,
                ruFromAddress: placeData.ruFromAddress,
                hyFromAddress: placeData.hyFromAddress,
                enFromName: placeData.enFromName,
                ruFromName: placeData.ruFromName,
                hyFromName: placeData.hyFromName,

                toPlaceId: placeData.toPlaceId,
                toAddressText: placeData.toAddressText,
                toLat: placeData.toLat,
                toLng: placeData.toLng,
                enToAddress: placeData.enToAddress,
                ruToAddress: placeData.ruToAddress,
                hyToAddress: placeData.hyToAddress,
                enToName: placeData.enToName,
                ruToName: placeData.ruToName,
                hyToName: placeData.hyToName,

                distanceFromYerevan,
                minimumPrice,
                mainImage: mainImageUrl,
                images: finalImages,
                slug,
                ...(entranceFees?.length ? { entranceFees } : {}),
                ...(features !== undefined ? { features } : {}),

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
            features,
            mainImage,
            images,
            placeId,
            name,
            address,
            location,
            fromPlace,
            toPlace,
            enFromAddress,
            ruFromAddress,
            hyFromAddress,
            enFromName,
            ruFromName,
            hyFromName,
            enToAddress,
            ruToAddress,
            hyToAddress,
            enToName,
            ruToName,
            hyToName,
            ...rest
        } = dto;

        const parsedTagIds = typeof tagIds === 'string' ? JSON.parse(tagIds) : tagIds;

        const updateData: any = {
            ...rest,
            mainImage: mainImageUrl,
            images: finalImages,
                ...(entranceFees?.length ? { entranceFees } : {}),
                ...(features !== undefined ? { features } : {}),
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

        if (dto.enFromAddress !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) updateData.enFromAddress = extracted.enFromAddress;
        if (dto.ruFromAddress !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) updateData.ruFromAddress = extracted.ruFromAddress;
        if (dto.hyFromAddress !== undefined || dto.fromPlace !== undefined || dto.address !== undefined) updateData.hyFromAddress = extracted.hyFromAddress;
        if (dto.enFromName !== undefined || dto.fromPlace !== undefined || dto.name !== undefined) updateData.enFromName = extracted.enFromName;
        if (dto.ruFromName !== undefined || dto.fromPlace !== undefined || dto.name !== undefined) updateData.ruFromName = extracted.ruFromName;
        if (dto.hyFromName !== undefined || dto.fromPlace !== undefined || dto.name !== undefined) updateData.hyFromName = extracted.hyFromName;

        if (dto.toPlaceId !== undefined || dto.toPlace !== undefined) updateData.toPlaceId = extracted.toPlaceId;
        if (dto.toAddressText !== undefined || dto.toPlace !== undefined) updateData.toAddressText = extracted.toAddressText;
        if (dto.toLat !== undefined || dto.toPlace !== undefined) updateData.toLat = extracted.toLat;
        if (dto.toLng !== undefined || dto.toPlace !== undefined) updateData.toLng = extracted.toLng;

        if (dto.enToAddress !== undefined || dto.toPlace !== undefined) updateData.enToAddress = extracted.enToAddress;
        if (dto.ruToAddress !== undefined || dto.toPlace !== undefined) updateData.ruToAddress = extracted.ruToAddress;
        if (dto.hyToAddress !== undefined || dto.toPlace !== undefined) updateData.hyToAddress = extracted.hyToAddress;
        if (dto.enToName !== undefined || dto.toPlace !== undefined) updateData.enToName = extracted.enToName;
        if (dto.ruToName !== undefined || dto.toPlace !== undefined) updateData.ruToName = extracted.ruToName;
        if (dto.hyToName !== undefined || dto.toPlace !== undefined) updateData.hyToName = extracted.hyToName;

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
                enFromAddress: true,
                ruFromAddress: true,
                hyFromAddress: true,
                enFromName: true,
                ruFromName: true,
                hyFromName: true,
                enToAddress: true,
                ruToAddress: true,
                hyToAddress: true,
                enToName: true,
                ruToName: true,
                hyToName: true,
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


