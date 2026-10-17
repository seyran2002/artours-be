import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    surname!: string;

    @IsString()
    @IsNotEmpty()
    originalText!: string;

    @IsInt()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating!: number;

    // translations — optional, admin may fill these in later via PATCH
    @IsString()
    @IsOptional()
    ruText?: string;

    @IsString()
    @IsOptional()
    hyText?: string;

    @IsString()
    @IsOptional()
    enText?: string;
}
