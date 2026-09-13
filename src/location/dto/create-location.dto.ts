import { IsNotEmpty, IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

interface EntranceFees {
    enName: string;
    ruName: string;
    hyName: string;
    fee: number;
}

export class MultilingualTextDto {
    @IsOptional()
    @IsString()
    en?: string | null;

    @IsOptional()
    @IsString()
    ru?: string | null;

    @IsOptional()
    @IsString()
    hy?: string | null;
}

export class LocationCoordinatesDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    lat?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    lng?: number;
}

export class PlaceDataDto {
    @IsOptional()
    @IsString()
    placeId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => MultilingualTextDto)
    name?: MultilingualTextDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => MultilingualTextDto)
    address?: MultilingualTextDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationCoordinatesDto)
    location?: LocationCoordinatesDto;
}

export class CreateLocationDto {
    @IsString()
    @IsOptional()
    fromPlaceId?: string;

    @IsString()
    @IsOptional()
    fromAddressText?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    fromLat?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    fromLng?: number;

    @IsString()
    @IsOptional()
    toPlaceId?: string;

    @IsString()
    @IsOptional()
    toAddressText?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    toLat?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    toLng?: number;

    // Multilingual flat fields for FROM
    @IsString()
    @IsOptional()
    enFromAddress?: string;

    @IsString()
    @IsOptional()
    ruFromAddress?: string;

    @IsString()
    @IsOptional()
    hyFromAddress?: string;

    @IsString()
    @IsOptional()
    enFromName?: string;

    @IsString()
    @IsOptional()
    ruFromName?: string;

    @IsString()
    @IsOptional()
    hyFromName?: string;

    // Multilingual flat fields for TO
    @IsString()
    @IsOptional()
    enToAddress?: string;

    @IsString()
    @IsOptional()
    ruToAddress?: string;

    @IsString()
    @IsOptional()
    hyToAddress?: string;

    @IsString()
    @IsOptional()
    enToName?: string;

    @IsString()
    @IsOptional()
    ruToName?: string;

    @IsString()
    @IsOptional()
    hyToName?: string;

    // Structured Place Payload support
    @IsOptional()
    placeId?: string;

    @IsOptional()
    name?: MultilingualTextDto | string;

    @IsOptional()
    address?: MultilingualTextDto | string;

    @IsOptional()
    location?: LocationCoordinatesDto | string;

    @IsOptional()
    fromPlace?: PlaceDataDto | string;

    @IsOptional()
    toPlace?: PlaceDataDto | string;

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

    @IsString()
    @IsNotEmpty()
    enLongDescription!: string;

    @IsString()
    @IsNotEmpty()
    ruLongDescription!: string;

    @IsString()
    @IsNotEmpty()
    hyLongDescription!: string;

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

