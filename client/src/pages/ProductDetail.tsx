import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { formatCurrency, getProductImage, getProductUnit } from '../utils/helpers';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = React.useState(1);
  const cartItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(Number(id)),
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.product_id, quantity);
      navigate('/products');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Product not found</h1>
        <Link to="/products" className="mt-4 text-primary font-bold">Back to Products</Link>
      </div>
    );
  }

  const unit = getProductUnit(product.name, product.material_type);
  const primaryImage = product.images?.[0]?.image_path ?? product.primary_image;

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
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="aspect-square bg-neutral-light dark:bg-slate-800 rounded-xl overflow-hidden">
            <img
              src={getProductImage(product.material_type, product.product_id, primaryImage)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div>
            <nav className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              <Link to="/products" className="hover:text-primary">Products</Link>
              <span className="mx-2">/</span>
              <span>{product.name}</span>
            </nav>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white">{product.name}</h1>
            
            <div className="flex items-center gap-4 mt-4">
              <span className="text-3xl font-bold text-primary">{formatCurrency(product.price)}</span>
              <span className="text-slate-500 dark:text-slate-400">per {unit === 'pieces' ? 'piece' : unit}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                {product.material_type}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium capitalize">
                {product.condition}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium">
                SKU: {product.sku}
              </span>
            </div>

            <p className="mt-6 text-slate-600 dark:text-slate-400 leading-relaxed">
              {product.description}
            </p>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Available Stock</span>
                  <p className="font-bold text-slate-900 dark:text-white">{Number(product.stock_quantity).toLocaleString()} {unit}</p>
                </div>
                {unit === 'kg' && product.weight_kg && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Weight</span>
                    <p className="font-bold text-slate-900 dark:text-white">{Number(product.weight_kg).toLocaleString()} kg</p>
                  </div>
                )}
              </div>
            </div>

            {isAuthenticated && (
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center border border-neutral-light dark:border-slate-700 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-primary hover:bg-primary/90 text-slate-900 font-bold transition-colors"
                >
                  <span className="material-symbols-outlined">shopping_cart</span>
                  Add to Cart
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link> to add items to your cart
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
