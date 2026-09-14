import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { productService } from '../../services/productService';
import { FarmerProfile, Product, Review } from '../../types';
import { formatUnitPrice } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Phone, 
  MessageCircle, 
  Package, 
  CheckCircle2, 
  Calendar,
  Check 
} from 'lucide-react';

export const FarmerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        setLoading(true);
        const p = await authService.getFarmerProfile(id);
        if (p) setFarmer(p);
        const prods = await productService.getProducts({ farmerId: id });
        setProducts(prods.filter((prod) => prod.status === 'active'));
        const revs = await productService.getReviews(id);
        setReviews(revs);
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading && !farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading farmer profile...
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        Farmer profile not found.
      </div>
    );
  }

  const handleAddToCart = (prod: Product) => {
    addItem(prod, 1);
    setAddedId(prod.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <img
              src={farmer.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop'}
              alt={farmer.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{farmer.name}</h1>
                <span className="bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>FPO Verified</span>
                </span>
              </div>
              <p className="text-sm text-emerald-200 font-semibold">{farmer.farm_name}</p>
              <p className="text-xs text-emerald-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{farmer.village_town}, {farmer.district}, Karnataka • {farmer.farm_size_acres} Acres Estate</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+919845012345"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Farmer</span>
            </a>
            <a
              href="https://wa.me/919845012345"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {farmer.bio && (
          <div className="mt-6 pt-4 border-t border-emerald-800/60 text-xs text-emerald-100/90 leading-relaxed max-w-3xl">
            {farmer.bio}
          </div>
        )}
      </div>

      {/* Available Produce */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Available Harvest ({products.length})</h2>
          <span className="text-xs text-gray-500">Direct from farmgate</span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-gray-200 text-xs text-gray-500">
            No active produce listed right now. Check back during upcoming harvest cycles.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <img src={prod.images[0]} alt={prod.name} className="w-full h-44 object-cover" />
                  <div className="p-4 space-y-2">
                    <Link to={`/product/${prod.id}`}>
                      <h4 className="font-bold text-gray-900 text-sm hover:text-emerald-800">
                        {prod.name}
                      </h4>
                    </Link>
                    <p className="text-xs text-gray-500 line-clamp-2">{prod.description}</p>
                    <div className="pt-2 flex items-baseline justify-between">
                      <span className="text-lg font-black text-emerald-950">
                        {formatUnitPrice(prod.price, prod.unit)}
                      </span>
                      <span className="text-[10px] text-gray-400">{prod.quantity_available} {prod.unit} left</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleAddToCart(prod)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      addedId === prod.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    }`}
                  >
                    {addedId === prod.id ? 'Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Reviews Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">Customer Verified Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-xs text-gray-500">No verified reviews submitted yet.</p>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-white border border-gray-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{r.reviewer_name}</span>
                  <div className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{r.rating} / 5</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
