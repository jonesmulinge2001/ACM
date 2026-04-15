/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './shared/cloudinary/cloudinary/cloudinary.module';
import { JwtModule } from './guards/jwt/jwt.module';
import { MailerModule } from './shared/mailer/mailer.module';
import { PermissionModule } from './permissions/permission.module';
import { ProfileModule } from './profile/profile.module';
import { FollowModule } from './follow/follow.module';
import { RecommenderModule } from './recommender/recommender.module';
import { InteractionModule } from './interaction/interaction.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { ViewsModule } from './views/views.module';
import { CommentLikeModule } from './comment-like/comment-like.module';
import { PostModule } from './post/post.module';
import { AcademicResourceModule } from './academic-resource/academic-resource.module';
import { DashboardOverviewModule } from './admin/dashboard-overview/dashboard-overview.module';
import { UserManagementModule } from './admin/user-management/user-management.module';
import { PostManagementModule } from './admin/post-management/post-management.module';
import { GroupsModule } from './groups/groups.module';
import { ConversationsModule } from './conversations/conversations.module';
import { InstitutionModule } from './institution/institution.module';
import { ManageGroupsModule } from './admin/manage-groups/manage-groups.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AcademicResourceAdminModule } from './admin/academic-rsource/academic-rsource.module';
import { VideosModule } from './uniTok/videos/videos.module';
import { VideoLikeModule } from './uniTok/video-like/video-like.module';
import { VideoCommentModule } from './uniTok/video-comment/video-comment.module';

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
    AcademicResourceAdminModule,
    GroupsModule,
    ConversationsModule,
    InstitutionModule,
    ManageGroupsModule,
    SearchModule,
    NotificationsModule,
    VideosModule,
    VideoLikeModule,
    VideoCommentModule
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
