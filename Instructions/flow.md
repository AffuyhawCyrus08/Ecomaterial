# System Flow Documentation: E-commerce Site for Recycled Materials

This document outlines the core system flows for an e-commerce platform specializing in refined plastic products, metal scraps, and discarded fabrics. It details how users interact, how data moves, how components connect, and how errors are managed, adhering strictly to the defined architectural decisions. The frontend is built with React + Vite, the backend with Node.js + Express, and data is stored in MySQL, with session-based authentication and an admin-user RBAC model.

## 1. User Workflows

This section describes the primary interactions users will have with the e-commerce system, differentiating between customer (buyer) and administrator roles. Authentication for all users is handled via a session-based approach.

### 1.1. Customer (Buyer) Workflows

**1.1.1. Account Management (Registration & Login)**
Customers can create new accounts or log in to existing ones to access personalized features.
*   **Flow:** Customer initiates registration/login on the React + Vite frontend -> Frontend sends credentials to Node.js + Express backend -> Backend authenticates against MySQL `users` table -> If successful, a session is created (cookie-based) -> Frontend redirects to dashboard/product listing.

**1.1.2. Product Browsing & Search**
Customers can view available `products` and search for specific items like refined plastic products, metal scraps, or discarded fabrics.
*   **Flow:** Customer navigates to product listing/search on the React + Vite frontend -> Frontend requests `products` data from Node.js + Express backend -> Backend fetches `products` from MySQL -> Frontend displays `products` with details (images, descriptions, pricing).

**1.1.3. Product Detail Viewing**
Customers can view comprehensive details for a specific product.
*   **Flow:** Customer selects a product on the React + Vite frontend -> Frontend requests specific product details from Node.js + Express backend -> Backend fetches product details from MySQL (including the image path reference) -> Frontend displays product images (served from `/var/www/storage/uploads/products/...`), description, price, etc.

**1.1.4. Placing an Order**
Customers can add `products` to a cart and proceed to checkout to finalize a purchase.
*   **Flow:** Customer adds `products` to cart (React + Vite) -> Views cart -> Proceeds to checkout, providing shipping/payment info -> Places order -> Frontend sends order details to Node.js + Express backend -> Backend processes order, updates MySQL (`orders`, `order_items`, and `products` stock) -> Order confirmation displayed.

**1.1.5. Order History & Status**
Customers can view their past orders and track current order statuses.
*   **Flow:** Authenticated Customer accesses "My Orders" on the React + Vite frontend -> Frontend requests order history from Node.js + Express backend -> Backend fetches orders related to the authenticated user from MySQL -> Frontend displays order details.

### 1.2. Administrator Workflows

**1.2.1. Admin Login & Dashboard**
Administrators log in to access the system's management features.
*   **Flow:** Admin accesses Admin Login Page (React + Vite) -> Submits credentials -> Frontend sends credentials to Node.js + Express backend -> Backend authenticates against MySQL `users` table, verifies admin role -> If successful, a session is created -> Frontend redirects to Admin Dashboard.

**1.2.2. Product Management (CRUD)**
Admins can add, view, edit, and delete `products`.
*   **Flow (Add Product):** Admin navigates to "Add Product" (React + Vite) -> Fills product details -> Uploads product image -> Frontend sends product data and image file to Node.js + Express backend -> Backend saves image to `/var/www/storage/uploads/products/{yyyy}/{uuid}.{ext}` and saves product details (including the image path) to the `products` table in MySQL -> Success/error response.
*   **Flow (Edit/Delete Product):** Admin navigates to "Manage Products" (React + Vite) -> Selects product -> Performs edit/delete action -> Frontend sends request to Node.js + Express backend -> Backend updates/deletes from MySQL `products` table.

**1.2.3. Order Management**
Admins can view all orders, update their statuses, and manage order details.
*   **Flow:** Admin navigates to "Orders" (React + Vite) -> Frontend requests all orders from Node.js + Express backend -> Backend fetches all orders from MySQL -> Frontend displays orders -> Admin updates status (e.g., "Processing", "Shipped") -> Frontend sends update request to Node.js + Express backend -> Backend updates MySQL.

**1.2.4. User Management**
Admins can view and manage customer accounts.
*   **Flow:** Admin navigates to "Users" (React + Vite) -> Frontend requests user data from Node.js + Express backend -> Backend fetches user data from MySQL -> Frontend displays user list -> Admin performs actions (e.g., view details, suspend).

### Mermaid Diagram: Customer Product Purchase Flow

```mermaid
graph TD
    A[Customer (React)] --> B(Access E-commerce Site);
    B --> C{Authenticated?};
    C -- No --> D[Login/Register (React)];
    C -- Yes --> E[Browse Products (React)];
    E --> F[View Product Details (React)];
    F --> G[Add to Cart (React)];
    G --> H{Review Cart / Checkout (React)};
    H -- Checkout --> I[Provide Shipping & Payment (React)];
    I --> J[Place Order (React)];
    J --> K(Node.js/Express Backend Processes Order);
    K --> L[Order Confirmation (React)];
    L --> M[Order History (via session)];
```

## 2. Data Flows

This section describes how data moves between the different layers of the system.

### 2.1. User Authentication & Authorization Data Flow

*   **Frontend (React + Vite):** User enters credentials (username, password) and submits via an API call (e.g., `POST /api/auth/login`).
*   **Backend (Node.js + Express):** Receives credentials.
    *   For registration: Hashes password using a secure algorithm (e.g., bcrypt) and stores it in the `users` table in MySQL.
    *   For login: Queries the `users` table in MySQL to retrieve user data, compares the provided password hash with the stored hash, and verifies the user's role (admin/user).
    *   If authentication and authorization are successful, a server-side session is created, and a session ID is sent back to the frontend in an HTTP-only cookie.
*   **MySQL:** Stores user credentials (hashed passwords), user roles, and other profile information in the `users` table.

### 2.2. Product Listing & Retrieval Data Flow

*   **Frontend (React + Vite):** Makes an API request (e.g., `GET /api/products` or `GET /api/products/:id`) to retrieve product data.
*   **Backend (Node.js + Express):**
    *   Receives the API request.
    *   Queries the `products` table in MySQL to fetch the relevant product data (name, description, price, category, stock, image URL).
    *   Constructs a JSON response containing the product data, including the URL to the product image which references files stored in `/var/www/storage/uploads/products/{yyyy}/{uuid}.{ext}`.
*   **MySQL:** Stores all product-related text data and the unique storage paths/URLs for associated images.

### 2.3. Product Creation/Update Data Flow

*   **Frontend (React + Vite):** Admin submits a product form which includes text data and potentially an image file using `multipart/form-data`.
*   **Backend (Node.js + Express):**
    *   Receives the `multipart/form-data` request.
    *   Uses middleware (e.g., Multer) to process the image upload.
    *   Saves the image file to the designated file storage path: `/var/www/storage/uploads/products/{yyyy}/{uuid}.{ext}`.
    *   Records the unique storage path/URL of the saved image in the `products` table in MySQL, along with other product details.
    *   Inserts a new record or updates an existing record in the `products` table.
    *   Returns a success or error response to the frontend.
*   **MySQL:** Stores product text data and the unique path/URL referencing the associated image file.
*   **File Storage:** `/var/www/storage/uploads/products/{yyyy}/{uuid}.{ext}` is the physical location where actual product image files are stored.

### 2.4. Order Placement Data Flow

*   **Frontend (React + Vite):** Authenticated customer submits order details (cart items, shipping information, payment intent).
*   **Backend (Node.js + Express):**
    *   Authenticates the user's session.
    *   Validates cart contents and user data against business rules.
    *   Initiates a database transaction within MySQL.
    *   Inserts new records into the `orders` table (e.g., `order_id`, `user_id`, `total_amount`, `status`).
    *   Inserts associated items into the `order_items` table (e.g., `order_item_id`, `order_id`, `product_id`, `quantity`, `price`).
    *   Updates the `stock` levels for the relevant `products` in the `products` table.
    *   Commits the transaction if all operations are successful; otherwise, rolls it back.
    *   Returns an order confirmation (or error) to the frontend.
*   **MySQL:** Manages data across `orders`, `order_items`, and `products` tables within a transactional context to ensure data consistency.

### Mermaid Diagram: Product Creation Data Flow

```mermaid
graph LR
    A[Admin Frontend (React)] -- Submit Product Form & Image --> B(Node.js/Express Backend);
    B -- Validate Data --> C{Data Valid?};
    C -- No --> E[Return Validation Error (React)];
    C -- Yes --> D[Process Image Upload (Multer)];
    D -- Save Image File --> F[/var/www/storage/uploads/products/{yyyy}/{uuid}.{ext}];
    D -- Get Image Path --> B;
    B -- Insert/Update 'products' table --> G(MySQL Database);
    G -- Store Product Data & Image Path --> G;
    B -- Return Success/Error --> A;
```

## 3. Integration Points

This section details how the various components of the system connect and interact.

### 3.1. Frontend (React + Vite) <-> Backend (Node.js + Express)

*   **Mechanism:** RESTful API calls over HTTP/HTTPS.
*   **Authentication:** Session-based. The React frontend sends HTTP requests with session cookies (automatically managed by browsers for same-origin requests). The Node.js + Express backend validates the session cookie against its session store to authenticate and authorize requests, enforcing `admin-user` RBAC.
*   **Data Format:** JSON for request/response bodies. `multipart/form-data` for file uploads (e.g., product images).
*   **Examples:** `GET /api/products` for listings, `POST /api/auth/login` for user authentication, `POST /api/products` (admin-only) for creating products, `PUT /api/orders/:id/status` (admin-only) for order updates.

