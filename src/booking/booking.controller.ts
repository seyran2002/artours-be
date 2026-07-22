import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CheckBookingDto } from './dto/check-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@Controller('bookings')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    //Public
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateBookingDto) {
        return this.bookingService.create(dto);
    }

    /** POST /bookings/check */
    @Post('check')
    @HttpCode(HttpStatus.OK)
    check(@Body() dto: CheckBookingDto) {
        return this.bookingService.check(dto);
    }

    @Post('cancel')
    async cancelBooking(
        @Body() dto: CancelBookingDto,
    ) {
        return this.bookingService.cancelBooking(dto);
    }

    // Admin
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.bookingService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateBookingStatusDto,
    ) {
        return this.bookingService.updateStatus(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.bookingService.remove(id);
    }
}
