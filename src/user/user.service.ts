import { isEmail, isMongoId } from '@/common/helpers/validate.helper';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { Account, Prisma, User } from '@prisma/client';

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private redis: RedisService
	) {}

	private readonly userSelect: { [key in keyof User]: boolean } = {
		refreshToken: false,
		id: true,
		email: true,
		name: true,
		role: true,
		avatar: true,
		createdAt: true,
		updatedAt: true,
		password: false,
	};

	async getUserByRefreshToken(refreshToken: string): Promise<User | null> {
		return this.prisma.user.findFirst({
			where: { refreshToken },
			select: this.userSelect,
		});
	}

	async getProfile(
		auth: User
	): Promise<(User & { accounts: Account[] }) | null> {
		return await this.getUserById(auth.id);
	}

	async getUserById(
		id: string
	): Promise<(User & { accounts: Account[] }) | null> {
		if (!isMongoId(id)) return null;
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: {
				...this.userSelect,
				accounts: true,
			},
		});
		return user;
	}

	async getUserByEmail(email: string): Promise<User | null> {
		if (!isEmail(email)) return null;
		return this.prisma.user.findFirst({
			where: { email },
			select: this.userSelect,
		});
	}

	async getAllUsers(
		params: Prisma.UserFindManyArgs
	): Promise<{ total: number; users: User[] }> {
		const take = params?.take;
		const skip = params?.skip;
		const page = skip / take;
		const limit = params?.take;
		const key = `all-users-page:${page}-limit:${limit}`;

		const total = await this.redis.cached<number>(
			`count-users-${JSON.stringify(params.where)}`,
			'1 day',
			() =>
				this.prisma.user.count({
					where: params.where,
				})
		);
		const users = await this.redis.cached<User[]>(key, '1 day', () =>
			this.prisma.user.findMany({
				...params,
				select: this.userSelect,
			})
		);
		return {
			total,
			users,
		};
	}
}
