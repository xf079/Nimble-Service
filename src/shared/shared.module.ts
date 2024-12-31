import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { LoggerService } from '@common/services/logger.service';
import { PrismaService } from '@shared/prisma/prisma.service';
import { cacheModule } from '@config/cache.config';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';
import Cacheable from 'cacheable';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env',
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('REDIS_HOST');
        const port = configService.get('REDIS_PORT');
        const redisPass = configService.get('REDIS_PASSWORD');
        const redisOptions = {
          url: `redis://${redisPass}@${host}:${port}`,
        };
        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(redisOptions),
              namespace: 'cache',
              useKeyPrefix: false,
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    LoggerService,
    PrismaService,
  ],
  exports: [ConfigModule, cacheModule, LoggerService, PrismaService],
})
export class SharedModule {}
