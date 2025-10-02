import React, { useState } from 'react';
import { customerLogin } from '../../lib/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { ShoppingBag, Lock } from 'lucide-react';

interface CustomerLoginProps {
  onLogin: () => void;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await customerLogin(mobile, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Suresh Patel Kirana EMI</h1>
          <p className="text-gray-600 mt-2">Customer Portal</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-semibold">Customer Login</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <Input
                label="Mobile Number"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your mobile number"
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={!mobile || !password}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Use the mobile number and password provided by the admin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};