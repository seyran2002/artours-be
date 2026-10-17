import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingStatus, CommentStatus, TourType } from '@prisma/client';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) {}

    async getDashboardStats(): Promise<{
        activeBookings: number;
        locationsCount: number;
        toursCount: number;
        transfersCount: number;
        pendingCommentsCount: number;
    }> {
        const [
            activeBookings,
            locationsCount,
            toursCount,
            transfersCount,
            pendingCommentsCount,
        ] = await Promise.all([
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
            this.prisma.comments.count({
                where: { status: CommentStatus.REVIEWING },
            }),
        ]);

        return {
            activeBookings,
            locationsCount,
            toursCount,
            transfersCount,
            pendingCommentsCount,
        };
    }
}
