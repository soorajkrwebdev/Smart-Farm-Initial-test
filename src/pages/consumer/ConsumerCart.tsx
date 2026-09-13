import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { formatINR, formatUnitPrice } from '../../lib/utils';
import { 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  ShieldCheck, 
  Store, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ConsumerCart: React.FC = () => {
  const { items, farmerGroups, updateQuantity, removeItem, clearCart, totalAmount, totalCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'farmer_delivery'>('farmer_delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.village_town ? `Kadri Hills, ${user.village_town}, ${user.district}` : 'Kadri Hills, Mangaluru, Dakshina Kannada'
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'pay_on_pickup'>('cash_on_delivery');
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string[] | null>(null);

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          Explore farmgate produce direct from verified Karnataka growers and add fresh items to your cart.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors"
        >
          <span>Browse Marketplace</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user) {
      alert('Please log in or select a demo user before completing checkout.');
      return;
    }

    setIsPlacing(true);
    const createdOrderNumbers: string[] = [];

    try {
      // Create an order for each distinct farmer group (Specification #16: Multi-farmer checkout grouping)
      for (const group of farmerGroups) {
        const orderItems = group.items.map((i) => ({
          id: `item-${Date.now()}-${Math.random()}`,
          order_id: '',
          product_id: i.product.id,
          product_name_snapshot: i.product.name,
          unit_price_snapshot: i.unit_price,
          quantity: i.quantity,
          unit: i.product.unit,
          total_price: i.unit_price * i.quantity,
        }));

        const newOrder = await orderService.createOrder({
          consumer_id: user.id,
          consumer_name: user.name,
          consumer_phone: user.phone,
          farmer_id: group.farmerId,
          farmer_name: group.farmerName,
          farmer_phone: '+91 98450 12345',
          total_amount: group.subtotal,
          status: 'pending',
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: 'pending',
          items: orderItems,
        });

        createdOrderNumbers.push(newOrder.order_number);
      }

      // Celebrate checkout!
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      clearCart();
      setOrderSuccess(createdOrderNumbers);
    } catch (e: any) {
      console.error('Checkout failed:', e);
      alert('Order placement error: ' + e.message);
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {orderSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-200 text-center shadow-lg space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Orders Placed Successfully!</h2>
          <p className="text-xs text-gray-600">
            Your orders have been transmitted directly to the respective farmer estates:
          </p>
          <div className="space-y-1.5 py-2">
            {orderSuccess.map((no) => (
              <div key={no} className="p-2 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-950">
                Order ID: {no}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500">
            Payment Method: <strong>{paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Pay on Pickup'}</strong>. The farmer will confirm status changes directly.
          </p>
          <div className="pt-3 flex items-center justify-center gap-3">
            <Link
              to="/consumer/orders"
              className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs"
            >
              Track Orders
            </Link>
            <Link
              to="/marketplace"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              Shopping Cart ({totalCount} items)
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Direct-from-farm produce. Products from different farmers are bundled individually for transparent fulfillment.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Grouped Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              {farmerGroups.map((group) => (
                <div
                  key={group.farmerId}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs"
                >
                  {/* Farmer Header */}
                  <div className="bg-emerald-50/70 p-4 border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-800" />
                      <span className="text-xs font-bold text-emerald-950">
                        Farmer: {group.farmerName}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-900">
                      Subtotal: {formatINR(group.subtotal)}
                    </span>
                  </div>

                  {/* Items in this farm */}
                  <div className="p-4 divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center gap-4 first:pt-0 last:pb-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatUnitPrice(item.unit_price, item.product.unit)}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50 text-xs">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2 font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="px-2 py-0.5 text-gray-600 hover:bg-gray-200 font-bold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium">
                              Total: {formatINR(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Checkout Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
                <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
                  Order Summary
                </h3>

                {/* Delivery Option */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Delivery / Collection Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('farmer_delivery')}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-colors ${
                        deliveryType === 'farmer_delivery'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      <Truck className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                      <span>Farmgate Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2.5 rounded-xl border text-center font-medium transition-colors ${
                        deliveryType === 'pickup'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      <Store className="w-4 h-4 mx-auto mb-1 text-emerald-700" />
                      <span>Self Pickup</span>
                    </button>
                  </div>
                </div>

                {/* Address */}
                {deliveryType === 'farmer_delivery' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Payment Option */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => setPaymentMethod('cash_on_delivery')}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-gray-800">Cash on Delivery (COD)</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'pay_on_pickup'}
                        onChange={() => setPaymentMethod('pay_on_pickup')}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-gray-800">Pay on Farm Pickup</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-gray-400" />
                    <span>UPI / Online payment gateway architecture ready for phase 2.</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Produce Subtotal:</span>
                    <span>{formatINR(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee:</span>
                    <span className="text-emerald-700 font-bold">FREE (Direct Farm)</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-gray-950 pt-2 border-t border-gray-100">
                    <span>Total Amount:</span>
                    <span>{formatINR(totalAmount)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isPlacing}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer touch-target"
                >
                  {isPlacing ? (
                    <span>Placing orders...</span>
                  ) : (
                    <>
                      <span>Place Orders ({formatINR(totalAmount)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
