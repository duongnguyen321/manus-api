import { Module } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BrowserService],
  exports: [BrowserService],
})
export class BrowserModule {}