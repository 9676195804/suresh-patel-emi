import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Customer, Purchase } from '../../types';
import { calculateEMI, generateEMISchedule } from '../../lib/emi-calculator';
import { sendPurchaseWelcomeSMS } from '../../lib/sms-service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Plus, ShoppingCart, Calendar, DollarSign } from 'lucide-react';

export const PurchaseManagement: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [defaultInterestRate, setDefaultInterestRate] = useState(24);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    product_name: '',
    total_price: '',
    down_payment: '',
    processing_fee: '',
    tds_amount: '',
    insurance_amount: '',
    documentation_charges: '',
    other_charges: '',
    tenure: 6,
    interest_rate: '',
    start_date: new Date().toISOString().split('T')[0]
  });

  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    mobile: ''
  });

  useEffect(() => {
    fetchPurchases();
    fetchCustomers();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'default_interest_rate')
        .maybeSingle();
      
      if (data) {
        setDefaultInterestRate(parseFloat(data.value));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          customer:customers(name, mobile)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalPrice = parseFloat(formData.total_price);
      const downPayment = parseFloat(formData.down_payment) || 0;
      const processingFee = parseFloat(formData.processing_fee) || 0;
      const tdsAmount = parseFloat(formData.tds_amount) || 0;
      const insuranceAmount = parseFloat(formData.insurance_amount) || 0;
      const documentationCharges = parseFloat(formData.documentation_charges) || 0;
      const otherCharges = parseFloat(formData.other_charges) || 0;
      
      const totalCharges = processingFee + tdsAmount + insuranceAmount + documentationCharges + otherCharges;
      const loanAmount = totalPrice - downPayment + totalCharges;
      const interestRate = parseFloat(formData.interest_rate) || defaultInterestRate;
      const emiAmount = calculateEMI(loanAmount, interestRate, formData.tenure);

      // Insert purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          customer_id: formData.customer_id,
          product_name: formData.product_name,
          total_price: totalPrice,
          down_payment: downPayment,
          processing_fee: processingFee,
          tds_amount: tdsAmount,
          insurance_amount: insuranceAmount,
          documentation_charges: documentationCharges,
          other_charges: otherCharges,
          loan_amount: loanAmount,
          tenure: formData.tenure,
          interest_rate: interestRate,
          emi_amount: emiAmount,
          start_date: formData.start_date
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Generate EMI schedule
      const emiSchedule = generateEMISchedule(
        purchase.id,
        loanAmount,
        emiAmount,
        interestRate,
        formData.tenure,
        formData.start_date
      );

      const { error: scheduleError } = await supabase
        .from('emi_schedule')
        .insert(emiSchedule);

      if (scheduleError) throw scheduleError;

      // Send welcome SMS to customer
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer) {
        const { data: shopData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'shop_name')
          .maybeSingle();
        
        const shopName = shopData?.value || 'Suresh Patel Kirana EMI';
        const firstDueDate = new Date(formData.start_date);
        firstDueDate.setMonth(firstDueDate.getMonth() + 1);
        
        await sendPurchaseWelcomeSMS(
          customer.name,
          customer.mobile,
          customer.id,
          formData.product_name,
          totalPrice,
          emiAmount,
          formData.tenure,
          firstDueDate.toLocaleDateString(),
          shopName
        );
      }

      setIsModalOpen(false);
      resetForm();
      fetchPurchases();
    } catch (error) {
      console.error('Error creating purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomerData])
        .select()
        .single();

      if (error) throw error;

      setCustomers([...customers, data]);
      setFormData({ ...formData, customer_id: data.id });
      setIsAddCustomerModalOpen(false);
      setNewCustomerData({ name: '', mobile: '' });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      product_name: '',
      total_price: '',
      down_payment: '',
      processing_fee: '',
      tds_amount: '',
      insurance_amount: '',
      documentation_charges: '',
      other_charges: '',
      tenure: 6,
      interest_rate: '',
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  const totalPrice = parseFloat(formData.total_price) || 0;
  const downPayment = parseFloat(formData.down_payment) || 0;
  const processingFee = parseFloat(formData.processing_fee) || 0;
  const tdsAmount = parseFloat(formData.tds_amount) || 0;
  const insuranceAmount = parseFloat(formData.insurance_amount) || 0;
  const documentationCharges = parseFloat(formData.documentation_charges) || 0;
  const otherCharges = parseFloat(formData.other_charges) || 0;
  
  const totalCharges = processingFee + tdsAmount + insuranceAmount + documentationCharges + otherCharges;
  const loanAmount = totalPrice - downPayment + totalCharges;
  const interestRate = parseFloat(formData.interest_rate) || defaultInterestRate;
  const emiAmount = loanAmount > 0 ? calculateEMI(loanAmount, interestRate, formData.tenure) : 0;
  const totalInterest = (emiAmount * formData.tenure) - loanAmount;
  const finalPrice = totalPrice + totalCharges + totalInterest;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Management</h1>
          <p className="text-gray-600">Manage customer purchases and EMI plans</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {/* Purchase List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : purchases.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No purchases found</p>
          </div>
        ) : (
          purchases.map((purchase) => (
            <Card key={purchase.id} hover>
              <CardHeader>
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">{purchase.product_name}</h3>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{purchase.customer?.name}</p>
                    <p className="text-sm text-gray-500">{purchase.customer?.mobile}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="font-semibold text-green-600">₹{purchase.total_price}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">EMI Amount</p>
                      <p className="font-semibold text-blue-600">₹{purchase.emi_amount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {purchase.tenure} months
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      purchase.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : purchase.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Purchase"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Customer *
            </label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsAddCustomerModalOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Customer
            </Button>
          </div>
          
          <select
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.mobile}
              </option>
            ))}
          </select>
          
          <Input
            label="Product Name *"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Price *"
              type="number"
              step="0.01"
              value={formData.total_price}
              onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
              required
            />
            <Input
              label="Down Payment"
              type="number"
              step="0.01"
              value={formData.down_payment}
              onChange={(e) => setFormData({ ...formData, down_payment: e.target.value })}
            />
          </div>
          
          {/* Additional Charges Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Additional Charges</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Processing Fee"
                type="number"
                step="0.01"
                value={formData.processing_fee}
                onChange={(e) => setFormData({ ...formData, processing_fee: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="TDS Amount"
                type="number"
                step="0.01"
                value={formData.tds_amount}
                onChange={(e) => setFormData({ ...formData, tds_amount: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Insurance Amount"
                type="number"
                step="0.01"
                value={formData.insurance_amount}
                onChange={(e) => setFormData({ ...formData, insurance_amount: e.target.value })}
                placeholder="0.00"
              />
              <Input
                label="Documentation Charges"
                type="number"
                step="0.01"
                value={formData.documentation_charges}
                onChange={(e) => setFormData({ ...formData, documentation_charges: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <Input
              label="Other Charges"
              type="number"
              step="0.01"
              value={formData.other_charges}
              onChange={(e) => setFormData({ ...formData, other_charges: e.target.value })}
              placeholder="0.00"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenure *
              </label>
              <select
                value={formData.tenure}
                onChange={(e) => setFormData({ ...formData, tenure: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={18}>18 months</option>
                <option value={24}>24 months</option>
              </select>
            </div>
            <Input
              label={`Interest Rate (Default: ${defaultInterestRate}%)`}
              type="number"
              step="0.01"
              value={formData.interest_rate}
              onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
              placeholder={defaultInterestRate.toString()}
            />
            <Input
              label="Start Date *"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          
          {/* EMI Preview */}
          {loanAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">EMI Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Product Price</p>
                  <p className="font-semibold text-blue-900">₹{totalPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Down Payment</p>
                  <p className="font-semibold text-blue-900">₹{downPayment.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Charges</p>
                  <p className="font-semibold text-orange-600">₹{totalCharges.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Loan Amount</p>
                  <p className="font-semibold text-blue-900">₹{loanAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700">Total Interest</p>
                  <p className="font-semibold text-purple-600">₹{totalInterest.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-blue-200">
                <div>
                  <p className="text-blue-700">Interest Rate</p>
                  <p className="font-semibold text-blue-900">{interestRate}% p.a.</p>
                </div>
                <div>
                  <p className="text-blue-700">EMI Amount</p>
                  <p className="font-semibold text-blue-900">₹{emiAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-700 font-bold">Final Price</p>
                  <p className="font-bold text-green-600 text-lg">₹{finalPrice.toFixed(2)}</p>
                </div>
              </div>
              {totalCharges > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600 mb-2">Charges Breakdown:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    {processingFee > 0 && <span>Processing: ₹{processingFee}</span>}
                    {tdsAmount > 0 && <span>TDS: ₹{tdsAmount}</span>}
                    {insuranceAmount > 0 && <span>Insurance: ₹{insuranceAmount}</span>}
                    {documentationCharges > 0 && <span>Documentation: ₹{documentationCharges}</span>}
                    {otherCharges > 0 && <span>Other: ₹{otherCharges}</span>}
                  </div>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-blue-200 bg-green-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-green-700">Total EMI Payments</p>
                    <p className="font-semibold text-green-900">₹{(emiAmount * formData.tenure).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-green-700">Customer Pays Total</p>
                    <p className="font-bold text-green-900 text-lg">₹{(downPayment + (emiAmount * formData.tenure)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Purchase
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};