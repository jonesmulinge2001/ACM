import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Post } from '../../interfaces';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-edit-post',
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.css']
})
export class EditPostComponent implements OnInit, OnChanges {
  @Input() post!: Post;
  @Input() showModal: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<FormData>(); // now emits FormData

  editForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['post'] && this.editForm && this.post) {
      this.patchForm();
    }
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      title: [this.post?.title || '', Validators.required],
      body: [this.post?.body || ''],
      tags: [this.post?.tags ? this.post.tags.join(', ') : ''],
      type: [this.post?.type || 'GENERAL'],
      fileUrl: [this.post?.fileUrl || ''],
    });
  }

  private patchForm(): void {
    this.editForm.patchValue({
      title: this.post.title,
      body: this.post.body,
      tags: this.post.tags ? this.post.tags.join(', ') : '',
      type: this.post.type || 'GENERAL',
      fileUrl: this.post.fileUrl || ''
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  onSave(): void {
    if (this.editForm.valid) {
      const tagsArray = this.editForm.value.tags
        ? this.editForm.value.tags.split(',').map((t: string) => t.trim())
        : [];
  
      const formData = new FormData();
      formData.append('title', this.editForm.value.title);
      formData.append('body', this.editForm.value.body || '');
      formData.append('type', this.editForm.value.type || 'GENERAL');
  
      // Append each tag separately so NestJS receives an array
      tagsArray.forEach((tag: string) => {
        if (tag) formData.append('tags', tag);
      });
  
      if (this.selectedFile) {
        formData.append('file', this.selectedFile);
      }
  
      this.save.emit(formData);
    }
  }
  
  

  onClose(): void {
    this.close.emit();
  }
}
