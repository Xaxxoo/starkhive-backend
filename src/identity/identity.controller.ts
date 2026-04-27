import { Controller, Post, Body } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { AggregateIdentityDto } from './dto/aggregate-identity.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('aggregate')
  async aggregate(@Body() dto: AggregateIdentityDto) {
    return this.identityService.aggregateIdentity(dto);
  }
}
