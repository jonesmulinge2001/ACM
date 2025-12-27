import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundMeComponent } from './fund-me.component';

describe('FundMeComponent', () => {
  let component: FundMeComponent;
  let fixture: ComponentFixture<FundMeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundMeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
