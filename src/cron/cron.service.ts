import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  scanRemoveBlacklistAccessToken() {
    this.prisma.blackListAccessToken.deleteMany({
      where: {
        expiredAt: {
          lte: new Date(),
        },
      },
    });
  }
}
