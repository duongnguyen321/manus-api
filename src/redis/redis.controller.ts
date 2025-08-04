import { Roles } from "@/auth/decorators/roles.decorator";
import { AuthGuard } from "@/auth/guards/Auth.guard";
import { RolesGuard } from "@/auth/guards/Roles.guard";
import { ApiResponseDto } from "@/common/classes/response.dto";
import { ApiMessageKey } from "@/common/constants/message.constants";
import { BasicHeader } from "@/common/decorators/basic-header.decorator";
import { RedisService } from "@/redis/redis.service";
import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { RoleUser } from "@prisma/client";

@BasicHeader("Redis")
@Controller("redis")
export class RedisController {
  constructor(private readonly redis: RedisService) {}

  @Get("")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleUser.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all key redis",
    description: "Requires role: ADMIN",
  })
  @ApiOkResponse({ type: ApiResponseDto<string[]> })
  async getAllKeyRedis(): Promise<ApiResponseDto<string[]>> {
    const client = this.redis.getClient();
    const keys = await client.keys("*");
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: keys,
      message: ApiMessageKey.GET_ALL_USERS_SUCCESS,
      pagination: null,
    });
  }

  @Get(":key")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleUser.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get detail key redis",
    description: "Requires role: ADMIN",
  })
  @ApiOkResponse({ type: ApiResponseDto<any> })
  async getDataKeyRedis(
    @Param("key") key: string,
  ): Promise<ApiResponseDto<any>> {
    let data = await this.redis.get(key);
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error(e.message);
    }
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: data,
      message: ApiMessageKey.GET_USER_DETAIL_SUCCESS,
      pagination: null,
    });
  }

  @Delete(":pattern")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleUser.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete key pattern redis",
    description: "Requires role: ADMIN",
  })
  @ApiOkResponse({ type: ApiResponseDto<number> })
  async deleteKeyRedis(
    @Param("pattern") pattern: string,
  ): Promise<ApiResponseDto<number>> {
    const number = await this.redis.delPattern(pattern);
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: number,
      message: ApiMessageKey.DELETE_USER_SUCCESS,
      pagination: null,
    });
  }

  @Delete()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleUser.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete all key redis",
    description: "Requires role: ADMIN",
  })
  @ApiOkResponse({ type: ApiResponseDto<number> })
  async deleteAllKeyRedis(): Promise<ApiResponseDto<number>> {
    await this.redis.deleteAll();
    return new ApiResponseDto({
      statusCode: HttpStatus.OK,
      data: "Delete all key redis success",
      message: ApiMessageKey.DELETE_USER_SUCCESS,
      pagination: null,
    });
  }
}
