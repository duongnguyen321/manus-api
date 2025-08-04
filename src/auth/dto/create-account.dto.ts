import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateAccountDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  username: string;

  @ApiProperty({
    type: String,
    required: true,
    description:
      "Password must be at least 8 characters long, contain one uppercase letter and one special character",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain at least 8 characters, one uppercase letter and one special character",
  })
  password: string;
}
