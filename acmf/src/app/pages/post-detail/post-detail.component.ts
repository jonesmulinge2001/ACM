// post-detail.component.ts
import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { CommentService } from '../../services/comment.service';
import { Post, Comment, Author } from '../../interfaces';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { LikeService } from '../../services/like.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div *ngIf="isOpen" class="post-detail-overlay" [class.open]="isOpen" (click)="close()">
      <div class="post-detail-container" (click)="$event.stopPropagation()">
        <!-- Close button -->
        <button class="close-btn" (click)="close()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>

        <!-- Loading state -->
        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading post...</p>
        </div>

        <!-- Error state -->
        <div *ngIf="error" class="error-container">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h3>Unable to load post</h3>
          <p>{{ error }}</p>
          <button class="retry-btn" (click)="loadPost()">Try Again</button>
        </div>

        <!-- Post content -->
        <div *ngIf="!loading && post" class="post-content">
          <!-- Author header -->
          <div class="author-header">
            <div class="author-info">
              <img 
                [src]="post.author.profileImage || 'assets/default-avatar.png'" 
                [alt]="post.author.name"
                class="author-avatar"
                (error)="handleImageError($event)"
              />
              <div class="author-details">
                <h3 class="author-name">{{ post.author.name }}</h3>
                <div class="author-meta">
                  <span *ngIf="post.author.institution" class="institution">
                    {{ post.author.institution.name }}
                  </span>
                  <span *ngIf="post.author.academicLevel" class="academic-level">
                    • {{ post.author.academicLevel }}
                  </span>
                  <span class="post-time">• {{ formatTime(post.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="post-actions-header">
              <button class="icon-btn" (click)="toggleBookmark()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                     [class.bookmarked]="isBookmarked">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                </svg>
              </button>
              <button class="icon-btn" (click)="showMoreOptions = !showMoreOptions">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
              <div *ngIf="showMoreOptions" class="more-options-dropdown">
                <button class="dropdown-item" (click)="copyPostLink()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Copy link to post
                </button>
                <button *ngIf="canEditPost()" class="dropdown-item" (click)="editPost()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit post
                </button>
                <!-- <button *ngIf="canDeletePost()" class="dropdown-item delete" (click)="deletePost()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete post
                </button> -->
                <button class="dropdown-item" (click)="reportPost()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Report post
                </button>
              </div>
            </div>
          </div>

          <!-- Post body -->
          <div class="post-body">
            <h2 class="post-title">{{ post.title }}</h2>
            <p class="post-description" [class.collapsed]="!showFullText && post.body && post.body.length > 300">
              {{ post.body }}
            </p>
            <button *ngIf="post.body && post.body.length > 300" 
                    class="read-more-btn" 
                    (click)="showFullText = !showFullText">
              {{ showFullText ? 'Show less' : '...read more' }}
            </button>

            <!-- Tags -->
            <div *ngIf="post.tags && post.tags.length > 0" class="post-tags">
              <span *ngFor="let tag of post.tags" class="tag">{{ tag }}</span>
            </div>

            <!-- Media content -->
            <div *ngIf="post.fileUrl" class="post-media">
              <ng-container [ngSwitch]="getFileType(post.fileUrl)">
                <img *ngSwitchCase="'image'" 
                     [src]="post.fileUrl" 
                     [alt]="post.title"
                     class="post-image"
                     (click)="openMediaViewer(post.fileUrl!)"
                     (error)="handleMediaError($event)"/>
                <video *ngSwitchCase="'video'" 
                       controls
                       class="post-video"
                       (error)="handleMediaError($event)">
                  <source [src]="post.fileUrl" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
                <div *ngSwitchDefault class="file-preview">
                  <a [href]="post.fileUrl" target="_blank" class="file-download">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Download File</span>
                  </a>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- Post stats -->
          <div class="post-stats">
            <div class="stat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>{{ post.likesCount || 0 }} likes</span>
            </div>
            <div class="stat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>{{ post.comments?.length || 0 }} comments</span>
            </div>
            <div class="stat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
              <span>{{ viewCount }} views</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="post-actions">
            <button class="action-btn" [class.active]="post.likedByCurrentUser" (click)="toggleLike()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                   [attr.stroke]="post.likedByCurrentUser ? 'none' : 'currentColor'" 
                   stroke-width="2"
                   [attr.fill]="post.likedByCurrentUser ? '#dc2626' : 'none'">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>{{ post.likedByCurrentUser ? 'Liked' : 'Like' }}</span>
            </button>
            <button class="action-btn" (click)="focusCommentInput()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>Comment</span>
            </button>
            <button class="action-btn" (click)="sharePost()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              <span>Share</span>
            </button>
            <button class="action-btn" (click)="toggleBookmark()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" 
                   [attr.stroke]="isBookmarked ? 'none' : 'currentColor'" 
                   stroke-width="2"
                   [attr.fill]="isBookmarked ? '#2563eb' : 'none'">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
              </svg>
              <span>{{ isBookmarked ? 'Saved' : 'Save' }}</span>
            </button>
          </div>

          <!-- Comments section -->
          <div class="comments-section">
            <h3 class="comments-title">Comments ({{ post.comments?.length || 0 }})</h3>
            
            <!-- New comment input -->
            <div class="new-comment">
              <img 
                [src]="currentUserProfileImage || 'assets/default-avatar.png'" 
                alt="Your avatar"
                class="comment-avatar"
                (error)="handleImageError($event)"
              />
              <div class="comment-input-container">
                <textarea 
                  #commentInput
                  [(ngModel)]="newComment"
                  placeholder="Add a comment..."
                  class="comment-input"
                  (keydown.enter)="addComment($event)"
                  rows="3"
                ></textarea>
                <button 
                  class="post-comment-btn" 
                  [disabled]="!newComment.trim() || postingComment"
                  (click)="addComment()">
                  {{ postingComment ? 'Posting...' : 'Post' }}
                </button>
              </div>
            </div>

            <!-- Comments list -->
            <div class="comments-list" *ngIf="post.comments && post.comments.length > 0">
              <div *ngFor="let comment of post.comments" class="comment-item">
                <img 
                  [src]="comment.user.profile.profileImage || 'assets/default-avatar.png'" 
                  [alt]="comment.user.name"
                  class="comment-avatar"
                  (error)="handleImageError($event)"
                />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user.name }}</span>
                    <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-body">{{ comment.body }}</p>
                  <div class="comment-actions">
                    <button class="comment-action-btn" (click)="toggleCommentLike(comment)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" 
                           [attr.stroke]="comment.isLikedByCurrentUser ? 'none' : 'currentColor'" 
                           stroke-width="2"
                           [attr.fill]="comment.isLikedByCurrentUser ? '#dc2626' : 'none'">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span>{{ comment.likes || 0 }}</span>
                    </button>
                    <button class="comment-action-btn" (click)="startReply(comment)">
                      Reply
                    </button>
                  </div>

                  <!-- Replies -->
                  <div *ngIf="comment.replies && comment.replies.length > 0" class="replies">
                    <div *ngFor="let reply of comment.replies" class="reply-item">
                      <img 
                        [src]="reply.user.profile.profileImage || 'assets/default-avatar.png'" 
                        [alt]="reply.user.name"
                        class="reply-avatar"
                        (error)="handleImageError($event)"
                      />
                      <div class="reply-content">
                        <div class="reply-header">
                          <span class="reply-author">{{ reply.user.name }}</span>
                          <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                        </div>
                        <p class="reply-body">{{ reply.body }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No comments message -->
            <div *ngIf="(!post.comments || post.comments.length === 0) && !loading" class="no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Media viewer modal -->
    <div *ngIf="showMediaViewer" class="media-viewer-overlay" (click)="closeMediaViewer()">
      <div class="media-viewer-content" (click)="$event.stopPropagation()">
        <button class="close-media-btn" (click)="closeMediaViewer()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
        </button>
        <img [src]="currentMediaUrl" alt="Media" class="media-viewer-image" *ngIf="getFileType(currentMediaUrl) === 'image'"/>
      </div>
    </div>
  `,
  styles: [`
    .post-detail-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      backdrop-filter: blur(4px);
    }

    .post-detail-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .post-detail-container {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }

    .post-detail-overlay.open .post-detail-container {
      transform: translateY(0);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(0, 0, 0, 0.1);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10;
      transition: background-color 0.2s ease;
    }

    .close-btn:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    .loading-container,
    .error-container {
      padding: 60px 40px;
      text-align: center;
      color: #666;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container h3 {
      color: #dc2626;
      margin: 16px 0 8px;
    }

    .retry-btn {
      margin-top: 20px;
      padding: 10px 24px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .retry-btn:hover {
      background: #1d4ed8;
    }

    .post-content {
      padding: 40px;
    }

    .author-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      position: relative;
    }

    .author-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #f3f4f6;
    }

    .author-details {
      flex: 1;
    }

    .author-name {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .author-meta {
      margin-top: 4px;
      font-size: 14px;
      color: #6b7280;
    }

    .institution,
    .academic-level,
    .post-time {
      margin-right: 8px;
    }

    .post-actions-header {
      display: flex;
      gap: 8px;
      position: relative;
    }

    .icon-btn {
      background: none;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .icon-btn:hover {
      background-color: #f3f4f6;
    }

    .icon-btn svg {
      color: #6b7280;
    }

    .icon-btn svg.bookmarked {
      fill: #2563eb;
      color: #2563eb;
    }

    .more-options-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 200px;
      z-index: 20;
      margin-top: 8px;
      overflow: hidden;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
      transition: background-color 0.2s ease;
    }

    .dropdown-item:hover {
      background-color: #f9fafb;
    }

    .dropdown-item.delete {
      color: #dc2626;
    }

    .dropdown-item.delete:hover {
      background-color: #fef2f2;
    }

    .post-body {
      margin-bottom: 24px;
    }

    .post-title {
      margin: 0 0 16px;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      line-height: 1.3;
    }

    .post-description {
      margin: 0 0 16px;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
      white-space: pre-wrap;
    }

    .post-description.collapsed {
      max-height: 120px;
      overflow: hidden;
      position: relative;
    }

    .post-description.collapsed::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: linear-gradient(transparent, white);
    }

    .read-more-btn {
      background: none;
      border: none;
      color: #2563eb;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 0;
      font-size: 14px;
    }

    .read-more-btn:hover {
      text-decoration: underline;
    }

    .post-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .tag {
      background: #f3f4f6;
      color: #374151;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .post-media {
      margin: 24px 0;
      border-radius: 8px;
      overflow: hidden;
      background: #f9fafb;
    }

    .post-image {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      cursor: zoom-in;
      display: block;
    }

    .post-video {
      width: 100%;
      max-height: 400px;
      display: block;
    }

    .file-preview {
      padding: 32px;
      text-align: center;
    }

    .file-download {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    .file-download:hover {
      color: #1d4ed8;
    }

    .post-stats {
      display: flex;
      gap: 24px;
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;
      font-size: 14px;
      color: #6b7280;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .post-actions {
      display: flex;
      justify-content: space-around;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background-color: #f3f4f6;
    }

    .action-btn.active {
      color: #2563eb;
    }

    .action-btn svg {
      color: inherit;
    }

    .comments-section {
      margin-top: 32px;
    }

    .comments-title {
      margin: 0 0 20px;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .new-comment {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
    }

    .comment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .comment-input-container {
      flex: 1;
      position: relative;
    }

    .comment-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
      min-height: 60px;
      font-family: inherit;
    }

    .comment-input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .post-comment-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 6px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .post-comment-btn:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .post-comment-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .comment-item {
      display: flex;
      gap: 12px;
    }

    .comment-content {
      flex: 1;
    }

    .comment-header {
      margin-bottom: 4px;
    }

    .comment-author {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }

    .comment-time {
      font-size: 12px;
      color: #9ca3af;
      margin-left: 8px;
    }

    .comment-body {
      margin: 0 0 8px;
      font-size: 14px;
      line-height: 1.5;
      color: #374151;
    }

    .comment-actions {
      display: flex;
      gap: 16px;
    }

    .comment-action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }

    .comment-action-btn:hover {
      color: #2563eb;
    }

    .replies {
      margin-top: 16px;
      margin-left: 24px;
      padding-left: 16px;
      border-left: 2px solid #e5e7eb;
    }

    .reply-item {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .reply-item:last-child {
      margin-bottom: 0;
    }

    .reply-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .reply-content {
      flex: 1;
    }

    .reply-header {
      margin-bottom: 2px;
    }

    .reply-author {
      font-weight: 500;
      color: #111827;
      font-size: 13px;
    }

    .reply-time {
      font-size: 11px;
      color: #9ca3af;
      margin-left: 6px;
    }

    .reply-body {
      margin: 0;
      font-size: 13px;
      line-height: 1.4;
      color: #4b5563;
    }

    .no-comments {
      text-align: center;
      padding: 32px;
      color: #9ca3af;
      font-style: italic;
    }

    .media-viewer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .media-viewer-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
    }

    .close-media-btn {
      position: absolute;
      top: -40px;
      right: 0;
      background: none;
      border: none;
      color: white;
      cursor: pointer;
    }

    .media-viewer-image {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
    }
  `]
})
export class PostDetailComponent implements OnInit {
  @Input() postId: string | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() postUpdated = new EventEmitter<Post>();

  post: Post | null = null;
  loading = false;
  error: string | null = null;
  showFullText = false;
  isBookmarked = false;
  showMoreOptions = false;
  newComment = '';
  postingComment = false;
  viewCount = 0;
  showMediaViewer = false;
  currentMediaUrl = '';
  currentUserProfileImage = 'assets/default-avatar.png';

  private currentUserId: string | null = null;

  constructor(
    private postService: PostService,
    private likeService: LikeService,
    private authService: AuthService,
    private commentService: CommentService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.id) {
        this.currentUserId = user.id;
        // You might want to load the user's profile image here
        this.currentUserProfileImage = user.profileImage || 'assets/default-avatar.png';
      }
    });

    // Handle route changes if opened via route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.postId = params['id'];
        this.isOpen = true;
        this.loadPost();
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.isOpen && keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      this.close();
    }
  }

  loadPost() {
    if (!this.postId) return;

    this.loading = true;
    this.error = null;

    this.postService.getPostById(this.postId).pipe(
      catchError(err => {
        this.error = err.message || 'Failed to load post';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(post => {
      if (post) {
        this.post = post;
        this.incrementViewCount();
        // Load comments if not already loaded
        if (!post.comments) {
          this.loadComments();
        }
      }
    });
  }

  loadComments() {
    if (!this.postId) return;

    this.commentService.getComments(this.postId).subscribe({
      next: (response) => {
        if (this.post) {
          this.post.comments = response.comments;
        }
      },
      error: (err) => {
        console.error('Failed to load comments:', err);
      }
    });
  }

  close() {
    this.isOpen = false;
    this.post = null;
    this.error = null;
    this.showFullText = false;
    this.showMoreOptions = false;
    this.newComment = '';
    this.closed.emit();
    
    // Navigate back if opened via route
    if (this.route.snapshot.params['id']) {
      this.router.navigate(['/'], { relativeTo: this.route });
    }
  }

  toggleLike() {
    if (!this.post || !this.currentUserId) return;

    const wasLiked = this.post.likedByCurrentUser;
    
    // Optimistic update
    this.post.likedByCurrentUser = !wasLiked;
    this.post.likesCount = (this.post.likesCount || 0) + (wasLiked ? -1 : 1);

    const likeAction = wasLiked 
      ? this.likeService.unLikePost(this.post.id)
      : this.likeService.likePost(this.post.id);

    likeAction.subscribe({
      error: () => {
        // Revert on error
        this.post!.likedByCurrentUser = wasLiked;
        this.post!.likesCount = (this.post!.likesCount || 0) + (wasLiked ? 1 : -1);
      }
    });
  }

  toggleBookmark() {
    this.isBookmarked = !this.isBookmarked;
    // TODO: Implement bookmark service call
  }

  canEditPost(): boolean {
    return this.currentUserId === this.post?.author.id;
  }

  // canDeletePost(): boolean {
  //   return this.canEditPost() || this.authService.getUserId();
  // }

  // deletePost() {
  //   if (!this.post || !confirm('Are you sure you want to delete this post?')) return;

  //   this.postService.deletePost(this.post.id).subscribe({
  //     next: () => {
  //       this.close();
  //       // Emit event for parent component to handle
  //       this.postUpdated.emit({ ...this.post!, isDeleted: true });
  //     },
  //     error: (err) => {
  //       alert('Failed to delete post: ' + err.message);
  //     }
  //   });
  // }

  editPost() {
    // TODO: Navigate to edit post page or open edit modal
    this.router.navigate(['/posts/edit', this.post?.id]);
    this.close();
  }

  sharePost() {
    if (!this.post) return;

    const shareUrl = `${window.location.origin}/posts/${this.post.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: this.post.title,
        text: this.post.body?.substring(0, 100),
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  }

  copyPostLink() {
    if (!this.post) return;

    const shareUrl = `${window.location.origin}/posts/${this.post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
      this.showMoreOptions = false;
    });
  }

  reportPost() {
    // TODO: Open report modal
    this.router.navigate(['/report'], { 
      queryParams: { postId: this.post?.id, type: 'POST' } 
    });
    this.close();
  }

  focusCommentInput() {
    const input = document.querySelector('.comment-input') as HTMLElement;
    input?.focus();
  }

  addComment(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.newComment.trim() || !this.post || !this.currentUserId || this.postingComment) return;

    this.postingComment = true;

    this.commentService.createComment(this.post.id, this.newComment).subscribe({
      next: (comment) => {
        if (!this.post!.comments) {
          this.post!.comments = [];
        }
        this.post!.comments.unshift(comment);
        this.newComment = '';
        this.postingComment = false;
      },
      error: (err) => {
        alert('Failed to post comment: ' + err.message);
        this.postingComment = false;
      }
    });
  }

  toggleCommentLike(comment: Comment) {
    comment.isLikedByCurrentUser = !comment.isLikedByCurrentUser;
    comment.likes = (comment.likes || 0) + (comment.isLikedByCurrentUser ? 1 : -1);
    
    // TODO: Call comment like service
  }

  startReply(comment: Comment) {
    this.newComment = `@${comment.user.name} `;
    this.focusCommentInput();
  }

  getFileType(url: string): 'image' | 'video' | 'file' {
    if (!url) return 'file';
    
    const extension = url.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];
    
    if (imageExtensions.includes(extension || '')) return 'image';
    if (videoExtensions.includes(extension || '')) return 'video';
    return 'file';
  }

  openMediaViewer(url: string) {
    if (this.getFileType(url) === 'image') {
      this.currentMediaUrl = url;
      this.showMediaViewer = true;
    }
  }

  closeMediaViewer() {
    this.showMediaViewer = false;
    this.currentMediaUrl = '';
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/default-avatar.png';
  }

  handleMediaError(event: Event) {
    console.error('Failed to load media:', event);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 168) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private incrementViewCount() {
    // TODO: Call service to increment view count
    this.viewCount++;
  }
}