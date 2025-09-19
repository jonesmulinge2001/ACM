import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from "@angular/router";
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { Profile } from '../../interfaces';

@Component({
  selector: 'app-institution-admin-layout',
  imports: [RouterModule],
  templateUrl: './institution-admin-layout.component.html',
  styleUrl: './institution-admin-layout.component.css'
})
export class InstitutionAdminLayoutComponent implements OnInit{

  isLoggedIn = false;
  userName = '';
  userImage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.isLoggedIn) {
      this.profileService.getMyProfile().subscribe({
        next: (profile: Profile) => {
          this.userName = profile.name;
          this.userImage = profile.profileImage || 'https://via.placeholder.com/40';
        },
        error: (err) => {
          this.toastr.error('Error loading profile');
        },
      });
    }
  }

  logOut(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

}