### 3.2. Backend (Node.js + Express) <-> Database (MySQL)

*   **Mechanism:** Database driver/ORM.
*   **Connectivity:** TCP/IP connection to the MySQL server.
*   **Libraries:** A Node.js MySQL driver (e.g., `mysql2`) or an ORM (e.g., Sequelize) will be used to establish connections, execute SQL queries (CRUD operations on tables like `users`, `products`, `orders`, `order_items`), and manage transactions.
*   **Authentication:** The backend connects to MySQL using configured database credentials (username, password).
*   **Data Schema:** All persistent application data is structured into tables within MySQL.

### 3.3. Backend (Node.js + Express) <-> File Storage

*   **Mechanism:** File system operations.
*   **Path:** All uploaded resources, such as product images, are stored locally on the server at the defined path: `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`.
*   **Libraries:** Middleware like `multer` for Express is used to handle `multipart/form-data` uploads, facilitating the saving of files to the specified storage path. The backend then records the unique path or URL of the stored file in the MySQL database (e.g., within the `products` table).
*   **Serving:** The Node.js + Express backend, or a reverse proxy like Nginx, is configured to serve these static files publicly from the `/var/www/storage/uploads/` directory, making them accessible via URL.

## 4. Error Handling

Effective error handling is crucial for a robust and user-friendly system. This section outlines strategies for managing failures across the frontend, backend, and database layers.

### 4.1. Frontend Error Handling (React + Vite)

*   **User Feedback:** Display clear, concise, and user-friendly error messages (e.g., toasts, banners, inline validation messages) for API failures, network issues, or client-side validation errors.
*   **Form Validation:** Implement client-side validation on all forms to provide immediate feedback to users, preventing invalid submissions and reducing server load.
*   **Graceful Degradation:** Design UI components to handle missing data or API failures gracefully, potentially showing loading states, empty states, or retry options.
*   **Error Boundaries:** Utilize React Error Boundaries to catch JavaScript errors within components, preventing application crashes and displaying a fallback UI.
*   **Loading States:** Implement distinct loading states for data fetching and submissions to provide visual feedback and manage user expectations.

### 4.2. Backend Error Handling (Node.js + Express)

*   **Centralized Error Middleware:** Implement a global error handling middleware in Express to catch all unhandled errors, log them comprehensively, and send standardized JSON error responses to the client. This ensures consistency and prevents sensitive information leakage.
    ```javascript
    // Example Express Error Middleware
    app.use((err, req, res, next) => {
        console.error(err.stack); // Log the error stack for debugging
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            status: 'error',
            message: err.message || 'An unexpected server error occurred.',
            // Include stack trace only in development environment for security
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    });
    ```
*   **API Error Responses:** Return appropriate HTTP status codes (e.g., 400 Bad Request for validation failures, 401 Unauthorized for authentication issues, 403 Forbidden for authorization issues, 404 Not Found for missing resources, 500 Internal Server Error for server-side failures) and structured JSON error bodies.
*   **Input Validation:** Employ server-side input validation (e.g., using Joi or Express-validator) for all incoming API requests to ensure data integrity and security, returning `400 Bad Request` for validation failures.
*   **Authentication/Authorization Errors:** Explicitly handle and return `401 Unauthorized` for invalid sessions or credentials, and `403 Forbidden` for authenticated users attempting to access resources or perform actions without the necessary `admin-user` RBAC permissions.
*   **Database Errors:** Catch and handle specific MySQL errors (e.g., connection issues, constraint violations, transaction failures, data type mismatches). These should be translated into appropriate HTTP responses with user-friendly messages.
*   **File Storage Errors:** Implement robust error handling for file upload operations (e.g., insufficient disk space, invalid file types, permission errors when writing to `/var/www/storage/uploads/`).
*   **Logging:** Utilize a dedicated logging library (e.g., Winston, Pino) to capture detailed application errors, warnings, and informational messages for effective monitoring, debugging, and post-mortem analysis.

### 4.3. Database Error Handling (MySQL)

*   **Transactions:** Crucially, use MySQL transactions for complex operations involving multiple table modifications (e.g., order placement affecting `orders`, `order_items`, and `products` stock). This ensures atomicity, allowing rollbacks in case of any intermediate failure to maintain data consistency.
*   **Constraint Violations:** Design the MySQL schema with appropriate constraints (e.g., `UNIQUE`, `FOREIGN KEY`, `NOT NULL`). The backend must catch SQL errors resulting from these violations and translate them into specific, user-friendly API error messages (e.g., "Email already registered", "Product not found for order item").
*   **Connection Management:** Employ connection pooling within the Node.js + Express backend to efficiently manage MySQL connections, handle connection drops, and ensure high availability. The backend should include mechanisms to gracefully handle connection failures and attempt re-establishment.
*   **Data Integrity:** Beyond constraints, ensure data integrity through careful schema design (correct data types, lengths, default values) and rigorous backend validation before data is committed to the database.
