import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserActivityLog])],
  providers: [UserActivityService],
  controllers: [UserActivityController],
  exports: [UserActivityService],
})
export class UserActivityModule {}
