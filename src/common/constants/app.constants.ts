export const AppConstants = {
	GLOBAL_PREFIX: 'api/v1',
	PROJECT_NAME: 'Manus',
	AUTH_HEADERS_KEY: 'authorization',
	LANG_HEADERS_KEY: 'x-language',
	VIETNAM_TIMEZONE: 'Asia/Ho_Chi_Minh',
	jwt: {
		expiresIn: {
			accessToken: '1 day',
			refreshToken: '7 days',
		},
	},
	filter: {
		page: 1,
		limit: 10,
	},
};
