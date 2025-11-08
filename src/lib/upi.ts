export interface UPIParams {
  pa: string; // UPI ID
  pn: string; // Merchant name
  am: number; // Amount
  cu?: 'INR'; // Currency, default INR
  tn?: string; // Note / transaction description
}

// Build a UPI deep link per standard format
export const buildUpiLink = ({ pa, pn, am, cu = 'INR', tn = '' }: UPIParams): string => {
  const params = new URLSearchParams();
  params.set('pa', pa);
  params.set('pn', pn);
  params.set('am', am.toFixed(2));
  params.set('cu', cu);
  if (tn) params.set('tn', tn);
  return `upi://pay?${params.toString()}`;
};

// Convenience helpers for common app URLs (all use same UPI link)
export const openUpiLink = (upiLink: string) => {
  window.location.href = upiLink;
};

export const formatNote = (text: string) => encodeURIComponent(text).replace(/%20/g, '+');

