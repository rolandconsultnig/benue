import { IsEnum, IsLatitude, IsLongitude, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '@cewers/shared';

class GeoPointDto {
  @IsLongitude()
  lng!: number;

  @IsLatitude()
  lat!: number;
}

export class CreateMediaAssetDto {
  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  mimeType!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  sizeBytes!: number;

  @IsOptional()
  @IsObject()
  @Type(() => GeoPointDto)
  geo?: GeoPointDto;
}
