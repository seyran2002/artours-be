import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { TransferService } from './transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Controller('transfers')
export class TransferController {
    constructor(private readonly transferService: TransferService) { }

    // CREATE
    @UseGuards(JwtAuthGuard)
    @Post()
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'mainImage', maxCount: 1 },
            { name: 'images', maxCount: 20 },
        ]),
    )
    create(
        @Body() dto: CreateTransferDto,
        @UploadedFiles()
        files: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
    ) {
        return this.transferService.create(dto, files);
    }

    // GET ALL
    @Get()
    findAll() {
        return this.transferService.findAll();
    }

    // GET POPULAR TRANSFERS
    @Get('popular')
    findPopular() {
        return this.transferService.findPopular()
    }

    // GET ONE BY ID
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.transferService.findOne(id)
    }


    // UPDATE
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'mainImage', maxCount: 1 },
            { name: 'images', maxCount: 20 },
        ]),
    )
    update(
        @Param('id') id: string,
        @Body() dto: UpdateTransferDto,
        @UploadedFiles()
        files: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
    ) {
        return this.transferService.update(id, dto, files);
    }

    // DELETE
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.transferService.remove(id);
    }
}
