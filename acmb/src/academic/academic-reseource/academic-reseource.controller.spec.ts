import { Test, TestingModule } from '@nestjs/testing';
import { AcademicReseourceController } from './academic-reseource.controller';

describe('AcademicReseourceController', () => {
  let controller: AcademicReseourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicReseourceController],
    }).compile();

    controller = module.get<AcademicReseourceController>(AcademicReseourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
