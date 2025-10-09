import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { GroupsService } from '../../services/group.service';
import { Group } from '../../interfaces';

@Component({
  selector: 'app-edit-group',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
        
        <!-- Close button -->
        <button
          (click)="cancel.emit()"
          class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 class="text-xl font-semibold mb-4">Edit Group</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Group name -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Group Name</label>
            <input
              formControlName="name"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              formControlName="description"
              rows="3"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            ></textarea>
          </div>

          <!-- Visibility -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Visibility</label>
            <select
              formControlName="visibility"
              class="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <!-- Cover image -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Cover Image</label>

            <!-- Preview -->
            <div *ngIf="previewUrl || group?.coverImage" class="mb-2">
              <img
                [src]="previewUrl || group?.coverImage"
                class="w-full h-40 object-cover rounded-lg"
              />
            </div>

            <!-- File input -->
            <input
              type="file"
              accept="image/*"
              (change)="onFileSelected($event)"
              class="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              (click)="cancel.emit()"
              class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="form.invalid"
              class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class EditGroupComponent implements OnChanges {
  @Input({ required: true }) group!: Group | null;
  @Output() updated = new EventEmitter<Group>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private groups: GroupsService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      visibility: ['PUBLIC', Validators.required],
      coverImage: [null]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['group'] && this.group) {
      this.form.patchValue({
        name: this.group.name,
        description: this.group.description ?? '',
        visibility: this.group.visibility,
      });
      this.previewUrl = null; // reset preview when group changes
      this.selectedFile = null;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.selectedFile = input.files[0];

    // For preview
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(this.selectedFile);
  }

  onSubmit() {
    if (this.form.valid && this.group) {
      const formData = new FormData();
      formData.append('name', this.form.value.name);
      formData.append('description', this.form.value.description);
      formData.append('visibility', this.form.value.visibility);
  
      if (this.selectedFile) {
        formData.append('coverImage', this.selectedFile);
      }
  
      this.groups.updateGroup(this.group.id, formData).subscribe({
        next: () => {
          // Fetch the group again with all relations
          this.groups.getGroupById(this.group!.id).subscribe(fullGroup => {
            this.updated.emit(fullGroup);
          });
        },
        error: () => {
          console.error('Failed to update group');
        }
      });
    }
  }
  
}
