import { IsNumber, IsArray } from 'class-validator';

export class AssignPermissionDto {
  @IsNumber()
  roleId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}
