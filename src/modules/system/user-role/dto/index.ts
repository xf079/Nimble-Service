import { IsNumber, IsArray } from 'class-validator';

export class AssignRoleDto {
  @IsNumber()
  userId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];
}
