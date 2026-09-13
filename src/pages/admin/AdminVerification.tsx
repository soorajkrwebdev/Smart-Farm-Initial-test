import React, { useState, useEffect } from 'react';
import { repository } from '../../services/storageService';
import { FarmerProfile } from '../../types';
import { ShieldCheck, CheckCircle2, XCircle, MapPin, Award } from 'lucide-react';

export const AdminVerification: React.FC = () => {
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);

  const loadFarmers = () => {
    const list = repository.getProfiles().filter((p) => p.role === 'farmer') as FarmerProfile[];
    setFarmers(list);
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const handleVerify = (farmerId: string, status: FarmerProfile['verification_status']) => {
    const farmer = farmers.find((f) => f.id === farmerId);
    if (farmer) {
      repository.saveProfile({ ...farmer, verification_status: status });
      loadFarmers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Farmer Verification & KYC Queue</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Verify landholding claims, FPO registration numbers, and organic certification badges.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Farmer Profile</th>
                <th className="p-4">Location</th>
                <th className="p-4">Acreage & Crops</th>
                <th className="p-4">FPO / Organic Status</th>
                <th className="p-4">Current Badge</th>
                <th className="p-4 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {farmers.map((farmer) => (
                <tr key={farmer.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={farmer.avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100&h=100&fit=crop'}
                      alt={farmer.name}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200"
                    />
                    <div>
                      <span className="font-bold text-gray-900 block">{farmer.name}</span>
                      <span className="text-[11px] text-emerald-800 font-semibold">{farmer.farm_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {farmer.village_town}, {farmer.district}
                  </td>
                  <td className="p-4 text-gray-600">
                    <span className="font-bold">{farmer.farm_size_acres || 5} Acres</span>
                    <span className="block text-[10px] text-gray-400">
                      {(farmer.primary_crops || []).slice(0, 2).join(', ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-gray-800 block">
                      {farmer.fpo_name || 'Individual Grower'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {farmer.organic_certified ? '🌱 Organic Declared' : 'Standard Conventional'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
                      {farmer.verification_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleVerify(farmer.id, 'fpo_verified')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
                        title="Award FPO Verified Badge"
                      >
                        Approve FPO
                      </button>
                      <button
                        onClick={() => handleVerify(farmer.id, 'admin_verified')}
                        className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                        title="Award Admin Verified Badge"
                      >
                        Verify Land
                      </button>
                      <button
                        onClick={() => handleVerify(farmer.id, 'unverified')}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Revoke Verification"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
