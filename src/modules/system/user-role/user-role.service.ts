import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { AssignRoleDto } from './dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class UserRoleService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async assignRoles(assignRoleDto: AssignRoleDto) {
    const { userId, roleIds } = assignRoleDto;

    return this.prisma.$transaction(async (prisma) => {
      // 删除现有角色
      await prisma.userRole.deleteMany({
        where: { userId },
      });

      // 分配新角色
      const userRoles = await Promise.all(
        roleIds.map((roleId) =>
          prisma.userRole.create({
            data: {
              userId,
              roleId,
            },
            include: {
              role: true,
            },
          }),
        ),
      );

      // 清除相关缓存
      await this.cacheManager.del(`user:${userId}`);
      await this.cacheManager.del('users:all');

      return userRoles;
    });
  }

  async getUserRoles(userId: number) {
    const cacheKey = `user:${userId}:roles`;
    const cachedRoles = await this.cacheManager.get(cacheKey);

    if (cachedRoles) {
      return cachedRoles;
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    await this.cacheManager.set(cacheKey, userRoles, 60 * 5);
    return userRoles;
  }

  async getRoleUsers(roleId: number) {
    const cacheKey = `role:${roleId}:users`;
    const cachedUsers = await this.cacheManager.get(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    const roleUsers = await this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: true,
      },
    });

    await this.cacheManager.set(cacheKey, roleUsers, 60 * 5);
    return roleUsers;
  }

  async removeUserRole(userId: number, roleId: number) {
    const userRole = await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    // 清除相关缓存
    await this.cacheManager.del(`user:${userId}`);
    await this.cacheManager.del(`user:${userId}:roles`);
    await this.cacheManager.del(`role:${roleId}:users`);
    await this.cacheManager.del('users:all');

    return userRole;
  }
}
