import React from "react";
import ProductCard from "./ProductCard";
import { ProductSkeletonGrid } from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";

export default function ProductGrid({
  products = [],
  loading = false,
  emptyTitle,
  emptyMessage,
  onReset,
}) {
  if (loading) {
    return <ProductSkeletonGrid count={8} />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || "No Products Found"}
        message={emptyMessage || "Try searching with different keywords or clearing applied filters."}
        onReset={onReset}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
