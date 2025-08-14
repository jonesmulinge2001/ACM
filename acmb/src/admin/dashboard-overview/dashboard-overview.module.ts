/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { DashboardOverviewService } from './dashboard-overview.service';
import { DashboardOverviewController } from './dashboard-overview.controller';

@Module({
  providers: [DashboardOverviewService],
  controllers: [DashboardOverviewController],
})
export class DashboardOverviewModule {}
