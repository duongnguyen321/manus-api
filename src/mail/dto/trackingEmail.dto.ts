import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TrackingEmailDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  id: string;
}
