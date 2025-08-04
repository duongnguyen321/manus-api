import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
  controllers: [RedisController],
})
export class RedisModule {}
