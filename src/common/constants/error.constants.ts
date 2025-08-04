export enum ErrorCode {
	USER_NOT_FOUND = 'USER_NOT_FOUND',
	UNAUTHORIZED = 'UNAUTHORIZED',
}

export const errorMessage: { [key in ErrorCode]: string } = {
	[ErrorCode.USER_NOT_FOUND]: 'User not found.',
	[ErrorCode.UNAUTHORIZED]: 'Unauthorized.',
};
