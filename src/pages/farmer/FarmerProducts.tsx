import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import { formatUnitPrice, formatDate } from '../../lib/utils';
import { PlusCircle, Edit, Trash2, Pause, Play, Package, Copy } from 'lucide-react';

export const FarmerProducts: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProducts = async () => {
    if (user) {
      const prods = await productService.getProducts({ farmerId: user.id });
      setProducts(prods);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    await productService.saveProduct({ ...product, status: newStatus });
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this produce listing?')) {
      await productService.deleteProduct(id);
      loadProducts();
    }
  };

  const handleDuplicate = async (product: Product) => {
    const { id, created_at, updated_at, ...rest } = product;
    await productService.saveProduct({
      ...rest,
      name: `${product.name} (Copy)`,
      status: 'draft',
    });
    loadProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950">Produce Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your harvest listings, stock quantities, and active/paused marketplace status.
          </p>
        </div>

        <Link
          to="/farmer/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Produce</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400">Loading your listings...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-300 space-y-3 max-w-md mx-auto">
          <Package className="w-12 h-12 mx-auto text-emerald-600/40" />
          <h3 className="font-bold text-gray-900">No Produce Listed Yet</h3>
          <p className="text-xs text-gray-500">
            List your freshly harvested pepper, arecanut, coconuts, or fruits to reach direct consumers.
          </p>
          <Link
            to="/farmer/products/new"
            className="inline-block px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-4">Produce Details</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Available Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Harvest Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block truncate max-w-xs">{prod.name}</span>
                        <span className="text-[11px] text-gray-400">{prod.variety || prod.category_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-emerald-950">
                      {formatUnitPrice(prod.price, prod.unit)}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-800">
                        {prod.quantity_available} {prod.unit}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          prod.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : prod.status === 'paused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      {prod.harvest_date ? formatDate(prod.harvest_date) : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(prod)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-lg hover:bg-gray-100"
                          title={prod.status === 'active' ? 'Pause Listing' : 'Resume Listing'}
                        >
                          {prod.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDuplicate(prod)}
                          className="p-1.5 text-gray-500 hover:text-blue-700 rounded-lg hover:bg-gray-100"
                          title="Duplicate Listing"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                          title="Delete Listing"
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
      )}
    </div>
  );
};
