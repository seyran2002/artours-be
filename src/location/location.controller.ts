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
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

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
        @Body() dto: CreateLocationDto,
        @UploadedFiles()
        files: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
    ) {
        return this.locationService.create(dto, files);
    }

    // GET ALL
    @Get()
    findAll() {
        return this.locationService.findAll();
    }

    // GET LOCATIONS COUNT
    @Get('count')
    getLocationsCount() {
        return this.locationService.getLocationsCount();
    }

    // GET POPULAR LOCATIONS
    @Get('popular')
    findPopular() {
        return this.locationService.findPopular();
    }

    // GET ONE BY ID
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.locationService.findOne(id);
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
        @Body() dto: UpdateLocationDto,
        @UploadedFiles()
        files: {
            mainImage?: Express.Multer.File[];
            images?: Express.Multer.File[];
        },
    ) {
        return this.locationService.update(id, dto, files);
    }

    // DELETE
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.locationService.remove(id);
    }
}
