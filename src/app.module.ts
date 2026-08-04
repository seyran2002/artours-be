import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TagModule } from './tag/tag.module';
import { TransferModule } from './transfer/transfer.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { TourModule } from './tour/tour.module';
import { SearchModule } from './search/search.module';
import { BookingModule } from './booking/booking.module';
import { TelegramModule } from './telegram/telegram.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    TagModule,
    TransferModule,
    CloudinaryModule,
    TourModule,
    SearchModule,
    BookingModule,
    TelegramModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
