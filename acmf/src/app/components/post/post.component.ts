
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './post.component.html',
  styleUrl: './post.component.css'
})
export class PostComponent implements OnInit{
  postForm!: FormGroup;
  selectedFile?: File;
  tags: string[] = [];
  showModal: boolean = true;
  isSubmitting = false;
  profile: Profile | null = null;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private toastr: ToastrService,
    private authService: AuthService,
    private router: Router
  ){
    this.postForm = this.fb.group({
      category: ['GENERAL'],
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(2)]],
      tagInput: [''],
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.profile = user;
    })
  }

  onFileSelected(event: Event, type: 'image' | 'file') {
    const input = event.target as HTMLInputElement;
    if(input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  addTag() {
    const tag = this.postForm.get('tagInput')?.value.trim();
    if(tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.postForm.get('tagInput')?.reset();
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  submitPost() {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      this.toastr.error('Please fill out all required fields correctly.');
      return;
    }    

    this.isSubmitting  = true;
    const formData = new FormData();
    formData.append('title', this.postForm.get('title')?.value);
    formData.append('body', this.postForm.get('content')?.value);
    formData.append('type', this.postForm.get('category')?.value);
    this.tags.forEach((tag, index) => formData.append(`tags[${index}]`, tag));
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.postService.createPostWithFile(formData).subscribe({
      next: () => {
        this.toastr.success('Post created successfully');
        this.closeModal();
        this.postForm.reset();
      },
      error: () => {
        this.toastr.error('Failed to create post');
        this.isSubmitting = false;
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.postForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  closeModal(): void {
    this.showModal = false;
    this.router.navigate(['/'])
  }

}
