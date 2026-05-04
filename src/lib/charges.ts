export interface ChargeDetails {
  total: number;
  breakdown: {
    brokerage: number;
    stt: number;
    exchangeTxn: number;
    sebi: number;
    gst: number;
    stampDuty: number;
  };
}

export function calculateCharges({
  type,
  symbol,
  entryPrice,
  exitPrice = entryPrice, // Default for open positions
  quantity,
  isFutures = false,
  isOptions = false,
}: {
  type: 'BUY' | 'SELL';
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  isFutures?: boolean;
  isOptions?: boolean;
}): ChargeDetails {
  const turnover = (entryPrice + exitPrice) * quantity;
  const brokerage = Math.min(20, turnover * 0.0003); // Zerodha-style flat fee

  let stt = 0;
  if (!isFutures && !isOptions) {
    // Equity delivery: 0.1% on buy and sell
    stt = (entryPrice * quantity * 0.001) + (exitPrice * quantity * 0.001);
  } else if (isFutures) {
    // Futures: 0.01% on sell side
    stt = exitPrice * quantity * 0.0001;
  } else if (isOptions) {
    // Options: 0.05% on sell side (on premium)
    stt = exitPrice * quantity * 0.0005;
  }

  const exchangeTxn = turnover * 0.0000325;
  const sebi = turnover * 0.000001;
  const gst = (brokerage + exchangeTxn) * 0.18;
  const stampDuty = entryPrice * quantity * 0.00003;

  const totalCharges = brokerage + stt + exchangeTxn + sebi + gst + stampDuty;

  return {
    total: parseFloat(totalCharges.toFixed(2)),
    breakdown: {
      brokerage: parseFloat(brokerage.toFixed(2)),
      stt: parseFloat(stt.toFixed(2)),
      exchangeTxn: parseFloat(exchangeTxn.toFixed(2)),
      sebi: parseFloat(sebi.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      stampDuty: parseFloat(stampDuty.toFixed(2)),
    },
  };
}
