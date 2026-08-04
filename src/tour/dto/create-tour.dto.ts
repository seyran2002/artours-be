import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ArrayMinSize,
    Min,
    Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateTourDto {
    @IsString()
    @IsNotEmpty()
    enTitle!: string;

    @IsString()
    @IsNotEmpty()
    ruTitle!: string;

    @IsString()
    @IsNotEmpty()
    hyTitle!: string;

    @IsString()
    @IsNotEmpty()
    enDescription!: string;

    @IsString()
    @IsNotEmpty()
    ruDescription!: string;

    @IsString()
    @IsNotEmpty()
    hyDescription!: string;

    // Sent as a file via multipart/form-data — not present in the body
    @IsOptional()
    mainImage?: any;

    @IsOptional()
    images?: any;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    minimumPrice!: number;

    @IsOptional()
    tagIds?: string | string[];

    @IsString()
    @IsOptional()
    duration?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    starRating?: number;

    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value
    )
    mealOptions?: any;

    @IsString()
    @IsOptional()
    routePolyline?: string;

    @IsOptional()
    entranceFees?: any;

    @Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value
    )
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    transferIds!: string[];
}
