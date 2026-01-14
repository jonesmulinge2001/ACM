/* eslint-disable prettier/prettier */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_POST)
  search(@Query('q') q: string) {
    return this.searchService.searchAll(q);
  }
}

