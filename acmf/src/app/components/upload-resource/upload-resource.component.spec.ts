import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadResourceComponent } from './upload-resource.component';

describe('UploadResourceComponent', () => {
  let component: UploadResourceComponent;
  let fixture: ComponentFixture<UploadResourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadResourceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadResourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
