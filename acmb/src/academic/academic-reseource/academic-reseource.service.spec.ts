import { Test, TestingModule } from '@nestjs/testing';
import { AcademicReseourceService } from './academic-reseource.service';

describe('AcademicReseourceService', () => {
  let service: AcademicReseourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicReseourceService],
    }).compile();

    service = module.get<AcademicReseourceService>(AcademicReseourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
