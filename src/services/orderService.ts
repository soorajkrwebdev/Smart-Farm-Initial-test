import { Order, OrderStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { repository } from './storageService';

function transformOrderRow(row: any): Order {
  const consumer = Array.isArray(row.consumer_profile) ? row.consumer_profile?.[0] : row.consumer_profile;
  const farmer = Array.isArray(row.farmer_profile) ? row.farmer_profile?.[0] : row.farmer_profile;
  return {
    id: row.id,
    order_number: row.order_number,
    consumer_id: row.consumer_id,
    consumer_name: consumer?.name,
    consumer_phone: consumer?.phone,
    farmer_id: row.farmer_id,
    farmer_name: farmer?.name,
    farmer_phone: farmer?.phone,
    total_amount: row.total_amount,
    status: row.status,
    delivery_type: row.delivery_type,
    delivery_address: row.delivery_address,
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: (row.items || row.order_items || []).map((it: any) => ({
      id: it.id,
      order_id: it.order_id,
      product_id: it.product_id,
      product_name_snapshot: it.product_name_snapshot,
      unit_price_snapshot: it.unit_price_snapshot,
      quantity: it.quantity,
      unit: it.unit,
      total_price: it.total_price,
    })),
  } as Order;
}

export const orderService = {
  async getOrders(params?: { consumerId?: string; farmerId?: string }): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('orders').select(`
            id,
            order_number,
            consumer_id,
            farmer_id,
            total_amount,
            status,
            delivery_type,
            delivery_address,
            payment_method,
            payment_status,
            notes,
            created_at,
            updated_at,
            items:order_items(*),
            consumer_profile:profiles!orders_consumer_id_fkey(name, phone),
            farmer_profile:profiles!orders_farmer_id_fkey(name, phone)
          `);
        if (params?.consumerId) query = query.eq('consumer_id', params.consumerId);
        if (params?.farmerId) query = query.eq('farmer_id', params.farmerId);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
          console.error('Supabase getOrders error:', error.message);
          throw new Error(`Failed to load orders: ${error.message}`);
        }
        return (data || []).map(transformOrderRow);
      } catch (err: any) {
        console.error('Error fetching orders from Supabase:', err);
        throw err;
      }
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
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            consumer_id,
            farmer_id,
            total_amount,
            status,
            delivery_type,
            delivery_address,
            payment_method,
            payment_status,
            notes,
            created_at,
            updated_at,
            items:order_items(*),
            consumer_profile:profiles!orders_consumer_id_fkey(name, phone),
            farmer_profile:profiles!orders_farmer_id_fkey(name, phone)
          `)
          .eq('id', orderId)
          .maybeSingle();
        if (error) {
          console.error('Supabase getOrderById error:', error.message);
          return undefined;
        }
        if (!data) return undefined;
        return transformOrderRow(data);
      } catch (err: any) {
        console.error('Error fetching order from Supabase:', err);
        return undefined;
      }
    }
    return repository.getOrderById(orderId);
  },

  async createOrder(orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { items, ...orderHeader } = orderData;
        const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `SF-${dateCode}-${randomSuffix}`;

        const { data: newOrder, error: oError } = await supabase
          .from('orders')
          .insert({ ...orderHeader, order_number: orderNumber })
          .select()
          .maybeSingle();
        if (oError) {
          throw new Error(`Failed to create order: ${oError.message}`);
        }

        if (!newOrder) {
          throw new Error('Order creation returned no data');
        }

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
        if (iError) {
          throw new Error(`Failed to create order items: ${iError.message}`);
        }

        await this.addNotification({
          user_id: newOrder.farmer_id,
          title: 'New Produce Order Received!',
          message: `A customer placed order ${orderNumber} for ₹${newOrder.total_amount}.`,
          type: 'order',
          link: '/farmer/orders',
        });

        const fullOrder = await this.getOrderById(newOrder.id);
        return fullOrder || { ...newOrder, items } as Order;
      } catch (err: any) {
        console.error('Error creating order in Supabase:', err);
        throw err;
      }
    }

    return repository.createOrder(orderData);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .select(`
            id,
            order_number,
            consumer_id,
            farmer_id,
            total_amount,
            status,
            delivery_type,
            delivery_address,
            payment_method,
            payment_status,
            notes,
            created_at,
            updated_at,
            items:order_items(*),
            consumer_profile:profiles!orders_consumer_id_fkey(name, phone),
            farmer_profile:profiles!orders_farmer_id_fkey(name, phone)
          `)
          .maybeSingle();
        if (error) {
          if (error.message.includes('permission')) {
            throw new Error('You do not have permission to update this order.');
          }
          throw new Error(`Failed to update order: ${error.message}`);
        }
        if (!data) return undefined;

        const updated = transformOrderRow(data);
        await this.addNotification({
          user_id: updated.consumer_id,
          title: `Order Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
          message: `Your order ${updated.order_number} is now marked as ${status.replace(/_/g, ' ')}.`,
          type: 'order',
          link: '/consumer/orders',
        });

        return updated;
      } catch (err: any) {
        console.error('Error updating order status in Supabase:', err);
        throw err;
      }
    }
    return repository.updateOrderStatus(orderId, status);
  },

  async addNotification(notif: {
    user_id: string;
    title: string;
    message: string;
    type: 'order' | 'market_price' | 'weather' | 'worker' | 'job' | 'system' | 'ai';
    link?: string;
  }) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').insert({
          user_id: notif.user_id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          link: notif.link,
          is_read: false,
        });
      } catch (err) {
        console.warn('Failed to persist notification:', err);
      }
    } else {
      repository.addNotification({ ...notif, is_read: false });
    }
  },
};
