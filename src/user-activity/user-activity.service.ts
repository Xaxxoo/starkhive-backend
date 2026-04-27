import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { UserActivityLog, ActivityType } from './entities/user-activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

export interface ActivitySummary {
  activityType: string;
  count: number;
}

export interface UserActivityStats {
  totalEvents: number;
  breakdown: ActivitySummary[];
  firstSeen: Date | null;
  lastSeen: Date | null;
}

@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name);

  constructor(
    @InjectRepository(UserActivityLog)
    private readonly activityLogRepository: Repository<UserActivityLog>,
  ) {}

  async logActivity(dto: CreateActivityLogDto): Promise<UserActivityLog> {
    const log = this.activityLogRepository.create(dto);
    const saved = await this.activityLogRepository.save(log);
    this.logger.debug(
      `Activity logged: userId=${dto.userId} type=${dto.activityType}`,
    );
    return saved;
  }

  async getLogs(query: QueryActivityLogDto): Promise<{ data: UserActivityLog[]; total: number }> {
    const { userId, activityType, startDate, endDate, resourceType, resourceId, page = 1, limit = 20 } = query;

    const where: FindOptionsWhere<UserActivityLog> = {};

    if (userId) where.userId = userId;
    if (activityType) where.activityType = activityType;
    if (resourceType) where.resourceType = resourceType;
    if (resourceId) where.resourceId = resourceId;

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.createdAt = Between(new Date(startDate), new Date());
    }

    const [data, total] = await this.activityLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async getLogById(id: string): Promise<UserActivityLog | null> {
    return this.activityLogRepository.findOne({ where: { id } });
  }

  async getUserActivityStats(userId: string, startDate?: string, endDate?: string): Promise<UserActivityStats> {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId });

    if (startDate) qb.andWhere('log.createdAt >= :start', { start: new Date(startDate) });
    if (endDate) qb.andWhere('log.createdAt <= :end', { end: new Date(endDate) });

    const [logs, totalEvents] = await qb.getManyAndCount();

    const counts: Record<string, number> = {};
    let firstSeen: Date | null = null;
    let lastSeen: Date | null = null;

    for (const log of logs) {
      counts[log.activityType] = (counts[log.activityType] || 0) + 1;
      if (!firstSeen || log.createdAt < firstSeen) firstSeen = log.createdAt;
      if (!lastSeen || log.createdAt > lastSeen) lastSeen = log.createdAt;
    }

    const breakdown: ActivitySummary[] = Object.entries(counts).map(([activityType, count]) => ({
      activityType,
      count,
    }));

    return { totalEvents, breakdown, firstSeen, lastSeen };
  }

  async getActivityTypeBreakdown(
    startDate?: string,
    endDate?: string,
  ): Promise<ActivitySummary[]> {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.activityType', 'activityType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.activityType');

    if (startDate) qb.andWhere('log.createdAt >= :start', { start: new Date(startDate) });
    if (endDate) qb.andWhere('log.createdAt <= :end', { end: new Date(endDate) });

    const rows = await qb.getRawMany<{ activityType: string; count: string }>();
    return rows.map((r) => ({ activityType: r.activityType, count: Number(r.count) }));
  }

  async getMostActiveUsers(
    limit = 10,
    startDate?: string,
    endDate?: string,
  ): Promise<{ userId: string; count: number }[]> {
    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.userId')
      .orderBy('count', 'DESC')
      .limit(limit);

    if (startDate) qb.andWhere('log.createdAt >= :start', { start: new Date(startDate) });
    if (endDate) qb.andWhere('log.createdAt <= :end', { end: new Date(endDate) });

    const rows = await qb.getRawMany<{ userId: string; count: string }>();
    return rows.map((r) => ({ userId: r.userId, count: Number(r.count) }));
  }

  async getActivityTrend(
    activityType: ActivityType,
    days = 30,
  ): Promise<{ date: string; count: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await this.activityLogRepository
      .createQueryBuilder('log')
      .select("DATE(log.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.activityType = :activityType', { activityType })
      .andWhere('log.createdAt >= :since', { since })
      .groupBy("DATE(log.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }
}
