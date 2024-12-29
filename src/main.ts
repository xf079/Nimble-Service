import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { setupSwagger } from '@/swagger';
import { PrismaService } from '@shared/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupSwagger(app);

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
