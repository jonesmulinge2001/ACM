/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Get } from '@nestjs/common';
import { StudyRequestsService } from './study-requests.service';
import { SendStudyRequestDto } from '../dto/send-study-request.dto';
import { CurrentUser } from '../decorator/currentUser/currentUser.decorator';
import { RespondStudyRequestDto } from '../dto/respond-study-request.dto';

@Controller('study-requests')
export class StudyRequestsController {
    constructor(private readonly service: StudyRequestsService){}

    @Post('send')
    send(@CurrentUser('id') userId: string, @Body() dto: SendStudyRequestDto) {
      return this.service.sendRequest(userId, dto.receiverId);
    }

    @Post('respond')
    respond(@CurrentUser('id') userId: string, @Body() dto: RespondStudyRequestDto) {
      return this.service.respondToRequest(userId, dto.requestId, dto.status);
    }

    @Post('cancel')
    cancel(@CurrentUser('id') userId: string, @Body('requestId') requestId: string) {
      return this.service.cancelRequest(userId, requestId);
    }

    @Get('incoming')
    incoming(@CurrentUser('id') userId: string) {
      return this.service.myIncomingRequests(userId);
    }

    @Get('partners')
    partners(@CurrentUser('id') userId: string) {
      return this.service.myStudyPartners(userId);
    }
}
