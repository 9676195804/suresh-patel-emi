import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { DashboardStats } from '../../types';
import {
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';

interface AdminDashboardProps {
  onViewChange: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewChange }) => {
  const [stats, setStats] = useState<DashboardStats>({
    total_customers: 0,
    active_loans: 0,
    overdue_payments: 0,
    total_outstanding: 0,
    monthly_collections: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured. Using demo data.');
        setStats({
          total_customers: 5,
          active_loans: 3,
          overdue_payments: 1,
          total_outstanding: 25000,
          monthly_collections: 15000
        });
        setLoading(false);
        return;
      }

      // Fetch total customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Fetch active loans
      const { count: activeLoansCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch overdue payments
      const { count: overdueCount } = await supabase
        .from('emi_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString().split('T')[0]);

      // Fetch total outstanding amount
      const { data: outstandingData } = await supabase
        .from('emi_schedule')
        .select('total_amount')
        .eq('status', 'pending');

      const totalOutstanding = outstandingData?.reduce((sum, item) => sum + item.total_amount, 0) || 0;

      // Fetch monthly collections
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount_paid')
        .gte('payment_date', currentMonthStart.toISOString().split('T')[0])
        .lt('payment_date', nextMonthStart.toISOString().split('T')[0]);

      const monthlyCollections = paymentsData?.reduce((sum, item) => sum + item.amount_paid, 0) || 0;

      setStats({
        total_customers: customersCount || 0,
        active_loans: activeLoansCount || 0,
        overdue_payments: overdueCount || 0,
        total_outstanding: totalOutstanding,
        monthly_collections: monthlyCollections
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReports = () => {
    // Implementation for exporting reports as CSV
    alert('Export functionality will be implemented');
  };

  const statsCards = [
    {
      title: 'Total Customers',
      value: stats.total_customers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Loans',
      value: stats.active_loans,
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Overdue Payments',
      value: stats.overdue_payments,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Outstanding Amount',
      value: `₹${stats.total_outstanding.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your EMI business</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportReports}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Reports
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} hover>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Collections */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold">This Month's Collections</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₹{stats.monthly_collections.toFixed(2)}
          </div>
          <p className="text-gray-600 mt-1">
            Total amount collected this month
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => onViewChange('customers')}
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">Add Customer</h4>
              <p className="text-sm text-gray-600">Add new customer to the system</p>
            </button>
            <button 
              onClick={() => onViewChange('purchases')}
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <CreditCard className="w-8 h-8 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">New Purchase</h4>
              <p className="text-sm text-gray-600">Create EMI for new purchase</p>
            </button>
            <button 
              onClick={() => onViewChange('payments')}
              className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
            >
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <h4 className="font-medium text-gray-900">Mark Payment</h4>
              <p className="text-sm text-gray-600">Record EMI payment</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};