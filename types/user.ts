export type UserEntry = {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  bio: string;
  createdAt: number;
  lastLoginAt: number;
};