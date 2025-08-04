import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { multerConfig } from '../common/config/multer.config';

@Module({
  imports: [
    PrismaModule,
    AIModule,
    MulterModule.registerAsync({
      useFactory: () => multerConfig,
    }),
    BullModule.registerQueue({
      name: 'file-processing',
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}