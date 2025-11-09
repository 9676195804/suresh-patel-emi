import React from 'react';
import { Purchase, EMISchedule } from '../../types';

interface InvoiceProps {
  purchase: Purchase;
  emis: EMISchedule[];
  shopDetails: { name: string; address: string; phone: string; signature?: string };
  purchaseImages?: string[];
}

export const Invoice: React.FC<InvoiceProps> = ({ purchase, emis, shopDetails, purchaseImages = [] }) => {
  return (
    <div className="p-8 bg-white">
      <div className="text-center mb-8">
        {shopDetails.signature && (
          <img
            src={shopDetails.signature}
            alt={`${shopDetails.name} logo`}
            className="h-16 w-auto mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-2xl font-bold">{shopDetails.name}</h1>
        <p>{shopDetails.address}</p>
        <p>{shopDetails.phone}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Invoice</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Invoice No:</strong> {purchase.id}</p>
            <p><strong>Date:</strong> {new Date(purchase.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p><strong>Customer:</strong> {purchase.customer?.name}</p>
            <p><strong>Mobile:</strong> {purchase.customer?.mobile}</p>
          </div>
        </div>
      </div>

      {purchaseImages && purchaseImages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Purchase Images</h3>
          <div className="grid grid-cols-2 gap-4">
            {purchaseImages.map((url, index) => (
              <img 
                key={index}
                src={url}
                alt={`Purchase image ${index + 1}`}
                className="w-full h-auto max-h-48 object-contain border border-gray-200 rounded"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">Purchase Details</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Product</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{purchase.product_name}</td>
              <td className="text-right">₹{purchase.total_price.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {purchase.purchase_images && purchase.purchase_images.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4">Purchase Images</h3>
          <div className="flex flex-wrap gap-3">
            {purchase.purchase_images.map((img, idx) => (
              img.image_url ? (
                <img
                  key={idx}
                  src={img.image_url}
                  alt={`Purchase image ${idx + 1}`}
                  className="w-32 h-32 object-cover rounded border"
                />
              ) : null
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">EMI Schedule</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Due Date</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {emis.map((emi) => (
              <tr key={emi.id}>
                <td>{new Date(emi.due_date).toLocaleDateString()}</td>
                <td className="text-right">₹{(emi.total_amount ?? 0).toFixed(2)}</td>
                <td className="text-right">{emi.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-16">
        <h4 className="text-md font-bold mb-4">Agreement</h4>
        <p className="text-sm">
          I hereby agree to pay the total amount of this purchase in {purchase.tenure} monthly installments as per the EMI schedule above. I understand that late fees of ₹50 per day will be charged for any delayed payments.
        </p>
      </div>

      <div className="mt-16 flex justify-between">
        <div>
          <p><strong>Shop Signature</strong></p>
          {shopDetails.signature ? (
            <img 
              src={shopDetails.signature} 
              alt="Shop Signature" 
              className="mt-2 max-w-48 max-h-20 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="mt-8 border-t border-gray-400 w-48"></div>
          )}
        </div>
        <div>
          <p><strong>Customer Signature</strong></p>
          <div className="mt-8 border-t border-gray-400 w-48"></div>
        </div>
      </div>
    </div>
  );
};
