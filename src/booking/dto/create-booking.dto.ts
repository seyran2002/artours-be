import {
    IsDate,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    MinDate,
    ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BookingType } from '@prisma/client';

export class CreateBookingDto {
    @IsEnum(BookingType)
    type!: BookingType;

    @ValidateIf((o) => o.type === BookingType.TOUR)
    @IsNotEmpty({ message: 'tourId is required when type is TOUR' })
    @IsUUID()
    tourId?: string;

    @ValidateIf((o) => o.type === BookingType.TRANSFER)
    @IsNotEmpty({ message: 'transferId is required when type is TRANSFER' })
    @IsUUID()
    transferId?: string;

    @IsInt()
    @Min(1, { message: 'peopleCount must be at least 1' })
    @Type(() => Number)
    peopleCount!: number;

    /**
     * Travel date — must be tomorrow or later (no past dates, no today).
     * Sent as an ISO 8601 date string (e.g. "2026-08-15") from the client,
     * transformed to a Date object for Prisma.
     */
    @IsDate({ message: 'travelDate must be a valid date' })
    @Transform(({ value }) => {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date;
    })
    @MinDate(
        () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow;
        },
        { message: 'travelDate must be at least tomorrow' },
    )
    travelDate!: Date;

    @IsString()
    @IsNotEmpty()
    customerName!: string;

    @IsEmail({}, { message: 'customerEmail must be a valid email address' })
    customerEmail!: string;

    @IsString()
    @IsNotEmpty({ message: 'customerPhone must not be empty' })
    customerPhone!: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
