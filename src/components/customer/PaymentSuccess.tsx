import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface Props {
  amount: number;
  productName?: string;
  installmentNumber?: number;
  tenure?: number;
  onClose: () => void;
}

export const PaymentSuccess: React.FC<Props> = ({ amount, productName, installmentNumber, tenure, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-3">
          <div className="text-green-600 text-4xl">✓</div>
          <h2 className="text-xl font-bold text-gray-900">Payment Successful</h2>
          <p className="text-gray-600">Your EMI payment was submitted.</p>
          <div className="bg-green-50 rounded p-3 text-sm text-green-800">
            <p><span className="font-medium">Amount:</span> ₹{amount.toFixed(2)}</p>
            {productName && <p><span className="font-medium">Product:</span> {productName}</p>}
            {installmentNumber && tenure && (
              <p><span className="font-medium">Installment:</span> {installmentNumber}/{tenure}</p>
            )}
          </div>
          <Button variant="success" onClick={onClose}>Done</Button>
        </CardContent>
      </Card>
    </div>
  );
};

