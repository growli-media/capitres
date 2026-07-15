import type { Product, ProductFilter, ProductSort } from "./types";
import { isInStock, isOnSale } from "./predicates";

/** Shared by every CatalogProvider so filtering/sorting behaves identically
 * regardless of where the product list came from. */
export function applyFilter(
  list: Product[],
  filter?: ProductFilter,
): Product[] {
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

export function applySort(list: Product[], sort?: ProductSort): Product[] {
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
