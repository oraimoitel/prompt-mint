import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Users,
  ArrowUpRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { fetchReferralStats, type CreatorReferralStats } from '@/lib/referral/referralSystem';
import { formatXlmLocale } from '@/lib/i18n-number';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CreatorReferralDashboard() {
  const { address } = useWallet();
  const [stats, setStats] = useState<CreatorReferralStats | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['referralStats', address],
    queryFn: async () => {
      if (!address) throw new Error('No address');
      return fetchReferralStats(address);
    },
    enabled: !!address,
  });

  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  if (!address) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-slate-400 mb-4">
              Please connect your wallet to view referral analytics
            </p>
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Referral Analytics</h1>
            <p className="text-slate-400">
              Track your creator referral conversions and rewards
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : error || !stats ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <p className="text-red-300">
                {error instanceof Error
                  ? error.message
                  : 'Failed to load referral analytics'}
              </p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Users}
                  title="Total Conversions"
                  value={stats.totalConversions.toString()}
                  trend={stats.totalConversions > 0 ? '+' : ''}
                />
                <MetricCard
                  icon={TrendingUp}
                  title="Conversion Rate"
                  value={`${(stats.conversionRate * 100).toFixed(1)}%`}
                />
                <MetricCard
                  icon={DollarSign}
                  title="Rewards Paid"
                  value={formatXlmLocale(stats.totalRewardsPaid, 'stroops', 'en')}
                />
              </div>

              {/* Top Referrers */}
              {stats.referrers.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Top Referrers</h2>
                  <div className="space-y-3">
                    {stats.referrers
                      .sort((a, b) => b.rewards - a.rewards)
                      .slice(0, 10)
                      .map((referrer, idx) => (
                        <ReferrerRow
                          key={referrer.address}
                          rank={idx + 1}
                          address={referrer.address}
                          referrals={referrer.referrals}
                          rewards={referrer.rewards}
                          conversionRate={referrer.conversionRate}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {stats.referrers.length === 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No referral conversions yet
                  </h3>
                  <p className="text-slate-400">
                    Share your creator link to start earning referral rewards
                  </p>
                </div>
              )}

              {/* Referral Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-blue-300 mb-3">How Creator Referrals Work</h3>
                <ul className="space-y-2 text-sm text-blue-200/80">
                  <li>• When your prompts are purchased via referral links, conversions are tracked</li>
                  <li>• Track total conversions and conversion rates across all referral sources</li>
                  <li>• View detailed stats for your top referrers</li>
                  <li>• Rewards are calculated based on successful referral conversions</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <Icon className="w-5 h-5 text-blue-400 mb-3" />
      <p className="text-sm text-slate-400 mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {trend && <p className="text-sm text-emerald-400">{trend}</p>}
      </div>
    </div>
  );
}

function ReferrerRow({
  rank,
  address,
  referrals,
  rewards,
  conversionRate,
}: {
  rank: number;
  address: string;
  referrals: number;
  rewards: bigint;
  conversionRate: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600 hover:bg-slate-700/50 transition">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Badge variant="secondary" className="bg-blue-600 text-white shrink-0">
          #{rank}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="text-white font-mono text-sm truncate">
            {address.slice(0, 16)}...{address.slice(-8)}
          </p>
          <div className="flex gap-4 mt-2 text-xs text-slate-400">
            <span>{referrals} conversions</span>
            <span>{(conversionRate * 100).toFixed(1)}% rate</span>
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-white font-mono">
          {formatXlmLocale(rewards, 'stroops', 'en')}
        </p>
        <p className="text-xs text-slate-400 mt-1">earned</p>
      </div>
    </div>
  );
}
