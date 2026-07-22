import { IsNotEmpty, IsString } from 'class-validator';

export class LinkTelegramDto {
    @IsString()
    @IsNotEmpty()
    bookingNumber: string;

    @IsString()
    @IsNotEmpty()
    chatId: string;
}
