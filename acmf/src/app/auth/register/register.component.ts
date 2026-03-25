import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  role = ['ADMIN', 'STUDENT'];

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^(?:\+254|0)?7\d{8}$/)],
      ],
      role: ['STUDENT', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService.handleRegister(this.registerForm.value);
  }

  toggleVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!control?.invalid && control?.touched;
  }

  // method for password strength indicator
  getPasswordStrength(): 'weak' | 'medium' | 'strong' {
    const password = this.registerForm.get('password')?.value || '';
    
    if (!password) return 'weak';
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Complexity checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }
}