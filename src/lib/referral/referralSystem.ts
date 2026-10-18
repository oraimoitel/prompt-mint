export interface ReferralReward {
  id: string;
  referrerAddress: string;
  referredAddress: string;
  rewardAmount: bigint;
  rewardPercentage: number;
  createdAt: Date;
  transactionHash: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsEarned: bigint;
  averageRewardAmount: bigint;
  recentRewards: ReferralReward[];
}

export interface BuyerReferralInfo {
  referralCode: string;
  referrerAddress?: string;
  rewardsEarned: bigint;
  purchasesReferred: number;
}

export interface CreatorReferralStats {
  totalConversions: number;
  conversionRate: number;
  totalRewardsPaid: bigint;
  referrers: Array<{
    address: string;
    referrals: number;
    rewards: bigint;
    conversionRate: number;
  }>;
}

const REFERRAL_REWARD_PERCENTAGE = 5; // 5% reward on purchases made via referral

export function generateReferralCode(address: string): string {
  const hash = address
    .slice(0, 4)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now().toString(36).slice(-4);
  return `REF-${hash}-${timestamp}`.toUpperCase();
}

export function calculateReferralReward(
  purchaseAmount: bigint,
  percentage: number = REFERRAL_REWARD_PERCENTAGE
): bigint {
  return (purchaseAmount * BigInt(percentage)) / BigInt(100);
}

export function validateReferralCode(code: string): boolean {
  return /^REF-[A-Z0-9]+-[A-Z0-9]+$/.test(code);
}

export function extractAddressFromReferralCode(code: string): string | null {
  const match = code.match(/^REF-([A-Z0-9]+)-/);
  return match ? `G${match[1]}` : null;
}

export async function fetchReferralStats(
  creatorAddress: string
): Promise<CreatorReferralStats> {
  // This would call your backend API to fetch stats
  // For now, returning a mock structure
  return {
    totalConversions: 0,
    conversionRate: 0,
    totalRewardsPaid: BigInt(0),
    referrers: [],
  };
}

export async function fetchBuyerReferralInfo(
  buyerAddress: string
): Promise<BuyerReferralInfo> {
  // This would call your backend API to fetch buyer referral info
  return {
    referralCode: generateReferralCode(buyerAddress),
    rewardsEarned: BigInt(0),
    purchasesReferred: 0,
  };
}

export async function applyReferralReward(
  referrerAddress: string,
  referredBuyerAddress: string,
  purchaseAmount: bigint,
  transactionHash: string
): Promise<ReferralReward> {
  const rewardAmount = calculateReferralReward(purchaseAmount);

  // This would send to your backend API
  return {
    id: `reward-${Date.now()}`,
    referrerAddress,
    referredAddress: referredBuyerAddress,
    rewardAmount,
    rewardPercentage: REFERRAL_REWARD_PERCENTAGE,
    createdAt: new Date(),
    transactionHash,
    status: 'pending',
  };
}
