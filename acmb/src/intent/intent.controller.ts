/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IntentService } from './intent.service';
import { JwtAuthGuard } from '../guards/jwt/jwtAuth.guard';
import { RequestWithUser } from '../interfaces/requestwithUser.interface';
import { CreateIntentDto } from '../dto/create-intent.dto';
import { UpdateIntentDto } from '../dto/update-intent.dto';

@UseGuards(JwtAuthGuard)
@Controller('intent')
export class IntentController {
  constructor(private readonly service: IntentService) {}

  @Post()
  create(@Body() dto: CreateIntentDto, @Req() req: RequestWithUser) {
    return this.service.create(req.user.id, dto);
  }

  @Get('me')
  findMine(@Req() req: RequestWithUser) {
    return this.service.findMine(req.user.id);
  }

  @Get('matches')
  findMatches(@Req() req: RequestWithUser) {
  return this.service.findMatches(req.user.id);
}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIntentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
