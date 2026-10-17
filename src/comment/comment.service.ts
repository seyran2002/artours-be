import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TelegramService } from 'src/telegram/telegram.service';
import {
    buildAdminNewCommentTemplate,
    buildAdminNewCommentKeyboard,
} from 'src/notification/notification.templates';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentStatus } from '@prisma/client';

@Injectable()
export class CommentService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly telegramService: TelegramService,
    ) {}

    // ─── CREATE (public) ──────────────────────────────────────────────────────

    async create(
        dto: CreateCommentDto,
        files?: Express.Multer.File[],
    ) {
        // Upload images to Cloudinary if provided
        let imageUrls: string[] = [];
        if (files && files.length > 0) {
            try {
                imageUrls = await this.cloudinaryService.uploadMultipleAndGetUrls(
                    files,
                    'comments',
                );
            } catch (error: any) {
                throw new InternalServerErrorException(
                    `Failed to upload images: ${error?.message ?? 'Unknown error'}`,
                );
            }
        }

        const comment = await this.prisma.comments.create({
            data: {
                name: dto.name,
                surname: dto.surname,
                originalText: dto.originalText,
                rating: dto.rating,
                ruText: dto.ruText,
                hyText: dto.hyText,
                enText: dto.enText,
                images: imageUrls,
                // status always defaults to REVIEWING — never accept from client
            },
        });

        // Notify admin via Telegram
        try {
            const message = buildAdminNewCommentTemplate(comment);
            const keyboard = buildAdminNewCommentKeyboard(comment.id);
            await this.telegramService.notifyAdmin(message, keyboard);
        } catch (error: any) {
            console.error(
                `Failed to send Telegram notification for new comment ${comment.id}:`,
                error?.message,
            );
        }

        return comment;
    }

    // ─── FIND ALL (filtered) ──────────────────────────────────────────────────

    async findAll(status?: CommentStatus) {
        try {
            return this.prisma.comments.findMany({
                where: status ? { status } : undefined,
                orderBy: { createdAt: 'desc' },
            });
        } catch (error: any) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch comments',
            );
        }
    }

    // ─── FIND ACTIVE (public) ─────────────────────────────────────────────────

    async findActive() {
        try {
            return this.prisma.comments.findMany({
                where: { status: CommentStatus.ACTIVE },
                orderBy: { createdAt: 'desc' },
            });
        } catch (error: any) {
            throw new InternalServerErrorException(
                error?.message || 'Failed to fetch active comments',
            );
        }
    }

    // ─── FIND ONE (admin) ─────────────────────────────────────────────────────

    async findOne(id: string) {
        const comment = await this.prisma.comments.findUnique({ where: { id } });
        if (!comment) {
            throw new NotFoundException(`Comment with id "${id}" not found`);
        }
        return comment;
    }

    // ─── UPDATE (admin) ───────────────────────────────────────────────────────

    async update(id: string, dto: UpdateCommentDto) {
        await this.findOne(id); // throws NotFoundException if not found

        return this.prisma.comments.update({
            where: { id },
            data: {
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.rating !== undefined && { rating: dto.rating }),
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.surname !== undefined && { surname: dto.surname }),
                ...(dto.originalText !== undefined && { originalText: dto.originalText }),
                ...(dto.ruText !== undefined && { ruText: dto.ruText }),
                ...(dto.hyText !== undefined && { hyText: dto.hyText }),
                ...(dto.enText !== undefined && { enText: dto.enText }),
            },
        });
    }

    // ─── DELETE IMAGE (admin) ─────────────────────────────────────────────────

    async removeImage(id: string, imageUrl: string) {
        const comment = await this.findOne(id);

        if (!comment.images || !comment.images.includes(imageUrl)) {
            throw new NotFoundException('Image not found in this comment');
        }

        // Clean up from Cloudinary
        try {
            await this.cloudinaryService.deleteImageByUrl(imageUrl);
        } catch (error: any) {
            console.error(
                `Failed to delete image from Cloudinary for comment ${id}:`,
                error?.message,
            );
        }

        // Update comment in PostgreSQL
        try {
            return await this.prisma.comments.update({
                where: { id },
                data: {
                    images: comment.images.filter((img) => img !== imageUrl),
                },
            });
        } catch (error: any) {
            console.error(
                `Failed to update comment ${id} images in database:`,
                error?.message,
            );
            throw new InternalServerErrorException(
                error?.message || 'Failed to remove image from comment',
            );
        }
    }

    // ─── DELETE (admin) ───────────────────────────────────────────────────────

    async remove(id: string): Promise<{ id: string }> {
        const comment = await this.findOne(id); // throws NotFoundException if not found

        // Clean up Cloudinary images if any exist
        if (comment.images && comment.images.length > 0) {
            try {
                const publicIds = comment.images.map((url) =>
                    this.cloudinaryService.extractPublicId(url),
                ).filter(Boolean) as string[];

                if (publicIds.length > 0) {
                    await this.cloudinaryService.deleteMultiple(publicIds);
                }
            } catch (error: any) {
                // Log but do not block deletion — avoid orphaned DB rows
                console.error(
                    `Failed to delete Cloudinary images for comment ${id}:`,
                    error?.message,
                );
            }
        }

        await this.prisma.comments.delete({ where: { id } });
        return { id };
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    /**
     * Extract the Cloudinary public_id from a secure_url.
     * Example: https://res.cloudinary.com/<cloud>/image/upload/v123/comments/abc.jpg
     *          → comments/abc
     */
    private extractPublicId(url: string): string | null {
        return this.cloudinaryService.extractPublicId(url);
    }
}
