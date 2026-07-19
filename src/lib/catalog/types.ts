import type { StaticImageData } from "next/image";
import type { LocalizedString } from "@/lib/content";

/** A product category slug. Categories are editable from the admin, so
 * this is an open string rather than a fixed union — but "gift-cards"
 * stays a reserved slug that drives gift-card behaviour. */
export type Category = string;

/** A category as shown in nav and the admin — slug plus localized name. */
export interface CategoryOption {
  slug: string;
  title: LocalizedString;
  sortOrder: number;
}

export type Gender = "men" | "women" | "unisex";

/** Integer amount in Iraqi Dinar — Wayl's only settlement currency. */
export interface Money {
  amount: number;
  currency: "IQD";
}

/**
 * Local catalog data uses Next's static `import img from "*.jpg"` (gets
 * blur placeholders + bundling). DB-backed products (added through the
 * admin) store a plain uploaded URL instead. `next/image` accepts both.
 */
export type ImageSource = StaticImageData | string;

export interface ProductImage {
  src: ImageSource;
  alt: LocalizedString;
}

export interface ProductColor {
  key: string;
  hex: string;
  name: LocalizedString;
}

export interface ProductVariant {
  id: string;
  size: string;
  /** Units on hand. 0 = sold out for this size. */
  stock: number;
}

export interface Review {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string;
  /** Reviews are user-generated quotes — kept in their original language. */
  text: string;
}

export interface Product {
  id: string;
  slug: string;
  title: LocalizedString;
  description: LocalizedString;
  /** Longer heritage narrative shown in "The story" on the PDP. */
  story?: LocalizedString;
  details: LocalizedString[];
  category: Category;
  gender: Gender;
  price: Money;
  compareAtPrice?: Money;
  colors: ProductColor[];
  variants: ProductVariant[];
  images: ProductImage[];
  collectionSlugs: string[];
  isNew?: boolean;
  featured?: boolean;
  releaseDate: string;
  reviews: Review[];
  /** Gift cards are configured, not size-picked. */
  giftCard?: {
    denominations: number[];
  };
}

export interface Collection {
  slug: string;
  title: LocalizedString;
  tagline: LocalizedString;
  description: LocalizedString;
  heroImage: ProductImage;
  theme: "dark" | "light";
  /** Archived drops render a story page with a waitlist instead of a grid. */
  archived?: boolean;
  order: number;
}

export type PostBlock =
  | { type: "p"; text: LocalizedString }
  | { type: "h2"; text: LocalizedString }
  | { type: "quote"; text: LocalizedString; attribution?: LocalizedString }
  | { type: "image"; image: ProductImage };

export interface Post {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  cover: ProductImage;
  date: string;
  readingMinutes: number;
  author: string;
  body: PostBlock[];
  relatedProductSlugs: string[];
}

export interface ProductFilter {
  category?: Category | "all";
  gender?: Gender;
  sizes?: string[];
  colors?: string[];
  maxPrice?: number;
  minPrice?: number;
  inStockOnly?: boolean;
  collection?: string;
  onSale?: boolean;
  isNew?: boolean;
}

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc";
