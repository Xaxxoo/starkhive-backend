export interface GitHubIdentity {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
}

export interface TwitterIdentity {
  id: string;
  username: string;
  name: string;
  description: string | null;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  verified: boolean;
}

export interface DiscordIdentity {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  globalName: string | null;
}

export interface WalletIdentity {
  address: string;
  ensName: string | null;
  avatarUrl: string | null;
}

export interface AggregatedIdentity {
  walletAddress: string;
  github: GitHubIdentity | null;
  twitter: TwitterIdentity | null;
  discord: DiscordIdentity | null;
  wallet: WalletIdentity;
  aggregatedAt: string;
  sources: string[];
}
