import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagService {
    constructor(private prisma: PrismaService) { }

    // CREATE
    async create(dto: CreateTagDto) {
        return this.prisma.tag.create({
            data: dto,
        });
    }

    // GET ALL
    async findAll() {
        return this.prisma.tag.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // GET MAIN TAGS
    async findMain() {
        return this.prisma.tag.findMany({
            where: {
                isMain: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // GET ONE
    async findOne(id: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
        });

        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        return tag;
    }

    // UPDATE
    async update(id: string, dto: UpdateTagDto) {
        try {
            return await this.prisma.tag.update({
                where: { id },
                data: dto,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Tag not found');
            }
            throw error;
        }
    }

    // DELETE
    async remove(id: string) {
        try {
            return this.prisma.tag.delete({
                where: { id },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Tag not found');
            }
            throw error;
        }
    }
}
