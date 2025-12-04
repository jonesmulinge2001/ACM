import { Routes } from '@angular/router';

import { RegisterComponent } from './auth/register/register.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';

import { CreateProfileComponent } from './components/profile/create-profile/create-profile.component';
import { MyProfileComponent } from './components/profile/my-profile/my-profile.component';
import { UpdateProfileComponent } from './components/profile/update-profile/update-profile.component';
import { StudentProfileComponent } from './pages/student-profile/student-profile.component';

import { HomeComponent } from './components/home/home.component';
import { NetworkComponent } from './components/network/network.component';
import { ResourcesComponent } from './components/resources/resources.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { PostComponent } from './components/post/post.component';
import { ResourceUploadModalComponent } from './components/resource-upload-modal/resource-upload-modal.component';

import { StudentLayoutComponent } from './layouts/student-layout/student-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ManageUsersComponent } from './admin/manage-users/manage-users.component';
import { DashboardOverviewComponent } from './admin/dashboard/dashboard.component';
import { PostDetailComponent } from './pages/post-detail/post-detail.component';
import { AdminPostsComponent } from './admin/admin-posts/admin-posts.component';
import { GroupListComponent } from './groups/group-list/group-list.component';
import { GroupDetailComponent } from './groups/group-detail/group-detail.component';
import { AdminAnnouncementFeedComponent } from './InstitutionAdmin/announcement-feed/announcement-feed.component';
import { CreateAnnouncementComponent } from './InstitutionAdmin/create-announcement/create-announcement.component';
import { InstitutionAdminLayoutComponent } from './layouts/institution-admin-layout/institution-admin-layout.component';
import { AnalyticsComponent } from './InstitutionAdmin/analytics/analytics.component';
import { InstitutionDashboardComponent } from './InstitutionAdmin/institution-dashboard/institution-dashboard.component';

import { NotificationCenterComponent } from './components/notification-center/notification-center.component';
import { AnnouncementDetailComponent } from './components/announcement-detail/announcement-detail.component';
import { AuthGuard } from './auth.guard';
import { CreateGroupComponent } from './groups/grou-formation/grou-formation.component';
import { ManageGroupsComponent } from './admin/manage-groups/manage-groups.component';
import { SuperAdminInstitutionsComponent } from './admin/institution-management/institution-management.component';

export const routes: Routes = [
  // ==== Public routes (no layout) ====
  { path: 'register', component: RegisterComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ==== Student routes ====
  {
    path: '',
    component: StudentLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'home', component: HomeComponent },
      { path: 'posts/:id', component: PostDetailComponent },
      { path: 'create-profile', component: CreateProfileComponent },
      { path: 'my-profile', component: MyProfileComponent },
      { path: 'update-profile', component: UpdateProfileComponent },
      { path: 'profile/:id', component: StudentProfileComponent },
      { path: 'network', component: NetworkComponent },
      { path: 'resources', component: ResourcesComponent },
      { path: 'create', component: PostComponent },
      { path: 'upload-academic-resource', component: ResourceUploadModalComponent },
      { path: 'opportunities', component: OpportunitiesComponent },
      { path: 'groups/create', component: CreateGroupComponent }, 
      { path: 'groups', component: GroupListComponent },
      { path: 'groups/:id', component: GroupDetailComponent },

      // Notifications + Announcements under StudentLayout
      { path: 'notifications', component: NotificationCenterComponent },
      { path: 'announcements/:id', component: AnnouncementDetailComponent },
    ]
  },

  // ==== Admin routes ====
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardOverviewComponent },
      { path: 'manage-users', component: ManageUsersComponent },
      { path: 'manage-posts', component: AdminPostsComponent },
      { path: 'posts/:id', component: PostDetailComponent },
      { path: 'manage-groups', component: ManageGroupsComponent } ,
      { path: 'institution-management', component: SuperAdminInstitutionsComponent },
    ]
  },

  // ==== Institution Admin routes ====
  {
    path: 'institution-admin',
    canActivate: [AuthGuard],
    component: InstitutionAdminLayoutComponent,
    children: [
      { path: 'announcements', component: AdminAnnouncementFeedComponent },
      { path: 'announcements/create-announcement', component: CreateAnnouncementComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'dashboard-overview', component: InstitutionDashboardComponent },
    ]
  },
];
  