import { User } from '@prisma/client';

export interface ILoginProfile {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
