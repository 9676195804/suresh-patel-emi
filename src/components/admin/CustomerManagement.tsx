import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Customer, Purchase, EMISchedule, Payment } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Plus, Search, CreditCard as Edit, Trash2, Phone, Eye, ShoppingCart, DollarSign } from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<{
    purchases: Purchase[];
    payments: Payment[];
    totalPaid: number;
    totalPending: number;
  }>({
    purchases: [],
    payments: [],
    totalPaid: 0,
    totalPending: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    mobile: '+91',
    password: '',
    aadhaar: '',
    pan: '',
    guarantor_name: '',
    guarantor_mobile: '',
    guarantor_address: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.mobile.trim()) {
        alert('Name and Mobile Number are required');
        return;
      }

      setLoading(true);

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', editingCustomer.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([formData]);
        
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert(`Error saving customer: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      aadhaar: customer.aadhaar || '',
      pan: customer.pan || '',
      guarantor_name: customer.guarantor_name || '',
      guarantor_mobile: customer.guarantor_mobile || '',
      guarantor_address: customer.guarantor_address || '',
      address: customer.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '+91',
      password: '',
      aadhaar: '',
      pan: '',
      guarantor_name: '',
      guarantor_mobile: '',
      guarantor_address: '',
      address: ''
    });
  };

  const handleViewDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoading(true);
    
    try {
      // Fetch customer purchases with EMI schedules
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          *,
          emi_schedules:emi_schedule(*)
        `)
        .eq('customer_id', customer.id);

      if (purchaseError) throw purchaseError;

      // Fetch customer payments
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id)
        .order('payment_date', { ascending: false });

      if (paymentError) throw paymentError;

      // Calculate totals
      let totalPaid = 0;
      let totalPending = 0;

      purchaseData?.forEach(purchase => {
        purchase.emi_schedules?.forEach((emi: any) => {
          if (emi.status === 'paid') {
            totalPaid += emi.total_amount + (emi.late_fee || 0);
          } else {
            totalPending += emi.total_amount;
          }
        });
      });

      setCustomerDetails({
        purchases: purchaseData || [],
        payments: paymentData || [],
        totalPaid,
        totalPending
      });

      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      alert('Error loading customer details');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    resetForm();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage your customers</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search customers by name or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {customer.mobile}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(customer)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {customer.aadhaar && (
                    <p><span className="text-gray-600">Aadhaar:</span> {customer.aadhaar}</p>
                  )}
                  {customer.pan && (
                    <p><span className="text-gray-600">PAN:</span> {customer.pan}</p>
                  )}
                  {customer.guarantor_name && (
                    <p><span className="text-gray-600">Guarantor:</span> {customer.guarantor_name}</p>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Added on {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Mobile Number *"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Aadhaar Number"
              value={formData.aadhaar}
              onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
            />
            <Input
              label="PAN Number"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
            />
          </div>
          
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Guarantor Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Guarantor Name"
                value={formData.guarantor_name}
                onChange={(e) => setFormData({ ...formData, guarantor_name: e.target.value })}
              />
              <Input
                label="Guarantor Mobile"
                value={formData.guarantor_mobile}
                onChange={(e) => setFormData({ ...formData, guarantor_mobile: e.target.value })}
              />
            </div>
            <Input
              label="Guarantor Address"
              value={formData.guarantor_address}
              onChange={(e) => setFormData({ ...formData, guarantor_address: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingCustomer ? 'Update' : 'Add'} Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Customer Details - ${selectedCustomer?.name}`}
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Mobile</p>
                <p className="font-medium">{selectedCustomer.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="font-semibold text-green-600">₹{customerDetails.totalPaid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="font-semibold text-orange-600">₹{customerDetails.totalPending}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="font-semibold">{customerDetails.purchases.length}</p>
              </div>
            </div>

            {/* Purchases */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Purchases
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {customerDetails.purchases.map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{purchase.product_name}</p>
                      <p className="text-sm text-gray-600">₹{purchase.total_price} - {purchase.tenure} months</p>
                    </div>
                    <Badge variant={purchase.status === 'active' ? 'success' : purchase.status === 'completed' ? 'default' : 'danger'}>
                      {purchase.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* EMI Schedules by Product */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                EMI Schedules by Product
              </h4>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {customerDetails.purchases.map((purchase) => (
                  <div key={purchase.id} className="border rounded-lg p-3">
                    <h5 className="font-medium text-gray-900 mb-2">{purchase.product_name}</h5>
                    <div className="space-y-1">
                      {(purchase as any).emi_schedules?.map((emi: any) => (
                        <div key={emi.id} className="flex justify-between items-center text-sm">
                          <span>EMI #{emi.installment_number} - {new Date(emi.due_date).toLocaleDateString()}</span>
                          <div className="flex items-center space-x-2">
                            <span>₹{emi.total_amount}</span>
                            <Badge variant={emi.status === 'paid' ? 'success' : emi.status === 'overdue' ? 'danger' : 'warning'} size="sm">
                              {emi.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payments */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Recent Payments
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {customerDetails.payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">₹{payment.amount_paid}</p>
                      <p className="text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-gray-500">{payment.payment_method}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};