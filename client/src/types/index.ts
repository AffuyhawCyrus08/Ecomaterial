// User types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product types
export interface Product {
  product_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: number;
  category_name?: string;
  sku: string;
  weight_kg: number | null;
  dimensions_cm: string | null;
  material_type: 'plastic' | 'metal' | 'fabric' | 'other';
  condition: 'new' | 'recycled' | 'used' | 'scrap';
  is_active: boolean;
  primary_image?: string;
  images?: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  image_id: number;
  product_id: number;
  image_path: string;
  alt_text: string | null;
  display_order: number;
}

export interface ProductsResponse {
  total: number;
  limit: number;
  offset: number;
  products: Product[];
}

// Category types
export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  parent_category_id: number | null;
  parent_name?: string;
  product_count?: number;
}

// Cart types
export interface CartItem {
  cart_item_id: number;
  quantity: number;
  added_at: string;
  product_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  material_type: string;
  condition: string;
  primary_image: string | null;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// Order types
export interface Order {
  order_id: number;
  user_id: number;
  order_date: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'paid' | 'unpaid' | 'refunded' | 'pending';
  payment_method: string | null;
  tracking_number: string | null;
  item_count?: number;
  items?: OrderItem[];
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  name?: string;
  primary_image?: string;
}

// Address types
export interface Address {
  address_id: number;
  user_id: number;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

// API Response types
export interface ApiError {
  error: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  userId: number;
  email: string;
}

// Dashboard stats
export interface DashboardStats {
  totalSales: number;
  newLeads: number;
  activeListings: number;
  stockLevels: number;
  recentOrders: number;
}
