/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/* eslint-disable prettier/prettier */
export interface CurrentUserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): CurrentUserData =>{
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
