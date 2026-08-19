import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Channel,
  Credibility,
  IncidentCategory,
  IncidentEventType,
  IncidentStatus,
  Priority,
  ResponseModality,
  ResponseTier,
} from '@cewers/shared';

class GeoPointDto {
  @IsLongitude()
  lng!: number;

  @IsLatitude()
  lat!: number;
}

class BboxDto {
  @IsObject()
  @Type(() => GeoPointDto)
  southWest!: GeoPointDto;

  @IsObject()
  @Type(() => GeoPointDto)
  northEast!: GeoPointDto;
}

export class CreateIncidentDto {
  @IsEnum(IncidentCategory)
  category!: IncidentCategory;

  @IsString()
  description!: string;

  @IsObject()
  @Type(() => GeoPointDto)
  geo!: GeoPointDto;

  @IsEnum(Channel)
  channel!: Channel;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;

  @IsOptional()
  @IsEnum(Priority)
  priorityHint?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaIds?: string[];
}

export class UpdateIncidentDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(Credibility)
  credibility?: Credibility;

  @IsOptional()
  @IsEnum(IncidentCategory)
  category?: IncidentCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assignedResponderId?: string;

  @IsOptional()
  @IsEnum(ResponseTier)
  responseTier?: ResponseTier;

  @IsOptional()
  @IsEnum(ResponseModality)
  responseModality?: ResponseModality;
}

export class AddEventDto {
  @IsEnum(IncidentEventType)
  type!: IncidentEventType;

  @IsOptional()
  @IsString()
  note?: string;
}

export class IncidentQueryDto {
  @IsOptional() @IsString() lgaId?: string;
  @IsOptional() @IsString() wardId?: string;
  @IsOptional() @IsEnum(IncidentCategory) category?: IncidentCategory;
  @IsOptional() @IsEnum(IncidentStatus) status?: IncidentStatus;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsEnum(Channel) channel?: Channel;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => BboxDto) @IsObject() bbox?: BboxDto;
  @IsOptional() @IsNumber() @Min(1) page?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(200) pageSize?: number;
}
