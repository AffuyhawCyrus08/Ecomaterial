import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { formatCurrency, getProductImage, getProductUnit } from '../utils/helpers';
import { useCart } from '../context/CartContext';

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart } = useCart();
  const [filters, setFilters] = React.useState({
    search: '',
    category_id: searchParams.get('category_id') ?? '',
    material_type: '',
  });
  const cartItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  React.useEffect(() => {
    const categoryId = searchParams.get('category_id') ?? '';
    setFilters((current) => current.category_id === categoryId ? current : { ...current, category_id: categoryId });
  }, [searchParams]);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll({
      ...filters,
      category_id: filters.category_id ? Number(filters.category_id) : undefined,
    }),
  });

  const getStockLabel = (product: { name: string; stock_quantity: number; material_type: string }) => {
    const unit = getProductUnit(product.name, product.material_type);
    return `${Number(product.stock_quantity).toLocaleString()} ${unit} available`;
  };

  const handleClearCategoryFilter = () => {
    setFilters((current) => ({ ...current, category_id: '' }));

    if (!searchParams.get('category_id')) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category_id');
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-light dark:border-neutral-dark bg-white dark:bg-background-dark px-4 py-3 md:px-10">
        <div className="flex items-center justify-between max-w-[1200px] mx-auto">
          <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-white">
            <div className="size-8 text-primary">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
              </svg>
            </div>
            <span className="font-bold">Waste2Value</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-neutral-light dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              Cart
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-slate-900 text-[11px] font-bold flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-lg px-4 py-2 bg-primary text-slate-900 text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8 md:px-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-light dark:border-slate-800 p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Filters</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search materials..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                  <button
                    type="button"
                    onClick={handleClearCategoryFilter}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-left text-slate-700 dark:text-slate-300"
                  >
                    All Categories
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Material Type</label>
                  <select
                    value={filters.material_type}
                    onChange={(e) => setFilters({ ...filters, material_type: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-neutral-light dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="plastic">Plastic</option>
                    <option value="fabric">Fabric</option>
                    <option value="other">Other</option>
                  </select>
                </div>


              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Browse Materials</h1>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {productsData?.total || 0} materials found
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {productsData?.products?.map((product: any) => (
                    <Link
                      key={product.product_id}
                      to={`/products/${product.product_id}`}
                      className="group bg-white dark:bg-surface-dark rounded-xl border border-neutral-light dark:border-slate-800 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="aspect-[4/3] bg-neutral-light dark:bg-slate-800 overflow-hidden">
                        <img
                          src={getProductImage(product.material_type, product.product_id, product.primary_image)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                          <span className="text-xs text-slate-400">{getStockLabel(product)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Products;
