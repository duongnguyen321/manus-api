// auth.service.ts
import { ChangePasswordDto } from '@/auth/dto/change-password.dto';
import { LoginAccountDto } from '@/auth/dto/login-account.dto';
import { AppConstants } from '@/common/constants/app.constants';
import {
	comparePassword,
	hashPassword,
} from '@/common/helpers/password.helpers';
import { isBusinessEmail } from '@/common/helpers/validate.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { UserService } from '@/user/user.service';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Account, Provider, User } from '@prisma/client';
import axios from 'axios';
import { CreateAccountDto } from './dto/create-account.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';

@Injectable()
export class AuthService {
	constructor(
		private users: UserService,
		private prisma: PrismaService,
		private redis: RedisService,
		private configService: ConfigService,
		private jwtService: JwtService
	) {}

	async googleLogin() {
		const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
		const redirectURI = this.configService.get<string>('GOOGLE_CALLBACK_URL');
		const scope = ['email', 'profile'].join(' ');
		const responseType = 'code';

		const params = new URLSearchParams({
			client_id: clientID!,
			redirect_uri: redirectURI!,
			response_type: responseType,
			scope,
			access_type: 'offline', // to get refresh token
			prompt: 'consent', // to force consent screen
		});

		return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
	}

	async googleLoginCallback(code: string) {
		if (!code) {
			throw new Error('Authorization code not provided');
		}

		try {
			const tokenResponse = await axios.post(
				'https://oauth2.googleapis.com/token',
				null,
				{
					params: {
						client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
						client_secret: this.configService.get<string>(
							'GOOGLE_CLIENT_SECRET'
						),
						redirect_uri: this.configService.get<string>('GOOGLE_CALLBACK_URL'),
						grant_type: 'authorization_code',
						code,
					},
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);

			const { access_token } = tokenResponse.data;

			const userInfoResponse = await axios.get(
				'https://www.googleapis.com/oauth2/v3/userinfo',
				{
					headers: {
						Authorization: `Bearer ${access_token}`,
					},
				}
			);
			return await this.validateGoogleUser(userInfoResponse.data);
		} catch (error) {
			console.error({
				statusCode: HttpStatus.BAD_REQUEST,
				message: error.message,
				error: error.response?.data,
			});
			throw new BadRequestException(
				{
					statusCode: HttpStatus.BAD_REQUEST,
					message: error.message,
					error: error.response?.data,
				},
				'Error during Google OAuth callback'
			);
		}
	}

	async validateGoogleUser(profile: any) {
		const { email, name, picture: avatar, sub: googleId } = profile;
		let user = await this.users.getUserByEmail(email);

		if (!user) {
			user = await this.prisma.user.create({
				data: {
					email,
					name,
					avatar,
				},
			});
		}
		const account = await this.redis.cached<Account>(
			`account-${user.id}-${Provider.GOOGLE}`,
			'1 month',
			() =>
				this.prisma.account.findFirst({
					where: {
						userId: user.id,
						provider: Provider.GOOGLE,
					},
				})
		);

		if (!account) {
			this.redis.cached<Account>(
				`account-${user.id}-${Provider.GOOGLE}`,
				'1 month',
				() =>
					this.prisma.account.create({
						data: {
							user: { connect: { id: user.id } },
							provider: Provider.GOOGLE,
							avatar,
							sub: googleId,
							name,
							email,
						},
					})
			);
		}
		const tokens = this.generateToken(user);
		const newUser = await this.prisma.user.update({
			where: { id: user.id },
			data: {
				refreshToken: tokens.refreshToken,
			},
		});
		return { user: newUser, tokens };
	}

	async createAccount(body: CreateAccountDto) {
		const { email, username, password } = body;
		// const checkBusinessEmail = isBusinessEmail(email);
		// if (!checkBusinessEmail) {
		//   throw new BadRequestException("Email is not a business email");
		// }
		const user = await this.users.getUserByEmail(email);
		if (user) {
			throw new BadRequestException('User already exists');
		}
		const { bcrypt: hashedPassword, md5 } = await hashPassword(password);
		const newUser = await this.prisma.user.create({
			data: {
				email,
				name: username,
				password: hashedPassword,
			},
		});
		const tokens = this.generateToken(newUser);
		const account = await this.redis.cached<Account>(
			`account-${newUser.id}-${Provider.EMAIL}`,
			'1 month',
			() =>
				this.prisma.account.findFirst({
					where: {
						userId: newUser.id,
						provider: Provider.EMAIL,
					},
				})
		);

		if (!account) {
			this.redis.cached<Account>(
				`account-${newUser.id}-${Provider.EMAIL}`,
				'1 month',
				() =>
					this.prisma.account.create({
						data: {
							user: { connect: { id: newUser.id } },
							provider: Provider.EMAIL,
							sub: newUser.id,
							name: username,
							email,
						},
					})
			);
		}
		const updatedUser = await this.prisma.user.update({
			where: { id: newUser.id },
			data: { refreshToken: tokens.refreshToken },
		});
		await this.prisma.oldPassword.create({
			data: {
				userId: newUser.id,
				password: md5,
			},
		});
		return { user: updatedUser, tokens };
	}

	async login(body: LoginAccountDto) {
		const { email, password } = body;
		// const checkBusinessEmail = isBusinessEmail(email);
		// if (!checkBusinessEmail) {
		//   throw new BadRequestException("Email is not a business email");
		// }
		const user = await this.users.getUserByEmail(email);
		if (!user) {
			throw new BadRequestException('User not found');
		}
		const isValidPassword = await comparePassword(password, user.password);
		if (!isValidPassword) {
			throw new BadRequestException('Invalid email or password');
		}
		const tokens = this.generateToken(user);
		const newUser = await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: tokens.refreshToken },
		});
		return { user: newUser, tokens };
	}

	async changePassword(body: ChangePasswordDto) {
		const { email, oldPassword, newPassword } = body;
		// const checkBusinessEmail = isBusinessEmail(email);
		// if (!checkBusinessEmail) {
		// 	throw new BadRequestException('Email is not a business email');
		// }
		const user = await this.users.getUserByEmail(email);
		if (!user) {
			throw new BadRequestException('User not found');
		}
		const isValidPassword = await comparePassword(oldPassword, user.password);
		if (!isValidPassword) {
			throw new BadRequestException('Invalid email or password');
		}
		const { bcrypt: hashedPassword, md5 } = await hashPassword(newPassword);
		const isHaveOldPassword = await this.prisma.oldPassword.findFirst({
			where: {
				userId: user.id,
				password: md5,
			},
		});
		if (isHaveOldPassword) {
			throw new BadRequestException('Password has been used before');
		}
		await this.prisma.oldPassword.create({
			data: {
				userId: user.id,
				password: md5,
			},
		});
		const _newUser = await this.prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});
		const tokens = this.generateToken(_newUser);
		const newUser = await this.prisma.user.update({
			where: { id: _newUser.id },
			data: { refreshToken: tokens.refreshToken },
		});
		return { user: newUser, tokens };
	}

	async renewToken(body: RefreshTokenDto) {
		const { refreshToken } = body;
		const user = await this.users.getUserByRefreshToken(refreshToken);
		if (!user) {
			throw new BadRequestException('User not found');
		}
		try {
			this.jwtService.verify(refreshToken, {
				secret: this.configService.get<string>('JWT_SUPER_SECRET'),
			});
		} catch {
			throw new BadRequestException('Invalid refresh token');
		}
		const tokens = this.generateToken(user);
		const newUser = await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: tokens.refreshToken },
		});
		return { user: newUser, tokens };
	}

	async logout(tokens: LogoutDto) {
		const { refreshToken, accessToken } = tokens;
		const user = await this.users.getUserByRefreshToken(refreshToken);
		if (!user) {
			throw new BadRequestException('User not found');
		}
		const decoded = this.jwtService.decode(accessToken);
		await this.prisma.blackListAccessToken.create({
			data: {
				token: accessToken,
				expiredAt: new Date(decoded.exp * 1000),
			},
		});
		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: null },
		});
		return true;
	}

	private generateToken(user: User) {
		const access = { sub: user.id, email: user.email };
		const refresh = { sub: user.id };
		return {
			accessToken: this.jwtService.sign(access, {
				expiresIn: AppConstants.jwt.expiresIn.accessToken,
				secret: this.configService.get<string>('JWT_SECRET'),
			}),
			refreshToken: this.jwtService.sign(refresh, {
				expiresIn: AppConstants.jwt.expiresIn.refreshToken,
				secret: this.configService.get<string>('JWT_SUPER_SECRET'),
			}),
		};
	}
}
