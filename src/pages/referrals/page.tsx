import { useEffect, useState, useMemo } from 'react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  Copy,
  Gift,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import {
  generateReferralCode,
  fetchBuyerReferralInfo,
  type BuyerReferralInfo,
} from '@/lib/referral/referralSystem';
import { formatXlmLocale } from '@/lib/i18n-number';

export default function BuyerReferralsPage() {
  const { address } = useWallet();
  const { history } = useTransactionHistory();
  const [referralInfo, setReferralInfo] = useState<BuyerReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReferralInfo = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const info = await fetchBuyerReferralInfo(address);
        setReferralInfo(info);
      } catch (error) {
        console.error('Failed to load referral info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferralInfo();
  }, [address]);

  const handleCopyReferralCode = () => {
    if (referralInfo) {
      navigator.clipboard.writeText(
        `${window.location.origin}?ref=${referralInfo.referralCode}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareReferralCode = () => {
    if (referralInfo && navigator.share) {
      navigator.share({
        title: 'PromptMint Referral',
        text: 'Join PromptMint and get rewarded for purchases made through my referral link!',
        url: `${window.location.origin}?ref=${referralInfo.referralCode}`,
      });
    }
  };

  const recentRewards = useMemo(() => {
    // Would filter history to show referral rewards only
    return history
      .filter((tx) => tx.type === 'referral_reward')
      .slice(0, 5);
  }, [history]);

  if (!address) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-slate-400 mb-4">Please connect your wallet to view referrals</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navigation />

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Referral Rewards</h1>
            <p className="text-slate-400">
              Share your referral code and earn rewards when your friends make purchases
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading referral information...</p>
            </div>
          ) : (
            <>
              {/* Referral Code Card */}
              {referralInfo && (
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Your Referral Code</p>
                      <div className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <code className="flex-1 font-mono text-lg text-white">
                          {referralInfo.referralCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyReferralCode}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Copy className="w-4 h-4" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={handleCopyReferralCode} className="gap-2 flex-1">
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </Button>
                      {navigator.share && (
                        <Button
                          variant="outline"
                          onClick={handleShareReferralCode}
                          className="gap-2 flex-1"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  icon={Gift}
                  title="Total Rewards"
                  value={
                    referralInfo
                      ? formatXlmLocale(referralInfo.rewardsEarned, 'stroops', 'en')
                      : '0 XLM'
                  }
                  subtext="XLM earned from referrals"
                />
                <StatCard
                  icon={TrendingUp}
                  title="Purchases Referred"
                  value={referralInfo?.purchasesReferred.toString() || '0'}
                  subtext="Successful referral purchases"
                />
                <StatCard
                  icon={DollarSign}
                  title="Reward Rate"
                  value="5%"
                  subtext="of each referred purchase"
                />
              </div>

              {/* How It Works */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                <h2 className="text-xl font-bold text-white mb-6">How It Works</h2>
                <div className="space-y-4">
                  <Step
                    number={1}
                    title="Share Your Code"
                    description="Share your referral code with friends and colleagues"
                  />
                  <Step
                    number={2}
                    title="They Purchase"
                    description="When they make a purchase using your code, you earn rewards"
                  />
                  <Step
                    number={3}
                    title="Earn Rewards"
                    description="Receive 5% of their purchase amount as XLM rewards"
                  />
                  <Step
                    number={4}
                    title="Withdraw Anytime"
                    description="Your rewards are automatically added to your balance"
                  />
                </div>
              </div>

              {/* Recent Rewards */}
              {recentRewards.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Recent Rewards</h2>
                  <div className="space-y-3">
                    {recentRewards.map((reward, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-white font-medium">
                              Reward from purchase
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(reward.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-white font-mono">
                          {formatXlmLocale(BigInt(reward.amount), 'stroops', 'en')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <Icon className="w-5 h-5 text-blue-400 mb-3" />
      <p className="text-sm text-slate-400 mb-2">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-2">{subtext}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <Badge className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-600 text-white border-0">
          {number}
        </Badge>
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
