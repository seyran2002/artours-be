import { IsEmail, IsString } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  bookingNumber: string;

  @IsEmail()
  customerEmail: string;
}