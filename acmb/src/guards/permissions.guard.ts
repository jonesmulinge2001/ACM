/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorator/permissions.decorator';
import { Permission } from '../permissions/permission.enum';
import { PermissionService } from '../permissions/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean  {
      const reqiuredPermissions = this.reflector.getAllAndOverride<string[]>(
        REQUIRE_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!reqiuredPermissions) return true;

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      if(!user || !user.role){
        throw new ForbiddenException('You do not have permission to access this resource');
      };

      const userPermissions = this.permissionService.getRolePermissions(
        user.role);
      
      const hasAllPermissions = reqiuredPermissions.every((permission) =>
    userPermissions.includes(permission as Permission),
      );

      if(!hasAllPermissions) {
        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
  }
}

export { PermissionService }
