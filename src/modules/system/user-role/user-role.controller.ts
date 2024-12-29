import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { UserRoleService } from './user-role.service';
import { AssignRoleDto } from './dto';

@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  @Post('assign')
  @RequirePermissions('assign:user-role')
  assignRoles(@Body() assignRoleDto: AssignRoleDto) {
    return this.userRoleService.assignRoles(assignRoleDto);
  }

  @Get('user/:userId')
  @RequirePermissions('read:user-role')
  getUserRoles(@Param('userId', ParseIntPipe) userId: number) {
    return this.userRoleService.getUserRoles(userId);
  }

  @Get('role/:roleId')
  @RequirePermissions('read:user-role')
  getRoleUsers(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.userRoleService.getRoleUsers(roleId);
  }

  @Delete('user/:userId/role/:roleId')
  @RequirePermissions('delete:user-role')
  removeUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.userRoleService.removeUserRole(userId, roleId);
  }
}
