import { Module } from '@nestjs/common';
import { SimpleService } from './simple.service';
import { SimpleController } from './simple.controller';
import { DockerModule } from '../docker/docker.module';
import { BrowserModule } from '../browser/browser.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    DockerModule,
    BrowserModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [SimpleController],
  providers: [SimpleService],
  exports: [SimpleService],
})
export class SimpleModule {}