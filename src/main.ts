import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from './configs/core/transform.interceptor';
import { JwtAuthGuard } from '@social/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(helmet());

  app.use(cookieParser());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.useGlobalGuards(new JwtAuthGuard(reflector));

  try {
    await app.listen(configService.get<number>('PORT', 3000));
    Logger.log(`Server is running 🚀 at http://localhost:${configService.get<number>('PORT')}`);
  } catch (error) {
    Logger.error(error);
    process.exit(1);
  }
}
bootstrap();
