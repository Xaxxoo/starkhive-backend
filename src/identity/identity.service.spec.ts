import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { IdentityService } from './identity.service';
import * as helpers from './utils/integrations.helper';

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns cached result on cache hit', async () => {
    const cached = { walletAddress: '0x123', sources: ['wallet', 'github'] };
    mockCacheManager.get.mockResolvedValue(cached);

    const result = await service.aggregateIdentity({ walletAddress: '0x123' });

    expect(result).toEqual(cached);
    expect(mockCacheManager.set).not.toHaveBeenCalled();
  });

  it('aggregates from all provided sources', async () => {
    mockCacheManager.get.mockResolvedValue(null);

    jest.spyOn(helpers, 'fetchGitHubIdentity').mockResolvedValue({
      login: 'octocat', name: 'Octocat', avatarUrl: '', bio: null,
      publicRepos: 10, followers: 5, following: 2, createdAt: '2020-01-01',
    });
    jest.spyOn(helpers, 'fetchTwitterIdentity').mockResolvedValue({
      id: 't1', username: 'user', name: 'User', description: null,
      followersCount: 100, followingCount: 50, tweetCount: 200, verified: false,
    });
    jest.spyOn(helpers, 'fetchDiscordIdentity').mockResolvedValue({
      id: 'd1', username: 'user#0001', discriminator: '0001', avatar: null, globalName: null,
    });
    jest.spyOn(helpers, 'fetchWalletMetadata').mockResolvedValue({
      address: '0xabc', ensName: 'test.eth', avatarUrl: null,
    });

    const result = await service.aggregateIdentity({
      walletAddress: '0xabc',
      githubToken: 'gh-token',
      twitterToken: 'tw-token',
      discordToken: 'dc-token',
    });

    expect(result.sources).toEqual(['wallet', 'github', 'twitter', 'discord']);
    expect(result.github?.login).toBe('octocat');
    expect(result.wallet.ensName).toBe('test.eth');
    expect(mockCacheManager.set).toHaveBeenCalled();
  });

  it('handles missing optional tokens gracefully', async () => {
    mockCacheManager.get.mockResolvedValue(null);
    jest.spyOn(helpers, 'fetchWalletMetadata').mockResolvedValue({
      address: '0xdef', ensName: null, avatarUrl: null,
    });

    const result = await service.aggregateIdentity({ walletAddress: '0xdef' });

    expect(result.github).toBeNull();
    expect(result.twitter).toBeNull();
    expect(result.discord).toBeNull();
    expect(result.sources).toEqual(['wallet']);
  });

  it('still returns partial data when one provider fails', async () => {
    mockCacheManager.get.mockResolvedValue(null);
    jest.spyOn(helpers, 'fetchGitHubIdentity').mockResolvedValue(null);
    jest.spyOn(helpers, 'fetchWalletMetadata').mockResolvedValue({
      address: '0x111', ensName: null, avatarUrl: null,
    });

    const result = await service.aggregateIdentity({
      walletAddress: '0x111',
      githubToken: 'bad-token',
    });

    expect(result.github).toBeNull();
    expect(result.sources).toEqual(['wallet']);
  });
});
