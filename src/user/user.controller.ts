import { Roles } from '@/auth/decorators/roles.decorator';
import { AuthGuard } from '@/auth/guards/Auth.guard';
import { RolesGuard } from '@/auth/guards/Roles.guard';
import { ApiResponseDto } from '@/common/classes/response.dto';
import { AppConstants } from '@/common/constants/app.constants';
import { ErrorCode } from '@/common/constants/error.constants';
import { ApiMessageKey } from '@/common/constants/message.constants';
import { BasicHeader } from '@/common/decorators/basic-header.decorator';
import { getErrorMessage } from '@/common/utils/message.utils';
import {
  Controller,
  Get,
  Param,
  HttpStatus,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { type Account, RoleUser, User as UserModel } from '@prisma/client';
import type { Request } from 'express';

@BasicHeader('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
  })
  @ApiOkResponse({
    type: ApiResponseDto<(UserModel & { accounts: Account[] }) | null>,
  })
  async getUserProfile(
    @Req() req: Request,
  ): Promise<ApiResponseDto<(UserModel & { accounts: Account[] }) | null>> {
    const auth = req?.user;
    if (!auth) {
      throw new NotFoundException({
        message: getErrorMessage(ErrorCode.USER_NOT_FOUND),
        error: ErrorCode.USER_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const user = await this.userService.getProfile(auth);
    if (!user) {
      throw new NotFoundException({
        message: getErrorMessage(ErrorCode.USER_NOT_FOUND),
        error: ErrorCode.USER_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return new ApiResponseDto<(UserModel & { accounts: Account[] }) | null>({
      statusCode: HttpStatus.OK,
      data: user,
      message: ApiMessageKey.GET_USER_DETAIL_SUCCESS,
      pagination: null,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleUser.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Requires role: ADMIN',
  })
  @ApiOkResponse({ type: ApiResponseDto<UserModel> })
  async getUserById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<UserModel | null>> {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new NotFoundException({
        message: getErrorMessage(ErrorCode.USER_NOT_FOUND),
        error: ErrorCode.USER_NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return new ApiResponseDto<UserModel>({
      statusCode: HttpStatus.OK,
      data: user,
      message: ApiMessageKey.GET_USER_DETAIL_SUCCESS,
      pagination: null,
    });
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleUser.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get list all user',
    description: 'Requires role: ADMIN',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    default: 10,
    description: 'Limit of records',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    default: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: RoleUser,
    description: 'Filter by role',
  })
  @ApiOkResponse({ type: ApiResponseDto<UserModel[]> })
  async getAllUsers(
    @Query('limit') limit: number = 10,
    @Query('page') page: number = 1,
    @Query('role') role?: RoleUser,
  ): Promise<ApiResponseDto<UserModel[] | []>> {
    const parsedLimit = isNaN(Number(limit))
      ? AppConstants.filter.limit
      : Number(limit);
    const parsedPage = isNaN(Number(page))
      ? AppConstants.filter.page
      : Number(page);
    const { users, total } = await this.userService.getAllUsers({
      take: parsedLimit,
      skip: (parsedPage - 1) * +parsedLimit,
      where: {
        ...(role ? { role } : {}),
      },
    });
    return new ApiResponseDto<UserModel[]>({
      statusCode: HttpStatus.OK,
      data: users,
      message: ApiMessageKey.GET_ALL_USERS_SUCCESS,
      pagination: {
        limit: +limit,
        page: +page,
        total,
      },
    });
  }
}
