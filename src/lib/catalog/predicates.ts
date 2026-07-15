import type { Product } from "./types";

export function isInStock(product: Product): boolean {
  return product.variants.some((v) => v.stock > 0);
}

export function isOnSale(product: Product): boolean {
  return (
    product.compareAtPrice !== undefined &&
    product.compareAtPrice.amount > product.price.amount
  );
}
