import { z } from 'zod';

export const CarListingSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number'),
  mileage: z.string().optional(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric']),
  transmission: z.enum(['automatic', 'manual']),
  engineCapacity: z.string().min(1, 'Engine capacity is required'),
  bodyType: z.string().optional().default('Sedan'),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  price: z.string().min(1, 'Price is required'),
  sellerName: z.string().min(1, 'Seller name is required'),
  sellerPhone: z.string().min(1, 'Seller phone is required'),
  description: z.string().optional(),
  features: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).max(10, 'Maximum 10 images allowed').optional().default([]),
});

export const InquirySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
  carId: z.string().uuid().optional(),
});

export const InspectionBookingSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.string().regex(/^\d{4}$/),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  address: z.string().min(1, 'Address is required'),
  plan: z.enum(['basic', 'standard', 'premium']),
  date: z.string().min(1, 'Date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  customerName: z.string().min(1, 'Name is required'),
  customerPhone: z.string().min(1, 'Phone is required'),
  customerEmail: z.string().email().optional(),
});

export const DealerApplicationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  license_number: z.string().min(1, 'License number is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required').max(5000),
});

export const AdminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const CarCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(2100),
  price: z.number().int().min(0),
  mileage: z.number().int().min(0).optional(),
  transmission: z.string().optional(),
  fuel_type: z.string().optional(),
  body_type: z.string().optional(),
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  engine: z.string().optional(),
  horsepower: z.number().int().optional(),
  condition: z.string().optional(),
  city: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'draft']).optional(),
  is_featured: z.boolean().optional(),
  slug: z.string().optional(),
  seller_id: z.string().uuid().optional(),
  dealer_id: z.string().uuid().optional(),
  currency: z.string().optional(),
  seller_name: z.string().optional(),
  seller_email: z.string().optional(),
  seller_phone: z.string().optional(),
});

export const RegistrationRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['buyer', 'seller'], { message: 'Please select a role' }),
  message: z.string().max(1000).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const BlogCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'scheduled']).optional(),
  published_at: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  focus_keyword: z.string().optional(),
});
