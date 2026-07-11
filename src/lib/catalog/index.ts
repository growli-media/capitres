import type {
  Collection,
  Post,
  Product,
  ProductFilter,
  ProductSort,
} from "./types";
import { products } from "./data/products";
import { collections } from "./data/collections";
import { posts } from "./data/posts";

/**
 * Headless catalog boundary.
 *
 * Every page reads through `catalog` (a CatalogProvider) rather than
 * importing data modules directly. To move to Sanity, Prisma/Postgres or
 * Shopify later, implement this interface and swap the export at the
 * bottom of this file — nothing else in the app changes.
 */
export interface CatalogProvider {
  getProducts(filter?: ProductFilter, sort?: ProductSort): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | undefined>;
  getCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | undefined>;
  getPosts(): Promise<Post[]>;
  getPost(slug: string): Promise<Post | undefined>;
}

export function isInStock(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

export function isOnSale(product: Product): boolean {
  return (
    product.compareAtPrice !== undefined &&
    product.compareAtPrice.amount > product.price.amount
  );
}

function applyFilter(list: Product[], filter?: ProductFilter): Product[] {
  if (!filter) return list;
  return list.filter((p) => {
    if (filter.category && filter.category !== "all" && p.category !== filter.category)
      return false;
    if (filter.gender && p.gender !== filter.gender && p.gender !== "unisex")
      return false;
    if (filter.collection && !p.collectionSlugs.includes(filter.collection))
      return false;
    if (filter.sizes?.length) {
      const hasSize = p.variants.some(
        (v) => filter.sizes!.includes(v.size) && v.stock > 0,
      );
      if (!hasSize) return false;
    }
    if (filter.colors?.length) {
      const hasColor = p.colors.some((c) => filter.colors!.includes(c.key));
      if (!hasColor) return false;
    }
    if (filter.minPrice !== undefined && p.price.amount < filter.minPrice)
      return false;
    if (filter.maxPrice !== undefined && p.price.amount > filter.maxPrice)
      return false;
    if (filter.inStockOnly && !isInStock(p)) return false;
    if (filter.onSale && !isOnSale(p)) return false;
    if (filter.isNew && !p.isNew) return false;
    return true;
  });
}

function applySort(list: Product[], sort?: ProductSort): Product[] {
  const sorted = [...list];
  switch (sort) {
    case "newest":
      sorted.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
      break;
    case "price-asc":
      sorted.sort((a, b) => a.price.amount - b.price.amount);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price.amount - a.price.amount);
      break;
    case "featured":
    default:
      sorted.sort(
        (a, b) =>
          Number(b.featured ?? false) - Number(a.featured ?? false) ||
          b.releaseDate.localeCompare(a.releaseDate),
      );
  }
  return sorted;
}

const localProvider: CatalogProvider = {
  async getProducts(filter, sort) {
    return applySort(applyFilter(products, filter), sort);
  },
  async getProduct(slug) {
    return products.find((p) => p.slug === slug);
  },
  async getCollections() {
    return [...collections].sort((a, b) => a.order - b.order);
  },
  async getCollection(slug) {
    return collections.find((c) => c.slug === slug);
  },
  async getPosts() {
    return [...posts].sort((a, b) => b.date.localeCompare(a.date));
  },
  async getPost(slug) {
    return posts.find((p) => p.slug === slug);
  },
};

/** Swap this export to change the commerce backend. */
export const catalog: CatalogProvider = localProvider;

/** Sync accessors for client components (local provider only). */
export function getProductBySlugSync(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllProductsSync(): Product[] {
  return products;
}
