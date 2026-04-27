import { IsString, IsOptional, IsEthereumAddress } from 'class-validator';

export class AggregateIdentityDto {
  @IsString()
  walletAddress: string;

  @IsOptional()
  @IsString()
  githubToken?: string;

  @IsOptional()
  @IsString()
  twitterToken?: string;

  @IsOptional()
  @IsString()
  discordToken?: string;
}
