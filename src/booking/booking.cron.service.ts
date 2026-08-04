import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

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
    transfer: {
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
};

@Injectable()
export class BookingCronService {
    private readonly logger = new Logger(BookingCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
    ) { }

    @Cron('0 0 * * *', { timeZone: 'Asia/Yerevan' })
    async completeExpiredBookings(): Promise<void> {
        try {
            const now = new Date();

            const expiredBookings = await this.prisma.booking.findMany({
                where: {
                    status: BookingStatus.CONFIRMED,
                    travelDate: { lt: now },
                },
                include: BOOKING_INCLUDE,
            });

            if (expiredBookings.length > 0) {
                await this.prisma.booking.updateMany({
                    where: {
                        id: { in: expiredBookings.map((b) => b.id) },
                    },
                    data: { status: BookingStatus.COMPLETED },
                });

                for (const booking of expiredBookings) {
                    const completedBooking = { ...booking, status: BookingStatus.COMPLETED };
                    await this.notificationService.notifyStatusChanged(completedBooking);
                }

                this.logger.log(
                    `[completeExpiredBookings] Marked ${expiredBookings.length} booking(s) as COMPLETED.`,
                );
            }
        } catch (error) {
            this.logger.error(
                '[completeExpiredBookings] Failed to complete expired bookings.',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    /**
     * Sends upcoming trip reminders 24h before travel date.
     * Runs daily at 09:00 AM Asia/Yerevan.
     */
    @Cron('0 9 * * *', { timeZone: 'Asia/Yerevan' })
    async sendUpcomingTripReminders(): Promise<void> {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
            const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

            const upcomingBookings = await this.prisma.booking.findMany({
                where: {
                    status: BookingStatus.CONFIRMED,
                    travelDate: {
                        gte: startOfTomorrow,
                        lte: endOfTomorrow,
                    },
                    customerTelegramId: { not: null },
                },
                include: BOOKING_INCLUDE,
            });

            for (const booking of upcomingBookings) {
                await this.notificationService.notifyReminder(booking);
            }

            if (upcomingBookings.length > 0) {
                this.logger.log(
                    `[sendUpcomingTripReminders] Sent reminders for ${upcomingBookings.length} booking(s).`,
                );
            }
        } catch (error) {
            this.logger.error(
                '[sendUpcomingTripReminders] Failed to send trip reminders.',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }
}
