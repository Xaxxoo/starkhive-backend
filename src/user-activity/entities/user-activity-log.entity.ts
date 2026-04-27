import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PROFILE_VIEWED = 'PROFILE_VIEWED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  JOB_POSTED = 'JOB_POSTED',
  JOB_APPLIED = 'JOB_APPLIED',
  PROPOSAL_SUBMITTED = 'PROPOSAL_SUBMITTED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  PAYMENT_MADE = 'PAYMENT_MADE',
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  CONNECTION_MADE = 'CONNECTION_MADE',
  FILE_UPLOADED = 'FILE_UPLOADED',
}

@Entity('user_activity_logs')
@Index(['userId', 'createdAt'])
@Index(['activityType', 'createdAt'])
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: ActivityType, name: 'activity_type' })
  activityType: ActivityType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ nullable: true, name: 'resource_id' })
  resourceId: string;

  @Column({ nullable: true, name: 'resource_type' })
  resourceType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
