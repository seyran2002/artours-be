import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommentStatus } from '@prisma/client';

export class UpdateCommentDto {
    // Admin can approve the comment by setting status to ACTIVE
    @IsEnum(CommentStatus)
    @IsOptional()
    status?: CommentStatus;

    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    @IsOptional()
    rating?: number;

    // Admin-managed translations
    @IsString()
    @IsOptional()
    ruText?: string;

    @IsString()
    @IsOptional()
    hyText?: string;

    @IsString()
    @IsOptional()
    enText?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    surname?: string;

    @IsString()
    @IsOptional()
    originalText?: string;
}
