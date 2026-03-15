import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency, getProductImage } from '../utils/helpers';

const Cart: React.FC = () => {
  const { cart, isLoading, updateQuantity, removeItem } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center px-4">
        <span className="material-symbols-outlined text-6xl text-slate-400">shopping_cart</span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Start shopping to add items to your cart</p>
        <Link to="/products" className="mt-6 px-6 py-3 bg-primary text-slate-900 rounded-lg font-bold hover:bg-primary/90">
          Browse Materials
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="max-w-[1200px] mx-auto px-4 py-8 md:px-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.cart_item_id}
                className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-light dark:border-slate-800 p-6"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={getProductImage(item.material_type, item.product_id, item.primary_image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
                      {item.material_type} - {item.condition}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-neutral-light dark:border-slate-700 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                          className="px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="px-3 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-slate-500">{formatCurrency(item.price)}/kg</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.cart_item_id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-neutral-light dark:border-slate-800 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal ({cart.itemCount} items)</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                  <span className="font-medium text-slate-900 dark:text-white">Calculated at checkout</span>
                </div>
                <div className="border-t border-neutral-light dark:border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(cart.subtotal)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-slate-900 font-bold transition-colors"
              >
                Proceed to Checkout
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>

              <Link
                to="/products"
                className="mt-3 w-full flex items-center justify-center py-3 px-4 text-slate-600 dark:text-slate-400 font-medium hover:text-primary transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
