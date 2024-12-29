import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
