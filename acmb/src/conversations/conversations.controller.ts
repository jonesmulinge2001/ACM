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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from 'src/dto/create-conversation.dto';
import { SendConversationMessageDto } from 'src/dto/1o1-send-message.dto';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { JwtAuthGuard } from 'src/guards/jwt/jwtAuth.guard';
import { AcademeetCloudinaryService, AcademeetUploadType } from 'src/shared/cloudinary/cloudinary/cloudinary.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MessageAttachment } from 'src/dto/message-attachment.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private conv: ConversationsService,
    private cloudinaryService: AcademeetCloudinaryService
  ) {}

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

  @Post('uploads/message')
@UseInterceptors(FileInterceptor('file'))
async uploadMessageAttachment(@UploadedFile() file: Express.Multer.File) {
  const result = await this.cloudinaryService.uploadMedia(
    file,
    AcademeetUploadType.RESOURCE_FILE,
  );

  return {
    url: result.secure_url,
    type: result.resource_type,
    name: file.originalname,
    size: file.size,
  };
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
  @UseInterceptors(FilesInterceptor('attachments'))
  async postMessage(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: SendConversationMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    dto.conversationId = id;
  
    let attachments: MessageAttachment[] | null = null;
  
    if (files && files.length > 0) {
      attachments = [];
  
      for (const file of files) {
        const isMedia = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
        const result = isMedia
          ? await this.cloudinaryService.uploadMedia(file, AcademeetUploadType.RESOURCE_FILE)
          : await this.cloudinaryService.uploadRaw(file, AcademeetUploadType.RESOURCE_FILE);
  
        attachments.push({
          url: result.secure_url,
          type: result.resource_type,
          name: file.originalname,
        });
      }
    }
  
    return this.conv.sendMessage(req.user.id, {
      ...dto,
      attachments,
    });
  }
  
  

  @Get(':id')
async getOne(@Req() req: RequestWithUser, @Param('id') id: string) {
  return this.conv.getConversation(id, req.user.id);
}

}
