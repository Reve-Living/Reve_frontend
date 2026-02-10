export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  category: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  sort_order: number;
  products?: number[];
  products_data?: Product[];
}

export interface ProductImage {
  id: number;
  url: string;
}

export interface ProductVideo {
  id: number;
  url: string;
}

export interface ProductColor {
  id: number;
  name: string;
  hex_code?: string;
  image?: string;
}

export interface ProductSize {
  id: number;
  name: string;
}

export interface ProductStyle {
  id: number;
  name: string;
  options: ProductStyleOption[] | string[];
}

export interface ProductStyleOption {
  label: string;
  description?: string;
}

export interface ProductFabric {
  id: number;
  name: string;
  image_url: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: number;
  category_name?: string;
  subcategory?: number | null;
  subcategory_name?: string;
  category_slug?: string;
  subcategory_slug?: string;
  price: number;
  original_price?: number | null;
  discount_percentage?: number;
  description: string;
  short_description?: string;
  features: string[];
  faqs?: ProductFaq[];
  delivery_info?: string;
  returns_guarantee?: string;
  delivery_charges?: number;
  in_stock: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  rating: number;
  review_count: number;
  images: ProductImage[];
  videos: ProductVideo[];
  colors: ProductColor[];
  sizes: ProductSize[];
  styles: ProductStyle[];
  fabrics: ProductFabric[];
}

export interface OrderItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  style?: string;
}

export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  total_amount: number;
  delivery_charges: number;
  status: string;
  payment_method: string;
  payment_id?: string;
  created_at: string;
  items: OrderItem[];
}
