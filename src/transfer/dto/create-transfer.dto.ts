import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

interface EntranceFees {
    enName: string;
    ruName: string;
    fee: number;
}

export class CreateTransferDto {
    @IsString()
    @IsNotEmpty()
    fromPlaceId!: string;

    @IsString()
    @IsNotEmpty()
    fromAddressText!: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    fromLat!: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    fromLng!: number;

    @IsString()
    @IsNotEmpty()
    toPlaceId!: string;

    @IsString()
    @IsNotEmpty()
    toAddressText!: string;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    toLat!: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    toLng!: number;

    @IsString()
    @IsOptional()
    fromCity?: string;

    @IsString()
    @IsOptional()
    toCity?: string;

    @IsString()
    @IsNotEmpty()
    enTitle!: string;

    @IsString()
    @IsNotEmpty()
    ruTitle!: string;

    @IsString()
    @IsNotEmpty()
    enDescription!: string;

    @IsString()
    @IsNotEmpty()
    ruDescription!: string;

    @IsString()
    @IsNotEmpty()
    enLongDescription!: string;

    @IsString()
    @IsNotEmpty()
    ruLongDescription!: string;

    // Sent as a file via multipart/form-data — not present in the body
    @IsOptional()
    mainImage?: any;

    // Sent as files via multipart/form-data — not present in the body
    @IsOptional()
    images?: any;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    distanceFromYerevan?: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    minimumPrice!: number;

    @IsOptional()
    tagIds?: string | string[];

    @IsOptional()
    entranceFees?: EntranceFees[];

    @IsString()
    @IsOptional()
    routePolyline?: string;
}