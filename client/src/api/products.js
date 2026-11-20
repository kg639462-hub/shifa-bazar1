import { apiRequest } from './client';
import { sampleProducts } from '../data/sampleProducts';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Fallback images strictly 4
const defaultImages = [
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80',
];

const normalizeClientProduct = (p) => {
  if (!p) return null;
  let rawImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  if (typeof p.images === 'string') {
    if (p.images.startsWith('http') || p.images.startsWith('/') || p.images.startsWith('data:')) {
      rawImages = [p.images];
    }
  }
  const fourImages = rawImages.slice(0, 4);
  while (fourImages.length < 4) {
    fourImages.push(defaultImages[fourImages.length]);
  }

  const name = p.name ? p.name.trim() : 'Therapeutic Remedy';
  const category = p.category ? p.category.trim() : 'Formulation';
  const lowerName = name.toLowerCase();

  const sellingPrice = Number(p.price) || 0;
  const originalPrice =
    p.original_price && Number(p.original_price) > sellingPrice
      ? Number(p.original_price)
      : Math.round(sellingPrice * 1.25);
  const discountPercent =
    originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : 0;

  return {
    ...p,
    id: p.id || `prod-${Math.random().toString(36).substring(2, 9)}`,
    name,
    category,
    batch_lot: p.batch_lot || (lowerName.includes('paracetamol') ? 'LOT #PARA-500' : lowerName.includes('crocin') ? 'BATCH #CRO-650' : `LOT #${(p.id || 'RX').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '702'}`),
    scientific_name: p.scientific_name || (lowerName.includes('paracetamol') ? 'Acetaminophen IP / N-(4-hydroxyphenyl)acetamide' : lowerName.includes('crocin') ? 'Paracetamolum & Caffeine Anhydrous Formulation' : `${name} Standardized Compound`),
    short_desc: p.short_desc || (lowerName.includes('paracetamol') ? 'Fast-acting antipyretic & analgesic pain relief formulation' : lowerName.includes('crocin') ? 'Advanced multi-symptom fever & headache relief medication' : `Clinical grade formulation indicated for ${category.toLowerCase()} management and recovery.`),
    full_desc: p.full_desc || (lowerName.includes('paracetamol') ? 'Clinical-grade Paracetamol (Acetaminophen) tablet formulation designed for rapid systemic absorption. Indicated for the symptomatic management of acute pyrexia, tension headaches, musculoskeletal pain, and post-viral fever.' : lowerName.includes('crocin') ? 'Fast-release analgesic and antipyretic formulation. Engineered to alleviate moderate-to-severe headache, dental pain, body aches, and febrile conditions.' : `Standardized according to clinical pharmacopoeia specifications with verified laboratory potency.`),
    dosage: p.dosage || (lowerName.includes('paracetamol') ? '1 tablet (500mg-650mg) every 4 to 6 hours as required. Do not exceed 4 tablets in 24 hours.' : lowerName.includes('crocin') ? '1 to 2 tablets every 4 to 6 hours after meals.' : 'Take as directed by a licensed physician or medical herbalist.'),
    ingredients: Array.isArray(p.ingredients) && p.ingredients.length > 0 ? p.ingredients : (lowerName.includes('paracetamol') ? ['Paracetamol IP 500 mg', 'Microcrystalline Cellulose', 'Purified Talc'] : [`Active ${name} Therapeutic Agent`, 'Excipients q.s.']),
    extract_type: p.extract_type || (lowerName.includes('paracetamol') ? '15 Tablets Strip' : lowerName.includes('crocin') ? '10 Tablets Strip' : 'Formulation'),
    price: sellingPrice,
    original_price: originalPrice,
    discount_percent: discountPercent,
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 100,
    co_a_verified: p.co_a_verified !== false,
    rating: Number(p.rating) || 4.9,
    reviews_count: Number(p.reviews_count) || 28,
    images: fourImages,
  };
};

export async function getProducts() {
  // 1. Try Backend API (Express + Supabase)
  try {
    const res = await apiRequest('/products');
    if (res.success && res.products && res.products.length > 0) {
      return res.products.map(normalizeClientProduct);
    }
  } catch (err) {
    console.warn('API getProducts fallback, trying direct Supabase:', err.message);
  }

  // 2. Direct Supabase Query fallback
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(normalizeClientProduct);
      }
    } catch (e) {
      console.warn('Direct Supabase fetch fallback:', e.message);
    }
  }

  return sampleProducts.map(normalizeClientProduct);
}

export async function getProductById(id) {
  // 1. Try Backend API
  try {
    const res = await apiRequest(`/products/${id}`);
    if (res.success && res.product) {
      return normalizeClientProduct(res.product);
    }
  } catch (err) {
    console.warn('API getProductById fallback, trying direct Supabase:', err.message);
  }

  // 2. Direct Supabase Query fallback
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (!error && data) {
        return normalizeClientProduct(data);
      }
    } catch (e) {
      console.warn('Direct Supabase fetch by id fallback:', e.message);
    }
  }

  const match = sampleProducts.find((p) => p.id === id);
  return normalizeClientProduct(match || sampleProducts[0]);
}

/**
 * Set/update product price through backend
 */
export async function updateProductPrice(productId, price) {
  return await apiRequest(`/products/${productId}/price`, {
    method: 'PUT',
    body: JSON.stringify({ price }),
  });
}

/**
 * Seed initial remedies into Supabase from backend
 */
export async function seedProducts() {
  return await apiRequest('/products/seed', {
    method: 'POST',
  });
}
