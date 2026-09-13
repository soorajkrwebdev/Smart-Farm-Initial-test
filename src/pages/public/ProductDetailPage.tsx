import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { formatUnitPrice, formatINR, formatDate } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { 
  Sprout, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  ShoppingCart, 
  CheckCircle2, 
  MessageCircle, 
  Phone,
  Info
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImg, setSelectedImg] = useState<number>(0);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    async function load() {
      if (id) {
        const prod = await productService.getProductById(id);
        if (prod) {
          setProduct(prod);
          setQuantity(prod.min_order_quantity || 1);
        }
      }
    }
    load();
  }, [id]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading product details...
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const priceDiff = product.mandi_reference_price ? product.mandi_reference_price - product.price : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5">
        <Link to="/" className="hover:text-emerald-800">Home</Link>
        <span>/</span>
        <Link to="/marketplace" className="hover:text-emerald-800">Marketplace</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-4/3 rounded-3xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-xs relative">
            <img
              src={product.images[selectedImg] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_organic && (
              <span className="absolute top-4 left-4 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                🌱 100% Organic Farmgate
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImg === idx ? 'border-emerald-700 ring-2 ring-emerald-500/20' : 'border-gray-200 opacity-70'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Produce Specs & Checkout */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {product.category_name || 'Agri Produce'}
              </span>
              {product.quality_grade && (
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                  Grade: {product.quality_grade}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-snug">
              {product.name}
            </h1>

            {product.variety && (
              <p className="text-xs text-emerald-900 font-semibold mt-1">
                Variety: {product.variety}
              </p>
            )}
          </div>

          {/* Farmer Card */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-lg">
                👨‍🌾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{product.farmer_name}</h4>
                  <span className="badge-verified text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Verified Farm</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{product.village_town}, {product.district}</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{product.farmer_rating || 4.9}</span>
                  </span>
                </div>
              </div>
            </div>

            <Link
              to={`/farmer/${product.farmer_id}`}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
            >
              View Farm
            </Link>
          </div>

          {/* Price & Mandi Benchmark Comparison */}
          <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-gray-500 font-semibold block">Farmer Direct Price</span>
                <span className="text-3xl font-black text-emerald-950">
                  {formatUnitPrice(product.price, product.unit)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-semibold block">Availability</span>
                <span className="text-sm font-bold text-emerald-800">
                  {product.quantity_available} {product.unit} in stock
                </span>
              </div>
            </div>

            {product.mandi_reference_price && (
              <div className="p-3 bg-white rounded-xl border border-emerald-100 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-700 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>Mandi Reference Price:</span>
                  </span>
                  <span className="text-gray-900">₹{product.mandi_reference_price}/{product.unit}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-gray-100">
                  <span>Farmer Margin Comparison:</span>
                  <span>
                    {priceDiff > 0 ? `₹${priceDiff}/${product.unit} lower than APMC mandi` : 'Direct farmgate parity'}
                  </span>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-500 leading-normal flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
              <span>Reference prices are sourced from available open market bulletins and may differ by market, grade, moisture content, and auction date.</span>
            </p>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity ({product.unit})
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(product.min_order_quantity || 1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={product.min_order_quantity || 1}
                    max={product.quantity_available}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(product.quantity_available, Math.max(1, Number(e.target.value))))}
                    className="w-16 text-center font-bold text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex-1 pt-5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added to Your Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart ({formatINR(product.price * quantity)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/919845012345?text=Hello%20Farmer%20${encodeURIComponent(product.farmer_name || '')},%20I%20am%20interested%20in%20your%20listing:%20${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors text-xs font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>WhatsApp Farmer</span>
              </a>
              <a
                href="tel:+919845012345"
                className="py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Contact</span>
              </a>
            </div>
          </div>

          {/* Description & Harvest Metadata */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h3 className="text-sm font-bold text-gray-900">About this Harvest</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {product.harvest_date && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>Harvest Date: <strong>{formatDate(product.harvest_date)}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
