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
import { TelegramService } from 'src/telegram/telegram.service';

const NANOID_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const nanoid = customAlphabet(NANOID_ALPHABET, 6);

const BOOKING_INCLUDE = {
    tour: {
        select: {
            id: true,
            slug: true,
            enTitle: true,
            ruTitle: true,
            mainImage: true,
            minimumPrice: true,
            duration: true,
        },
    },
    transfer: {
        select: {
            id: true,
            slug: true,
            enTitle: true,
            ruTitle: true,
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
        private readonly telegramService: TelegramService,
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
        transferId?: string,
    ): Promise<{ minimumPrice: number }> {
        if (type === BookingType.TOUR) {
            if (!tourId) {
                throw new BadRequestException(
                    'tourId is required when type is TOUR',
                );
            }
            if (transferId) {
                throw new BadRequestException(
                    'transferId must be null when type is TOUR',
                );
            }

            const tour = await this.prisma.tour.findUnique({
                where: { id: tourId },
                select: { minimumPrice: true },
            });
            if (!tour) {
                throw new NotFoundException(`Tour with id "${tourId}" not found`);
            }
            return { minimumPrice: tour.minimumPrice };
        }

        // type === TRANSFER
        if (!transferId) {
            throw new BadRequestException(
                'transferId is required when type is TRANSFER',
            );
        }
        if (tourId) {
            throw new BadRequestException(
                'tourId must be null when type is TRANSFER',
            );
        }

        const transfer = await this.prisma.transfer.findUnique({
            where: { id: transferId },
            select: { minimumPrice: true },
        });
        if (!transfer) {
            throw new NotFoundException(
                `Transfer with id "${transferId}" not found`,
            );
        }
        return { minimumPrice: transfer.minimumPrice };
    }

    // Public endpoints
    async create(dto: CreateBookingDto) {
        const { type, tourId, transferId, peopleCount, ...customerDetails } =
            dto;

        const { minimumPrice } = await this.validateBookingTarget(
            type,
            tourId,
            transferId,
        );

        const bookingNumber = await this.generateUniqueBookingNumber();
        const totalPrice = new Prisma.Decimal(minimumPrice * peopleCount);

        const booking = await this.prisma.booking.create({
            data: {
                bookingNumber,
                type,
                peopleCount,
                totalPrice,
                ...(type === BookingType.TOUR
                    ? { tourId: tourId! }
                    : { transferId: transferId! }),
                ...customerDetails,
            },
            include: BOOKING_INCLUDE,
        });

        const entityName = booking.tour?.enTitle ?? booking.transfer?.enTitle ?? '—';

        await this.telegramService.notifyAdmin(
            `🆕 New ArTours Booking

Booking number:
<code>${booking.bookingNumber}</code>

Type:
<b>${booking.type}</b>

Tour/Transfer name:
<b>${entityName}</b>

Customer:
<b>${booking.customerName}</b>

Email:
<b>${booking.customerEmail}</b>

Phone:
<b>${booking.customerPhone}</b>

People:
<b>${booking.peopleCount}</b>

Travel date:
<b>${booking.travelDate.toISOString().split('T')[0]}</b>

Total price:
<b>${booking.totalPrice} AMD</b>

<a href="http://localhost:5173/admin/bookings">Open bookings</a>`
        );

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

        await this.telegramService.notifyAdmin(
            `🔄 Booking Status Updated

Booking:
<code>${existing.bookingNumber}</code>

Customer:
<b>${existing.customerName}</b>

Status:
<b>${dto.status}</b>`
        );

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

        return this.prisma.booking.update({
            where: {
                bookingNumber: dto.bookingNumber,
                customerEmail: dto.customerEmail,
            },
            data: {
                status: BookingStatus.CANCELLED,
            },
        });
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
