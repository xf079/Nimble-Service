import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('NestJS API 文档')
    .setDescription('API 接口文档')
    .setVersion('1.0.0')
    .addBearerAuth() // 添加 Bearer token 认证
    .addTag('API') // 添加API标签分类
    .setContact('开发团队', 'https://example.com', 'team@example.com') // 添加联系信息
    .setLicense('MIT', 'https://opensource.org/licenses/MIT') // 添加许可证信息
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 配置 Swagger UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持认证状态
      docExpansion: 'none', // 默认折叠所有API
      filter: true, // 启用搜索过滤
      showRequestDuration: true, // 显示请求持续时间
    },
  });
}
