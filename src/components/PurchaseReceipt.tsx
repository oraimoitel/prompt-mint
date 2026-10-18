import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { formatXlmLocale } from '@/lib/i18n-number';
import type { CartItem } from '@/providers/CartProvider';

interface PurchaseReceiptProps {
  items: CartItem[];
  totalStroops: bigint;
  feeStroops: bigint;
  subtotalStroops: bigint;
  txHash?: string;
  timestamp?: Date;
  buyerAddress?: string;
  onClose?: () => void;
}

export function PurchaseReceipt({
  items,
  totalStroops,
  feeStroops,
  subtotalStroops,
  txHash,
  timestamp,
  buyerAddress,
  onClose,
}: PurchaseReceiptProps) {
  const receiptId = useMemo(
    () => `RECEIPT-${timestamp?.getTime().toString().slice(-8)}`,
    [timestamp]
  );

  const handleDownload = () => {
    const receiptText = generateReceiptText(
      items,
      totalStroops,
      feeStroops,
      subtotalStroops,
      txHash,
      timestamp,
      buyerAddress,
      receiptId
    );

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(receiptText)}`);
    element.setAttribute('download', `${receiptId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Purchase Receipt</h2>
              <p className="text-sm text-slate-400">{receiptId}</p>
            </div>
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
          {/* Success Status */}
          {txHash && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-400">Transaction Successful</p>
                <p className="text-xs text-emerald-300/80 mt-1">
                  Hash: <code className="font-mono text-emerald-300">{txHash.slice(0, 20)}...</code>
                </p>
              </div>
            </div>
          )}

          {/* Transaction Info */}
          <div className="space-y-2 text-sm">
            {timestamp && (
              <div className="flex justify-between text-slate-400">
                <span>Date & Time</span>
                <span>{timestamp.toLocaleString()}</span>
              </div>
            )}
            {buyerAddress && (
              <div className="flex justify-between text-slate-400">
                <span>Buyer Address</span>
                <code className="font-mono text-xs text-slate-300 truncate">
                  {buyerAddress.slice(0, 16)}...{buyerAddress.slice(-8)}
                </code>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Purchased Items</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-start justify-between text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-1">ID: {item.id}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-white font-mono">
                      {formatXlmLocale(BigInt(item.priceStroops), 'stroops', 'en')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 border-t border-slate-700 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white font-mono">
                {formatXlmLocale(subtotalStroops, 'stroops', 'en')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Network Fee</span>
              <span className="text-white font-mono">
                {formatXlmLocale(feeStroops, 'stroops', 'en')}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-4 mt-4">
              <span className="text-white">Total</span>
              <span className="text-white font-mono">
                {formatXlmLocale(totalStroops, 'stroops', 'en')}
              </span>
            </div>
          </div>

          {/* Items Count */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-slate-800">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 border-t border-slate-700 p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download Receipt
          </Button>
          {onClose && (
            <Button onClick={onClose} className="gap-2">
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function generateReceiptText(
  items: CartItem[],
  totalStroops: bigint,
  feeStroops: bigint,
  subtotalStroops: bigint,
  txHash?: string,
  timestamp?: Date,
  buyerAddress?: string,
  receiptId?: string
): string {
  const lines = [
    '═══════════════════════════════════',
    'PROMPTMINT - PURCHASE RECEIPT',
    '═══════════════════════════════════',
    '',
    timestamp ? `Date: ${timestamp.toLocaleString()}` : '',
    receiptId ? `Receipt ID: ${receiptId}` : '',
    buyerAddress ? `Buyer: ${buyerAddress}` : '',
    '',
    '───────────────────────────────────',
    'LINE ITEMS',
    '───────────────────────────────────',
    ...items.map((item) => {
      const xlm = Number(item.priceStroops) / 10_000_000;
      return `${item.name.padEnd(30)} ${xlm.toFixed(7)} XLM`;
    }),
    '',
    '───────────────────────────────────',
    `Subtotal:      ${(Number(subtotalStroops) / 10_000_000).toFixed(7)} XLM`,
    `Network Fee:   ${(Number(feeStroops) / 10_000_000).toFixed(7)} XLM`,
    `TOTAL:         ${(Number(totalStroops) / 10_000_000).toFixed(7)} XLM`,
    '───────────────────────────────────',
    txHash ? `Transaction Hash: ${txHash}` : '',
    '',
    'Thank you for your purchase!',
    '═══════════════════════════════════',
  ];

  return lines.filter((line) => line !== '').join('\n');
}
