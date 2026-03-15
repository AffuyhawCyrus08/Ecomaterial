The following implementation guide details the frontend architecture and design for an e-commerce platform selling refined plastic products, metal scraps, and discarded fabrics, adhering strictly to the locked architectural decisions.

### frontend.md

This guide outlines the frontend implementation using React with Vite, focusing on a premium, SaaS-style user interface and experience. It emphasizes clarity, elegance, efficiency, and robustness for an enterprise-ready product.

#### 1. Component Structure

The application will be built upon a robust, consistent component-based design system, facilitating reusability and maintainability. Key components will be organized into logical directories (e.g., `components/common`, `components/layout`, `components/features`).

**Common UI Components:**
These are foundational, reusable elements.

*   `Button`: Primary, secondary, tertiary, and icon-only variants.
*   `Input`: Text, number, password, textarea, select, file input.
*   `Modal`: Generic modal wrapper for various dialogs (e.g., confirmation, forms).
*   `Card`: Versatile container for content, with configurable shadow and padding.
*   `Table`: Displays tabular data efficiently, supporting pagination, sorting, and filtering.
*   `Pagination`: Navigates through lists of items.
*   `Dropdown`: Menu for contextual actions or navigation.
*   `LoadingSpinner/Skeleton`: Visual feedback for data fetching.
*   `AlertDialog/Toast`: For notifications and user feedback.
*   `Icon`: Wrapper for SVG icons, ensuring consistent sizing and styling.

**Layout Components:**
These structure the overall page.

*   `Sidebar`: Navigation for primary sections (e.g., Dashboard, Products, Orders, Users, Settings). Differentiates visibility based on `admin-user` RBAC roles.
*   `TopNavigation`: Includes branding, user profile/avatar, global search, and notifications.
*   `PageHeader`: Consistent title and breadcrumbs for each major section.
*   `MainContentArea`: Wrapper for the primary content of each page.

**Feature-Specific Components:**
These are tailored for the e-commerce functionality.

*   `ProductCard`: Displays individual product details (image, name, price, short description). Example structure:
    ```tsx
    // src/components/features/ProductCard.tsx
    import React from 'react';
    import { Button } from '../common/Button'; // Assuming Button is a common UI component

    interface Product {
      id: string;
      name: string;
      description: string;
      price: number;
      imageUrl: string;
    }

    interface ProductCardProps {
      product: Product;
      onAddToCart: (productId: string) => void;
    }

    const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
      return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4">
          <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-md mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-indigo-600">${product.price.toFixed(2)}</span>
            <Button variant="primary" onClick={() => onAddToCart(product.id)}>Add to Cart</Button>
          </div>
        </div>
      );
    };

    export default ProductCard;
    ```
*   `ProductDetails`: Detailed view of a single product.
*   `CartItem`: Represents an item within the shopping cart.
*   `CartSummary`: Displays total items and price in the cart.
*   `CheckoutForm`: Collects shipping, billing, and payment information.
*   `OrderSummary`: Displays details of a placed order.
*   `UserProfileForm`: Manages user profile information.
*   `AdminProductTable`: Table for `admin` users to manage `products` (CRUD operations).
*   `UserManagementTable`: Table for `admin` users to manage other users.

#### 2. State Management

For a React + Vite application with complex SaaS features, a combination of approaches will be used to manage application state effectively:

1.  **React Query (TanStack Query):** This will be the primary tool for managing server-side state (fetching, caching, synchronizing, and updating data from the backend). It handles loading, error, and success states automatically, reducing boilerplate. All interactions with the `products` table, user data, orders, etc., will leverage React Query.
    *   **Example (Fetching products):**
        ```tsx
        // src/hooks/useProducts.ts
        import { useQuery } from '@tanstack/react-query';

        const fetchProducts = async () => {
          // Assuming session-based auth, browser handles cookies automatically
          const response = await fetch('/api/products');
          if (!response.ok) {
            throw new Error('Failed to fetch products');
          }
          return response.json();
        };

        export const useProducts = () => {
          return useQuery({
            queryKey: ['products'],
            queryFn: fetchProducts,
            // Add options like staleTime, cacheTime, refetchOnWindowFocus etc.
          });
        };

        // src/pages/ProductListingPage.tsx
        import React from 'react';
        import { useProducts } from '../hooks/useProducts';
        import ProductCard from '../components/features/ProductCard';

        const ProductListingPage: React.FC = () => {
          const { data: products, isLoading, isError, error } = useProducts();

          if (isLoading) return <p>Loading products...</p>;
          if (isError) return <p>Error: {error?.message}</p>;

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
              {products.map((product: any) => ( // Replace 'any' with actual Product type
                <ProductCard key={product.id} product={product} onAddToCart={() => console.log('Add to cart')} />
              ))}
            </div>
          );
        };
        ```
