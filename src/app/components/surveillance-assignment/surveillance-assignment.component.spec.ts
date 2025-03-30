import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveillanceAssignmentComponent } from './surveillance-assignment.component';

describe('SurveillanceAssignmentComponent', () => {
  let component: SurveillanceAssignmentComponent;
  let fixture: ComponentFixture<SurveillanceAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurveillanceAssignmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveillanceAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
