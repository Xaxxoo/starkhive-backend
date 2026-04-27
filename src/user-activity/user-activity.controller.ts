import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { ActivityType } from './entities/user-activity-log.entity';

@Controller('user-activity')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Post()
  async logActivity(@Body() dto: CreateActivityLogDto) {
    return this.userActivityService.logActivity(dto);
  }

  @Get()
  async getLogs(@Query() query: QueryActivityLogDto) {
    return this.userActivityService.getLogs(query);
  }

  @Get('analytics/breakdown')
  async getBreakdown(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userActivityService.getActivityTypeBreakdown(startDate, endDate);
  }

  @Get('analytics/most-active')
  async getMostActiveUsers(
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userActivityService.getMostActiveUsers(Number(limit) || 10, startDate, endDate);
  }

  @Get('analytics/trend/:activityType')
  async getActivityTrend(
    @Param('activityType') activityType: ActivityType,
    @Query('days') days?: number,
  ) {
    return this.userActivityService.getActivityTrend(activityType, Number(days) || 30);
  }

  @Get('user/:userId/stats')
  async getUserStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userActivityService.getUserActivityStats(userId, startDate, endDate);
  }

  @Get(':id')
  async getLogById(@Param('id') id: string) {
    const log = await this.userActivityService.getLogById(id);
    if (!log) throw new NotFoundException(`Activity log ${id} not found`);
    return log;
  }
}
