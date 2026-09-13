import React, { useState, useEffect } from 'react';
import { repository } from '../../services/storageService';
import { Order } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { ClipboardList, Package } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setOrders(repository.getOrders());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Ecosystem Order Transactions</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Platform-wide view of farmer-to-consumer order lifecycles, payment modes, and delivery fulfillments.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Farmer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-4 font-bold text-gray-900">{o.order_number}</td>
                  <td className="p-4 text-gray-700">{o.consumer_name}</td>
                  <td className="p-4 text-emerald-800 font-semibold">{o.farmer_name}</td>
                  <td className="p-4 font-black text-gray-950">{formatINR(o.total_amount)}</td>
                  <td className="p-4 text-gray-500 capitalize">{o.payment_method.replace(/_/g, ' ')}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-900">
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 whitespace-nowrap">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
