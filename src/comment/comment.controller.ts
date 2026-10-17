import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { FilterCommentDto } from './dto/filter-comment.dto';
import { DeleteCommentImageDto } from './dto/delete-comment-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    // ─── POST /comments — public, always creates with REVIEWING status ────────
    @Post()
    @UseInterceptors(FilesInterceptor('images', 10))
    create(
        @Body() dto: CreateCommentDto,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        return this.commentService.create(dto, files);
    }

    // ─── GET /comments/active — public, returns only ACTIVE comments ──────────
    @Get('active')
    findActive() {
        return this.commentService.findActive();
    }

    // ─── GET /comments — admin only; supports ?status= filtering ─────────────
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Query() query: FilterCommentDto) {
        return this.commentService.findAll(query.status);
    }

    // ─── GET /comments/:id — admin only ──────────────────────────────────────
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.commentService.findOne(id);
    }

    // ─── PATCH /comments/:id — admin only (approve / update translations) ─────
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
        return this.commentService.update(id, dto);
    }

    // ─── DELETE /comments/:id/images — admin only (remove specific image) ─────
    @UseGuards(JwtAuthGuard)
    @Delete(':id/images')
    removeImage(
        @Param('id') id: string,
        @Body() dto: DeleteCommentImageDto,
    ) {
        return this.commentService.removeImage(id, dto.imageUrl);
    }

    // ─── DELETE /comments/:id — admin only (reject + permanent delete) ─────────
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.commentService.remove(id);
    }
}
