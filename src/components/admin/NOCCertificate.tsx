import React from 'react';
import { Purchase, Customer } from '../../types';

interface NOCCertificateProps {
  purchase: Purchase & { customer?: Customer };
  shopDetails: { 
    name: string; 
    address: string; 
    phone: string;
    proprietor?: string;
    gstin?: string;
    email?: string;
  };
  shopSignUrl?: string;
  certificateNumber?: string;
  issueDate?: string;
}

export const NOCCertificate: React.FC<NOCCertificateProps> = ({ 
  purchase, 
  shopDetails, 
  shopSignUrl,
  certificateNumber = `NOC-${purchase.id}-${Date.now()}`,
  issueDate = new Date().toLocaleDateString('en-IN')
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const totalPaid = purchase.emi_schedules?.reduce((sum, emi) => 
    emi.status === 'paid' ? sum + emi.total_amount + (emi.late_fee || 0) : sum, 0
  ) || 0;

  const startDate = purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('en-IN') : 'N/A';
  const completionDate = purchase.emi_schedules?.find(emi => emi.installment_number === purchase.tenure)?.paid_at 
    ? new Date(purchase.emi_schedules.find(emi => emi.installment_number === purchase.tenure)!.paid_at!).toLocaleDateString('en-IN')
    : new Date().toLocaleDateString('en-IN');

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* Certificate Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          {shopSignUrl && (
            <img 
              src={shopSignUrl} 
              alt={`${shopDetails.name} Shop Sign`}
              className="h-16 w-auto mr-4 object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{shopDetails.name}</h1>
            <p className="text-lg text-gray-600">{shopDetails.address}</p>
            <p className="text-md text-gray-600">
              Phone: {shopDetails.phone}
              {shopDetails.email && ` | Email: ${shopDetails.email}`}
              {shopDetails.gstin && ` | GSTIN: ${shopDetails.gstin}`}
            </p>
          </div>
        </div>
        
        <div className="border-t-2 border-b-2 border-gray-300 py-4 my-6">
          <h2 className="text-4xl font-bold text-blue-800 mb-2">NO OBJECTION CERTIFICATE</h2>
          <p className="text-lg text-gray-600">Certificate No: {certificateNumber}</p>
          <p className="text-lg text-gray-600">Date of Issue: {issueDate}</p>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="mb-8 text-justify">
        <p className="text-lg leading-relaxed mb-6">
          This is to certify that <strong>{purchase.customer?.name}</strong>, 
          residing at <strong>{purchase.customer?.address || 'Address not provided'}</strong>, 
          holding mobile number <strong>{purchase.customer?.mobile}</strong> and 
          Aadhaar number <strong>{purchase.customer?.aadhaar || 'N/A'}</strong>, 
          has successfully completed all EMI payments for the purchase made from our establishment.
        </p>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold mb-4 text-center">PURCHASE DETAILS</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Product Name:</strong> {purchase.product_name}</p>
              <p><strong>Total Amount:</strong> {formatCurrency(purchase.total_price)}</p>
              <p><strong>Down Payment:</strong> {formatCurrency(purchase.down_payment)}</p>
              <p><strong>EMI Amount:</strong> {formatCurrency(purchase.emi_amount)}</p>
            </div>
            <div>
              <p><strong>Tenure:</strong> {purchase.tenure} months</p>
              <p><strong>Start Date:</strong> {startDate}</p>
              <p><strong>Completion Date:</strong> {completionDate}</p>
              <p><strong>Total Paid:</strong> {formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>

        <p className="text-lg leading-relaxed mb-6">
          The customer has fulfilled all financial obligations related to this purchase, including all monthly installments, 
          interest charges, and any applicable fees. All {purchase.tenure} EMI payments have been received in full and on time.
        </p>

        <p className="text-lg leading-relaxed mb-6">
          Based on the satisfactory completion of all payment obligations, we hereby issue this No Objection Certificate 
          confirming that there are no outstanding dues, liabilities, or objections against the above-mentioned customer 
          for this particular purchase.
        </p>

        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h4 className="text-lg font-bold mb-2">DECLARATION</h4>
          <p className="text-base leading-relaxed">
            This certificate is issued at the request of the customer for their records and future reference. 
            The customer is free from any financial obligations related to this purchase. We appreciate the customer's 
            prompt payment behavior and cooperation throughout the EMI tenure.
          </p>
        </div>

        <p className="text-lg leading-relaxed mb-8">
          This certificate is valid for all legal and official purposes and is issued without any reservations.
        </p>

        <div className="bg-green-50 p-6 rounded-lg mb-8">
          <h4 className="text-lg font-bold mb-2">ACKNOWLEDGMENT</h4>
          <p className="text-base leading-relaxed mb-4">
            We thank <strong>{purchase.customer?.name}</strong> for choosing our services and maintaining 
            a satisfactory payment record. We wish them all the best for their future endeavors.
          </p>
          <p className="text-base text-gray-600 italic">
            "Thank you for your business and trust in our services."
          </p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h4 className="text-lg font-bold mb-4">TERMS AND CONDITIONS</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>This certificate is issued based on the records available with us as of the date of issue.</li>
          <li>This certificate pertains only to the specific purchase mentioned above.</li>
          <li>This certificate does not guarantee any future transactions or purchases.</li>
          <li>The certificate is valid only if the official seal and authorized signature are present.</li>
          <li>Any alterations to this certificate will render it invalid.</li>
        </ol>
      </div>

      {/* Signatures */}
      <div className="mt-16">
        <div className="flex justify-between items-end">
          <div className="text-center">
            {shopSignUrl && (
              <img 
                src={shopSignUrl} 
                alt={`${shopDetails.name} Shop Sign`}
                className="h-12 w-auto mx-auto mb-2 object-contain"
              />
            )}
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="font-bold">{shopDetails.proprietor || 'Proprietor'}</p>
              <p className="text-sm text-gray-600">For {shopDetails.name}</p>
              <p className="text-xs text-gray-500">Authorized Signatory</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="font-bold">Customer Signature</p>
              <p className="text-sm text-gray-600">{purchase.customer?.name}</p>
              <p className="text-xs text-gray-500">Date: {issueDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center border-t border-gray-300 pt-6">
        <p className="text-sm text-gray-500">
          This is a computer-generated certificate and does not require a physical seal. 
          For verification, contact: {shopDetails.phone}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Generated on {new Date().toLocaleString('en-IN')} | Certificate ID: {certificateNumber}
        </p>
      </div>
    </div>
  );
};