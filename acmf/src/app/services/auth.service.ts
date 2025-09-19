import { GenericResponse, LoginRequest, LoginResponse, Profile, RegisterRequest, RegisterResponse, ResetPasswordRequest, VerifyEmailRequest } from './../interfaces';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ProfileService } from './profile.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl = 'http://localhost:3000/auth';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<Profile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private profileService: ProfileService
  ) {
    // Restore user on reload if token exists
    const token = localStorage.getItem('token');
    if (token) {
      this.profileService.getMyProfile().subscribe({
        next: (profile) => {
          this.setCurrentUser(profile);
        },
        error: () => {
          // Token invalid? clear everything
          this.logout();
        }
      });
    }
  }
  
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
  

  // api callls
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/register`, data);
  }

  verifyEmail(data: VerifyEmailRequest): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.baseUrl}/verify-email`, data);
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data);
  }

  requestVerificationCode(email: string): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.baseUrl}/request-verification-code`, { email});
  };

  forgotPassword(email: string): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.baseUrl}/forgot-password`, {
      email,
    });
  }

  resetPassword(data: ResetPasswordRequest): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.baseUrl}/reset-password`, data);
  }

  resendRequestCode(email: string): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.baseUrl}/resend-reset-code`, {
      email
    });
  }

  // handler Methods
  handleRegister(data: RegisterRequest): void {
    this.loadingSubject.next(true);
    this.register(data).subscribe({
      next: (response) => {
        this.toastr.success('Registration successful');
        localStorage.setItem('verifyEmail', data.email);
        this.router.navigate(['/verify-email']);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        this.toastr.error('Registration failed');
        this.loadingSubject.next(false);
      }
    });
  }

  handleLogin(data: LoginRequest): void {
    this.loadingSubject.next(true);
    this.login(data).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.toastr.error('Invalid credentials');
          this.loadingSubject.next(false);
          return;
        }

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userId', user.id);
        this.toastr.success('Login successful', 'Welcome back');

        this.profileService.getMyProfile().subscribe({
          next: (profile) => {
            this.setCurrentUser(profile);
          }
        });

        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } 
        else if (user.role === 'INSTITUTION_ADMIN') {
          this.router.navigate(['/institution-admin/announcements']);
        } 
        else {
          this.router.navigate(['/home']);
        }
        
        this.loadingSubject.next(false);
      },
    });
  }

  handleVeridyEmail(data: VerifyEmailRequest): void {
    this.loadingSubject.next(true);
    this.verifyEmail(data).subscribe({
      next: (response) => {
        this.toastr.success(response.message || 'Email verified');
        this.router.navigate(['/login']);
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.toastr.error(err.error.message || 'Email verification failed');
        this.loadingSubject.next(false);
      },
    });
  }

  handleRequestVerificationCode(email: string): void {
    this.loadingSubject.next(true);
    this.requestVerificationCode(email).subscribe({
      next: (response) => {
        this.toastr.success(
          response.message || 'Verification code sent to your email'
        );
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.toastr.error(
          err.error.message || 'Failed to send verification code'
        );
      },
    });
  }

  handleForgotPassword(email: string): void {
    this.loadingSubject.next(true);
    this.forgotPassword(email).subscribe({
      next: (response) => {
        this.toastr.success(
          response.message || 'Password reset code sent to your email'
        );
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.toastr.error(
          err.error.message || 'Failed to send password reset code'
        );
        this.loadingSubject.next(false);
      },
    });
  }

  handleResetPassword(data: ResetPasswordRequest): void {
    this.loadingSubject.next(true);
    this.resetPassword(data).subscribe({
      next: (response) => {
        this.toastr.success(response.message || 'Password reset successfully');
        this.router.navigate(['/login']);
        this.loadingSubject.next(false);
      },
    });
  }

  handleResendResetCode(email: string): void {
    this.loadingSubject.next(true);
    this.resendRequestCode(email).subscribe({
      next: (response) => {
        this.toastr.success(
          'Verification code resent to your email',
          'success'
        );
        this.loadingSubject.next(false);
      },
      error: (err) => {
        this.toastr.error('Failed to resend verification code');
        this.loadingSubject.next(false);
      },
    });
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  setCurrentUser(profile: Profile): void {
    this.currentUserSubject.next(profile);
  }

  getCurrentuser(): Profile | null {
    return this.currentUserSubject.value;
  }
}
