import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TourModule } from 'src/tour/tour.module';
import { LocationModule } from 'src/location/location.module';


@Module({
  imports: [TourModule, LocationModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule { }
