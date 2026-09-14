import { Product, ProductStatus, ProductCategory } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';
import { PRODUCT_CATEGORIES } from '../lib/constants';

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

const CATEGORY_CACHE: { slug: string; id: string; name: string }[] = [];

async function seedAndGetCategories(): Promise<ProductCategory[]> {
  if (!isSupabaseConfigured || !supabase) return PRODUCT_CATEGORIES;

  if (CATEGORY_CACHE.length === 0) {
    const { data } = await supabase.from('product_categories').select('*').eq('is_active', true);
    if (data && data.length > 0) {
      CATEGORY_CACHE.length = 0;
      data.forEach((r: any) => CATEGORY_CACHE.push({ slug: r.slug, id: r.id, name: r.name }));
    } else {
      for (const c of PRODUCT_CATEGORIES) {
        const { data: inserted } = await supabase
          .from('product_categories')
          .insert({ name: c.name, slug: c.slug, icon: c.icon, is_active: c.is_active })
          .select()
          .maybeSingle();
        if (inserted) {
          CATEGORY_CACHE.push({ slug: inserted.slug, id: inserted.id, name: inserted.name });
        }
      }
    }
  }
  return CATEGORY_CACHE as unknown as ProductCategory[];
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      if (CATEGORY_CACHE.length === 0) {
        return await seedAndGetCategories();
      }
      return CATEGORY_CACHE as unknown as ProductCategory[];
    } catch (err) {
      return PRODUCT_CATEGORIES;
    }
  }
  return PRODUCT_CATEGORIES;
}

async function resolveCategoryId(inputId: string | undefined): Promise<string | undefined> {
  if (!inputId) return undefined;
  if (!isSupabaseConfigured || !supabase) return inputId;

  await seedAndGetCategories();

  const directMatch = CATEGORY_CACHE.find((c) => c.id === inputId);
  if (directMatch) return directMatch.id;

  const constant = PRODUCT_CATEGORIES.find((c) => c.id === inputId);
  if (constant) {
    const bySlug = CATEGORY_CACHE.find((c) => c.slug === constant.slug);
    if (bySlug) return bySlug.id;
    const byName = CATEGORY_CACHE.find((c) => c.name.toLowerCase() === constant.name.toLowerCase());
    if (byName) return byName.id;
  }

  const anyMatch = CATEGORY_CACHE[0];
  return anyMatch?.id;
}

function transformProductRow(row: any): Product {
  const farmer = Array.isArray(row.farmers) ? row.farmers?.[0] : row.farmers;
  const profile = Array.isArray(row.profiles) ? row.profiles?.[0] : row.profiles;
  const category = Array.isArray(row.product_categories) ? row.product_categories?.[0] : row.product_categories;
  return {
    id: row.id,
    farmer_id: row.farmer_id,
    farmer_name: profile?.name,
    farmer_rating: farmer?.rating,
    farmer_verification: profile?.verification_status,
    category_id: row.category_id,
    category_name: category?.name,
    name: row.name,
    variety: row.variety,
    description: row.description,
    price: row.price,
    unit: row.unit,
    quantity_available: row.quantity_available,
    reserved_quantity: row.reserved_quantity,
    min_order_quantity: row.min_order_quantity,
    harvest_date: row.harvest_date,
    quality_grade: row.quality_grade,
    is_organic: row.is_organic,
    images: row.images,
    status: row.status,
    village_town: row.village_town,
    district: row.district,
    state: row.state,
    created_at: row.created_at,
    updated_at: row.updated_at,
  } as Product;
}

