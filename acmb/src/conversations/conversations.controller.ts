/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from 'src/dto/create-conversation.dto';
import { SendConversationMessageDto } from 'src/dto/1o1-send-message.dto';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { JwtAuthGuard } from 'src/guards/jwt/jwtAuth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conv: ConversationsService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateConversationDto,
  ) {
    // for now handle oneOnOne convenience
    if (!dto.isGroup && dto.participantIds?.length === 1) {
      return this.conv.createOneOnOne(req.user.id, dto.participantIds[0]);
    }
    // implement group creation if needed
  }

  @Get()
  async list(@Req() req: RequestWithUser) {
    return this.conv.listConversationsForUser(req.user.id);
  }

  @Get(':id/messages')
  async messages(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Query('limit') l?: string,
    @Query('cursor') cursor?: string,
  ) {
    // ensure participant
    await this.conv['ensureParticipant'](id, req.user.id);
    const limit = l ? parseInt(l, 10) : 50;
    return this.conv.getMessages(id, limit, cursor);
  }

  @Post(':id/read')
  async markRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.conv.markAsRead(id, req.user.id);
  }

  @Post(':id/messages')
  async postMessage(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: SendConversationMessageDto,
  ) {
    // fallback REST sending (gateway is preferred)
    dto.conversationId = id;
    return this.conv.sendMessage(req.user.id, dto);
  }
}
