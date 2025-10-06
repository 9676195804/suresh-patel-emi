import React, { useState, useEffect } from 'react';
import { getAdminUser, getCustomerUser } from './lib/auth';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerManagement } from './components/admin/CustomerManagement';
import { PurchaseManagement } from './components/admin/PurchaseManagement';
import { PaymentManagement } from './components/admin/PaymentManagement';
import { Settings } from './components/admin/Settings';
import { SMSLogs } from './components/admin/SMSLogs';
import { CustomerLogin } from './components/customer/CustomerLogin';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { Navigation } from './components/Navigation';

function App() {
  const [adminUser, setAdminUser] = useState(getAdminUser());
  const [customerUser, setCustomerUser] = useState(getCustomerUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [userType, setUserType] = useState<'admin' | 'customer' | null>(null);

  useEffect(() => {
    if (adminUser) {
      setUserType('admin');
    } else if (customerUser) {
      setUserType('customer');
    } else {
      setUserType(null);
    }
  }, [adminUser, customerUser]);

  const handleAdminLogin = () => {
    setAdminUser(getAdminUser());
  };

  const handleCustomerLogin = () => {
    setCustomerUser(getCustomerUser());
  };

  // Show login selection if no user is logged in
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Suresh Patel Kirana EMI
            </h1>
            <p className="text-gray-600">Choose your portal</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setUserType('admin')}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-3 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admin Portal</h3>
                  <p className="text-sm text-gray-500">Manage customers, purchases & EMIs</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setUserType('customer')}
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-3 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Customer Portal</h3>
                  <p className="text-sm text-gray-500">View your EMI schedule & payments</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show admin login if admin portal selected but not logged in
  if (userType === 'admin' && !adminUser) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  // Show customer login if customer portal selected but not logged in
  if (userType === 'customer' && !customerUser) {
    return <CustomerLogin onLogin={handleCustomerLogin} />;
  }

  // Main application layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        userType={userType}
      />
      
      <main className="max-w-7xl mx-auto">
        {userType === 'admin' ? (
          <>
            {currentView === 'dashboard' && <AdminDashboard onViewChange={setCurrentView} />}
            {currentView === 'customers' && <CustomerManagement />}
            {currentView === 'purchases' && <PurchaseManagement />}
            {currentView === 'payments' && <PaymentManagement />}
            {currentView === 'settings' && <Settings />}
            {currentView === 'sms-logs' && <SMSLogs />}
          </>
        ) : (
          <CustomerDashboard />
        )}
      </main>
    </div>
  );
}

export default App;