import { AIMessage, UserRole } from '../types';
import { marketPriceService } from './marketPriceService';
import { weatherService } from './weatherService';
import { productService } from './productService';
import { workerService } from './workerService';
import { orderService } from './orderService';
import { repository } from './storageService';
import { formatINR } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ToolResult {
  tool_name: string;
  params: Record<string, any>;
  result: any;
}

export const aiService = {
  // Execute server-side approved tools against real application data
  async executeTool(name: string, params: Record<string, any>): Promise<any> {
    switch (name) {
      case 'get_market_price': {
        const { commodity, district } = params;
        const res = await marketPriceService.getMarketPrices(commodity, district);
        return {
          source: res.source,
          last_updated: res.lastUpdated,
          prices: res.data.slice(0, 4).map((p) => ({
            commodity: p.commodity,
            market: p.market,
            modal_price: `₹${p.modal_price}/${p.unit}`,
            range: `₹${p.min_price} - ₹${p.max_price}`,
            date: p.price_date,
          })),
        };
      }
      case 'get_weather': {
        const district = params.district || 'Dakshina Kannada';
        const weather = await weatherService.getWeatherForDistrict(district);
        return {
          district: weather.district,
          temperature: `${weather.current_temp}°C`,
          condition: weather.condition,
          rain_probability: `${weather.rain_probability}%`,
          alerts: weather.alerts,
          agricultural_advisory: weather.agricultural_advisory,
        };
      }
      case 'search_products': {
        const products = await productService.getProducts({ search: params.query, categoryId: params.category });
        return products.slice(0, 5).map((p) => ({
          name: p.name,
          farmer: p.farmer_name,
          location: `${p.village_town}, ${p.district}`,
          price: `${formatINR(p.price)}/${p.unit}`,
          quantity_available: `${p.quantity_available} ${p.unit}`,
          organic: p.is_organic,
        }));
      }
      case 'search_workers': {
        const workers = await workerService.getWorkers({ skill: params.skill, district: params.district });
        return workers.slice(0, 4).map((w) => ({
          name: w.name,
          location: `${w.village_town}, ${w.district}`,
          skills: w.skills,
          daily_wage: `₹${w.daily_wage_rate}/day`,
          availability: w.availability_status,
          rating: `${w.rating} ★`,
        }));
      }
      case 'get_farmer_orders': {
        const orders = await orderService.getOrders({ farmerId: params.farmerId || 'usr-farmer-1' });
        return orders.slice(0, 5).map((o) => ({
          order_number: o.order_number,
          customer: o.consumer_name,
          total: formatINR(o.total_amount),
          status: o.status,
          items_count: o.items.length,
          date: o.created_at.slice(0, 10),
        }));
      }
      case 'search_articles': {
        const q = (params.query || '').toLowerCase();
        let articles;
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase
            .from('articles')
            .select('*')
            .or(`title.ilike.%${q}%,category.ilike.%${q}%`)
            .limit(3);
          articles = data || [];
        } else {
          articles = repository.getArticles()
            .filter((a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
            .slice(0, 3);
        }
        return articles
          .map((a: any) => ({
            title: a.title,
            category: a.category,
            source: a.official_source,
            summary: a.summary,
          }));
      }
      default:
        return { error: 'Unknown tool' };
    }
  },

  // Process user prompt with safety guardrails and real data resolution
  async sendMessage(
    prompt: string,
    role: UserRole,
    context?: { userId?: string; district?: string }
  ): Promise<{ reply: string; toolCalls?: ToolResult[] }> {
    const p = prompt.toLowerCase();
    const toolCalls: ToolResult[] = [];

    // 1. Market Price Queries
    if (p.includes('price') || p.includes('mandi') || p.includes('rate') || p.includes('pepper') || p.includes('arecanut') || p.includes('coconut')) {
      let commodity = '';
      if (p.includes('pepper')) commodity = 'Black Pepper';
      else if (p.includes('arecanut') || p.includes('supari') || p.includes('betel')) commodity = 'Arecanut';
      else if (p.includes('coconut') || p.includes('copra')) commodity = 'Coconut';
      else if (p.includes('tomato')) commodity = 'Tomato';
      else if (p.includes('chilli')) commodity = 'Byadagi Chilli';

      const res = await this.executeTool('get_market_price', { commodity, district: context?.district });
      toolCalls.push({ tool_name: 'get_market_price', params: { commodity }, result: res });

      if (res.prices && res.prices.length > 0) {
        const items = res.prices
          .map((item: any) => `• **${item.commodity}** (${item.market}): Modal reference **${item.modal_price}** [Range: ${item.range}] on ${item.date}`)
          .join('\n');
        return {
          reply: `According to the latest available mandi market data:\n\n${items}\n\n*Reference prices are sourced from ${res.source}. Actual realized farmgate prices may vary based on moisture, grade, and delivery conditions.*`,
          toolCalls,
        };
      }
    }

    // 2. Weather & Farming Planning
    if (p.includes('weather') || p.includes('rain') || p.includes('forecast') || p.includes('spray') || p.includes('monsoon')) {
      const res = await this.executeTool('get_weather', { district: context?.district || 'Dakshina Kannada' });
      toolCalls.push({ tool_name: 'get_weather', params: { district: res.district }, result: res });

      return {
        reply: `**Weather Advisory for ${res.district}**:\n• **Current:** ${res.temperature}, ${res.condition}\n• **Rain Probability:** ${res.rain_probability}\n\n🌾 **Agricultural Advisory:**\n${res.agricultural_advisory}\n\n${
          res.alerts && res.alerts.length > 0 ? `⚠️ **Alert:** ${res.alerts.join(' ')}\n\n` : ''
        }*General recommendation — please verify with your local taluk Raitha Samparka Kendra (RSK) before conducting high-value chemical applications.*`,
        toolCalls,
      };
    }

    // 3. Worker Search
    if (p.includes('worker') || p.includes('labour') || p.includes('labor') || p.includes('climber') || p.includes('harvesting work')) {
      const res = await this.executeTool('search_workers', { district: context?.district });
      toolCalls.push({ tool_name: 'search_workers', params: {}, result: res });

      if (res && res.length > 0) {
        const workers = res
          .map((w: any) => `• **${w.name}** (${w.location}): Skills: ${w.skills.join(', ')} — Rate: **${w.daily_wage}** (${w.availability})`)
          .join('\n');
        return {
          reply: `Here are available agricultural workers in your area:\n\n${workers}\n\nYou can view their full profiles or post a specific farm job directly on the Worker Marketplace.`,
          toolCalls,
        };
      }
    }

    // 4. Orders Query (Farmer)
    if ((p.includes('order') || p.includes('pending')) && role === 'farmer') {
      const res = await this.executeTool('get_farmer_orders', { farmerId: context?.userId });
      toolCalls.push({ tool_name: 'get_farmer_orders', params: {}, result: res });

      if (res && res.length > 0) {
        const orders = res
          .map((o: any) => `• **${o.order_number}** for **${o.total}** by ${o.customer} — Status: *${o.status}* (${o.date})`)
          .join('\n');
        return {
          reply: `Here are your recent orders:\n\n${orders}\n\nYou can accept or update order stages in your **Farmer Orders** dashboard.`,
          toolCalls,
        };
      } else {
        return {
          reply: `You currently do not have any pending orders. All caught up!`,
          toolCalls,
        };
      }
    }

    // 5. Product Search (Consumer)
    if (p.includes('vegetable') || p.includes('fruit') || p.includes('organic') || p.includes('buy') || p.includes('produce') || p.includes('find')) {
      const res = await this.executeTool('search_products', { query: prompt });
      toolCalls.push({ tool_name: 'search_products', params: { query: prompt }, result: res });

      if (res && res.length > 0) {
        const items = res
          .map((item: any) => `• **${item.name}** by Farmer ${item.farmer} (${item.location}): **${item.price}** ${item.organic ? '🌱 [Organic Certified]' : ''}`)
          .join('\n');
        return {
          reply: `Here is fresh produce matching your search:\n\n${items}\n\nYou can add any of these directly to your cart in the Marketplace.`,
          toolCalls,
        };
      } else {
        return {
          reply: `I couldn't find an exact product listing matching your criteria right now. Check back soon or explore nearby farmer estates in the Marketplace!`,
          toolCalls,
        };
      }
    }

    // 6. Agricultural Knowledge / Schemes
    if (p.includes('scheme') || p.includes('subsidy') || p.includes('wilt') || p.includes('disease') || p.includes('kcc') || p.includes('irrigation')) {
      const res = await this.executeTool('search_articles', { query: prompt });
      toolCalls.push({ tool_name: 'search_articles', params: { query: prompt }, result: res });

      if (res && res.length > 0) {
        const arts = res
          .map((a: any) => `• **${a.title}** (${a.category}) — Source: *${a.source}*\n  ${a.summary}`)
          .join('\n\n');
        return {
          reply: `Here is verified agricultural guidance from trusted institutions:\n\n${arts}\n\n*Always confirm scheme guidelines with your local Horticulture / Agriculture Office.*`,
          toolCalls,
        };
      }
    }

    // Default Contextual Welcome
    if (role === 'farmer') {
      return {
        reply: `Namaskara! I am **FarmAI**, your agricultural intelligence assistant. I can assist you with:\n\n1. Checking live mandi commodity reference prices (Pepper, Arecanut, Coconut, Tomato)\n2. District weather forecasts & spraying advisories\n3. Discovering available agricultural workers nearby\n4. Reviewing your pending farm orders and inventory\n\nHow can I assist your farm today?`,
      };
    } else {
      return {
        reply: `Namaskara! I am **FarmNexa Assistant**. I can help you find fresh farm produce directly from local farmers, compare mandi prices, or track your orders.\n\nWhat produce are you looking for today?`,
      };
    }
  },
};
