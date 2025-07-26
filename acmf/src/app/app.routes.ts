import { Routes } from '@angular/router';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { CreateProfileComponent } from './components/profile/create-profile/create-profile.component';
import { MyProfileComponent } from './components/profile/my-profile/my-profile.component';
import { HomeComponent } from './components/home/home.component';
import { NetworkComponent } from './components/network/network.component';
import { ResourcesComponent } from './components/resources/resources.component';
import { CreateComponent } from './components/create/create.component';
import { OpportunitiesComponent } from './components/opportunities/opportunities.component';
import { UpdateProfileComponent } from './components/profile/update-profile/update-profile.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    {path: 'home', component: HomeComponent},
    {path: 'register', component: RegisterComponent},
    { path: 'verify-email', component: VerifyEmailComponent },
    { path: 'login', component: LoginComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },

    //====>>>> public routes
    {path: 'create-profile', component: CreateProfileComponent},
    {path: 'my-profile', component: MyProfileComponent},
    {path: 'update-profile', component: UpdateProfileComponent},
    
    {path: 'network', component: NetworkComponent},
    {path: 'resources', component: ResourcesComponent},
    {path: 'create', component: CreateComponent},
    {path: 'opportunities', component: OpportunitiesComponent}
];
