import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/shared.module';
import { SystemModule } from '@modules/system/system.module';

@Module({
  imports: [SharedModule, SystemModule],
})
export class AppModule {}
