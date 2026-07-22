import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingCronService {
    private readonly logger = new Logger(BookingCronService.name);

    constructor(private readonly prisma: PrismaService) { }

    @Cron('0 0 * * *', { timeZone: 'Asia/Yerevan' })
    async completeExpiredBookings(): Promise<void> {
        try {
            const now = new Date();

            const result = await this.prisma.booking.updateMany({
                where: {
                    status: BookingStatus.CONFIRMED,
                    travelDate: { lt: now },
                },
                data: { status: BookingStatus.COMPLETED },
            });

            this.logger.log(
                `[completeExpiredBookings] Marked ${result.count} booking(s) as COMPLETED.`,
            );
        } catch (error) {
            this.logger.error(
                '[completeExpiredBookings] Failed to complete expired bookings.',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }
}
