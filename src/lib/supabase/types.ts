export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CarStatus = 'pending' | 'approved' | 'rejected' | 'draft';
export type InquiryStatus = 'pending' | 'read' | 'replied' | 'archived';
export type InspectionStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled';
export type InspectionPlan = 'basic' | 'standard' | 'premium';
export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';
export type BlogStatus = 'draft' | 'published' | 'scheduled';
export type DealerStatus = 'pending' | 'approved' | 'suspended';
export type RegistrationRequestStatus = 'pending' | 'approved' | 'rejected';

/** Matches live `users` table */
export type DbUser = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  bio: string | null;
  listings_count: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
};

export type DbDealer = {
  id: string;
  user_id: string | null;
  company_name: string;
  logo_url: string | null;
  license_number: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  business_hours: Json | null;
  is_verified: boolean;
  status: DealerStatus;
  rating_avg: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
};

/** Matches live `cars` table — 'brand' column was renamed to 'make' in migration 004 */
export type DbCar = {
  id: string;
  seller_id: string | null;
  dealer_id: string | null;
  title: string;
  slug: string | null;
  make: string;          // was 'brand' in original schema; renamed in migration 004
  model: string;
  year: number;
  mileage: number | null;
  price: number;
  currency: string | null;
  condition: string | null;
  fuel_type: string | null;
  transmission: string | null;
  color: string | null;           // general color field
  exterior_color: string | null;  // more specific; may be same as color
  interior_color: string | null;
  body_type: string | null;
  engine: string | null;
  horsepower: number | null;
  city: string | null;
  description: string | null;
  features: Json;
  images: Json;
  status: CarStatus;
  is_featured: boolean;
  views_count: number;
  seller_name: string | null;
  seller_email: string | null;
  seller_phone: string | null;
  is_inspected?: boolean | null;
  inspection_rating?: number | null;
  inspection_notes?: string | null;
  inspected_at?: string | null;
  inspector_id?: string | null;
  inspector_name?: string | null;
  inspector_email?: string | null;
  inspector_phone?: string | null;
  created_at: string;
  updated_at: string;
};

export type DbInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  car_id: string | null;
  status: InquiryStatus;
  is_read: boolean;
  created_at: string;
};

export type DbInspection = {
  id: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  address: string;
  plan: InspectionPlan;
  plan_price: number;
  scheduled_date: string;
  time_slot: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: InspectionStatus;
  created_at: string;
};

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
};

export type DbBlog = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  images: string[];
  author_name: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  status: 'draft' | 'published';
  views: number;
  created_at: string;
  updated_at: string;
};

export type DbJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
  salary: string | null;
  description: string;
  requirements: string[];
  apply_google_form_url: string | null;
  apply_whatsapp_number: string | null;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
};

export type DbSEOSetting = {
  id: string;
  page_path: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  schema_markup: Json | null;
  created_at?: string;
  updated_at: string;
};

/** Matches live `site_settings` table — key/value store */
export type DbSiteSetting = {
  id: string;
  key: string;
  value: Json;
  updated_at: string;
};

export type DbRegistrationRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'buyer' | 'seller';
  message: string | null;
  status: RegistrationRequestStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      cars: {
        Row: DbCar;
        Insert: {
          id?: string;
          seller_id?: string | null;
          dealer_id?: string | null;
          title: string;
          slug?: string | null;
          make: string;
          model: string;
          year: number;
          mileage?: number | null;
          price: number;
          currency?: string | null;
          condition?: string | null;
          fuel_type?: string | null;
          transmission?: string | null;
          color?: string | null;
          exterior_color?: string | null;
          interior_color?: string | null;
          body_type?: string | null;
          engine?: string | null;
          horsepower?: number | null;
          city?: string | null;
          description?: string | null;
          features?: Json;
          images?: Json;
          status?: CarStatus;
          is_featured?: boolean;
          views_count?: number;
          seller_name?: string | null;
          seller_email?: string | null;
          seller_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cars']['Insert']>;
        Relationships: [];
      };
      inquiries: {
        Row: DbInquiry;
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          subject: string;
          message: string;
          car_id?: string | null;
          status?: InquiryStatus;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
        Relationships: [];
      };
      inspections: {
        Row: DbInspection;
        Insert: {
          id?: string;
          make: string;
          model: string;
          year: number;
          registration_number: string;
          address: string;
          plan?: InspectionPlan;
          plan_price?: number;
          scheduled_date: string;
          time_slot: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          status?: InspectionStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inspections']['Insert']>;
        Relationships: [];
      };
      blogs: {
        Row: DbBlog;
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          content: string;
          cover_image?: string | null;
          images?: string[];
          author_name?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          keywords?: string[];
          status?: 'draft' | 'published';
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blogs']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: DbCategory;
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      users: {
        Row: DbUser;
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          role?: UserRole;
          status?: UserStatus;
          avatar_url?: string | null;
          bio?: string | null;
          listings_count?: number;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      dealers: {
        Row: DbDealer;
        Insert: {
          id?: string;
          user_id?: string | null;
          company_name: string;
          logo_url?: string | null;
          license_number?: string | null;
          address?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          description?: string | null;
          business_hours?: Json | null;
          is_verified?: boolean;
          status?: DealerStatus;
          rating_avg?: number;
          total_reviews?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['dealers']['Insert']>;
        Relationships: [];
      };
      seo_settings: {
        Row: DbSEOSetting;
        Insert: {
          id?: string;
          page_path?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          canonical_url?: string | null;
          og_image?: string | null;
          schema_markup?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['seo_settings']['Insert']>;
        Relationships: [];
      };
      site_settings: {
        Row: DbSiteSetting;
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
        Relationships: [];
      };
      registration_requests: {
        Row: DbRegistrationRequest;
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          role: 'buyer' | 'seller';
          message?: string | null;
          status?: RegistrationRequestStatus;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['registration_requests']['Insert']>;
        Relationships: [];
      };
      jobs: {
        Row: DbJob;
        Insert: {
          id?: string;
          title: string;
          department: string;
          location?: string;
          type?: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
          salary?: string | null;
          description: string;
          requirements?: string[];
          apply_google_form_url?: string | null;
          apply_whatsapp_number?: string | null;
          status?: 'active' | 'closed';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_car_views: {
        Args: {
          car_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