2.  **React Context API:** For global, relatively infrequent updates, such as user authentication status, theme preferences, or global notifications.
    *   **User Session Context:** Manages the logged-in user's data and `session` state.
    *   **Auth State Example:**
        ```tsx
        // src/context/AuthContext.tsx
        import React, { createContext, useContext, useState, useEffect } from 'react';

        interface AuthContextType {
          user: { id: string; email: string; role: 'user' | 'admin' } | null;
          isAuthenticated: boolean;
          login: (userData: any) => void;
          logout: () => void;
        }

        const AuthContext = createContext<AuthContextType | undefined>(undefined);

        export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
          const [user, setUser] = useState<AuthContextType['user']>(null);
          const [isAuthenticated, setIsAuthenticated] = useState(false);

          useEffect(() => {
            // Check for existing session on app load
            const checkSession = async () => {
              try {
                const response = await fetch('/api/user/session'); // Endpoint to check session status
                if (response.ok) {
                  const userData = await response.json();
                  setUser(userData);
                  setIsAuthenticated(true);
                } else {
                  setUser(null);
                  setIsAuthenticated(false);
                }
              } catch (error) {
                console.error('Session check failed:', error);
                setUser(null);
                setIsAuthenticated(false);
              }
            };
            checkSession();
          }, []);

          const login = (userData: any) => {
            setUser(userData);
            setIsAuthenticated(true);
          };

          const logout = async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' }); // Invalidate session on backend
            } catch (error) {
              console.error('Logout failed:', error);
            } finally {
              setUser(null);
              setIsAuthenticated(false);
            }
          };

          return (
            <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
              {children}
            </AuthContext.Provider>
          );
        };

        export const useAuth = () => {
          const context = useContext(AuthContext);
          if (context === undefined) {
            throw new Error('useAuth must be used within an AuthProvider');
          }
          return context;
        };
        ```
3.  **Local Component State:** For ephemeral UI states like form input values (`useState`), toggle states, or temporary visibility controls.
4.  **Cart State:** For managing the shopping cart, a dedicated React Context or a local state management library like Zustand could be used, depending on complexity.

#### 3. UI/UX Guidelines

The design aims for a premium, SaaS-style experience with an emphasis on clarity, elegance, and efficiency.

*   **Visual Aesthetics:**
    *   **Color Palette:** A refined, limited color palette will be used. Primary brand colors, a spectrum of grays for text and backgrounds, and accent colors for interactive elements, alerts, and highlights. Avoid overly bright or saturated colors.
    *   **Typography:** A strong typographic hierarchy with 2-3 carefully chosen fonts (e.g., a modern sans-serif for headings and body, a monospace for code snippets). Clear sizing and weight distinctions for headings, subheadings, body text, and captions.
    *   **Spacing & Layout:** Generous use of whitespace (`padding`, `margin`, `gap`) to create breathing room, improve readability, and define clear sections. Use a consistent spacing scale (e.g., 4px or 8px increments).
    *   **Imagery:** High-quality product photography and engaging, professional illustrations/icons that align with the brand. Images will be optimized for web performance.
*   **Component-Based Design System:**
    *   All UI elements will originate from a shared design system (e.g., Storybook, Figma components). This ensures visual and functional consistency across the application.
    *   Every component will have defined states (hover, focus, active, disabled, loading, error).
*   **Interaction & Feedback:**
    *   **Micro-interactions & Animations:** Subtle, purposeful animations (e.g., on button clicks, menu transitions, data loading) will enhance usability and provide immediate feedback without being distracting. Use CSS transitions or libraries like Framer Motion.
    *   **Feedback:** Clear and immediate feedback for user actions (e.g., success messages, error messages, loading indicators, form validation).
*   **Responsiveness & Accessibility:**
    *   **Responsive Design:** The interface will be fully responsive, adapting seamlessly across desktops, tablets, and mobile devices. A mobile-first approach will be considered.
    *   **Accessibility (A11y):** Adherence to WCAG guidelines. Use semantic HTML, ARIA attributes where necessary, keyboard navigation support, and sufficient color contrast.
