import React from 'react';
import { adminLogout, customerLogout, getAdminUser, getCustomerUser } from '../lib/auth';
import { Button } from './ui/Button';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  DollarSign,
  Settings,
  LogOut,
  ShoppingBag,
  MessageSquare
} from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userType: 'admin' | 'customer';
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  userType
}) => {
  const handleLogout = () => {
    if (userType === 'admin') {
      adminLogout();
    } else {
      customerLogout();
    }
    window.location.reload();
  };

  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'sms-logs', label: 'SMS Logs', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const customerMenuItems = [
    { id: 'dashboard', label: 'My EMIs', icon: LayoutDashboard }
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : customerMenuItems;
  const user = userType === 'admin' ? getAdminUser() : getCustomerUser();

  return (
    <div className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Suresh Patel Kirana EMI
                </h1>
                <p className="text-xs text-gray-500">
                  {userType === 'admin' ? 'Admin Portal' : 'Customer Portal'}
                </p>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {userType === 'admin' ? user?.username : user?.name}
              </p>
              <p className="text-xs text-gray-500">
                {userType === 'customer' && user?.mobile}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout} className="hover:scale-105 transition-transform">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-gray-50/80 backdrop-blur-lg">
        <div className="px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};