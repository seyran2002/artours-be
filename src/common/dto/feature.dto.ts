import { IsOptional, IsString } from 'class-validator';

export class FeatureDto {
    @IsOptional()
    @IsString()
    icon?: string;

    @IsString()
    ru!: string;

    @IsString()
    en!: string;

    @IsString()
    hy!: string;
}

