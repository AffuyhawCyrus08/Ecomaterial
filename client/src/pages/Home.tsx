import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '../services/api';
import { formatCurrency, getProductImage } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getAll({ limit: 5 }),
  });
  
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const displayCategoryName = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized === 'refined plastic') return 'Refined plastics';
    return name;
  };

  const featuredCategories = (categories ?? [])
    .map((category: any) => ({
      ...category,
      displayName: displayCategoryName(category.name),
    }))
    .filter((category: any) => {
      const normalizedName = category.name.toLowerCase();
      const normalizedDescription = String(category.description ?? '').toLowerCase();

      if (normalizedName.includes('mixed aluminum scrap') || normalizedDescription.includes('mixed aluminum scrap')) {
        return false;
      }

      return normalizedName === 'refined plastic' || normalizedName === 'discarded fabrics';
    })
    .sort((a: any, b: any) => {
      const order = ['Refined plastics', 'Discarded Fabrics'];
      return order.indexOf(a.displayName) - order.indexOf(b.displayName);
    });

  const getCategoryImage = (displayName: string) => {
    const normalized = displayName.toLowerCase();

    if (normalized.includes('plastic')) {
      return '/refine.jpg';
    }

    if (normalized.includes('fabric')) {
      return '/Discard.jpg';
    }

    return getProductImage('other', 1);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-neutral-light dark:border-neutral-dark bg-white dark:bg-background-dark px-4 py-3 md:px-10">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="size-8 text-primary">
              <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 className="hidden md:block text-lg font-bold leading-tight tracking-[-0.015em]">Waste2Value</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-6 lg:gap-9">
            <Link className="text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary text-sm font-medium leading-normal transition-colors" to="/products">Shop</Link>
            <Link className="text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary text-sm font-medium leading-normal transition-colors" to="/dashboard">Account</Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4 md:gap-8 ml-4">
          <div className="hidden sm:flex flex-col min-w-40 h-10 w-full max-w-[320px]">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-neutral-light dark:border-neutral-dark focus-within:border-primary transition-colors overflow-hidden">
              <div className="text-slate-500 flex border-none bg-neutral-light dark:bg-neutral-dark items-center justify-center pl-3">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg rounded-l-none border-none bg-neutral-light dark:bg-neutral-dark text-slate-900 dark:text-white focus:ring-0 h-full placeholder:text-slate-500 px-2 text-sm font-normal leading-normal" placeholder="Search materials..." />
            </div>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent hover:bg-neutral-light dark:hover:bg-neutral-dark text-slate-900 dark:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-sm font-bold leading-normal tracking-[0.015em] transition-all">
                  <span className="material-symbols-outlined mr-1">shopping_cart</span>
                  Cart
                </Link>
                <Link to="/dashboard" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden lg:flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent hover:bg-neutral-light dark:hover:bg-neutral-dark text-slate-900 dark:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-sm font-bold leading-normal tracking-[0.015em] transition-all">
                  Sign In
                </Link>
                <Link to="/register" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary/90 text-slate-900 text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center py-5 px-4 md:px-10">
        <div className="layout-content-container flex flex-col max-w-[1200px] flex-1 gap-12">
          {/* Hero Section */}
          <section>
            <div className="relative overflow-hidden rounded-xl bg-slate-900 text-white min-h-[480px] flex flex-col justify-end p-8 md:p-12 lg:p-16">
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800"></div>
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              <div className="relative z-20 max-w-2xl flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider w-fit">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Verified Suppliers
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                    Sustainable Sourcing for <span className="text-primary">Industrial Materials</span>
                  </h1>
                  <p className="text-lg text-slate-200 max-w-xl leading-relaxed">
                    The global marketplace for refined recycled plastics, sorted metal scraps, and industrial textiles. Connect directly with verified recyclers.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <Link to="/products" className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-primary/90 text-slate-900 text-base font-bold transition-all transform hover:translate-y-[-1px]">
                    <span>Browse Materials</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </Link>
                  <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-base font-bold transition-all">
                    <span>Start Selling</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-y border-neutral-light dark:border-neutral-dark py-8">
            <div className="flex flex-col gap-1 items-center md:items-start px-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white">2.5M+</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tons Recycled</span>
            </div>
            <div className="flex flex-col gap-1 items-center md:items-start px-4 border-l border-neutral-light dark:border-neutral-dark">
              <span className="text-3xl font-black text-slate-900 dark:text-white">1,200+</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Verified Suppliers</span>
            </div>
            <div className="flex flex-col gap-1 items-center md:items-start px-4 border-l border-neutral-light dark:border-neutral-dark">
              <span className="text-3xl font-black text-slate-900 dark:text-white">98%</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Quality Assured</span>
            </div>
            <div className="flex flex-col gap-1 items-center md:items-start px-4 border-l border-neutral-light dark:border-neutral-dark">
              <span className="text-3xl font-black text-slate-900 dark:text-white">Global</span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Shipping Network</span>
            </div>
          </section>

          {/* Categories Section */}
          <section className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Explore Categories</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Source high-grade materials for your production line</p>
              </div>
              <Link className="hidden md:flex items-center gap-1 text-primary font-bold text-sm hover:underline" to="/products">
                View All Categories
                <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
              {/* Category Cards */}
              {featuredCategories.map((category: any) => {
                const displayName = category.displayName;
                return (
                  <Link key={category.category_id} to={`/products?category_id=${category.category_id}`} className="group flex flex-col rounded-xl overflow-hidden bg-white dark:bg-neutral-dark border border-neutral-light dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                    <div className="aspect-[4/3] bg-neutral-light dark:bg-slate-800 relative overflow-hidden">
                      <img
                        src={getCategoryImage(displayName)}
                        alt={displayName}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(event) => {
                          if (displayName.toLowerCase().includes('plastic')) {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getProductImage('plastic', 1);
                          }

                          if (displayName.toLowerCase().includes('fabric')) {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = getProductImage('fabric', 1);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/25"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 transition-transform duration-500 group-hover:scale-110"></div>
                      <div className="absolute top-4 right-4 bg-white dark:bg-slate-900 rounded-full p-2 shadow-lg z-10">
                        <span className="material-symbols-outlined text-primary">
                          {displayName.toLowerCase().includes('plastic') ? 'recycling' : 
                           displayName.toLowerCase().includes('metal') ? 'construction' : 'checkroom'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col p-5 gap-3 h-full">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{displayName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{category.description}</p>
                      </div>
                      <div className="mt-auto pt-4 border-t border-neutral-light dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{category.product_count || 0}+ Listings</span>
                        <span className="material-symbols-outlined text-primary transform translate-x-0 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Listings */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Listings</h2>
            </div>
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-light dark:border-neutral-dark bg-white dark:bg-neutral-dark shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-neutral-light/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-6 py-4">Material Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Quantity Available</th>
                      <th className="px-6 py-4">Price / Ton</th>
                      <th className="px-6 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-light dark:divide-slate-800">
                    {productsData?.products?.map((product: any) => (
                      <tr key={product.product_id} className="hover:bg-neutral-light/30 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                          <div className="w-10 h-10 rounded overflow-hidden shrink-0">
                            <img src={getProductImage(product.material_type, product.product_id)} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          {product.name}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 capitalize">{product.material_type}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white">{Number(product.stock_quantity).toLocaleString()} kg</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4">
                          <Link to={`/products/${product.product_id}`} className="text-primary hover:text-primary/80 font-bold text-sm">View Details</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* CTA Banner */}
          <section className="rounded-xl bg-slate-900 dark:bg-primary/10 overflow-hidden relative">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/20 skew-x-[-20deg] translate-x-12"></div>
            <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex flex-col gap-4 max-w-xl">
                <h2 className="text-3xl font-bold text-white dark:text-white">Ready to Monetize Your Waste?</h2>
                <p className="text-slate-300 dark:text-slate-300">Join over 5,000 industrial facilities turning their waste stream into a revenue stream. List your materials in minutes.</p>
              </div>
              <div className="flex gap-4">
                <Link to="/register" className="flex items-center justify-center gap-2 rounded-lg h-12 px-8 bg-primary hover:bg-primary/90 text-slate-900 text-base font-bold transition-colors">
                  Become a Seller
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-light dark:border-neutral-dark bg-white dark:bg-background-dark py-12 px-4 md:px-10">
        <div className="flex flex-col md:flex-row justify-between gap-12 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
              <div className="size-6 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                </svg>
              </div>
              Waste2Value
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Connecting industries for a circular economy. Transforming waste into worth since 2023.</p>
          </div>
          <div className="flex gap-16 flex-wrap">
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-white">Platform</h4>
              <Link className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" to="/products">Browse Materials</Link>
              <Link className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" to="/register">Sell Waste</Link>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-white">Company</h4>
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">About Us</a>
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">Sustainability</a>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-slate-900 dark:text-white">Support</h4>
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">Help Center</a>
              <a className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary" href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-light dark:border-neutral-dark mt-12 pt-8 text-center text-sm text-slate-400">
          &copy; 2024 Waste2Value. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
