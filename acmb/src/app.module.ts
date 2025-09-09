/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './shared/cloudinary/cloudinary/cloudinary.module';
import { JwtModule } from './guards/jwt/jwt.module';
import { MailerService } from './shared/mailer/mailer.service';
import { MailerModule } from './shared/mailer/mailer.module';
import { AuthService } from './auth/auth.service';
import { PermissionModule } from './permissions/permission.module';
import { ProfileModule } from './profile/profile.module';
import { FollowModule } from './follow/follow.module';
import { RecommenderModule } from './recommender/recommender.module';
import { RecommenderController } from './recommender/recommender.controller';
import { RecommenderService } from './recommender/recommender.service';
import { InteractionModule } from './interaction/interaction.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { ViewsModule } from './views/views.module';
import { CommentLikeModule } from './comment-like/comment-like.module';
import { CommentLikeService } from './comment-like/comment-like.service';
import { PostModule } from './post/post.module';
import { AcademicResourceModule } from './academic-resource/academic-resource.module';
import { DashboardOverviewModule } from './admin/dashboard-overview/dashboard-overview.module';
import { DashboardOverviewController } from './admin/dashboard-overview/dashboard-overview.controller';
import { DashboardOverviewService } from './admin/dashboard-overview/dashboard-overview.service';
import { UserManagementModule } from './admin/user-management/user-management.module';
import { PostManagementModule } from './admin/post-management/post-management.module';
import { AcademicRsourceModule } from './admin/academic-rsource/academic-rsource.module';
import { GroupsModule } from './groups/groups.module';
import { ConversationsModule } from './conversations/conversations.module';

@Module({
  imports: [
    AuthModule,
    CloudinaryModule,
    PermissionModule,
    JwtModule,
    MailerModule,
    ProfileModule,
    FollowModule,
    RecommenderModule,
    InteractionModule,
    LikeModule,
    CommentModule,
    ViewsModule,
    CommentLikeModule,
    PostModule,
    AcademicResourceModule,
    DashboardOverviewModule,
    UserManagementModule,
    PostManagementModule,
    AcademicRsourceModule,
    GroupsModule,
    ConversationsModule,
  ],
  controllers: [
    AppController,
    RecommenderController,
    DashboardOverviewController,
  ],
  providers: [
    AppService,
    AuthService,
    MailerService,
    RecommenderService,
    CommentLikeService,
    DashboardOverviewService,
  ],
})
export class AppModule {}
