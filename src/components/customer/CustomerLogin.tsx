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
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full shadow-lg">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Suresh Patel Kirana EMI</h1>
          <p className="text-white/80 mt-2">Customer Portal</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-white/70" />
              <h2 className="text-xl font-semibold text-white">Customer Login</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
              
              <Input
                label="Mobile Number"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your mobile number"
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                required
              />
              
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                loading={loading}
                disabled={!mobile || !password}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
              <p className="text-sm text-white/80">
                <strong>Note:</strong> Use the mobile number and password provided by the admin.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};