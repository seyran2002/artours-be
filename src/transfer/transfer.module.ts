import { Module } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule],
    controllers: [TransferController],
    providers: [TransferService],
    exports: [TransferService],
})

export class TransferModule { }
