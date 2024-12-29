import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { AssignPermissionDto } from './dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class RolePermissionService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async assignPermissions(assignPermissionDto: AssignPermissionDto) {
    const { roleId, permissionIds } = assignPermissionDto;

    return this.prisma.$transaction(async (prisma) => {
      // 删除现有权限
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // 分配新权限
      const rolePermissions = await Promise.all(
        permissionIds.map((permissionId) =>
          prisma.rolePermission.create({
            data: {
              roleId,
              permissionId,
            },
            include: {
              permission: true,
            },
          }),
        ),
      );

      // 清除相关缓存
      await this.cacheManager.del(`role:${roleId}`);
      await this.cacheManager.del('roles:all');

      return rolePermissions;
    });
  }

  async getRolePermissions(roleId: number) {
    const cacheKey = `role:${roleId}:permissions`;
    const cachedPermissions = await this.cacheManager.get(cacheKey);

    if (cachedPermissions) {
      return cachedPermissions;
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    await this.cacheManager.set(cacheKey, rolePermissions, 60 * 5);
    return rolePermissions;
  }

  async getPermissionRoles(permissionId: number) {
    const cacheKey = `permission:${permissionId}:roles`;
    const cachedRoles = await this.cacheManager.get(cacheKey);

    if (cachedRoles) {
      return cachedRoles;
    }

    const permissionRoles = await this.prisma.rolePermission.findMany({
      where: { permissionId },
      include: {
        role: true,
      },
    });

    await this.cacheManager.set(cacheKey, permissionRoles, 60 * 5);
    return permissionRoles;
  }

  async removeRolePermission(roleId: number, permissionId: number) {
    const rolePermission = await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    // 清除相关缓存
    await this.cacheManager.del(`role:${roleId}`);
    await this.cacheManager.del(`role:${roleId}:permissions`);
    await this.cacheManager.del(`permission:${permissionId}:roles`);
    await this.cacheManager.del('roles:all');

    return rolePermission;
  }
}
