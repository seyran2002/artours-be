import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, private prisma: PrismaService) { }

    async validateUser({ email, password }: AuthDto): Promise<string | null> {
        const findUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!findUser) return null;

        const isPasswordValid = await bcrypt.compare(password, findUser.password);

        if (!isPasswordValid) return null;

        const { password: _ignored, ...user } = findUser;


        return this.jwtService.sign(user);
    }

}
