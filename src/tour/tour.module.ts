import { Module } from '@nestjs/common';
import { TourController } from './tour.controller';
import { TourService } from './tour.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule],
    controllers: [TourController],
    providers: [TourService],
    exports: [TourService],
})
export class TourModule {}
