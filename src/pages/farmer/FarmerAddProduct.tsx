import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { marketPriceService } from '../../services/marketPriceService';
import { PRODUCT_CATEGORIES, AGRICULTURAL_UNITS } from '../../lib/constants';
import { formatINR } from '../../lib/utils';
import { 
  Camera, 
  Upload, 
  Sprout, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Info,
  X
} from 'lucide-react';

export const FarmerAddProduct: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(PRODUCT_CATEGORIES[0].id);
  const [variety, setVariety] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState<any>('kg');
  const [quantity, setQuantity] = useState('');
  const [minOrder, setMinOrder] = useState('1');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [isOrganic, setIsOrganic] = useState(true);
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop'
  ]);
  const [mandiRef, setMandiRef] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When produce name changes, check for live mandi reference
  const handleNameBlur = async () => {
    if (name.trim()) {
      const ref = await marketPriceService.getReferenceForProduct(name);
      if (ref) {
        setMandiRef(ref.modal_price);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const url = await productService.uploadProductImage(file);
        setImages((prev) => [url, ...prev]);
      } catch (err) {
        console.error('Image upload error:', err);
      }
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsPublishing(true);
    try {
      await productService.saveProduct({
        farmer_id: user.id,
        category_id: categoryId,
        name,
        variety,
        description: description || `Freshly harvested ${name} from ${user.village_town || 'Sullia'}.`,
        price: Number(price),
        unit,
        quantity_available: Number(quantity),
        min_order_quantity: Number(minOrder),
        harvest_date: harvestDate,
        quality_grade: qualityGrade,
        is_organic: isOrganic,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop'],
        status: 'active',
        village_town: user.village_town || 'Sullia',
        district: user.district || 'Dakshina Kannada',
        state: user.state || 'Karnataka',
      });

      navigate('/farmer/products');
    } catch (e: any) {
      alert('Error listing produce: ' + e.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Add Fresh Produce Listing</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Fast, image-first listing designed for smartphones and touchscreens.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        {/* Photo Upload Section */}
        <div>
          <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
            Produce Photos
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                <img src={img} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <label className="aspect-square rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-3 text-center">
              <Camera className="w-6 h-6 text-emerald-700 mb-1" />
              <span className="text-xs font-bold text-emerald-900">Upload Photo</span>
              <span className="text-[10px] text-emerald-700/70">From mobile or gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Produce Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Malabar Black Pepper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameBlur}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Variety / Cultivar (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Panniyur-1 / Mangala"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Quality Grade</label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              <option value="Grade A">Grade A (Premium Bold)</option>
              <option value="Grade B">Grade B (Standard Market)</option>
              <option value="Export Quality">Export Quality</option>
              <option value="Organic Certified">Organic Certified</option>
            </select>
          </div>
        </div>

        {/* Pricing & Mandi Benchmark Comparison */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Your Selling Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="550"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Pricing Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full p-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {AGRICULTURAL_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mandi Benchmark Helper */}
          {mandiRef ? (
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>APMC Mandi Modal Benchmark: <strong>₹{mandiRef}/{unit}</strong></span>
              </span>
              {price && Number(price) <= mandiRef ? (
                <span className="text-emerald-700 font-bold">✓ Highly Competitive Price</span>
              ) : (
                <span className="text-amber-800 font-medium">Premium Estate Direct</span>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-gray-400" />
              <span>Type your produce name to see the latest APMC mandi reference price.</span>
            </p>
          )}
        </div>

        {/* Quantities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Available Quantity ({unit}) *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 150"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Minimum Order ({unit})
            </label>
            <input
              type="number"
              min="1"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Harvest Date & Organic Checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Harvest Date</label>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <input
                type="checkbox"
                checked={isOrganic}
                onChange={(e) => setIsOrganic(e.target.checked)}
                className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600"
              />
              <span className="text-xs font-bold text-emerald-950">
                🌱 100% Organic & Chemical-Free
              </span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Description & Quality Notes
          </label>
          <textarea
            rows={3}
            placeholder="Mention sun-drying method, aroma, moisture levels, or storage conditions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPublishing}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer touch-target"
        >
          {isPublishing ? (
            <span>Publishing produce...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Produce to Marketplace</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
