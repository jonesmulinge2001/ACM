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
  ],
  controllers: [AppController, RecommenderController],
  providers: [AppService, AuthService, MailerService, RecommenderService, CommentLikeService],
})
export class AppModule {}
