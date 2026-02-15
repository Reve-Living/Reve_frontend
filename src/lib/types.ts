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
  image_url?: string;
  image?: string;
}

export interface ProductSize {
  id: number;
  name: string;
  description?: string;
  price_delta?: number;
}

export interface ProductStyle {
  id: number;
  size?: number | null;
  size_name?: string;
  is_shared?: boolean;
  name: string;
  icon_url?: string;
  options: ProductStyleOption[] | string[];
}

export interface ProductStyleOption {
  label: string;
  description?: string;
  icon_url?: string;
  price_delta?: number;
  size?: string;
}

export interface ProductFabric {
  id: number;
  name: string;
  image_url: string;
  is_shared?: boolean;
  colors?: ProductColor[];
}

export interface ProductMattress {
  id: number;
  name?: string;
  description?: string;
  image_url?: string;
  price?: number | string | null;
  source_product?: number | null;
}

export interface FilterOption {
  id: number;
  name: string;
  slug: string;
  color_code?: string | null;
  icon_url?: string;
  price_delta?: number;
  is_wingback?: boolean;
  metadata?: Record<string, unknown>;
  product_count?: number;
}

export interface FilterType {
  id: number;
  name: string;
  slug: string;
  display_type: string;
  icon_url?: string;
  display_hint?: string;
  is_default?: boolean;
  is_expanded_by_default: boolean;
  options: FilterOption[];
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductDimensionRow {
  measurement: string;
  values: Record<string, string>;
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
  dimensions?: ProductDimensionRow[];
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
  mattresses?: ProductMattress[];
  filters?: FilterType[];
  computed_dimensions?: ProductDimensionRow[];
  dimension_template?: number | null;
  dimension_template_name?: string;
  wingback_width_delta_cm?: number;
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
   dimension?: string;
   dimension_details?: string;
   selected_variants?: Record<string, string>;
   extras_total?: number;
   include_dimension?: boolean;
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

export interface Review {
  id: number;
  product: number;
  product_name?: string;
  name: string;
  rating: number;
  comment: string;
  is_visible?: boolean;
  created_at?: string;
}
