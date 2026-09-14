import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { Order } from '../../types';
import { formatINR, formatDate } from '../../lib/utils';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, Star, MessageSquare } from 'lucide-react';

export const ConsumerOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      if (user) {
        const data = await orderService.getOrders({ consumerId: user.id });
        setOrders(data);
      }
      setIsLoading(false);
    }
    load();
  }, [user]);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'accepted':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">Accepted by Farmer</span>;
      case 'preparing':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">Harvesting / Packing</span>;
      case 'ready_for_pickup':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">Ready for Pickup</span>;
      case 'out_for_delivery':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">Out for Delivery</span>;
      case 'completed':
        return <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-full">Delivered & Complete</span>;
      case 'cancelled':
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full capitalize">{status}</span>;
      default:
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-full">Pending Farmer Approval</span>;
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder || !user) return;

    await productService.addReview({
      order_id: reviewOrder.id,
      reviewer_id: user.id,
      reviewer_name: user.name,
      target_id: reviewOrder.farmer_id,
      rating,
      comment,
    });

    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewOrder(null);
      setComment('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">My Farm Produce Orders</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Track harvest preparation, farmgate dispatch, and review your purchases.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-200 text-gray-500 space-y-2">
          <Package className="w-10 h-10 mx-auto text-gray-400" />
          <p className="font-bold text-gray-800">You haven't placed any orders yet.</p>
          <p className="text-xs">Explore fresh produce in the marketplace to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">{order.order_number}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Farmer: <strong>{order.farmer_name}</strong> • Placed on {formatDate(order.created_at)}
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
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-gray-700">
                      <strong>{item.quantity} {item.unit}</strong> × {item.product_name_snapshot}
                    </span>
                    <span className="font-semibold text-gray-900">{formatINR(item.total_price)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Address & Review Button */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-gray-500">
                  <span>Method: <strong>{order.delivery_type === 'farmer_delivery' ? 'Direct Farmgate Delivery' : 'Self Pickup'}</strong></span>
                  {order.delivery_address && (
                    <span className="block text-[11px] text-gray-400">{order.delivery_address}</span>
                  )}
                </div>

                {order.status === 'completed' && (
                  <button
                    onClick={() => setReviewOrder(order)}
                    className="px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Rate Farmer Produce</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">
              Review Farmer {reviewOrder.farmer_name}
            </h3>
            <p className="text-xs text-gray-500">
              Share your honest feedback on produce quality, packaging, and delivery.
            </p>

            {reviewSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-center font-bold text-xs">
                Thank you! Your verified review has been published.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rating (1 to 5 Stars)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-2 rounded-xl border ${rating >= s ? 'bg-amber-100 border-amber-400 text-amber-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Comment</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe produce aroma, freshness, grading..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewOrder(null)}
                    className="px-4 py-2 text-xs text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
