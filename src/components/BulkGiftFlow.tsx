import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { PromptHashClient } from '@/lib/stellar/promptHashClient';
import { isValidStellarAddress } from '@/lib/stellar/addressValidation';
import { formatXlmLocale } from '@/lib/i18n-number';
import type { CartItem } from '@/providers/CartProvider';

interface GiftRecipient {
  id: string;
  address: string;
  isValid: boolean;
}

interface BulkGiftFlowProps {
  items: CartItem[];
  senderAddress?: string;
  onClose?: () => void;
  onSuccess?: (results: GiftResult[]) => void;
}

export interface GiftResult {
  promptId: string;
  recipientAddress: string;
  success: boolean;
  txHash?: string;
  error?: string;
}

type FlowStep = 'recipients' | 'review' | 'processing' | 'complete' | 'error';

export function BulkGiftFlow({
  items,
  senderAddress,
  onClose,
  onSuccess,
}: BulkGiftFlowProps) {
  const [step, setStep] = useState<FlowStep>('recipients');
  const [recipients, setRecipients] = useState<GiftRecipient[]>([
    { id: '1', address: '', isValid: false },
  ]);
  const [results, setResults] = useState<GiftResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalGifts = useMemo(() => {
    return recipients.filter((r) => r.isValid).length * items.length;
  }, [recipients, items.length]);

  const validRecipients = useMemo(
    () => recipients.filter((r) => r.isValid && r.address.trim() !== ''),
    [recipients]
  );

  const handleAddRecipient = () => {
    const newId = Math.max(...recipients.map((r) => parseInt(r.id) || 0), 0) + 1;
    setRecipients([...recipients, { id: newId.toString(), address: '', isValid: false }]);
  };

  const handleRemoveRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((r) => r.id !== id));
    }
  };

  const handleAddressChange = (id: string, address: string) => {
    setRecipients(
      recipients.map((r) =>
        r.id === id
          ? { ...r, address, isValid: isValidStellarAddress(address) }
          : r
      )
    );
  };

  const handleProcessGifts = async () => {
    if (!senderAddress) {
      setError('Sender address is required');
      setStep('error');
      return;
    }

    if (validRecipients.length === 0) {
      setError('No valid recipients specified');
      return;
    }

    setStep('processing');
    setIsProcessing(true);
    setError(null);
    const giftResults: GiftResult[] = [];

    try {
      for (const recipient of validRecipients) {
        for (const item of items) {
          try {
            const result = await PromptHashClient.giftPrompt(
              item.id,
              senderAddress,
              recipient.address
            );

            giftResults.push({
              promptId: item.id,
              recipientAddress: recipient.address,
              success: result.success,
              txHash: result.txHash,
            });
          } catch (err) {
            giftResults.push({
              promptId: item.id,
              recipientAddress: recipient.address,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }
      }

      setResults(giftResults);
      setStep('complete');
      onSuccess?.(giftResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process gifts');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Bulk Gift Prompts</h2>
            <p className="text-sm text-slate-400 mt-1">
              {step === 'recipients' && 'Add recipients for bulk gifting'}
              {step === 'review' && 'Review your bulk gift setup'}
              {step === 'processing' && 'Processing gifts...'}
              {step === 'complete' && 'Gifts completed'}
              {step === 'error' && 'An error occurred'}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'recipients' && (
            <>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Items to Gift ({items.length})</h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="text-sm bg-slate-800 p-2 rounded border border-slate-700"
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4">Gift Recipients</h3>
                <div className="space-y-3 mb-4">
                  {recipients.map((recipient) => (
                    <div key={recipient.id} className="flex gap-2">
                      <input
                        type="text"
                        value={recipient.address}
                        onChange={(e) => handleAddressChange(recipient.id, e.target.value)}
                        placeholder="Stellar address (G...)"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 text-sm"
                      />
                      {recipient.address && (
                        <div className="flex items-center">
                          {recipient.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      )}
                      {recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveRecipient(recipient.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={handleAddRecipient}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Recipient
                </Button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  Total gifts to send: <strong>{totalGifts}</strong> ({items.length} items × {validRecipients.length} recipients)
                </p>
              </div>
            </>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Items</p>
                  <p className="text-white font-medium">{items.length} prompts</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Recipients</p>
                  <p className="text-white font-medium">{validRecipients.length} addresses</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Gifts</p>
                  <p className="text-white font-medium">{totalGifts} gifts</p>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-center text-slate-300">Processing {totalGifts} gifts...</p>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((results.length / totalGifts) * 100).toFixed(0)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-emerald-400">
                    {results.filter((r) => r.success).length} of {totalGifts} gifts completed
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`text-sm p-3 rounded border ${
                      result.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    {result.success ? (
                      <p>✓ Gifted to {result.recipientAddress.slice(0, 16)}...</p>
                    ) : (
                      <p>✗ Failed: {result.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Error</p>
                <p className="text-sm text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-6 flex gap-3 justify-end">
          {step === 'recipients' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('review')}
                disabled={validRecipients.length === 0}
              >
                Review
              </Button>
            </>
          )}
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('recipients')}>
                Back
              </Button>
              <Button onClick={handleProcessGifts} disabled={isProcessing}>
                Send Gifts
              </Button>
            </>
          )}
          {(step === 'complete' || step === 'error') && (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}
