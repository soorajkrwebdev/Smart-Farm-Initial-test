import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Phone, 
  Clock, 
  PackageCheck 
} from 'lucide-react';

export const FarmerOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    if (user) {
      const data = await orderService.getOrders({ farmerId: user.id });
      setOrders(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await orderService.updateOrderStatus(orderId, status);
    loadOrders();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Customer Order Board</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Accept new incoming orders, update harvest packing status, and confirm direct farmgate deliveries.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading incoming orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-300 space-y-2 max-w-md mx-auto">
          <ClipboardList className="w-10 h-10 mx-auto text-gray-400" />
          <p className="font-bold text-gray-800">No orders received yet.</p>
          <p className="text-xs text-gray-500">Orders from consumers will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">{order.order_number}</span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer: <strong>{order.consumer_name}</strong> • Placed: {formatDate(order.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-emerald-950">{formatINR(order.total_amount)}</span>
                  <span className="text-[10px] text-gray-400 block capitalize">
                    {order.payment_method.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span>
                      <strong>{item.quantity} {item.unit}</strong> × {item.product_name_snapshot}
                    </span>
                    <span className="font-semibold text-gray-900">{formatINR(item.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span>Method: <strong>{order.delivery_type === 'farmer_delivery' ? 'Direct Farmgate Delivery' : 'Self Pickup'}</strong></span>
                  {order.delivery_address && (
                    <span className="block text-[11px] text-gray-500">{order.delivery_address}</span>
                  )}
                </div>

                {order.consumer_phone && (
                  <a
                    href={`tel:${order.consumer_phone}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer ({order.consumer_phone})</span>
                  </a>
                )}
              </div>

              {/* Order Stage Progression Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'accepted')}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Order</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'rejected')}
                      className="px-4 py-2 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'preparing')}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Mark as Harvesting / Packing</span>
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, order.delivery_type === 'farmer_delivery' ? 'out_for_delivery' : 'ready_for_pickup')}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {order.delivery_type === 'farmer_delivery' ? 'Dispatch for Delivery' : 'Mark Ready for Pickup'}
                    </span>
                  </button>
                )}

                {(order.status === 'out_for_delivery' || order.status === 'ready_for_pickup') && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'completed')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Mark Delivered & Complete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
