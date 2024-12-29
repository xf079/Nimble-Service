import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { AssignPermissionDto } from './dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('role-permissions')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post('assign')
  @RequirePermissions('assign:role-permission')
  assignPermissions(@Body() assignPermissionDto: AssignPermissionDto) {
    return this.rolePermissionService.assignPermissions(assignPermissionDto);
  }

  @Get('role/:roleId')
  @RequirePermissions('read:role-permission')
  getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.rolePermissionService.getRolePermissions(roleId);
  }

  @Get('permission/:permissionId')
  @RequirePermissions('read:role-permission')
  getPermissionRoles(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolePermissionService.getPermissionRoles(permissionId);
  }

  @Delete('role/:roleId/permission/:permissionId')
  @RequirePermissions('delete:role-permission')
  removeRolePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolePermissionService.removeRolePermission(
      roleId,
      permissionId,
    );
  }
}
