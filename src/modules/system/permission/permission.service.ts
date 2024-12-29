import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto } from './dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getPermissionCacheKey(id: number) {
    return `permission:${id}`;
  }

  async create(createPermissionDto: CreatePermissionDto) {
    const permission = await this.prisma.permission.create({
      data: createPermissionDto,
    });

    await this.cacheManager.del('permissions:all');
    return permission;
  }

  async findAll() {
    const cacheKey = 'permissions:all';
    const cachedPermissions = await this.cacheManager.get(cacheKey);

    if (cachedPermissions) {
      return cachedPermissions;
    }

    const permissions = await this.prisma.permission.findMany();
    await this.cacheManager.set(cacheKey, permissions, 60 * 5);
    return permissions;
  }

  async findOne(id: number) {
    const cacheKey = this.getPermissionCacheKey(id);
    const cachedPermission = await this.cacheManager.get(cacheKey);

    if (cachedPermission) {
      return cachedPermission;
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限 ID ${id} 不存在`);
    }

    await this.cacheManager.set(cacheKey, permission, 60 * 5);
    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });

    await this.cacheManager.del(this.getPermissionCacheKey(id));
    await this.cacheManager.del('permissions:all');

    return permission;
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      await prisma.rolePermission.deleteMany({
        where: { permissionId: id },
      });

      const permission = await prisma.permission.delete({
        where: { id },
      });

      await this.cacheManager.del(this.getPermissionCacheKey(id));
      await this.cacheManager.del('permissions:all');

      return permission;
    });
  }
}
