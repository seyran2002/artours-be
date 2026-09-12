import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, BookingType, BookingStatus } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CheckBookingDto } from './dto/check-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { NotificationService } from 'src/notification/notification.service';

const NANOID_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(NANOID_ALPHABET, 6);

const BOOKING_INCLUDE = {
    tour: {
        select: {
            id: true,
            slug: true,
            enTitle: true,
            ruTitle: true,
            hyTitle: true,
            mainImage: true,
            minimumPrice: true,
            duration: true,
        },
    },
    location: {
        select: {
            id: true,
            slug: true,
            enTitle: true,
            ruTitle: true,
            hyTitle: true,
            mainImage: true,
            minimumPrice: true,
            toAddressText: true,
        },
    },
} satisfies Prisma.BookingInclude;

@Injectable()
export class BookingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }

    private async generateUniqueBookingNumber(): Promise<string> {
        while (true) {
            const candidate = `ART-${nanoid()}`;
            const existing = await this.prisma.booking.findUnique({
                where: { bookingNumber: candidate },
                select: { id: true },
            });
            if (!existing) return candidate;
        }
    }

    private async validateBookingTarget(
        type: BookingType,
        tourId?: string,
        locationId?: string,
    ): Promise<void> {
        if (type === BookingType.TOUR) {
            if (!tourId) {
                throw new BadRequestException(
                    'tourId is required when type is TOUR',
                );
            }
            if (locationId) {
                throw new BadRequestException(
                    'locationId must be null when type is TOUR',
                );
            }

            const tour = await this.prisma.tour.findUnique({
                where: { id: tourId },
                select: { id: true },
            });
            if (!tour) {
                throw new NotFoundException(`Tour with id "${tourId}" not found`);
            }
            return;
        }

        // type === LOCATION or TRANSFER — both require a locationId
        if (!locationId) {
            throw new BadRequestException(
                `locationId is required when type is ${type}`,
            );
        }
        if (tourId) {
            throw new BadRequestException(
                `tourId must be null when type is ${type}`,
            );
        }

        const location = await this.prisma.location.findUnique({
            where: { id: locationId },
            select: { id: true },
        });
        if (!location) {
            throw new NotFoundException(
                `Location with id "${locationId}" not found`,
            );
        }
    }

    // Public endpoints
    async create(dto: CreateBookingDto) {
        const {
            type,
            tourId,
            locationId,
            transferId,
            peopleCount,
            totalPrice,
            ...customerDetails
        } = dto;

        const targetLocationId = locationId || transferId;

        await this.validateBookingTarget(
            type,
            tourId,
            targetLocationId,
        );

        const bookingNumber = await this.generateUniqueBookingNumber();

        const booking = await this.prisma.booking.create({
            data: {
                bookingNumber,
                type,
                peopleCount,
                totalPrice: new Prisma.Decimal(totalPrice),
                ...(type === BookingType.TOUR
                    ? { tourId: tourId! }
                    : { locationId: targetLocationId! }),
                ...customerDetails,
            },
            include: BOOKING_INCLUDE,
        });

        await this.notificationService.notifyNewBooking(booking);

        return booking;
    }

    async check(dto: CheckBookingDto) {
        const booking = await this.prisma.booking.findUnique({
            where: { bookingNumber: dto.bookingNumber },
            include: BOOKING_INCLUDE,
        });

        if (!booking) {
            throw new NotFoundException(
                `Booking "${dto.bookingNumber}" not found`,
            );
        }

        return booking;
    }

    async findAll() {
        return this.prisma.booking.findMany({
            include: BOOKING_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: BOOKING_INCLUDE,
        });

        if (!booking) {
            throw new NotFoundException(`Booking with id "${id}" not found`);
        }

        return booking;
    }

    async updateStatus(id: string, dto: UpdateBookingStatusDto) {
        const existing = await this.prisma.booking.findUnique({
            where: { id },
            select: { id: true, bookingNumber: true, customerName: true },
        });

        if (!existing) {
            throw new NotFoundException(`Booking with id "${id}" not found`);
        }

        const updated = await this.prisma.booking.update({
            where: { id },
            data: { status: dto.status },
            include: BOOKING_INCLUDE,
        });

        await this.notificationService.notifyStatusChanged(updated);

        return updated;
    }

    async cancelBooking(dto: CancelBookingDto) {
        const booking = await this.prisma.booking.findUnique({
            where: {
                bookingNumber: dto.bookingNumber,
                customerEmail: dto.customerEmail,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking number or customer email is incorrect');
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new BadRequestException('Booking already cancelled');
        }

        if (booking.status === BookingStatus.COMPLETED) {
            throw new BadRequestException('Completed booking cannot be cancelled');
        }

        const now = new Date();

        const hoursBeforeTour =
            (booking.travelDate.getTime() - now.getTime()) /
            (1000 * 60 * 60);

        if (hoursBeforeTour < 48) {
            throw new BadRequestException(
                'Booking can only be cancelled 48 hours before the tour'
            );
        }

        const updated = await this.prisma.booking.update({
            where: {
                bookingNumber: dto.bookingNumber,
                customerEmail: dto.customerEmail,
            },
            data: {
                status: BookingStatus.CANCELLED,
            },
            include: BOOKING_INCLUDE,
        });

        await this.notificationService.notifyCancelled(updated);

        return updated;
    }

    async remove(id: string): Promise<{ id: string }> {
        const existing = await this.prisma.booking.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw new NotFoundException(`Booking with id "${id}" not found`);
        }

        await this.prisma.booking.delete({ where: { id } });
        return { id };
    }
}
