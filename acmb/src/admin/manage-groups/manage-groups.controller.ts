/* eslint-disable prettier/prettier */
 
/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { ManageGroupsService } from './manage-groups.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../../decorator/permissions.decorator';
import { Permission } from '../../permissions/permission.enum';


@Controller('admin/groups')

export class ManageGroupsController {
  constructor(private readonly manageGroupsService: ManageGroupsService) {}

  @Get()
    @UseGuards(AuthGuard('jwt'))
    @RequirePermissions(Permission.MANAGE_USERS)
  async getAllGroups() {
    return this.manageGroupsService.getAllGroups();
  }

  @Get(':id/members')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async getGroupMembers(@Param('id') id: string) {
    return this.manageGroupsService.getGroupMembers(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async deleteGroup(@Param('id') id: string) {
    return this.manageGroupsService.deleteGroup(id);
  }

  @Patch(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async restoreGroup(@Param('id') id: string) {
    return this.manageGroupsService.restoreGroup(id);
  }
}
