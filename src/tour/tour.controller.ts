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
import { TourService } from './tour.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Controller('tours')
export class TourController {
    constructor(private readonly tourService: TourService) { }

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
        @Body() dto: CreateTourDto,
        @UploadedFiles()
        files?: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
    ) {
        return this.tourService.create(dto, files);
    }

    // GET ALL
    @Get()
    findAll() {
        return this.tourService.findAll();
    }

    // GET POPULAR TOURS
    @Get('popular')
    findPopular() {
        return this.tourService.findPopular()
    }

    // GET BY SLUG
    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.tourService.findBySlug(slug);
    }

    // GET BY ID
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tourService.findOne(id);
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
        @Body() dto: UpdateTourDto,
        @UploadedFiles()
        files?: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
    ) {
        return this.tourService.update(id, dto, files);
    }

    // DELETE
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tourService.remove(id);
    }
}
