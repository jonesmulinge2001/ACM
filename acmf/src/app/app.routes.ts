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
import { CreateComponent } from './components/create/create.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { PostComponent } from './components/post/post.component';
import { ResourceUploadModalComponent } from './components/resource-upload-modal/resource-upload-modal.component';

import { StudentLayoutComponent } from './layouts/student-layout/student-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ManageUsersComponent } from './admin/manage-users/manage-users.component';
import { ManageResourcesComponent } from './admin/manage-resources/manage-resources.component';
import { DashboardOverviewComponent } from './admin/dashboard/dashboard.component';
import { PostDetailComponent } from './pages/post-detail/post-detail.component';
import { AdminPostsComponent } from './admin/admin-posts/admin-posts.component';
import { GroupListComponent } from './groups/group-list/group-list.component';
import { GroupDetailComponent } from './groups/group-detail/group-detail.component';
import { AdminAnnouncementFeedComponent } from './InstitutionAdmin/announcement-feed/announcement-feed.component';
import { CreateAnnouncementComponent } from './InstitutionAdmin/create-announcement/create-announcement.component';
import { InstitutionAdminLayoutComponent } from './layouts/institution-admin-layout/institution-admin-layout.component';
import { AnalyticsComponent } from './InstitutionAdmin/analytics/analytics.component';

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
      { path: 'groups', component: GroupListComponent },
      { path: 'groups/:id', component: GroupDetailComponent },
    ]
  },

  // ==== Admin routes ====
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardOverviewComponent },
      { path: 'manage-users', component: ManageUsersComponent },
      { path: 'manage-posts', component: AdminPostsComponent },
      { path: 'posts/:id', component: PostDetailComponent }
    ]
  },

  // ==== Institution Admin routes ====
{
  path: 'institution-admin',
  component: InstitutionAdminLayoutComponent,
  children: [
    { path: 'announcements', component: AdminAnnouncementFeedComponent },
    { path: 'announcements/create', component: CreateAnnouncementComponent },
    // { path: 'announcements/:id/edit', component: AdminAnnouncementFormComponent },
    { path: 'analytics', component: AnalyticsComponent },
  ]
},

];
