import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { formatCurrency, getProductImage } from '../utils/helpers';

interface Address {
  address_id: number;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province?: string;
  postal_code: string;
  country: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const queryClient = useQueryClient();
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [newAddress, setNewAddress] = useState({
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'USA',
    is_default_shipping: true,
    is_default_billing: true,
  });

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await api.get('/users/addresses');
      return response.data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { shipping_address_id: number; billing_address_id: number; payment_method: string }) => {
      const response = await api.post('/orders', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      clearCart();
      setShowPaymentPrompt(false);
      setPhoneNumber('');
      setPaymentError('');
      navigate(`/orders/${data.orderId}`);
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: typeof newAddress) => {
      const response = await api.post('/users/addresses', data);
      return response.data;
    },
    onSuccess: (newAddressData) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setSelectedAddress(newAddressData.addressId);
      setShowNewAddress(false);
      setNewAddress({
        address_line1: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'USA',
        is_default_shipping: true,
        is_default_billing: true,
      });
    },
  });

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert('Please select a shipping address');
      return;
    }

    setPaymentError('');
    setShowPaymentPrompt(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedAddress) {
      setShowPaymentPrompt(false);
      return;
    }

    const sanitizedNumber = phoneNumber.replace(/\D/g, '');

    if (sanitizedNumber.length !== 9) {
      setPaymentError('Enter a valid 9-digit mobile money number.');
      return;
    }

    createOrderMutation.mutate({
      shipping_address_id: selectedAddress,
      billing_address_id: selectedAddress,
      payment_method: `Mobile Money (233${sanitizedNumber})`,
    });
  };

  const subtotal = cart?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const shipping = subtotal > 500 ? 0 : 25;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-24 h-24 text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Add some materials to your cart to checkout</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-[#13ec80] text-black font-medium rounded-lg hover:bg-[#0fc76a] transition-colors"
          >
            Browse Materials
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Shipping Address</h2>

              {addresses.length > 0 && !showNewAddress && (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.address_id}
                      className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddress === address.address_id
                          ? 'border-[#13ec80] bg-[#13ec80]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === address.address_id}
                        onChange={() => setSelectedAddress(address.address_id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">Saved Address</span>
                          {(address.is_default_shipping || address.is_default_billing) && (
                            <span className="px-2 py-0.5 text-xs bg-[#13ec80]/20 text-[#13ec80] rounded">Default</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">
                          {address.address_line1}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {address.city}, {address.state_province} {address.postal_code}
                        </p>
                      </div>
                    </label>
                  ))}
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="w-full py-3 border border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
                  >
                    + Add New Address
                  </button>
                </div>
              )}

              {(addresses.length === 0 || showNewAddress) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={newAddress.address_line1}
                      onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                      className="w-full px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#13ec80]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">City</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#13ec80]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Region</label>
                      <input
                        type="text"
                        value={newAddress.state_province}
                        onChange={(e) => setNewAddress({ ...newAddress, state_province: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#13ec80]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">GPS Address</label>
                      <input
                        type="text"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#13ec80]"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {showNewAddress && (
                      <button
                        onClick={() => setShowNewAddress(false)}
                        className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => addAddressMutation.mutate(newAddress)}
                      disabled={addAddressMutation.isPending}
                      className="px-4 py-2 bg-[#13ec80] text-black font-medium rounded-lg hover:bg-[#0fc76a] transition-colors disabled:opacity-50"
                    >
                      {addAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Order Items</h2>
              <div className="space-y-4">
                {cart?.items?.map((item) => (
                  <div key={item.cart_item_id} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-0">
                    <div className="w-20 h-20 bg-[#0a0a0a] rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={getProductImage(item.material_type, item.product_id, item.primary_image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name || 'Product'}</h3>
                      <p className="text-sm text-gray-400">
                        {item.material_type} • {item.condition}
                      </p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/10 sticky top-24">
              <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (8%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {shipping === 0 && (
                <div className="mb-4 p-3 bg-[#13ec80]/10 rounded-lg text-[#13ec80] text-sm">
                  You qualify for free shipping on orders over GH₵500!
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!selectedAddress || createOrderMutation.isPending}
                className="w-full py-3 bg-[#13ec80] text-black font-medium rounded-lg hover:bg-[#0fc76a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showPaymentPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="relative w-full max-w-sm rounded-[28px] bg-[#f3f5f7] px-6 pb-6 pt-8 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                if (!createOrderMutation.isPending) {
                  setShowPaymentPrompt(false);
                  setPaymentError('');
                }
              }}
              className="absolute right-5 top-4 text-[#9aaabd] transition-colors hover:text-[#64748b]"
              aria-label="Close payment prompt"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d8e4ef] text-[#9aaabd]">
              <span className="material-symbols-outlined text-[28px]">account_balance</span>
            </div>

            <h2 className="text-center text-[2rem] font-black tracking-tight text-[#0f172a]">
              Pay {formatCurrency(total)}
            </h2>

            <p className="mx-auto mt-4 max-w-[240px] text-center text-sm font-medium leading-6 text-[#334155]">
              Enter a valid mobile money number below to process your payment.
            </p>

            <div className="mt-6 rounded-[22px] bg-[#e8edf2] p-5">
              <label className="mb-3 block text-sm font-semibold text-[#9ab0c2]">
                Enter Phone Number
              </label>

              <div className="flex overflow-hidden rounded-xl border border-[#2563eb] bg-white">
                <div className="flex items-center gap-1 border-r border-slate-200 px-4 text-sm text-slate-500">
                  <span>233</span>
                  <span className="material-symbols-outlined text-base">expand_more</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9));
                    if (paymentError) {
                      setPaymentError('');
                    }
                  }}
                  placeholder="24xxxxxxx"
                  className="w-full bg-white px-4 py-4 text-base text-slate-900 outline-none placeholder:text-slate-300"
                />
              </div>

              {paymentError && (
                <p className="mt-3 text-sm font-medium text-red-500">{paymentError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handlePaymentSubmit}
              disabled={createOrderMutation.isPending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8e4db] px-4 py-4 text-base font-bold text-white transition-colors hover:bg-[#9fd7cc] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              {createOrderMutation.isPending ? 'Processing Payment...' : 'Pay with Mobile Money'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
