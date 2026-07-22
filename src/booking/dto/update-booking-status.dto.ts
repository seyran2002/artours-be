import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
    @IsEnum(BookingStatus, {
        message: `status must be one of: ${Object.values(BookingStatus).join(', ')}`,
    })
    status!: BookingStatus;
}
