import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getCustomerUser } from '../../lib/auth';
import { Purchase, EMISchedule, Customer } from '../../types';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { UPIPaymentModal } from './UPIPaymentModal';
import { buildUpiLink } from '../../lib/upi';
import { generateNOCDownloadLink } from '../../lib/noc-generator';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Smartphone,
  Settings,
  Save,
  ShoppingBag,
  Download
} from 'lucide-react';
import { ProductList } from './ProductList';


interface ExtendedPurchase extends Purchase {
  emi_schedules?: EMISchedule[];
}

export const CustomerDashboard: React.FC = () => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<ExtendedPurchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [upiId, setUpiId] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    nextDueDate: null as string | null,
    nextDueAmount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerData = await getCustomerUser();
        setCustomer(customerData);

        // Fetch products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true);
          
        if (productsError) {
          console.error('Error fetching products:', productsError);
        } else {
          setProducts(productsData);
        }

        if (customerData) {
          fetchCustomerData(customerData.mobile);
          fetchUpiId();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchUpiId = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'upi_id')
        .maybeSingle();
      
      setUpiId(data?.value || 'jadhavsuresh2512@axl');
    } catch (error) {
      console.error('Error fetching UPI ID:', error);
      setUpiId('jadhavsuresh2512@axl');
    }
  };

  const fetchCustomerData = async (mobile: string) => {
    try {
      // Get customer data by mobile
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('mobile', mobile)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch customer purchases with EMI schedules
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          *,
          emi_schedules:emi_schedule(*)
        `)
        .eq('customer_id', customerData.id);

      if (purchaseError) throw purchaseError;

      const purchasesWithSchedules = purchaseData || [];
      setPurchases(purchasesWithSchedules);

      // Calculate stats
      let totalPaid = 0;
      let totalPending = 0;
      let nextDue: { date: string; amount: number } | null = null;

      purchasesWithSchedules.forEach(purchase => {
        purchase.emi_schedules?.forEach(emi => {
          if (emi.status === 'paid') {
            totalPaid += emi.total_amount + emi.late_fee;
          } else {
            totalPending += emi.total_amount;
            
            // Find next due date
            if (!nextDue || emi.due_date < nextDue.date) {
              nextDue = { date: emi.due_date, amount: emi.total_amount };
            }
          }
        });
      });

      setStats({
        totalPaid,
        totalPending,
        nextDueDate: nextDue?.date || null,
        nextDueAmount: nextDue?.amount || 0
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [currentUpiLink, setCurrentUpiLink] = useState<string>('');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number>(0);
  const [currentCustomerName, setCurrentCustomerName] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMeta, setSuccessMeta] = useState<{ amount: number; productName?: string; installmentNumber?: number; tenure?: number } | null>(null);

  const handlePayment = async (purchase: ExtendedPurchase, emi: EMISchedule) => {
    try {
      // Fetch UPI config
      const [{ data: upiData }, { data: shopData }] = await Promise.all([
        supabase.from('settings').select('value').eq('key', 'upi_id').single(),
        supabase.from('settings').select('value').eq('key', 'shop_name').maybeSingle(),
      ]);

      const upiId = upiData?.value || '9676195804@paytm';
  const merchantName = shopData?.value || 'SURESH PATEL EMI';
      const amount = Number(emi.total_amount + (emi.late_fee || 0));

      // Serial-payment guard: ensure all earlier EMIs are paid
      const idx = purchase.emi_schedules.findIndex(e => e.id === emi.id);
      const previousPending = purchase.emi_schedules.slice(0, idx).some(e => e.status !== 'paid');
      if (previousPending) {
        alert('Please pay all previous installments first');
        return;
      }

      const note = `EMI Payment ${emi.installment_number}/${purchase.tenure}`;
      const upiLink = buildUpiLink({ pa: upiId, pn: merchantName, am: amount, tn: note });

      // Log generated UPI link
      await supabase.from('upi_links').insert([
        {
          upi_link: upiLink,
          amount,
          customer_id: purchase.customer_id,
          purchase_id: purchase.id,
          emi_schedule_id: emi.id,
          status: 'generated',
        },
      ]);

      // Open modal
      setCurrentUpiLink(upiLink);
      setCurrentPaymentAmount(amount);
      setCurrentCustomerName(purchase.customer?.name || '');
      setIsUpiModalOpen(true);
    } catch (error) {
      console.error('Error preparing UPI payment:', error);
      alert('Could not prepare UPI payment. Please try again.');
    }
  };

  // Manual confirmation handler (can be replaced by backend verification hook)
  const confirmPayment = async (purchase: ExtendedPurchase, emi: EMISchedule) => {
    try {
      // Update link status to completed for logging
      await supabase
        .from('upi_links')
        .update({ status: 'completed' })
        .eq('emi_schedule_id', emi.id);

      setIsUpiModalOpen(false);
      setSuccessMeta({ amount: Number(emi.total_amount + (emi.late_fee || 0)), productName: purchase.product_name, installmentNumber: emi.installment_number, tenure: purchase.tenure });
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('Could not confirm payment. Please contact support.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      alert('Password must be at least 4 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ password: newPassword })
        .eq('mobile', customer?.mobile);

      if (error) throw error;

      alert('Password updated successfully');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleNOCDownload = async (purchase: Purchase) => {
    try {
      if (!customer) return;
      
      // Get shop name
      const { data: shopData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'shop_name')
        .maybeSingle();
      
      const shopName = shopData?.value || 'SURESH PATEL EMI';

      // Fetch additional shop details for NOC
      const { data: extraSettings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['shop_signature_url', 'sms_sender_id', 'shop_address', 'shop_email', 'shop_gstin', 'shop_proprietor']);

      const settingsMap: Record<string, string> = {};
      extraSettings?.forEach(s => { settingsMap[s.key] = s.value; });
      
      const nocLink = await generateNOCDownloadLink({
        purchase,
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
      
      if (nocLink) {
        window.open(nocLink, '_blank');
      }
    } catch (error) {
      console.error('Error generating NOC:', error);
      alert('Failed to generate NOC certificate. Please contact support.');
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
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (isOverdue) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {customer?.name}!</h1>
            <p className="text-gray-600">Here's your EMI overview</p>
          </div>
          <Button
            onClick={() => setIsPasswordModalOpen(true)}
            variant="secondary"
            className="flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">₹{stats.totalPending.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Due</p>
                <p className="text-sm font-bold text-blue-600">
                  {stats.nextDueDate ? new Date(stats.nextDueDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Amount</p>
                <p className="text-xl font-bold text-purple-600">₹{stats.nextDueAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases and EMI Schedules */}
      {purchases.map((purchase) => (
        <Card key={purchase.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{purchase.product_name}</h3>
                  <p className="text-sm text-gray-500">
                    Total: ₹{purchase.total_price} | EMI: ₹{purchase.emi_amount} x {purchase.tenure} months
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  purchase.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : purchase.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {purchase.status}
                </span>
                {purchase.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleNOCDownload(purchase)}
                    className="flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download NOC
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">EMI #</th>
                    <th className="text-left py-2">Due Date</th>
                    <th className="text-left py-2">Principal</th>
                    <th className="text-left py-2">Interest</th>
                    <th className="text-left py-2">Total</th>
                    <th className="text-left py-2">Late Fee</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.emi_schedules?.map((emi) => (
                    <tr key={emi.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center">
                          {getStatusIcon(emi.status, emi.due_date)}
                          <span className="ml-2">{emi.installment_number}</span>
                        </div>
                      </td>
                      <td className="py-3">{new Date(emi.due_date).toLocaleDateString()}</td>
                      <td className="py-3 text-blue-600">₹{emi.principal_amount}</td>
                      <td className="py-3 text-orange-600">₹{emi.interest_amount}</td>
                      <td className="py-3 font-semibold">₹{emi.total_amount}</td>
                      <td className="py-3 text-red-600">
                        {emi.late_fee > 0 ? `₹${emi.late_fee}` : '-'}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(emi.status, emi.due_date)}
                          {emi.status === 'pending' && (() => {
                            const idx = purchase.emi_schedules.findIndex(e => e.id === emi.id);
                            // Block if ANY previous EMI is still pending
                            const previousPending = purchase.emi_schedules.slice(0, idx).some(e => e.status !== 'paid');
                            return (
                              <Button
                                size="sm"
                                onClick={() => handlePayment(purchase, emi)}
                                disabled={previousPending}
                                title={previousPending ? 'Please pay previous installments first' : ''}
                                className="ml-2 flex items-center"
                              >
                                <Smartphone className="w-3 h-3 mr-1" />
                                Pay
                              </Button>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {purchases.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No purchases found</p>
          </CardContent>
        </Card>
      )}

      {/* Available Products */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Products</h2>
        <ProductList products={products} upiId={upiId} />
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={4}
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={4}
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={passwordLoading}>
              <Save className="w-4 h-4 mr-2" />
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        upiLink={currentUpiLink}
        amount={currentPaymentAmount}
        customerName={currentCustomerName}
      />

      {showSuccess && successMeta && (
        // Lightweight success overlay until backend verification exists
        <PaymentSuccess
          amount={successMeta.amount}
          productName={successMeta.productName}
          installmentNumber={successMeta.installmentNumber}
          tenure={successMeta.tenure}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};
