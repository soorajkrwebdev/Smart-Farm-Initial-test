import React, { useState, useEffect } from 'react';
import { repository } from '../../services/storageService';
import { Product } from '../../types';
import { formatUnitPrice } from '../../lib/utils';
import { Package, Trash2, Pause, Play, ShieldAlert } from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = () => {
    setProducts(repository.getProducts());
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleStatus = (p: Product) => {
    const nextStatus = p.status === 'active' ? 'paused' : 'active';
    repository.saveProduct({ ...p, status: nextStatus });
    loadProducts();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this listing from the marketplace?')) {
      repository.deleteProduct(id);
      loadProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Produce Catalogue Moderation</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Audit listings, remove spam or suspicious pricing, and monitor active marketplace commodities.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-4">Listing</th>
                <th className="p-4">Farmer</th>
                <th className="p-4">Price</th>
                <th className="p-4">Inventory</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <span className="font-bold text-gray-900 block">{p.name}</span>
                      <span className="text-[11px] text-gray-400">{p.category_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">{p.farmer_name}</td>
                  <td className="p-4 font-bold text-emerald-950">{formatUnitPrice(p.price, p.unit)}</td>
                  <td className="p-4 text-gray-700">{p.quantity_available} {p.unit}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-gray-100"
                      >
                        {p.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
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
