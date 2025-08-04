import { Public } from '@/auth/decorators/public.decorator';
import { BasicHeader } from '@/common/decorators/basic-header.decorator';
import { MailService } from './mail.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

@BasicHeader('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Public()
  @Get('tracking')
  @ApiOperation({
    summary: 'String buffer of image',
  })
  @ApiOkResponse({ type: File })
  @ApiOperation({ summary: 'Get Image' })
  getImage(
    @Query('email') email: string,
    @Query('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const bufferLikeBuffer = this.mailService.trackingMail({ email, id });
      res.setHeader('Content-Type', 'image/png');
      res.send(bufferLikeBuffer);
    } catch (err) {
      throw err;
    }
  }
}
