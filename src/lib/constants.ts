import { ProductCategory } from '../types';

export const AGRICULTURAL_UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'quintal', label: 'Quintal (100 kg)' },
  { value: 'ton', label: 'Tonne (1000 kg)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'piece', label: 'Piece / Count' },
  { value: 'dozen', label: 'Dozen (12 pcs)' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'bag', label: 'Bag' },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', name: 'Spices & Condiments', slug: 'spices', icon: 'Sparkles', is_active: true },
  { id: 'cat-2', name: 'Plantation Crops', slug: 'plantation', icon: 'Trees', is_active: true },
  { id: 'cat-3', name: 'Fresh Vegetables', slug: 'vegetables', icon: 'Carrot', is_active: true },
  { id: 'cat-4', name: 'Fresh Fruits', slug: 'fruits', icon: 'Apple', is_active: true },
  { id: 'cat-5', name: 'Cereals & Grains', slug: 'cereals', icon: 'Wheat', is_active: true },
  { id: 'cat-6', name: 'Pulses & Legumes', slug: 'pulses', icon: 'Cookie', is_active: true },
  { id: 'cat-7', name: 'Honey & Organic Dairy', slug: 'honey-dairy', icon: 'Milk', is_active: true },
  { id: 'cat-8', name: 'Arecanut & Betel', slug: 'arecanut', icon: 'Sprout', is_active: true },
  { id: 'cat-9', name: 'Coconut & Copra', slug: 'coconut', icon: 'CircleDot', is_active: true },
];

export const KARNATAKA_LOCATIONS = [
  { district: 'Dakshina Kannada', towns: ['Sullia', 'Puttur', 'Mangaluru', 'Belthangady', 'Bantwal', 'Moodbidri'], lat: 12.87, lon: 74.88 },
  { district: 'Udupi', towns: ['Udupi', 'Karkala', 'Kundapura', 'Brahmavara', 'Byndoor'], lat: 13.34, lon: 74.74 },
  { district: 'Chikkamagaluru', towns: ['Chikkamagaluru', 'Mudigere', 'Koppa', 'Sringeri', 'Tarikere'], lat: 13.31, lon: 75.77 },
  { district: 'Shivamogga', towns: ['Shivamogga', 'Thirthahalli', 'Sagara', 'Shikaripura', 'Bhadravati'], lat: 13.92, lon: 75.56 },
  { district: 'Kodagu (Coorg)', towns: ['Madikeri', 'Somwarpet', 'Virajpet', 'Gonikoppal', 'Kushalnagar'], lat: 12.42, lon: 75.73 },
  { district: 'Bengaluru Urban', towns: ['Bengaluru South', 'Bengaluru North', 'Yelahanka', 'Anekal'], lat: 12.97, lon: 77.59 },
  { district: 'Mysuru', towns: ['Mysuru', 'Hunsur', 'Nanjangud', 'Periyapatna', 'T. Narasipura'], lat: 12.29, lon: 76.63 },
  { district: 'Hassan', towns: ['Hassan', 'Sakleshpur', 'Belur', 'Alur', 'Arkalgud'], lat: 13.00, lon: 76.09 },
];

export const WORKER_SKILL_OPTIONS = [
  'Arecanut Tree Climbing',
  'Coconut Tree Climbing',
  'Pepper Harvesting & Processing',
  'Pesticide & Fertilizer Spraying',
  'Power Tiller / Tractor Operation',
  'Weeding & De-trashing',
  'Drip Irrigation Maintenance',
  'Paddy Transplanting & Reaping',
  'Coffee Berry Picking',
  'General Farm Labour',
];

