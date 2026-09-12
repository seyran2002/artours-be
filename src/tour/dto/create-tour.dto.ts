import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ArrayMinSize,
    Min,
    Max,
    IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TourType } from '@prisma/client';

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

    @IsOptional()
    @IsEnum(TourType)
    type?: TourType;

    @Transform(({ value }) =>
        typeof value === 'string' ? JSON.parse(value) : value
    )
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    locationIds?: string[];

}
