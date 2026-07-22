import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TourModule } from 'src/tour/tour.module';
import { TransferModule } from 'src/transfer/transfer.module';


@Module({
  imports: [TourModule, TransferModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule { }
