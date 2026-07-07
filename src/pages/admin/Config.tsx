import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getPlatformConfig, updatePlatformConfig } from '@/services/adminService';
import { miscKeys } from '@/lib/query-keys';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';

export default function Config() {
  const queryClient = useQueryClient();

  const {
    data: config,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: miscKeys.platformConfig,
    queryFn: getPlatformConfig,
  });

  const [form, setForm] = useState({
    commissionRate: '12',
    verificationFee: '500',
    minPayoutAmount: '100',
    maxPayoutAmount: '50000',
  });

  useEffect(() => {
    if (config) {
      setForm({
        commissionRate: String(config.commissionRate || '12'),
        verificationFee: String(config.verificationFee || '500'),
        minPayoutAmount: String(config.minPayoutAmount || '100'),
        maxPayoutAmount: String(config.maxPayoutAmount || '50000'),
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updatePlatformConfig({
        commissionRate: Number(form.commissionRate),
        verificationFee: Number(form.verificationFee),
        minPayoutAmount: Number(form.minPayoutAmount),
        maxPayoutAmount: Number(form.maxPayoutAmount),
      }),
    onSuccess: () => {
      toast.success('Configuration updated');
      queryClient.invalidateQueries({ queryKey: miscKeys.platformConfig });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update configuration');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <CardSkeleton />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load configuration" onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-dark">Platform Configuration</h1>
          <p className="text-body text-sm">Manage platform settings and fees</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Commission Rate (%)</label>
          <input
            name="commissionRate"
            type="number"
            value={form.commissionRate}
            onChange={handleChange}
            min={0}
            max={100}
            required
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Percentage deducted from trainer earnings as platform fee
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-dark mb-1 block">Verification Fee (KES)</label>
          <input
            name="verificationFee"
            type="number"
            value={form.verificationFee}
            onChange={handleChange}
            min={0}
            required
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">One-time fee for trainer verification</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Min Payout (KES)</label>
            <input
              name="minPayoutAmount"
              type="number"
              value={form.minPayoutAmount}
              onChange={handleChange}
              min={0}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-dark mb-1 block">Max Payout (KES)</label>
            <input
              name="maxPayoutAmount"
              type="number"
              value={form.maxPayoutAmount}
              onChange={handleChange}
              min={0}
              required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-2.5 bg-primary text-white font-medium rounded-btn hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
