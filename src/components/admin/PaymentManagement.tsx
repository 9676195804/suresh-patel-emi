import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { EMISchedule, Purchase, Customer } from '../../types';
import { calculateLateFee } from '../../lib/emi-calculator';
import { sendPaymentConfirmationSMS, sendNOCSMS } from '../../lib/sms-service';
import { generateNOCDownloadLink } from '../../lib/noc-generator';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, Clock, AlertTriangle, DollarSign } from 'lucide-react';

interface ExtendedEMISchedule extends EMISchedule {
  purchase?: Purchase & { customer?: Customer };
}

export const PaymentManagement: React.FC = () => {
  const [emiSchedules, setEmiSchedules] = useState<ExtendedEMISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchEMISchedules();
  }, []);

  const fetchEMISchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('emi_schedule')
        .select(`
          *,
          purchase:purchases(
            *,
            customer:customers(*)
          )
        `)
        .order('due_date');

      if (error) throw error;
      setEmiSchedules(data || []);
    } catch (error) {
      console.error('Error fetching EMI schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const markPayment = async (emiId: string, emiSchedule: ExtendedEMISchedule) => {
    setProcessingPayment(emiId);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate late fee if payment is after due date
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'late_fee_per_day')
        .maybeSingle();
      
      const feePerDay = settings ? parseFloat(settings.value) : 50;
      const lateFee = calculateLateFee(emiSchedule.due_date, feePerDay);

      // Update EMI schedule status
      const { error: updateError } = await supabase
        .from('emi_schedule')
        .update({
          status: 'paid',
          paid_date: today,
          late_fee: lateFee
        })
        .eq('id', emiId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          emi_schedule_id: emiId,
          purchase_id: emiSchedule.purchase_id,
          customer_id: emiSchedule.purchase?.customer_id,
          amount_paid: emiSchedule.total_amount,
          late_fee: lateFee,
          payment_date: today,
          payment_method: 'cash'
        }]);

      if (paymentError) throw paymentError;

      // Check if this is the last EMI
      const { data: remainingEMIs } = await supabase
        .from('emi_schedule')
        .select('id')
        .eq('purchase_id', emiSchedule.purchase_id)
        .eq('status', 'pending');

      const remainingCount = remainingEMIs?.length || 0;

      // Get shop name for SMS
      const { data: shopData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'shop_name')
        .maybeSingle();
      
  const shopName = shopData?.value || 'SURESH PATEL EMI';

      // Send SMS notification
      if (emiSchedule.purchase?.customer) {
        const customer = emiSchedule.purchase.customer;

        if (remainingCount === 0) {
          // Last EMI - generate NOC and send SMS with download link
          // Fetch additional shop details for NOC
          const { data: extraSettings } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['shop_signature_url', 'sms_sender_id', 'shop_address', 'shop_email', 'shop_gstin', 'shop_proprietor']);

          const settingsMap: Record<string, string> = {};
          extraSettings?.forEach(s => { settingsMap[s.key] = s.value; });

          const nocLink = await generateNOCDownloadLink({
            purchase: emiSchedule.purchase,
            shopDetails: {
              name: shopName,
              address: settingsMap.shop_address || '',
              phone: settingsMap.sms_sender_id || '',
              proprietor: settingsMap.shop_proprietor || undefined,
              gstin: settingsMap.shop_gstin || undefined,
              email: settingsMap.shop_email || undefined,
            },
            shopSignUrl: settingsMap.shop_signature_url || ''
          });
          
          await sendNOCSMS(
            customer.name,
            customer.mobile,
            customer.id,
            emiSchedule.purchase.product_name,
            shopName,
            nocLink
          );
          
          // Update purchase status to completed
          await supabase
            .from('purchases')
            .update({ status: 'completed' })
            .eq('id', emiSchedule.purchase_id);
        } else {
          // Regular payment confirmation SMS
          await sendPaymentConfirmationSMS(
            customer.name,
            customer.mobile,
            customer.id,
            emiSchedule.total_amount,
            emiSchedule.installment_number,
            remainingCount,
            shopName,
          );
        }
      }

      fetchEMISchedules();
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'pending' && dueDate < today;

    if (status === 'paid') {
      return <Badge variant="success">Paid</Badge>;
    } else if (isOverdue) {
      return <Badge variant="danger">Overdue</Badge>;
    } else {
      return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'pending' && dueDate < today;

    if (status === 'paid') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (isOverdue) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    } else {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">This Month's Collections</h1>
        <p className="text-gray-600">EMI payments due this month</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {emiSchedules.map((emi) => (
          <Card key={emi.id} hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(emi.status, emi.due_date)}
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">
                      {emi.purchase?.product_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {emi.purchase?.customer?.name} - {emi.purchase?.customer?.mobile}
                    </p>
                  </div>
                </div>
                {getStatusBadge(emi.status, emi.due_date)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Installment</p>
                    <p className="font-medium">{emi.installment_number} of {emi.purchase?.tenure}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">{new Date(emi.due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Principal</p>
                    <p className="font-semibold text-blue-600">₹{emi.principal_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest</p>
                    <p className="font-semibold text-orange-600">₹{emi.interest_amount}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-xl font-bold text-gray-900">₹{emi.total_amount}</p>
                    {emi.late_fee > 0 && (
                      <p className="text-sm text-red-600">+ Late fee: ₹{emi.late_fee}</p>
                    )}
                  </div>

                  {emi.status === 'pending' && (
                    <Button
                      onClick={() => markPayment(emi.id, emi)}
                      loading={processingPayment === emi.id}
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Mark Paid
                    </Button>
                  )}
                </div>

                {emi.status === 'paid' && emi.paid_date && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    Paid on {new Date(emi.paid_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {emiSchedules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No EMI schedules found</p>
        </div>
      )}
    </div>
  );
};