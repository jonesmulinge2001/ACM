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
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { CommentLikeModule } from './comment-like/comment-like.module';
import { PostModule } from './post/post.module';
import { DashboardOverviewModule } from './admin/dashboard-overview/dashboard-overview.module';
import { UserManagementModule } from './admin/user-management/user-management.module';
import { PostManagementModule } from './admin/post-management/post-management.module';
import { GroupsModule } from './groups/groups.module';
import { ConversationsModule } from './conversations/conversations.module';
import { InstitutionModule } from './institution/institution.module';
import { ManageGroupsModule } from './admin/manage-groups/manage-groups.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { VideosModule } from './uniTok/videos/videos.module';
import { VideoLikeModule } from './uniTok/video-like/video-like.module';
import { VideoCommentModule } from './uniTok/video-comment/video-comment.module';
import { UploadModule } from './academic/upload/upload.module';
import { ExtractionModule } from './academic/extraction/extraction.module';
import { ModerationModule } from './academic/moderation/moderation.module';
import { ProcessingModule } from './academic/processing/processing.module';
import { AcademicResourceModule } from './academic/academic-reseource/academic-resource.module';
import { IntentModule } from './intent/intent.module';

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
    LikeModule,
    CommentModule,
    CommentLikeModule,
    PostModule,
    DashboardOverviewModule,
    UserManagementModule,
    PostManagementModule,
    GroupsModule,
    ConversationsModule,
    InstitutionModule,
    ManageGroupsModule,
    SearchModule,
    NotificationsModule,
    VideosModule,
    VideoLikeModule,
    VideoCommentModule,
    UploadModule,
    ExtractionModule,
    ModerationModule,
    ProcessingModule,
    AcademicResourceModule,
    IntentModule
  ],
  providers: [AppService],
  controllers: [],
})
export class AppModule {}
