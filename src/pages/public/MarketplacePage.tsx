import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../lib/constants';
import { formatUnitPrice } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { Search, Filter, Star, CheckCircle2, Sprout, ArrowUpDown } from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOrganicOnly, setIsOrganicOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const prods = await productService.getProducts({
          search,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          isOrganic: isOrganicOnly ? true : undefined,
          sortBy,
        });
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [search, selectedCategory, isOrganicOnly, sortBy]);

  const handleAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault();
    addItem(prod, 1);
    setAddedId(prod.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            Direct Farmer Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Discover unpolished black pepper, dried arecanut, virgin coconut oil, and fresh harvest direct from Karnataka growers.
          </p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by produce name, variety, or farmer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-gray-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="newest">Sort: Newest Harvest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated Farmers</option>
            </select>
          </div>

          {/* Organic Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsOrganicOnly(!isOrganicOnly)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
              isOrganicOnly
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Organic Certified Only</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Produce
          </button>
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Produce Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-400">Loading fresh produce listings...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-300 max-w-md mx-auto space-y-3">
          <Sprout className="w-12 h-12 mx-auto text-emerald-600/40" />
          <h3 className="font-bold text-gray-900">No matching produce listed</h3>
          <p className="text-xs text-gray-500">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.is_organic && (
                    <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      Organic
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {product.village_town}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span className="truncate">{product.farmer_name}</span>
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {product.farmer_rating}
                    </span>
                  </div>

                  <Link to={`/product/${product.id}`} className="block">
                    <h4 className="font-bold text-gray-900 text-sm hover:text-emerald-800 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                  </Link>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="pt-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-extrabold text-emerald-950">
                        {formatUnitPrice(product.price, product.unit)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {product.quantity_available} {product.unit} left
                      </span>
                    </div>

                    {product.mandi_reference_price && (
                      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                        <span className="font-semibold text-emerald-900">Mandi: ₹{product.mandi_reference_price}/{product.unit}</span>
                        {product.price < product.mandi_reference_price ? (
                          <span className="text-emerald-700 font-bold">
                            ₹{product.mandi_reference_price - product.price} lower
                          </span>
                        ) : (
                          <span className="text-gray-500">Direct Farmgate</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 touch-target ${
                    addedId === product.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                  }`}
                >
                  {addedId === product.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <span>Add to Cart</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
