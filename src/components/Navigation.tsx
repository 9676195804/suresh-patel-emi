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
  ShoppingBag 
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
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const customerMenuItems = [
    { id: 'dashboard', label: 'My EMIs', icon: LayoutDashboard }
  ];

  const menuItems = userType === 'admin' ? adminMenuItems : customerMenuItems;
  const user = userType === 'admin' ? getAdminUser() : getCustomerUser();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
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
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-gray-50">
        <div className="px-4 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
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