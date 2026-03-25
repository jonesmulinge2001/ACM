import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      
      // Add shake animation to invalid fields
      const invalidFields = document.querySelectorAll('.border-red-400');
      invalidFields.forEach(field => {
        field.classList.add('animate-shake');
        setTimeout(() => {
          field.classList.remove('animate-shake');
        }, 300);
      });
      
      // Show toast notification for invalid form
      this.toastr.warning('Please enter a valid email address', 'Invalid Email');
      return;
    }

    const email = this.forgotForm.value.email;
    
    // Show loading toast
    this.toastr.info('Sending reset code...', 'Please wait');
    
    this.authService.handleForgotPassword(email);
    localStorage.setItem('resetEmail', email);
    
    // Navigate after a short delay to show loading state
    setTimeout(() => {
      this.router.navigate(['/reset-password']);
    }, 1000);
  }

  // Navigation helper methods
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Helper method to check if email exists in system (optional)
  checkEmailExists(): void {
    const email = this.forgotForm.get('email')?.value;
    if (email && this.forgotForm.get('email')?.valid) {
      // You can add an API call here to check if email exists
      // This would provide better user experience
      console.log('Checking email:', email);
    }
  }
}