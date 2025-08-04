import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
