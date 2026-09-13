import { Order, OrderStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';

export const orderService = {
  async getOrders(params?: { consumerId?: string; farmerId?: string }): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('orders').select('*, items:order_items(*)');
      if (params?.consumerId) query = query.eq('consumer_id', params.consumerId);
      if (params?.farmerId) query = query.eq('farmer_id', params.farmerId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Order[];
    }

    let orders = repository.getOrders();
    if (params?.consumerId) {
      orders = orders.filter((o) => o.consumer_id === params.consumerId);
    }
    if (params?.farmerId) {
      orders = orders.filter((o) => o.farmer_id === params.farmerId);
    }
    return orders;
  },

  async getOrderById(orderId: string): Promise<Order | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();
      if (error) return undefined;
      return data as Order;
    }
    return repository.getOrderById(orderId);
  },

  async createOrder(orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      // 1. Insert order
      const { items, ...orderHeader } = orderData;
      const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `SF-${dateCode}-${randomSuffix}`;

      const { data: newOrder, error: oError } = await supabase
        .from('orders')
        .insert({ ...orderHeader, order_number: orderNumber })
        .select()
        .single();
      if (oError) throw oError;

      // 2. Insert items
      const itemsToInsert = items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_name_snapshot: item.product_name_snapshot,
        unit_price_snapshot: item.unit_price_snapshot,
        quantity: item.quantity,
        unit: item.unit,
        total_price: item.total_price,
      }));
      const { error: iError } = await supabase.from('order_items').insert(itemsToInsert);
      if (iError) throw iError;

      return { ...newOrder, items };
    }

    return repository.createOrder(orderData);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('*, items:order_items(*)')
        .single();
      if (error) throw error;
      return data as Order;
    }
    return repository.updateOrderStatus(orderId, status);
  },
};
