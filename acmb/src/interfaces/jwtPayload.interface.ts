/* eslint-disable prettier/prettier */
import { UserRole } from 'generated/prisma';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
