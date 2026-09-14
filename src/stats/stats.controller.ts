import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { StatsService } from './stats.service';

@Controller('admin/stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    getDashboardStats() {
        return this.statsService.getDashboardStats();
    }
}
