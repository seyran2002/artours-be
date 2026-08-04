import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  ruName: string;

  @IsString()
  @IsNotEmpty()
  enName: string;

  @IsString()
  @IsNotEmpty()
  hyName: string;

  @IsBoolean()
  @IsOptional()
  isMain?: boolean;
}