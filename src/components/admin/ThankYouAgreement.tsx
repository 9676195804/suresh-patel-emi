import React from 'react';
import { Customer, Purchase } from '../../types';

interface ThankYouAgreementProps {
  customer: Customer;
  purchase: Purchase;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  currentDate: string;
}

export const ThankYouAgreement: React.FC<ThankYouAgreementProps> = ({
  customer,
  purchase,
  shopName,
  shopAddress,
  shopPhone,
  shopEmail,
  currentDate
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-xs text-center">Shop Sign</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{shopName}</h1>
        <p className="text-gray-600 text-sm mb-1">{shopAddress}</p>
        <p className="text-gray-600 text-sm mb-1">Phone: {shopPhone}</p>
        <p className="text-gray-600 text-sm">Email: {shopEmail}</p>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">THANK YOU & APPRECIATION CERTIFICATE</h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
      </div>

      {/* Certificate Content */}
      <div className="mb-8">
        <p className="text-lg text-gray-800 mb-6 leading-relaxed">
          This is to certify that <strong>{customer.name}</strong>, residing at{' '}
          <strong>{customer.address}</strong>, has successfully completed all EMI payments for the following purchase:
        </p>

        {/* Purchase Details */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Product Name:</p>
              <p className="font-semibold text-gray-900">{purchase.product_name}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Purchase Date:</p>
              <p className="font-semibold text-gray-900">{new Date(purchase.purchase_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Total Amount:</p>
              <p className="font-semibold text-gray-900">₹{purchase.total_price}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Down Payment:</p>
              <p className="font-semibold text-gray-900">₹{purchase.down_payment}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">EMI Amount:</p>
              <p className="font-semibold text-gray-900">₹{purchase.emi_amount}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Tenure:</p>
              <p className="font-semibold text-gray-900">{purchase.tenure} months</p>
            </div>
          </div>
        </div>

        {/* Appreciation Message */}
        <div className="mb-8">
          <p className="text-lg text-gray-800 mb-4 leading-relaxed">
            We sincerely appreciate your trust and confidence in our services. Your commitment to timely payments and 
            financial discipline is commendable and serves as an excellent example of responsible financial management.
          </p>
          
          <p className="text-lg text-gray-800 mb-4 leading-relaxed">
            We are grateful for the opportunity to serve you and look forward to continuing our relationship. 
            Your satisfaction is our priority, and we are always here to assist you with any future requirements.
          </p>

          <p className="text-lg text-gray-800 leading-relaxed">
            This certificate is issued as a token of our appreciation and as confirmation of the successful 
            completion of your EMI tenure with us.
          </p>
        </div>

        {/* Best Wishes */}
        <div className="bg-blue-50 p-6 rounded-lg text-center mb-8">
          <p className="text-xl font-semibold text-blue-800 mb-2">
            Thank you for choosing {shopName}!
          </p>
          <p className="text-blue-700">
            We wish you continued success and prosperity in all your endeavors.
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-12">
        <div className="grid grid-cols-2 gap-8">
          <div className="text-center">
            <div className="w-32 h-16 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-gray-500 text-xs text-center">Customer Signature</span>
            </div>
            <p className="text-sm text-gray-600">Customer</p>
            <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
            <p className="text-xs text-gray-500">Date: {currentDate}</p>
          </div>
          
          <div className="text-center">
            <div className="w-32 h-16 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-gray-500 text-xs text-center">Authorized Signatory</span>
            </div>
            <p className="text-sm text-gray-600">For {shopName}</p>
            <p className="text-sm font-semibold text-gray-900">Authorized Signatory</p>
            <p className="text-xs text-gray-500">Date: {currentDate}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500 mb-2">
          This is a computer-generated document and does not require a physical signature.
        </p>
        <p className="text-xs text-gray-500">
          For any queries, please contact us at {shopPhone} or {shopEmail}
        </p>
      </div>
    </div>
  );
};