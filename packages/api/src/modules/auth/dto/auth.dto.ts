import { IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { Agency, Role } from '@cewers/shared';

export class LoginDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(Agency)
  agency?: Agency;

  @IsOptional()
  @IsString()
  lgaId?: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
