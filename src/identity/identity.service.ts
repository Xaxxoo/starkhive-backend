import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AggregateIdentityDto } from './dto/aggregate-identity.dto';
import { AggregatedIdentity } from './interfaces/identity.interface';
import {
  fetchGitHubIdentity,
  fetchTwitterIdentity,
  fetchDiscordIdentity,
  fetchWalletMetadata,
} from './utils/integrations.helper';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async aggregateIdentity(dto: AggregateIdentityDto): Promise<AggregatedIdentity> {
    const cacheKey = `identity:${dto.walletAddress}`;
    const cached = await this.cacheManager.get<AggregatedIdentity>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${dto.walletAddress}`);
      return cached;
    }

    const [github, twitter, discord, wallet] = await Promise.all([
      dto.githubToken ? fetchGitHubIdentity(dto.githubToken) : Promise.resolve(null),
      dto.twitterToken ? fetchTwitterIdentity(dto.twitterToken) : Promise.resolve(null),
      dto.discordToken ? fetchDiscordIdentity(dto.discordToken) : Promise.resolve(null),
      fetchWalletMetadata(dto.walletAddress),
    ]);

    const sources: string[] = ['wallet'];
    if (github) sources.push('github');
    if (twitter) sources.push('twitter');
    if (discord) sources.push('discord');

    const result: AggregatedIdentity = {
      walletAddress: dto.walletAddress,
      github,
      twitter,
      discord,
      wallet,
      aggregatedAt: new Date().toISOString(),
      sources,
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL_MS);
    return result;
  }
}
