import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MessageSquare, RefreshCw, Search, Filter } from 'lucide-react';

interface SMSLog {
  id: string;
  customer_id: string | null;
  mobile: string;
  message: string;
  sms_type: string;
  status: string;
  response: string;
  created_at: string;
}

export const SMSLogs: React.FC = () => {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<SMSLog | null>(null);

  useEffect(() => {
    fetchLogs();

    // Set up real-time subscription
    const subscription = supabase
      .channel('sms_logs_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sms_logs' },
        (payload) => {
          console.log('SMS log change received:', payload);
          fetchLogs(); // Refresh logs when changes occur
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [filter]); // Re-subscribe when filter changes

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.mobile.includes(searchTerm) ||
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.sms_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success">Sent</Badge>;
      case 'failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'test':
        return 'bg-purple-100 text-purple-800';
      case 'purchase_welcome':
        return 'bg-blue-100 text-blue-800';
      case 'payment_confirmation':
        return 'bg-green-100 text-green-800';
      case 'payment_reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue_notice':
        return 'bg-red-100 text-red-800';
      case 'noc':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseResponse = (responseStr: string) => {
    try {
      return JSON.parse(responseStr);
    } catch {
      return responseStr;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Logs</h1>
          <p className="text-gray-600">Monitor and debug SMS messages</p>
        </div>
        <Button onClick={fetchLogs} loading={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by mobile, message, or type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('sent')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'sent'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'failed'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Failed
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No SMS logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(log.sms_type)}`}>
                        {log.sms_type.replace('_', ' ')}
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      To: {log.mobile}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">SMS Log Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(selectedLog.sms_type)}`}>
                  {selectedLog.sms_type.replace('_', ' ')}
                </span>
                {getStatusBadge(selectedLog.status)}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Timestamp</label>
                <p className="mt-1 text-gray-900">{formatDate(selectedLog.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                <p className="mt-1 text-gray-900 font-mono">{selectedLog.mobile}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">{selectedLog.message}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">API Response</label>
                <pre className="mt-1 text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                  {JSON.stringify(parseResponse(selectedLog.response), null, 2)}
                </pre>
              </div>
              {selectedLog.customer_id && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Customer ID</label>
                  <p className="mt-1 text-gray-900 font-mono text-sm">{selectedLog.customer_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
