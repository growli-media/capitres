import type {
  CategoryOption,
  Collection,
  Post,
  Product,
  ProductFilter,
  ProductSort,
} from "./types";
import { products } from "./data/products";
import { collections } from "./data/collections";
import { posts } from "./data/posts";
import { DEFAULT_CATEGORIES } from "./categories";
import { postgresProvider } from "./providers/postgres";
import { applyFilter, applySort } from "./filter-sort";
import { isInStock, isOnSale } from "./predicates";

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
  getCategories(): Promise<CategoryOption[]>;
  getPosts(): Promise<Post[]>;
  getPost(slug: string): Promise<Post | undefined>;
}

export { isInStock, isOnSale, applyFilter, applySort };

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
  async getCategories() {
    return DEFAULT_CATEGORIES;
  },
  async getPosts() {
    return [...posts].sort((a, b) => b.date.localeCompare(a.date));
  },
  async getPost(slug) {
    return posts.find((p) => p.slug === slug);
  },
};

/**
 * Swap this to change the commerce backend. `postgresProvider` is the
 * production catalog (products/collections/posts editable from /admin);
 * `localProvider` is the original hardcoded seed data, kept only as a
 * reference for `scripts/migrate.ts` and as a DB-less fallback.
 */
export const catalog: CatalogProvider = process.env.DATABASE_URL
  ? postgresProvider
  : localProvider;
