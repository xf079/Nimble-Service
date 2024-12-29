import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { UserRoleModule } from './user-role/user-role.module';
import { RolePermissionModule } from './role-permission/role-permission.module';

@Module({
  imports: [
    UserModule,
    RoleModule,
    PermissionModule,
    UserRoleModule,
    RolePermissionModule,
  ],
  exports: [
    UserModule,
    RoleModule,
    PermissionModule,
    UserRoleModule,
    RolePermissionModule,
  ],
})
export class SystemModule {}
