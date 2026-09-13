import { Test, TestingModule } from '@nestjs/testing';
import { TourController } from './tour.controller';
import { TourService } from './tour.service';
import { TourType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('TourController', () => {
  let controller: TourController;
  let tourService: TourService;

  const mockTourService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByType: jest.fn(),
    findPopular: jest.fn(),
    findBySlug: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourController],
      providers: [
        {
          provide: TourService,
          useValue: mockTourService,
        },
      ],
    }).compile();

    controller = module.get<TourController>(TourController);
    tourService = module.get<TourService>(TourService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByType', () => {
    it('should return tours for valid type TOUR', async () => {
      const mockResult = [{ id: '1', type: TourType.TOUR }] as any;
      mockTourService.findByType.mockResolvedValue(mockResult);

      const result = await controller.findByType('TOUR');
      expect(mockTourService.findByType).toHaveBeenCalledWith(TourType.TOUR);
      expect(result).toBe(mockResult);
    });

    it('should return tours for valid type TRANSFER (case-insensitive)', async () => {
      const mockResult = [{ id: '2', type: TourType.TRANSFER }] as any;
      mockTourService.findByType.mockResolvedValue(mockResult);

      const result = await controller.findByType('transfer');
      expect(mockTourService.findByType).toHaveBeenCalledWith(TourType.TRANSFER);
      expect(result).toBe(mockResult);
    });

    it('should throw BadRequestException for invalid type', () => {
      expect(() => controller.findByType('INVALID')).toThrow(
        BadRequestException,
      );
      expect(mockTourService.findByType).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should call tourService.findAll when no type query is provided', async () => {
      const mockResult = [{ id: '1' }] as any;
      mockTourService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll();
      expect(mockTourService.findAll).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    it('should filter by type when type query is provided', async () => {
      const mockResult = [{ id: '1', type: TourType.TOUR }] as any;
      mockTourService.findByType.mockResolvedValue(mockResult);

      const result = await controller.findAll('TOUR');
      expect(mockTourService.findByType).toHaveBeenCalledWith(TourType.TOUR);
      expect(result).toBe(mockResult);
    });

    it('should throw BadRequestException when invalid type query is provided', () => {
      expect(() => controller.findAll('WRONG_TYPE')).toThrow(
        BadRequestException,
      );
    });
  });
});
