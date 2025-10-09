/* eslint-disable prettier/prettier */
 
 
 
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { RequestWithUser } from 'src/interfaces/requestwithUser.interface';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';
import { Permission } from 'src/permissions/permission.enum';

@Controller('interactions')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.CREATE_PROFILE)
  async track(@Req() req: RequestWithUser, @Body() body: { postId: string; type: 'VIEW' | 'LIKE' | 'COMMENT'}) {
    const userId = req.user.id;
    const { postId, type } = body;
    return this.interactionService.logInteraction(userId, postId, type);
  }
}
