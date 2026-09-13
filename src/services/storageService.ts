import { 
  UserProfile, 
  Product, 
  Order, 
  WorkerJob, 
  WorkerApplication, 
  MarketPrice, 
  WeatherData, 
  Article, 
  AppNotification, 
  Review 
} from '../types';
import { 
  INITIAL_PROFILES, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_JOBS, 
  INITIAL_APPLICATIONS, 
  INITIAL_MARKET_PRICES, 
  INITIAL_WEATHER, 
  INITIAL_ARTICLES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_REVIEWS 
} from './mockData';

const KEYS = {
  PROFILES: 'farmnexa_profiles_prod_v4',
  PRODUCTS: 'farmnexa_products_prod_v4',
  ORDERS: 'farmnexa_orders_prod_v4',
  JOBS: 'farmnexa_jobs_prod_v4',
  APPLICATIONS: 'farmnexa_applications_prod_v4',
  MARKET_PRICES: 'farmnexa_market_prices_prod_v4',
  WEATHER: 'farmnexa_weather_prod_v4',
  ARTICLES: 'farmnexa_articles_prod_v4',
  NOTIFICATIONS: 'farmnexa_notifications_prod_v4',
  REVIEWS: 'farmnexa_reviews_prod_v4',
  CURRENT_USER: 'farmnexa_active_user_prod_v4',
};

