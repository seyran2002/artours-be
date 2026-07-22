import { IsNotEmpty, IsString } from 'class-validator';

export class CheckBookingDto {
    @IsString()
    @IsNotEmpty({ message: 'bookingNumber must not be empty' })
    bookingNumber!: string;
}
