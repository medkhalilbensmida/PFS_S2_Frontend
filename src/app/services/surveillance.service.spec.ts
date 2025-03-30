import { TestBed } from '@angular/core/testing';

import { SurveillanceService } from './surveillance.service';

describe('SurveillanceService', () => {
  let service: SurveillanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SurveillanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
