import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repository } from '../../services/storageService';
import { FarmerProfile } from '../../types';
import { Sprout, MapPin, Star, ShieldCheck, ArrowRight, Package } from 'lucide-react';

export const FarmersPage: React.FC = () => {
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);

  useEffect(() => {
    const all = repository.getProfiles().filter((p) => p.role === 'farmer') as FarmerProfile[];
    setFarmers(all);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
          Verified Local Farmers
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Explore regional plantation estates and organic growers across Karnataka. Buy directly and support sustainable heritage farming.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farmers.map((farmer) => (
          <div
            key={farmer.id}
            className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={farmer.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop'}
                  alt={farmer.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-emerald-300 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 text-base">{farmer.name}</h3>
                    <span className="badge-verified text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 font-semibold">{farmer.farm_name}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{farmer.village_town}, {farmer.district}</span>
                  </p>
                </div>
              </div>

              {farmer.bio && (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {farmer.bio}
                </p>
              )}

              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Primary Crops:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(farmer.primary_crops || []).map((crop) => (
                    <span
                      key={crop}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{farmer.rating || 5.0}</span>
                <span className="text-[10px] text-gray-400">({farmer.reviews_count || 0} reviews)</span>
              </div>

              <Link
                to={`/farmer/${farmer.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
              >
                <span>Visit Farm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
