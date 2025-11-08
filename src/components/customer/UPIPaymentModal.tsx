import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  upiLink: string;
  amount: number;
  customerName?: string;
}

export const UPIPaymentModal: React.FC<Props> = ({ isOpen, onClose, upiLink, amount, customerName }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    const genQr = async () => {
      try {
        const url = await QRCode.toDataURL(upiLink, { margin: 2, scale: 8 });
        setQrDataUrl(url);
      } catch (e) {
        console.error('Failed to generate QR:', e);
      }
    };
    genQr();
  }, [isOpen, upiLink, refreshKey]);

  const refreshQR = () => {
    // Force re-generate QR when modal opens or on demand
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    if (isOpen) {
      refreshQR();
    }
  }, [isOpen]);

  const openLink = () => {
    window.location.href = upiLink;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay via UPI">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Amount</p>
          <p className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</p>
          {customerName && <p className="text-sm text-gray-500">Customer: {customerName}</p>}
        </div>

        <div className="flex justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI QR" className="w-64 h-64 rounded-lg border" />
          ) : (
            <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-lg" />
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          Scan with any UPI app to pay
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Pay using any UPI app:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={openLink} variant="primary" size="sm">Google Pay</Button>
            <Button onClick={openLink} variant="primary" size="sm">Paytm</Button>
            <Button onClick={openLink} variant="primary" size="sm">BHIM</Button>
          </div>
          <div className="bg-yellow-50 text-yellow-800 text-sm p-2 rounded mt-2">
            📱 PhonePe users — please scan this QR with your PhonePe app.
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

