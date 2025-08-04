import {ChangePasswordDto} from "@/auth/dto/change-password.dto";
import {CreateAccountDto} from "@/auth/dto/create-account.dto";
import {LoginAccountDto} from "@/auth/dto/login-account.dto";
import {AuthGuard} from './guards/Auth.guard';
import {LogoutDto} from './dto/logout.dto';
import {RefreshTokenDto} from './dto/refreshToken.dto';
import {ILoginProfile} from './interfaces/ILoginProfile';
import {ApiResponseDto} from '@/common/classes/response.dto';
import {ApiMessageKey} from '@/common/constants/message.constants';
import {BasicHeader} from '@/common/decorators/basic-header.decorator';
import {
	Body,
	Controller,
	Get,
	HttpStatus,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiBody,
	ApiOkResponse,
	ApiOperation,
} from '@nestjs/swagger';
import {AuthService} from './auth.service';
import {Public} from './decorators/public.decorator';

@BasicHeader('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {
	}

	@Public()
	@Get('google')
	@ApiOperation({
		summary: 'Get google redirect',
	})
	@ApiOkResponse({type: ApiResponseDto<string>})
	@ApiOperation({summary: 'Get redirect string url for Google OAuth'})
	async googleAuth() {
		try {
			const url = await this.authService.googleLogin();
			return new ApiResponseDto<string>({
				statusCode: HttpStatus.OK,
				data: url,
				message: ApiMessageKey.GET_GOOGLE_URL_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}

	@Public()
	@Get('google/callback')
	@ApiOperation({
		summary: 'Login google callback',
	})
	@ApiOkResponse({type: ApiResponseDto<ILoginProfile>})
	@ApiOperation({summary: 'Handle Google OAuth callback'})
	async googleAuthCallback(@Query('code') code: string) {
		try {
			const user = await this.authService.googleLoginCallback(code);
			return new ApiResponseDto<ILoginProfile>({
				statusCode: HttpStatus.OK,
				data: user,
				message: ApiMessageKey.LOGIN_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}


	@Public()
	@Post('email/create')
	@ApiOperation({
		summary: 'Create account by email',
	})
	@ApiBody({type: CreateAccountDto})
	@ApiOkResponse({type: ApiResponseDto<ILoginProfile>})
	@ApiOperation({summary: 'Create account by email'})
	async createAccountEmail(@Body() body: CreateAccountDto) {
		try {
			const user = await this.authService.createAccount(body);
			return new ApiResponseDto<ILoginProfile>({
				statusCode: HttpStatus.OK,
				data: user,
				message: ApiMessageKey.CREATE_USER_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}

	@Public()
	@Post('email/login')
	@ApiOperation({
		summary: 'Login account by email',
	})
	@ApiBody({type: LoginAccountDto})
	@ApiOkResponse({type: ApiResponseDto<ILoginProfile>})
	@ApiOperation({summary: 'Login account by email'})
	async loginAccountEmail(@Body() body: LoginAccountDto) {
		try {
			const user = await this.authService.login(body);
			return new ApiResponseDto<ILoginProfile>({
				statusCode: HttpStatus.OK,
				data: user,
				message: ApiMessageKey.LOGIN_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}

	@Public()
	@Post('email/change-password')
	@ApiOperation({
		summary: 'Change password account by email',
	})
	@ApiBody({type: ChangePasswordDto})
	@ApiOkResponse({type: ApiResponseDto<ILoginProfile>})
	@ApiOperation({summary: 'Change password account by email'})
	async changePasswordAccountEmail(@Body() body: ChangePasswordDto) {
		try {
			const user = await this.authService.changePassword(body);
			return new ApiResponseDto<ILoginProfile>({
				statusCode: HttpStatus.OK,
				data: user,
				message: ApiMessageKey.CHANGE_PASSWORD_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}

	@Post('refresh-token')
	@ApiOperation({
		summary: 'Get refresh token',
	})
	@ApiBody({type: RefreshTokenDto})
	@ApiOkResponse({type: ApiResponseDto<ILoginProfile>})
	@ApiOperation({summary: 'Get refresh token'})
	async getNewAccessToken(@Body() body: RefreshTokenDto) {
		try {
			const user = await this.authService.renewToken(body);
			return new ApiResponseDto<ILoginProfile>({
				statusCode: HttpStatus.OK,
				data: user,
				message: ApiMessageKey.REFRESH_TOKEN_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}

	@UseGuards(AuthGuard)
	@ApiBearerAuth()
	@Post('logout')
	@ApiOperation({
		summary: 'Block token when logout',
	})
	@ApiBody({type: LogoutDto})
	@ApiOkResponse({type: ApiResponseDto<boolean>})
	@ApiOperation({summary: 'Block token when logout'})
	async logout(@Body() body: LogoutDto) {
		try {
			const user = await this.authService.logout(body);
			return new ApiResponseDto<boolean>({
				statusCode: HttpStatus.OK,
				data: user,
				message: ApiMessageKey.LOGOUT_SUCCESS,
				pagination: null,
			});
		} catch (err) {
			throw err;
		}
	}
}
