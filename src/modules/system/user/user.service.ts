import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { hash } from 'bcrypt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getUserCacheKey(id: number) {
    return `user:${id}`;
  }

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          ...rest,
          password: await hash(password, 10),
        },
      });

      // 创建默认角色关联
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'user' },
      });

      if (defaultRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id,
          },
        });
      }

      return user;
    });
  }

  async findAll() {
    const cacheKey = 'users:all';
    const cachedUsers = await this.cacheManager.get(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    const users = await this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    await this.cacheManager.set(cacheKey, users, 60 * 5); // 5分钟缓存
    return users;
  }

  async findOne(id: number) {
    const cacheKey = this.getUserCacheKey(id);
    const cachedUser = await this.cacheManager.get(cacheKey);

    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }

    await this.cacheManager.set(cacheKey, user, 60 * 5);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    const data: any = { ...rest };

    if (password) {
      data.password = await hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.cacheManager.del(this.getUserCacheKey(id));
    await this.cacheManager.del('users:all');

    return user;
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });

      const user = await prisma.user.delete({
        where: { id },
      });

      await this.cacheManager.del(this.getUserCacheKey(id));
      await this.cacheManager.del('users:all');

      return user;
    });
  }
}
