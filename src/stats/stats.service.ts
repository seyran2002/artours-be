import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingStatus, TourType } from '@prisma/client';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboardStats(): Promise<{
        activeBookings: number;
        locationsCount: number;
        toursCount: number;
        transfersCount: number;
    }> {
        const [activeBookings, locationsCount, toursCount, transfersCount] =
            await Promise.all([
                this.prisma.booking.count({
                    where: { status: BookingStatus.PENDING },
                }),
                this.prisma.location.count(),
                this.prisma.tour.count({
                    where: { type: TourType.TOUR },
                }),
                this.prisma.tour.count({
                    where: { type: TourType.TRANSFER },
                }),
            ]);

        return {
            activeBookings,
            locationsCount,
            toursCount,
            transfersCount,
        };
    }
}
