/* eslint-disable prettier/prettier */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardOverviewService } from './dashboard-overview.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';
import { InstitutionActivity } from 'src/dto/institution-activity.dto';

@Controller('dashboard-overview')
export class DashboardOverviewController {
    constructor(
        private dashboardOverviewService: DashboardOverviewService
    ){}
    @Get('overview')
      @UseGuards(AuthGuard('jwt'))
      @RequirePermissions(Permission.MANAGE_USERS)
    async getOverview() {
        return this.dashboardOverviewService.getOverview();
    }

    @Get('activity')
    async getInstitutionActivity(): Promise<InstitutionActivity[]> {
      return this.dashboardOverviewService.getInstitutionActivity();
    }
}
