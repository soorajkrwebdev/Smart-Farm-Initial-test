import { Product, ProductStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  farmerId?: string;
  isOrganic?: boolean;
  minPrice?: number;
  maxPrice?: number;
  district?: string;
  status?: ProductStatus;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('products').select('*');
      if (filters?.status) query = query.eq('status', filters.status);
      else query = query.eq('status', 'active');
      if (filters?.farmerId) query = query.eq('farmer_id', filters.farmerId);
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters?.isOrganic !== undefined) query = query.eq('is_organic', filters.isOrganic);
      if (filters?.district) query = query.eq('district', filters.district);

      const { data, error } = await query;
      if (error) throw error;
      let results = (data || []) as Product[];

      if (filters?.search) {
        const s = filters.search.toLowerCase();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.variety?.toLowerCase().includes(s) ||
            p.description.toLowerCase().includes(s)
        );
      }
      return results;
    }

    // Demo Mode implementation
    let products = repository.getProducts();

    if (filters?.farmerId) {
      products = products.filter((p) => p.farmer_id === filters.farmerId);
    } else if (filters?.status) {
      products = products.filter((p) => p.status === filters.status);
    } else {
      // Default to active for public
      products = products.filter((p) => p.status === 'active');
    }

    if (filters?.categoryId && filters.categoryId !== 'all') {
      products = products.filter((p) => p.category_id === filters.categoryId);
    }

    if (filters?.isOrganic !== undefined && filters.isOrganic) {
      products = products.filter((p) => p.is_organic);
    }

    if (filters?.district) {
      products = products.filter((p) => p.district === filters.district);
    }

    if (filters?.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.variety?.toLowerCase().includes(s) ||
          p.farmer_name?.toLowerCase().includes(s) ||
          p.village_town?.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s)
      );
    }

    if (filters?.sortBy === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (filters?.sortBy === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (filters?.sortBy === 'rating') {
      products.sort((a, b) => (b.farmer_rating || 0) - (a.farmer_rating || 0));
    } else {
      // newest
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return products;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) return undefined;
      return data as Product;
    }
    return repository.getProductById(id);
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (!product.farmer_id) {
      throw new Error('Authentication required. Please sign in as a farmer before listing a product.');
    }
    if (!product.farmer_name) {
      throw new Error('Farmer profile name missing. Please complete your farm profile first.');
    }

    const fullProduct = {
      id: product.id || `prod-${Date.now()}`,
      farmer_id: product.farmer_id,
      farmer_name: product.farmer_name,
      farmer_rating: product.farmer_rating ?? 5.0,
      farmer_verification: product.farmer_verification || 'phone_verified',
      category_id: product.category_id || 'cat-all',
      category_name: product.category_name || 'Produce',
      name: product.name || 'Farm Produce',
      variety: product.variety || '',
      description: product.description || '',
      price: Number(product.price) || 0,
      unit: product.unit || 'kg',
      quantity_available: Number(product.quantity_available) || 0,
      reserved_quantity: Number(product.reserved_quantity) || 0,
      min_order_quantity: Number(product.min_order_quantity) || 1,
      harvest_date: product.harvest_date || new Date().toISOString().slice(0, 10),
      quality_grade: product.quality_grade || 'Standard',
      is_organic: Boolean(product.is_organic),
      images: product.images?.length
        ? product.images
        : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop'],
      status: product.status || 'active',
      village_town: product.village_town || '',
      district: product.district || '',
      state: product.state || 'Karnataka',
      mandi_reference_price: product.mandi_reference_price,
      created_at: product.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Product;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').upsert(fullProduct).select().single();
      if (error) throw error;
      return data as Product;
    }

    return repository.saveProduct(fullProduct);
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      return !error;
    }
    return repository.deleteProduct(id);
  },

  // Helper to convert uploaded File to Data URL for instant preview & persistence
  readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
