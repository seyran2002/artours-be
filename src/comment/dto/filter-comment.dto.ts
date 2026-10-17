import { IsEnum, IsOptional } from 'class-validator';
import { CommentStatus } from '@prisma/client';

export class FilterCommentDto {
    @IsEnum(CommentStatus)
    @IsOptional()
    status?: CommentStatus;
}
