import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { TelegramModule } from 'src/telegram/telegram.module';
import { BookingCronService } from './booking.cron.service';

@Module({
    imports: [
        TelegramModule
    ],
    controllers: [BookingController],
    providers: [
        BookingService,
        BookingCronService
    ],
})
export class BookingModule { }
