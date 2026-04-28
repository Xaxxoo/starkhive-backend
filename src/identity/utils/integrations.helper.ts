import axios from 'axios';
import { Logger } from '@nestjs/common';
import {
  GitHubIdentity,
  TwitterIdentity,
  DiscordIdentity,
  WalletIdentity,
} from '../interfaces/identity.interface';

const logger = new Logger('IntegrationsHelper');

interface GitHubApiResponse {
  login: string;
  name?: string | null;
  avatar_url: string;
  bio?: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface TwitterApiResponse {
  data: {
    id: string;
    username: string;
    name: string;
    description?: string | null;
    public_metrics?: {
      followers_count?: number;
      following_count?: number;
      tweet_count?: number;
    };
    verified?: boolean;
  };
}

interface DiscordApiResponse {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string | null;
  global_name?: string | null;
}

interface EnsApiResponse {
  ens?: string | null;
  avatar?: string | null;
}

interface AxiosLikeError {
  response?: {
    status?: number;
  };
}

function isAxiosLikeError(error: unknown): error is AxiosLikeError {
  return typeof error === 'object' && error !== null && 'response' in error;
}

function getAxiosStatus(error: unknown): number | undefined {
  return isAxiosLikeError(error) ? error.response?.status : undefined;
}

export async function fetchGitHubIdentity(token: string): Promise<GitHubIdentity | null> {
  try {
    const { data } = await axios.get<GitHubApiResponse>('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return {
      login: data.login,
      name: data.name ?? null,
      avatarUrl: data.avatar_url,
      bio: data.bio ?? null,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
    };
  } catch (err) {
    const status = getAxiosStatus(err);
    if (status === 401) {
      logger.warn('GitHub token expired or invalid');
    } else {
      logger.error(`GitHub fetch failed: ${(err as Error).message}`);
    }
    return null;
  }
}

export async function fetchTwitterIdentity(token: string): Promise<TwitterIdentity | null> {
  try {
    const { data } = await axios.get<TwitterApiResponse>('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        'user.fields': 'description,public_metrics,verified',
      },
      timeout: 5000,
    });
    const user = data.data;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      description: user.description ?? null,
      followersCount: user.public_metrics?.followers_count ?? 0,
      followingCount: user.public_metrics?.following_count ?? 0,
      tweetCount: user.public_metrics?.tweet_count ?? 0,
      verified: user.verified ?? false,
    };
  } catch (err) {
    const status = getAxiosStatus(err);
    if (status === 401) {
      logger.warn('Twitter token expired or invalid');
    } else {
      logger.error(`Twitter fetch failed: ${(err as Error).message}`);
    }
    return null;
  }
}

export async function fetchDiscordIdentity(token: string): Promise<DiscordIdentity | null> {
  try {
    const { data } = await axios.get<DiscordApiResponse>('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return {
      id: data.id,
      username: data.username,
      discriminator: data.discriminator,
      avatar: data.avatar ?? null,
      globalName: data.global_name ?? null,
    };
  } catch (err) {
    const status = getAxiosStatus(err);
    if (status === 401) {
      logger.warn('Discord token expired or invalid');
    } else {
      logger.error(`Discord fetch failed: ${(err as Error).message}`);
    }
    return null;
  }
}

export async function fetchWalletMetadata(walletAddress: string): Promise<WalletIdentity> {
  // Attempt ENS resolution via a public provider; fall back gracefully
  let ensName: string | null = null;
  let avatarUrl: string | null = null;

  try {
    const { data } = await axios.get<EnsApiResponse>(
      `https://ensdata.net/${walletAddress}`,
      { timeout: 3000 },
    );
    ensName = data.ens ?? null;
    avatarUrl = data.avatar ?? null;
  } catch {
    // ENS resolution is best-effort; non-fatal
    logger.debug(`ENS lookup failed for ${walletAddress}`);
  }

  return { address: walletAddress, ensName, avatarUrl };
}
