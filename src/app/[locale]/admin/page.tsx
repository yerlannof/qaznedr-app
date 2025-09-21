'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card-new';
import {
  BarChart3,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Activity,
  Shield,
  Settings,
  Database,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeListings: number;
  totalTransactions: number;
  revenue: number;
  pendingVerifications: number;
  reportedListings: number;
  newUsersToday: number;
  transactionsToday: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeListings: 0,
    totalTransactions: 0,
    revenue: 0,
    pendingVerifications: 0,
    reportedListings: 0,
    newUsersToday: 0,
    transactionsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
    loadDashboardStats();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        users,
        listings,
        transactions,
        pendingVerifications,
        reportedListings,
        newUsersToday,
        transactionsToday,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase
          .from('kazakhstan_deposits')
          .select('id', { count: 'exact' })
          .eq('status', 'ACTIVE'),
        supabase.from('transactions').select('id, amount', { count: 'exact' }),
        supabase
          .from('verification_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('reported_listings')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .gte(
            'created_at',
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          ),
        supabase
          .from('transactions')
          .select('id', { count: 'exact' })
          .gte(
            'created_at',
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          ),
      ]);

      // Calculate total revenue
      const totalRevenue =
        transactions.data?.reduce(
          (sum: number, t: any) => sum + (t.platform_fee || 0),
          0
        ) || 0;

      setStats({
        totalUsers: users.count || 0,
        activeListings: listings.count || 0,
        totalTransactions: transactions.count || 0,
        revenue: totalRevenue,
        pendingVerifications: pendingVerifications.count || 0,
        reportedListings: reportedListings.count || 0,
        newUsersToday: newUsersToday.count || 0,
        transactionsToday: transactionsToday.count || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalUsers.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2">
                +{stats.newUsersToday} today
              </p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold mt-1">
                {stats.activeListings.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-2">Available now</p>
            </div>
            <FileText className="w-10 h-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold mt-1">
                ₸{stats.revenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-2">
                {stats.transactionsToday} sales today
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Actions</p>
              <p className="text-2xl font-bold mt-1">
                {(
                  stats.pendingVerifications + stats.reportedListings
                ).toLocaleString()}
              </p>
              <p className="text-sm text-orange-600 mt-2">Requires attention</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="w-6 h-6 text-blue-500 mb-2" />
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-gray-600">
                View and manage user accounts
              </p>
            </button>

            <button
              onClick={() => router.push('/admin/listings')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-green-500 mb-2" />
              <p className="font-medium">Manage Listings</p>
              <p className="text-sm text-gray-600">
                Review and moderate listings
              </p>
            </button>

            <button
              onClick={() => router.push('/admin/verifications')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Shield className="w-6 h-6 text-purple-500 mb-2" />
              <p className="font-medium">Verifications</p>
              <p className="text-sm text-gray-600">
                {stats.pendingVerifications} pending
              </p>
            </button>

            <button
              onClick={() => router.push('/admin/reports')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
              <p className="font-medium">Reports</p>
              <p className="text-sm text-gray-600">
                {stats.reportedListings} to review
              </p>
            </button>

            <button
              onClick={() => router.push('/admin/analytics')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <BarChart3 className="w-6 h-6 text-indigo-500 mb-2" />
              <p className="font-medium">Analytics</p>
              <p className="text-sm text-gray-600">View detailed statistics</p>
            </button>

            <button
              onClick={() => router.push('/admin/settings')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="w-6 h-6 text-gray-500 mb-2" />
              <p className="font-medium">Settings</p>
              <p className="text-sm text-gray-600">Platform configuration</p>
            </button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Database</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">API</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Payments</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm">CDN</span>
              </div>
              <span className="text-sm text-yellow-600">High traffic</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">WebSocket</span>
              </div>
              <span className="text-sm text-green-600">Connected</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Database Usage</span>
              <span className="text-sm font-medium">42%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: '42%' }}
              ></div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Storage Usage</span>
              <span className="text-sm font-medium">68%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: '68%' }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3 text-sm font-medium text-gray-600">
                  Transaction ID
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-600">
                  Listing
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-600">
                  Amount
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left pb-3 text-sm font-medium text-gray-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Sample data - would be fetched from database */}
              <tr className="border-b">
                <td className="py-3 text-sm">#TXN-001</td>
                <td className="py-3 text-sm">Gold Mining License - Aktobe</td>
                <td className="py-3 text-sm">₸15,000,000</td>
                <td className="py-3">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Completed
                  </span>
                </td>
                <td className="py-3 text-sm text-gray-600">2 hours ago</td>
              </tr>
              {/* Add more rows as needed */}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
