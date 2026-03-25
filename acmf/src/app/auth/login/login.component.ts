import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword: boolean = false;
  capsLockWarning: boolean = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      // Add shake animation to invalid fields
      const invalidFields = document.querySelectorAll('.border-red-400');
      invalidFields.forEach(field => {
        field.classList.add('animate-shake');
        setTimeout(() => {
          field.classList.remove('animate-shake');
        }, 300);
      });
      return;
    }

    const payLoad = this.loginForm.value;
    this.authService.handleLogin(payLoad);
  }

  toggleVisibility() {
    this.showPassword = !this.showPassword;
  }

  isInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control?.invalid && control?.touched;
  }

  // Detect Caps Lock
  @HostListener('window:keydown', ['$event'])
  detectCapsLock(event: KeyboardEvent): void {
    if (event.getModifierState && event.getModifierState('CapsLock')) {
      this.capsLockWarning = true;
    } else {
      this.capsLockWarning = false;
    }
  }
}