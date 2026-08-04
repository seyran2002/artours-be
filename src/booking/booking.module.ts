import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { NotificationModule } from 'src/notification/notification.module';
import { BookingCronService } from './booking.cron.service';

@Module({
    imports: [
        NotificationModule
    ],
    controllers: [BookingController],
    providers: [
        BookingService,
        BookingCronService
    ],
})
export class BookingModule { }