*   **Productivity Optimization:**
    *   **Intuitive Workflows:** Streamlined navigation, clear calls to action, and logical progression for complex tasks (e.g., checkout, product management for `admin` users).
    *   **Data Density:** Balance between information density and readability, especially in dashboards and tables. Allow users to customize views where appropriate.
    *   **Efficient Forms:** Clear labels, input masks, inline validation, and sensible defaults.
*   **File Uploads:** When `admin` users upload images for `products`, the frontend will facilitate this to the backend, which will then store them according to the path convention: `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`. The frontend will receive the public URL to display.

#### 4. Page Layouts

The application will feature a dashboard-driven architecture with a consistent layout structure across most pages.

**Core Layout:**
*   **Sidebar Navigation:** Primary global navigation for authenticated users, with menu items dynamically displayed based on `admin-user` roles.
    *   *User specific:* Dashboard (overview), Products (browse), Cart, Orders, Profile, Settings.
    *   *Admin specific:* Products (manage `products`), Users (manage users), Orders (manage orders), Analytics.
*   **Top Navigation:** Brand logo, global search, user dropdown (profile, logout), notifications.
*   **Main Content Area:** Where page-specific content is rendered.

**Key Screens & States:**

1.  **Onboarding & Authentication:**
    *   **Login Page:** Email/username and password fields, "Forgot Password" link. Requires `session` authentication via `POST /api/auth/login`.
    *   **Registration Page:** Form for new user signup.
    *   **Forgot Password:** Email input to initiate password reset.
    *   **Reset Password:** Form for new password input after token verification.
    *   *States:* Initial, loading (for submission), error (e.g., invalid credentials), success (redirect).

2.  **User Dashboard (Authenticated Users):**
    *   Overview of recent orders, saved `products`, personalized recommendations.
    *   Cards displaying quick stats or links to frequently accessed sections.
    *   *States:* Initial loading, data loaded, empty (e.g., no recent orders).

3.  **Product Listing Page:**
    *   Grid or list view of `products`.
    *   Filters (category, price range, material type: refined plastic, metal scraps, discarded fabrics), search bar, sorting options.
    *   Pagination (`Table` component will be used for displaying many `products`).
    *   `ProductCard` components for each item.
    *   *States:* Loading `products`, `products` loaded, empty (no `products` found), error fetching.

4.  **Product Detail Page:**
    *   Large product image gallery, detailed description, specifications, pricing, quantity selector.
    *   "Add to Cart" button, "Add to Wishlist" option.
    *   Related `products` section.
    *   *States:* Loading product, product loaded, product not found (error).

5.  **Shopping Cart Page:**
    *   List of `CartItem` components.
    *   Quantity adjustments, removal options.
    *   `CartSummary` with subtotal, shipping estimates, total.
    *   "Proceed to Checkout" button.
    *   *States:* Loading cart, cart loaded, empty cart.

6.  **Checkout Flow:**
    *   Multi-step form (`CheckoutForm`) for shipping address, billing address, payment method.
    *   Review order (`OrderSummary`).
    *   Order confirmation page after successful payment.
    *   *States:* Form validation errors, loading payment, payment success/failure.

7.  **Order History Page:**
    *   Table listing user's past orders, with status and basic details.
    *   Ability to view `OrderSummary` for a specific order.
    *   *States:* Loading orders, orders loaded, empty (no orders).

8.  **User Profile & Settings:**
    *   Account details (`UserProfileForm`).
    *   Address management.
    *   Password change.
    *   Notification preferences.
    *   *States:* Loading user data, data loaded, saving, error saving.

9.  **Admin Dashboard (Role-based access for 'admin' users):**
    *   **Product Management:** `AdminProductTable` for CRUD operations on `products` from the `products` table, including adding new `products` with image uploads.
    *   **User Management:** `UserManagementTable` for viewing and managing user accounts (e.g., change roles, suspend).
    *   **Order Management:** View all orders, update order status.
    *   **Analytics Overview:** Key business metrics (sales, inventory).
    *   *States:* Loading data, data loaded, empty lists, actions (e.g., deleting a product) in progress, error states.

**General States for all Pages:**
*   **Loading States:** Use `LoadingSpinner` or `Skeleton` components for a smooth user experience while data is being fetched.
*   **Empty States:** Custom illustrations and clear messages for sections with no content (e.g., empty cart, no search results, no orders).
*   **Error Handling:** Prominent, user-friendly error messages for API failures, network issues, or invalid inputs. Use `AlertDialog` or `Toast` for non-blocking notifications.