function getStorage<T>(key: string, initialData: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(item);
  } catch (error) {
    console.warn(`Error loading ${key} from storage:`, error);
    return initialData;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Error saving ${key} to storage:`, error);
  }
}

class LocalStorageRepository {
  // --- Profiles ---
  getProfiles(): UserProfile[] {
    return getStorage<UserProfile[]>(KEYS.PROFILES, INITIAL_PROFILES as UserProfile[]);
  }

  getProfileById(id: string): UserProfile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  saveProfile(profile: UserProfile): UserProfile {
    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = { ...profile, updated_at: new Date().toISOString() };
    } else {
      profiles.push({ ...profile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    setStorage(KEYS.PROFILES, profiles);
    return profile;
  }

  // --- Products ---
  getProducts(): Product[] {
    return getStorage<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = { ...product, updated_at: new Date().toISOString() };
    } else {
      products.unshift({ 
        ...product, 
        id: product.id || `prod-${Date.now()}`,
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      });
    }
    setStorage(KEYS.PRODUCTS, products);
    return index >= 0 ? products[index] : products[0];
  }

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    setStorage(KEYS.PRODUCTS, filtered);
    return filtered.length !== products.length;
  }

  // --- Orders ---
  getOrders(): Order[] {
    return getStorage<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  }

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  }

  createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>): Order {
    const orders = this.getOrders();
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}`,
      order_number: `SF-${dateCode}-${randomSuffix}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    setStorage(KEYS.ORDERS, orders);

    // Reserve inventory for products
    const products = this.getProducts();
    for (const item of newOrder.items) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        prod.quantity_available = Math.max(0, prod.quantity_available - item.quantity);
        prod.reserved_quantity = (prod.reserved_quantity || 0) + item.quantity;
        if (prod.quantity_available === 0) {
          prod.status = 'sold_out';
        }
      }
    }
    setStorage(KEYS.PRODUCTS, products);

    // Create Notification for the Farmer
    this.addNotification({
      user_id: newOrder.farmer_id,
      title: 'New Produce Order Received!',
      message: `${newOrder.consumer_name || 'A customer'} placed order ${newOrder.order_number} for ₹${newOrder.total_amount}.`,
      type: 'order',
      link: '/farmer/orders',
      is_read: false,
    });

    return newOrder;
  }

  updateOrderStatus(orderId: string, status: Order['status']): Order | undefined {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return undefined;

    order.status = status;
    order.updated_at = new Date().toISOString();
    setStorage(KEYS.ORDERS, orders);

    // Create notification for consumer
    this.addNotification({
      user_id: order.consumer_id,
      title: `Order Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
      message: `Your order ${order.order_number} from ${order.farmer_name || 'Farmer'} is now marked as ${status.replace(/_/g, ' ')}.`,
      type: 'order',
      link: '/consumer/orders',
      is_read: false,
    });

    return order;
  }

  // --- Worker Jobs & Applications ---
  getJobs(): WorkerJob[] {
    return getStorage<WorkerJob[]>(KEYS.JOBS, INITIAL_JOBS);
  }

  saveJob(job: WorkerJob): WorkerJob {
    const jobs = this.getJobs();
    const index = jobs.findIndex((j) => j.id === job.id);
    if (index >= 0) {
      jobs[index] = job;
    } else {
      jobs.unshift({ ...job, id: job.id || `job-${Date.now()}`, created_at: new Date().toISOString() });
    }
    setStorage(KEYS.JOBS, jobs);
    return index >= 0 ? jobs[index] : jobs[0];
  }

  getApplications(): WorkerApplication[] {
    return getStorage<WorkerApplication[]>(KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  }

  createApplication(app: Omit<WorkerApplication, 'id' | 'created_at' | 'updated_at'>): WorkerApplication {
    const apps = this.getApplications();
    const newApp: WorkerApplication = {
      ...app,
      id: `app-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    apps.unshift(newApp);
    setStorage(KEYS.APPLICATIONS, apps);

    // Update job applicant count
    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === app.job_id);
    if (job) {
      job.applicant_count = (job.applicant_count || 0) + 1;
      setStorage(KEYS.JOBS, jobs);

      // Notify farmer
      this.addNotification({
        user_id: job.farmer_id,
        title: 'Worker Applied to Job',
        message: `${app.worker?.name || 'A worker'} applied to "${job.title}".`,
        type: 'worker',
        link: '/farmer/jobs',
        is_read: false,
      });
    }

    return newApp;
  }

  updateApplicationStatus(appId: string, status: WorkerApplication['status']): WorkerApplication | undefined {
    const apps = this.getApplications();
    const app = apps.find((a) => a.id === appId);
    if (!app) return undefined;

    app.status = status;
    app.updated_at = new Date().toISOString();
    setStorage(KEYS.APPLICATIONS, apps);

    // If accepted, increment workers_hired on job
    if (status === 'accepted') {
      const jobs = this.getJobs();
      const job = jobs.find((j) => j.id === app.job_id);
      if (job) {
        job.workers_hired = (job.workers_hired || 0) + 1;
        setStorage(KEYS.JOBS, jobs);
      }
    }

    // Notify worker
    this.addNotification({
      user_id: app.worker_id,
      title: `Job Application ${status.toUpperCase()}`,
      message: `Your application has been marked as ${status}.`,
      type: 'job',
      link: '/worker/applications',
      is_read: false,
    });

    return app;
  }

  // --- Market Prices ---
  getMarketPrices(): MarketPrice[] {
    return getStorage<MarketPrice[]>(KEYS.MARKET_PRICES, INITIAL_MARKET_PRICES);
  }

  saveMarketPrices(prices: MarketPrice[]): void {
    setStorage(KEYS.MARKET_PRICES, prices);
  }

  // --- Weather ---
  getWeather(): WeatherData {
    return getStorage<WeatherData>(KEYS.WEATHER, INITIAL_WEATHER);
  }

  saveWeather(weather: WeatherData): void {
    setStorage(KEYS.WEATHER, weather);
  }

  // --- Articles ---
  getArticles(): Article[] {
    return getStorage<Article[]>(KEYS.ARTICLES, INITIAL_ARTICLES);
  }

  saveArticle(article: Article): Article {
    const articles = this.getArticles();
    const index = articles.findIndex((a) => a.id === article.id);
    if (index >= 0) {
      articles[index] = article;
    } else {
      articles.unshift({ ...article, id: `art-${Date.now()}`, created_at: new Date().toISOString() });
    }
    setStorage(KEYS.ARTICLES, articles);
    return article;
  }

  // --- Notifications ---
  getNotifications(userId: string): AppNotification[] {
    const notifs = getStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return notifs.filter((n) => n.user_id === userId);
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'created_at'>): AppNotification {
    const notifs = getStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    setStorage(KEYS.NOTIFICATIONS, notifs);
    return newNotif;
  }

  markNotificationRead(id: string): void {
    const notifs = getStorage<AppNotification[]>(KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const notif = notifs.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      setStorage(KEYS.NOTIFICATIONS, notifs);
    }
  }

  // --- Reviews ---
  getReviews(targetId?: string): Review[] {
    const reviews = getStorage<Review[]>(KEYS.REVIEWS, INITIAL_REVIEWS);
    if (targetId) {
      return reviews.filter((r) => r.target_id === targetId);
    }
    return reviews;
  }

  addReview(review: Omit<Review, 'id' | 'created_at'>): Review {
    const reviews = this.getReviews();
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    reviews.unshift(newRev);
    setStorage(KEYS.REVIEWS, reviews);
    return newRev;
  }

  // --- Active User Persistence ---
  getActiveUser(): UserProfile | null {
    try {
      const u = localStorage.getItem(KEYS.CURRENT_USER);
      if (!u) return null;
      return JSON.parse(u);
    } catch {
      return null;
    }
  }

  setActiveUser(user: UserProfile | null): void {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }
}

export const repository = new LocalStorageRepository();
