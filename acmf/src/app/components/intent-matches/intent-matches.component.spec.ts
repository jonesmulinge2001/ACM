import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntentMatchesComponent } from './intent-matches.component';

describe('IntentMatchesComponent', () => {
  let component: IntentMatchesComponent;
  let fixture: ComponentFixture<IntentMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntentMatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntentMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
