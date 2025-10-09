import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit, OnDestroy{
  verifyForm!: FormGroup;
  email!: string;

  resendDisabled: boolean = true;
  countDown: number = 60;
  private timerInterval!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.email = localStorage.getItem('verifyEmail') || '';

    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
    });

    this.startCountDown();
    
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    const payLoad = {
      email: this.email,
      code: this.verifyForm.value.code
    };

    this.authService.verifyEmail(payLoad).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Email verified successfully');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Invalid or expired code';
        this.toastr.error(msg, 'verification failed');
      }
    });
  }

  resendCode(): void {
    if(!this.email){
      this.toastr.error('Email is missing', 'Please register again');
      return;
    }
    this.authService.requestVerificationCode(this.email).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'A new code has been sent to your email successfully');
        this.startCountDown(); // restart timer after resending code
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to resend verification code';
        this.toastr.error(msg, 'Verification failed');
      }
    });
  }

  private startCountDown(): void {
    this.resendDisabled = true;
    this.countDown = 60;

    this.timerInterval = window.setInterval(() =>{
      this.countDown--;
      if(this.countDown === 0) {
        this.resendDisabled = false;
        clearInterval(this.timerInterval)
      }
    }, 1000);
  }
}
