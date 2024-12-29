import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { LoggerService } from '@common/services/logger.service';
import { PrismaService } from '@shared/prisma/prisma.service';
import { cacheModule } from '@config/cache.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env.development.local',
        '.env.development',
        '.env.local',
        '.env',
      ],
    }),
    cacheModule,
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
