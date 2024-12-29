import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const cacheModule = CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (
    configService: ConfigService,
  ): Promise<CacheModuleOptions> => ({
    store: 'redis',
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    ttl: 60 * 60,
    isGlobal: true,
  }),
  inject: [ConfigService],
});
