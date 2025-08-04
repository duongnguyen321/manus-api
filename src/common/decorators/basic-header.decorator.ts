import {
  applyDecorators,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorDto } from '../classes/error.dto';

export function BasicHeader(tag: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiConsumes('application/json'),
    ApiBadRequestResponse({
      description: 'Bad request',
      type: ErrorDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: ErrorDto,
    }),
    UseInterceptors(ClassSerializerInterceptor),
  );
}
