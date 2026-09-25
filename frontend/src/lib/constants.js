/**
 * @module lib/constants
 * @description Shared constants used across multiple pages/components.
 */

/** Gradient backgrounds for cards and decorative elements. */
export const GRADIENTS = [
  'linear-gradient(135deg, #A855F7, #EC4899)',
  'linear-gradient(135deg, #3B82F6, #A855F7)',
  'linear-gradient(135deg, #EC4899, #F97316)',
  'linear-gradient(135deg, #6366F1, #3B82F6)',
];

/** Shop product categories. */
export const SHOP_CATEGORIES = [
  'Books & Bibles', 'Christian Apparel', 'Church Supplies',
  'Musical Instruments', 'Handmade Crafts', 'Events & Conference Tickets',
  'Technology', 'Local Christian Businesses', 'Tutoring',
  'Photography', 'Graphic Design', 'Free Items',
];

/** Product condition options. */
export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Donate/Free'];

/** Prayer wall categories with color classes. */
export const PRAYER_CATEGORIES = [
  { value: 'Healing', label: 'Healing & Health', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'Guidance', label: 'Wisdom & Guidance', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'Thanksgiving', label: 'Thanksgiving & Praise', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Relationship', label: 'Family & Relationship', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { value: 'Faith', label: 'Faith & Spiritual Growth', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
];