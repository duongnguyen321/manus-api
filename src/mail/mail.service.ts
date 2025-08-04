import { isEmail, isMongoId } from '@/common/helpers/validate.helper';
import { TrackingEmailDto } from '@/mail/dto/trackingEmail.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MailStatus,
  type MailTracking,
  MailType,
  Prisma,
} from '@prisma/client';
import fs from 'fs';
import path from 'path';

@Injectable()
export class MailService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendMail(
    email: string,
    mailType: MailType,
    options: {
      subject: string;
      template: string;
      context: Record<string, any>;
    },
  ) {
    const serverURL = this.configService.get('SERVER_URL');
    const mailRecord = await this.prisma.mailTracking.create({
      data: {
        subject: options.subject,
        recipient: email,
        type: mailType,
      },
    });
    const trackingUrl = `${serverURL}/mail/tracking?email=${email}&id=${mailRecord.id}`;
    this.mailerService.sendMail({
      to: email,
      subject: options.subject,
      template: path.join(__dirname, `./templates/${options.template}.pug`),
      context: {
        ...options.context,
        trackingUrl, // Pass the tracking URL to the template
      },
    });
    return trackingUrl;
  }

  private async changeStatusMail({ email, id }: TrackingEmailDto) {
    if (!isEmail(email) || !isMongoId(id)) return;
    const mailRecord = await this.prisma.mailTracking.findUnique({
      where: {
        id,
        recipient: email,
      },
    });
    if (!mailRecord) return;
    await this.prisma.mailTracking.update({
      where: {
        id,
        recipient: email,
      },
      data: {
        status: MailStatus.READ,
      },
    });
  }

  async getAllMail(
    params: Prisma.MailTrackingFindManyArgs,
  ): Promise<{ total: number; mails: MailTracking[] }> {
    const where = params?.where;
    const take = params?.take;
    const skip = params?.skip;
    const page = skip / take;
    const limit = params?.take;
    const key = `all-mails-page:${where?.type || 'all'}-page:${page}-limit:${limit}`;
    const total = await this.redis.cached<number>(
      `count-mails-${JSON.stringify(where)}`,
      '1 day',
      () =>
        this.prisma.mailTracking.count({
          where: params.where,
        }),
    );
    const mails = await this.redis.cached(key, '1 day', () =>
      this.prisma.mailTracking.findMany({
        ...params,
      }),
    );
    return {
      total,
      mails,
    };
  }

  trackingMail(query: TrackingEmailDto) {
    try {
      this.changeStatusMail(query).then();
    } catch {
      console.error(
        `Error tracking email from ${query.email} with id: ${query.id}`,
      );
    }
    return fs.readFileSync(path.join(__dirname, 'assets/logo.png'));
  }
}
