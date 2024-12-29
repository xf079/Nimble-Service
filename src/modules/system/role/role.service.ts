import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getRoleCacheKey(id: number) {
    return `role:${id}`;
  }

  async create(createRoleDto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: createRoleDto,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.cacheManager.del('roles:all');
    return role;
  }

  async findAll() {
    const cacheKey = 'roles:all';
    const cachedRoles = await this.cacheManager.get(cacheKey);

    if (cachedRoles) {
      return cachedRoles;
    }

    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    await this.cacheManager.set(cacheKey, roles, 60 * 5);
    return roles;
  }

  async findOne(id: number) {
    const cacheKey = this.getRoleCacheKey(id);
    const cachedRole = await this.cacheManager.get(cacheKey);

    if (cachedRole) {
      return cachedRole;
    }

    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`角色 ID ${id} 不存在`);
    }

    await this.cacheManager.set(cacheKey, role, 60 * 5);
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });

    await this.cacheManager.del(this.getRoleCacheKey(id));
    await this.cacheManager.del('roles:all');

    return role;
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      await prisma.userRole.deleteMany({
        where: { roleId: id },
      });

      const role = await prisma.role.delete({
        where: { id },
      });

      await this.cacheManager.del(this.getRoleCacheKey(id));
      await this.cacheManager.del('roles:all');

      return role;
    });
  }
}
