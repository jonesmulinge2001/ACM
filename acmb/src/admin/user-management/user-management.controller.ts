/* eslint-disable prettier/prettier */
 
 
/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';

@Controller('admin/users')
export class UserManagementController {
  constructor(private readonly userService: UserManagementService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Patch('suspend')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async suspendUsers(
    @Req() req: RequestWithUser,
    @Body('ids') ids: string[],
    @Body('reason') reason: string,
  ) {
    return this.userService.suspendUsers(
      ids,
      req.user.id,
      reason || 'Policy violation',
    );
  }

  @Patch('restore')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async restoreUsers(@Req() req: RequestWithUser, @Body('ids') ids: string[]) {
    return this.userService.restoreUsers(ids, req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<any>) {
    return this.userService.updateUser(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Patch(':id/suspend')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async suspendUser(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body('reason') reason: string,
  ) {
    return this.userService.suspendUser(
      id,
      req.user.id,
      reason || 'Policy violation',
    );
  }

  @Patch(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async restoreUser(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.userService.restoreUser(id, req.user.id);
  }

  @Delete()
@UseGuards(AuthGuard('jwt'))
@RequirePermissions(Permission.MANAGE_USERS)
async deleteUsers(@Body('ids') ids: string[]) {
  return this.userService.deleteUsers(ids);
}

}
