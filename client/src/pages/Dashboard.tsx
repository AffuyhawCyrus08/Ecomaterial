import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';

interface OrderSummary {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  itemCount: number;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.firstName || user?.name || 'User';

  const { data: orders = [] } = useQuery<OrderSummary[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await api.get('/orders/me');

      return response.data.map((order: any) => ({
        id: Number(order.order_id ?? order.id),
        status: order.status,
        total_amount: Number(order.total_amount),
        created_at: order.order_date ?? order.created_at,
        itemCount: Number(order.item_count ?? 0),
      }));
    },
  });

  const stats: UserStats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.total_amount, 0),
    pendingOrders: orders.filter((order) => order.status === 'pending' || order.status === 'processing').length,
  };

  const recentOrders = orders.slice(0, 5);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      processing: 'bg-blue-500/20 text-blue-500',
      shipped: 'bg-purple-500/20 text-purple-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500',
    };

    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, {displayName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#13ec80]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#13ec80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending Orders</p>
                <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a2e] rounded-xl border border-white/10">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
                <Link to="/orders" className="text-[#13ec80] hover:underline text-sm">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-white/10">
                {recentOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-400">No orders yet</p>
                    <Link to="/products" className="inline-block mt-4 text-[#13ec80] hover:underline">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to="/orders"
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-white">Order #{order.id}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()} • {order.itemCount} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{formatCurrency(order.total_amount)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/products"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#0a0a0a]/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-[#13ec80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-300">Browse Materials</span>
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#0a0a0a]/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-[#13ec80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-gray-300">View Cart</span>
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0a] hover:bg-[#0a0a0a]/50 transition-colors"
                >
                  <svg className="w-5 h-5 text-[#13ec80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-gray-300">Order History</span>
                </Link>
              </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#13ec80] rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">{displayName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-white">{displayName}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className="text-white capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
