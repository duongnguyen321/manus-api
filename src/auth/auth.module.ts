// auth.module.ts
import { UserService } from '@/user/user.service';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
	controllers: [AuthController],
	providers: [AuthService, UserService],
	exports: [AuthService, UserService],
})
export class AuthModule {}
