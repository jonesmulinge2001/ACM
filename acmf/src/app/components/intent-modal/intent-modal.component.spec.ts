import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntentModalComponent } from './intent-modal.component';

describe('IntentModalComponent', () => {
  let component: IntentModalComponent;
  let fixture: ComponentFixture<IntentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntentModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
