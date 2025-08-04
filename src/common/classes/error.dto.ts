import { ErrorCode } from '@/common/constants/error.constants';
import { getErrorMessage } from '@/common/utils/message.utils';
import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export interface IErrorResponse {
  statusCode: HttpStatus;
  timestamp: Date | string;
  path: string;
  message: ErrorCode;
}

export class ErrorDto {
  @ApiProperty()
  @ApiResponseProperty()
  statusCode: number;

  @ApiProperty()
  @ApiResponseProperty()
  timestamp: Date | string;

  @ApiProperty()
  @ApiResponseProperty()
  path: string;

  @ApiProperty()
  @ApiResponseProperty()
  message: string;

  constructor(props: IErrorResponse) {
    this.statusCode = props.statusCode;
    this.timestamp = props.timestamp;
    this.path = props.path;
    this.message = getErrorMessage(props.message);
  }
}
