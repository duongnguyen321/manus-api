import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponseDto } from './common/classes/response.dto';
import { ApiMessageKey } from './common/constants/message.constants';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): ApiResponseDto<string> {
		const msg = this.appService.getHello();
		return new ApiResponseDto<string>({
			data: msg,
			message: ApiMessageKey.GET_HELLO_SUCCESS,
			pagination: null,
			statusCode: 200,
		});
	}
}
