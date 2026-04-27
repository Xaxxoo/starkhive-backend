import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivityService } from './user-activity.service';
import { UserActivityLog, ActivityType } from './entities/user-activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('UserActivityService', () => {
  let service: UserActivityService;
  let repo: jest.Mocked<Partial<Repository<UserActivityLog>>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityService,
        { provide: getRepositoryToken(UserActivityLog), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<UserActivityService>(UserActivityService);
    repo = module.get(getRepositoryToken(UserActivityLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logActivity', () => {
    it('should create and save an activity log', async () => {
      const dto: CreateActivityLogDto = {
        userId: 'user-1',
        activityType: ActivityType.LOGIN,
        ipAddress: '127.0.0.1',
      };
      const entity = { id: 'log-1', ...dto, createdAt: new Date() } as UserActivityLog;
      (repo.create as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(entity);

      const result = await service.logActivity(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('getLogs', () => {
    it('should return paginated logs', async () => {
      const logs = [{ id: 'log-1' }] as UserActivityLog[];
      (repo.findAndCount as jest.Mock).mockResolvedValue([logs, 1]);

      const result = await service.getLogs({ userId: 'user-1', page: 1, limit: 10 });

      expect(result.data).toEqual(logs);
      expect(result.total).toBe(1);
    });
  });

  describe('getLogById', () => {
    it('should return a log by id', async () => {
      const log = { id: 'log-1' } as UserActivityLog;
      (repo.findOne as jest.Mock).mockResolvedValue(log);

      const result = await service.getLogById('log-1');
      expect(result).toEqual(log);
    });

    it('should return null when log not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getLogById('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getUserActivityStats', () => {
    it('should compute stats correctly', async () => {
      const logs = [
        { activityType: ActivityType.LOGIN, createdAt: new Date('2025-01-01') },
        { activityType: ActivityType.LOGIN, createdAt: new Date('2025-01-02') },
        { activityType: ActivityType.PROFILE_VIEWED, createdAt: new Date('2025-01-03') },
      ] as UserActivityLog[];

      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([logs, 3]),
      };
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const stats = await service.getUserActivityStats('user-1');

      expect(stats.totalEvents).toBe(3);
      expect(stats.breakdown.find((b) => b.activityType === ActivityType.LOGIN)?.count).toBe(2);
      expect(stats.breakdown.find((b) => b.activityType === ActivityType.PROFILE_VIEWED)?.count).toBe(1);
    });
  });
});
