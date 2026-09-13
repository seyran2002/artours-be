import { Test, TestingModule } from '@nestjs/testing';
import { TourService } from './tour.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TourType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('TourService', () => {
  let service: TourService;

  const mockPrismaService = {
    tour: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    uploadMultipleAndGetUrls: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TourService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<TourService>(TourService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByType', () => {
    it('should query prisma.tour.findMany with type filter', async () => {
      const mockTours = [
        {
          id: 'tour-1',
          type: TourType.TOUR,
          locations: [],
          tags: [],
        },
      ];
      mockPrismaService.tour.findMany.mockResolvedValue(mockTours);

      const result = await service.findByType(TourType.TOUR);

      expect(mockPrismaService.tour.findMany).toHaveBeenCalledWith({
        where: { type: TourType.TOUR },
        include: {
          locations: {
            orderBy: { order: 'asc' },
            include: { location: true },
          },
          tags: true,
        },
      });
      expect(result).toEqual(mockTours);
    });

    it('should throw BadRequestException when unsupported type is passed', async () => {
      await expect(service.findByType('INVALID' as any)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.tour.findMany).not.toHaveBeenCalled();
    });
  });
});
