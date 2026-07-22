import { Controller, Post, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SafeUser } from '../types/user.type';
import { UseGuards } from '@nestjs/common';
import { LocalGuard } from './guards/local.guards';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @UseGuards(LocalGuard)
    login(@Req() req: Request & { user: string }) {
        return { token: req.user };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@Req() req: Request & { user: SafeUser }) {
        return req.user;
    }

}