export const productService = {
  getProductCategories,

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const resolvedCategory = filters?.categoryId ? await resolveCategoryId(filters.categoryId) : undefined;
        let query = supabase
          .from('products')
          .select(`
            id,
            farmer_id,
            category_id,
            name,
            variety,
            description,
            price,
            unit,
            quantity_available,
            reserved_quantity,
            min_order_quantity,
            harvest_date,
            quality_grade,
            is_organic,
            images,
            status,
            village_town,
            district,
            state,
            created_at,
            updated_at,
            farmers(rating, reviews_count),
            profiles:profiles!products_farmer_id_fkey(name, verification_status),
            product_categories(name, slug)
          `);

        if (filters?.status) {
          query = query.eq('status', filters.status);
        } else {
          query = query.eq('status', 'active');
        }
        if (filters?.farmerId) query = query.eq('farmer_id', filters.farmerId);
        if (resolvedCategory) query = query.eq('category_id', resolvedCategory);
        if (filters?.isOrganic !== undefined) query = query.eq('is_organic', filters.isOrganic);
        if (filters?.district) query = query.eq('district', filters.district);
        if (filters?.minPrice !== undefined) query = query.gte('price', filters.minPrice);
        if (filters?.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);

        if (filters?.sortBy === 'price_asc') query = query.order('price', { ascending: true });
        else if (filters?.sortBy === 'price_desc') query = query.order('price', { ascending: false });
        else query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) {
          console.error('Supabase getProducts error:', error.message);
          throw new Error(`Failed to load products: ${error.message}`);
        }

        let results = (data || []).map(transformProductRow);

        if (filters?.search) {
          const s = filters.search.toLowerCase();
          results = results.filter(
            (p) =>
              p.name.toLowerCase().includes(s) ||
              (p.variety?.toLowerCase() || '').includes(s) ||
              p.description.toLowerCase().includes(s) ||
              (p.farmer_name?.toLowerCase() || '').includes(s)
          );
        }

        if (filters?.sortBy === 'rating') {
          results.sort((a, b) => (b.farmer_rating || 0) - (a.farmer_rating || 0));
        }

        return results;
      } catch (err: any) {
        console.error('Error fetching products from Supabase:', err);
        throw err;
      }
    }

    let products = repository.getProducts();

    if (filters?.farmerId) {
      products = products.filter((p) => p.farmer_id === filters.farmerId);
    } else if (filters?.status) {
      products = products.filter((p) => p.status === filters.status);
    } else {
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
          (p.variety?.toLowerCase() || '').includes(s) ||
          (p.farmer_name?.toLowerCase() || '').includes(s) ||
          (p.village_town?.toLowerCase() || '').includes(s) ||
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
      products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return products;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            farmer_id,
            category_id,
            name,
            variety,
            description,
            price,
            unit,
            quantity_available,
            reserved_quantity,
            min_order_quantity,
            harvest_date,
            quality_grade,
            is_organic,
            images,
            status,
            village_town,
            district,
            state,
            created_at,
            updated_at,
            farmers(rating, reviews_count),
            profiles:profiles!products_farmer_id_fkey(name, verification_status),
            product_categories(name, slug)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Supabase getProductById error:', error.message);
          return undefined;
        }
        if (!data) return undefined;
        return transformProductRow(data);
      } catch (err: any) {
        console.error('Error fetching product from Supabase:', err);
        return undefined;
      }
    }
    return repository.getProductById(id);
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (!product.farmer_id) {
      throw new Error('Authentication required. Please sign in as a farmer before listing a product.');
    }

    // Required field validation (useful errors BEFORE DB call)
    const rawPrice = Number(product.price);
    if (!product.name || String(product.name).trim().length === 0) {
      throw new Error('Produce name is required.');
    }
    if (Number.isNaN(rawPrice) || rawPrice <= 0) {
      throw new Error('Please enter a valid selling price greater than ₹0.');
    }
    const rawQty = Number(product.quantity_available);
    if (Number.isNaN(rawQty) || rawQty < 0) {
      throw new Error('Available quantity must be 0 or higher.');
    }
    const rawMin = Number(product.min_order_quantity);
    if (Number.isNaN(rawMin) || rawMin <= 0) {
      throw new Error('Minimum order quantity must be greater than 0.');
    }

    const resolvedCategoryId = product.category_id ? await resolveCategoryId(product.category_id) : undefined;

    const productToSave: Record<string, any> = {
      farmer_id: product.farmer_id,
      category_id: resolvedCategoryId,
      name: String(product.name || 'Farm Produce').trim(),
      variety: product.variety || '',
      description: product.description || '',
      price: rawPrice,
      unit: product.unit || 'kg',
      quantity_available: rawQty,
      reserved_quantity: Number(product.reserved_quantity) || 0,
      min_order_quantity: rawMin,
      harvest_date: product.harvest_date || new Date().toISOString().slice(0, 10),
      quality_grade: product.quality_grade || 'Standard',
      is_organic: Boolean(product.is_organic),
      images: product.images && product.images.length > 0
        ? product.images
        : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop'],
      status: product.status || 'active',
      village_town: product.village_town || '',
      district: product.district || '',
      state: product.state || 'Karnataka',
    };

    if (product.id) {
      productToSave.id = product.id;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .upsert(productToSave)
          .select(`
            id,
            farmer_id,
            category_id,
            name,
            variety,
            description,
            price,
            unit,
            quantity_available,
            reserved_quantity,
            min_order_quantity,
            harvest_date,
            quality_grade,
            is_organic,
            images,
            status,
            village_town,
            district,
            state,
            created_at,
            updated_at,
            farmers(rating, reviews_count),
            profiles:profiles!products_farmer_id_fkey(name, verification_status),
            product_categories(name, slug)
          `)
          .maybeSingle();

        if (error) {
          if (error.message.includes('permission')) {
            throw new Error('You do not have permission to modify this product.');
          }
          throw new Error(`Failed to save product: ${error.message}`);
        }

        if (!data) {
          throw new Error('Product save returned no data');
        }

        return transformProductRow(data);
      } catch (err: any) {
        console.error('Error saving product to Supabase:', err);
        throw err;
      }
    }

    return repository.saveProduct(productToSave as any);
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          if (error.message.includes('permission')) {
            throw new Error('You do not have permission to delete this product.');
          }
          console.error('Supabase deleteProduct error:', error.message);
          throw new Error(`Failed to delete product: ${error.message}`);
        }
        return true;
      } catch (err: any) {
        console.error('Error deleting product from Supabase:', err);
        throw err;
      }
    }
    return repository.deleteProduct(id);
  },

  async getReviews(targetId: string) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            order_id,
            product_id,
            reviewer_id,
            target_id,
            rating,
            comment,
            created_at,
            reviewer:profiles!reviews_reviewer_id_fkey(name, avatar_url)
          `)
          .eq('target_id', targetId)
          .order('created_at', { ascending: false });
        if (error) return [];
        return ((data || []) as any[]).map((r) => ({
          id: r.id,
          order_id: r.order_id,
          product_id: r.product_id,
          reviewer_id: r.reviewer_id,
          reviewer_name: r.reviewer?.name || 'Anonymous',
          target_id: r.target_id,
          rating: r.rating,
          comment: r.comment || '',
          created_at: r.created_at,
        }));
      } catch (e) {
        return [];
      }
    }
    return repository.getReviews(targetId);
  },

  async addReview(review: {
    order_id?: string;
    product_id?: string;
    reviewer_id: string;
    target_id: string;
    rating: number;
    comment?: string;
    reviewer_name?: string;
  }) {
    if (isSupabaseConfigured && supabase) {
      const { reviewer_name, ...dbReview } = review;
      const toInsert = {
        ...dbReview,
        comment: review.comment ?? '',
      };
      const { data, error } = await supabase
        .from('reviews')
        .insert(toInsert)
        .select()
        .maybeSingle();
      if (error || !data) throw new Error(error?.message || 'Failed to save review');
      return {
        ...data,
        reviewer_name: reviewer_name || 'Anonymous',
      };
    }
    const reviewer = repository.getProfileById(review.reviewer_id);
    return repository.addReview({
      ...review,
      comment: review.comment ?? '',
      reviewer_name: review.reviewer_name ?? reviewer?.name ?? 'Anonymous',
    } as any);
  },

  async uploadProductImage(file: File): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const path = `${safeName}`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(path, file, { cacheControl: '31536000', upsert: true });
        if (error) {
          throw error;
        }
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data?.path || path);
        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      } catch (err: any) {
        console.warn('Supabase Storage upload failed, falling back to DataURL:', err?.message || err);
      }
    }
    return this.readFileAsDataURL(file);
  },

  readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
