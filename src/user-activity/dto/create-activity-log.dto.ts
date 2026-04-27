import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';
import { ActivityType } from '../entities/user-activity-log.entity';

export class CreateActivityLogDto {
  @IsString()
  userId: string;

  @IsEnum(ActivityType)
  activityType: ActivityType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  resourceType?: string;
}
