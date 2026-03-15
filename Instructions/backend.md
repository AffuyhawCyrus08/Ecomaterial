This document outlines the backend implementation plan for the Ecommerce site selling refined plastic products, metal scraps, and discarded fabrics, adhering strictly to the locked architectural decisions and ensuring cross-file consistency.

## Backend Implementation Plan

**Version: 1.0**
**Date: 2024-05-15**

---

### 1. API Design

The API will be built using Node.js with Express, following a RESTful style. All endpoints will be prefixed with `/api`. Authentication for all interactions will be session-based, aligning with the `session` Auth Mode and API Style.

#### 1.1 User Management

*   **`POST /api/auth/register`**
    *   **Description:** Registers a new user with a default 'user' role.
    *   **Request Body:**
        ```json
        {
          "username": "john.doe",
          "email": "john.doe@example.com",
          "password": "securePassword123"
        }
        ```
    *   **Response:** `201 Created` on success, `400 Bad Request` or `409 Conflict` on error.
        ```json
        {
          "message": "User registered successfully",
          "userId": "uuid-of-user"
        }
        ```
*   **`POST /api/auth/login`**
    *   **Description:** Authenticates a user and establishes a session.
    *   **Request Body:**
        ```json
        {
          "email": "john.doe@example.com",
          "password": "securePassword123"
        }
        ```
    *   **Response:** `200 OK` on success, `401 Unauthorized` on failure.
        ```json
        {
          "message": "Logged in successfully",
          "user": {
            "id": "uuid-of-user",
            "username": "john.doe",
            "email": "john.doe@example.com",
            "role": "user"
          }
        }
        ```
*   **`POST /api/auth/logout`**
    *   **Description:** Destroys the current user session.
    *   **Request Body:** None.
    *   **Response:** `200 OK` on success.
        ```json
        {
          "message": "Logged out successfully"
        }
        ```
*   **`GET /api/users/me`**
    *   **Description:** Retrieves the authenticated user's profile.
    *   **Authentication:** Required (Session-based, User/Admin role).
    *   **Response:** `200 OK` with user data, `401 Unauthorized` if not logged in.
        ```json
        {
          "id": "uuid-of-user",
          "username": "john.doe",
          "email": "john.doe@example.com",
          "role": "user",
          "createdAt": "2023-01-01T12:00:00Z"
        }
        ```

#### 1.2 Product Management

*   **`GET /api/products`**
    *   **Description:** Retrieves a list of all products (from the `products` table). Supports optional query parameters for filtering/pagination.
    *   **Authentication:** Optional.
    *   **Response:** `200 OK` with an array of products.
        ```json
        [
          {
            "id": "product-uuid-1",
            "name": "Refined Plastic Granules",
            "description": "High-quality plastic granules for various applications.",
            "price": 10.50,
            "category": "Plastic",
            "stockQuantity": 1000,
            "imageUrl": "/var/www/storage/uploads/products/2024/product-uuid-1.jpg"
          }
        ]
        ```
*   **`GET /api/products/:id`**
    *   **Description:** Retrieves details for a specific product (from the `products` table).
    *   **Authentication:** Optional.
    *   **Response:** `200 OK` with product details, `404 Not Found`.
*   **`POST /api/products`**
    *   **Description:** Creates a new product (in the `products` table).
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Request Body:**
        ```json
        {
          "name": "Steel Scrap Grade A",
          "description": "Premium grade A steel scrap, ideal for recycling.",
          "price": 0.75,
          "categoryId": "category-uuid-1",
          "stockQuantity": 5000
        }
        ```
    *   **Response:** `201 Created`.
*   **`PUT /api/products/:id`**
    *   **Description:** Updates an existing product (in the `products` table).
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Request Body:** (Partial updates allowed)
        ```json
        {
          "price": 0.80,
          "stockQuantity": 4500
        }
        ```
    *   **Response:** `200 OK`.
*   **`DELETE /api/products/:id`**
    *   **Description:** Deletes a product (from the `products` table).
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Response:** `204 No Content`.
*   **`POST /api/products/:id/upload-image`**
    *   **Description:** Uploads an image for a product. The image will be stored according to the defined storage path: `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`.
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Request Body:** `multipart/form-data` with a `file` field.
    *   **Response:** `200 OK` with the new image URL.
        ```json
        {
          "message": "Image uploaded successfully",
          "imageUrl": "/var/www/storage/uploads/products/2024/product-image-uuid.png"
        }
        ```

#### 1.3 Order Management

*   **`POST /api/orders`**
    *   **Description:** Creates a new order for the authenticated user.
    *   **Authentication:** Required (Session-based, User/Admin role).
    *   **Request Body:**
        ```json
        {
          "items": [
            { "productId": "product-uuid-1", "quantity": 100 },
            { "productId": "product-uuid-2", "quantity": 50 }
          ]
        }
        ```
    *   **Response:** `201 Created` with order details.
*   **`GET /api/orders/me`**
    *   **Description:** Retrieves all orders for the authenticated user.
    *   **Authentication:** Required (Session-based, User/Admin role).
    *   **Response:** `200 OK` with an array of orders.
*   **`GET /api/orders/:id`**
    *   **Description:** Retrieves a specific order by ID.
    *   **Authentication:** Required (Session-based, User - for their own orders, Admin - for any order).
    *   **Response:** `200 OK` with order details, `404 Not Found`, `403 Forbidden` if not authorized.
*   **`GET /api/admin/orders`**
    *   **Description:** Retrieves all orders in the system (Admin only).
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Response:** `200 OK` with an array of all orders.
*   **`PUT /api/admin/orders/:id/status`**
    *   **Description:** Updates the status of an order.
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Request Body:**
        ```json
        {
          "status": "shipped"
        }
        ```
    *   **Response:** `200 OK`.

#### 1.4 Category Management

*   **`GET /api/categories`**
    *   **Description:** Retrieves all product categories.
    *   **Authentication:** Optional.
*   **`POST /api/categories`**
    *   **Description:** Creates a new product category.
    *   **Authentication:** Required (Session-based, Admin role).
    *   **Request Body:**
        ```json
        {
          "name": "Metal Scraps",
          "description": "Various grades of metal scraps like steel, aluminum, copper."
        }
        ```
    *   **Response:** `201 Created`.
*   **`PUT /api/categories/:id`**
    *   **Description:** Updates a product category.
    *   **Authentication:** Required (Session-based, Admin role).
*   **`DELETE /api/categories/:id`**
    *   **Description:** Deletes a product category.
    *   **Authentication:** Required (Session-based, Admin role).

---

### 2. Data Models

The database will be MySQL. All timestamps will be `DATETIME` with `DEFAULT CURRENT_TIMESTAMP` and `ON UPDATE CURRENT_TIMESTAMP` where applicable. UUIDs will be used for primary keys for better distribution and separation from sequential data.

#### `users` table

*   `id` (VARCHAR(36) / CHAR(36) UUID, PRIMARY KEY)
*   `username` (VARCHAR(255), UNIQUE, NOT NULL)
*   `email` (VARCHAR(255), UNIQUE, NOT NULL)
*   `password_hash` (VARCHAR(255), NOT NULL)
*   `role` (ENUM('user', 'admin'), DEFAULT 'user', NOT NULL) - *Aligns with `admin-user` RBAC.*
*   `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
*   `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `categories` table

*   `id` (VARCHAR(36) / CHAR(36) UUID, PRIMARY KEY)
*   `name` (VARCHAR(255), UNIQUE, NOT NULL)
*   `description` (TEXT)
*   `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
*   `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `products` table

*   `id` (VARCHAR(36) / CHAR(36) UUID, PRIMARY KEY)
*   `name` (VARCHAR(255), NOT NULL)
*   `description` (TEXT)
*   `price` (DECIMAL(10, 2), NOT NULL)
*   `category_id` (VARCHAR(36) / CHAR(36) UUID, NOT NULL, FOREIGN KEY REFERENCES `categories`(id))
*   `stock_quantity` (INT, NOT NULL, DEFAULT 0)
*   `image_url` (VARCHAR(255)) - *Stores the full path conforming to `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`.*
*   `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
*   `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `orders` table

*   `id` (VARCHAR(36) / CHAR(36) UUID, PRIMARY KEY)
*   `user_id` (VARCHAR(36) / CHAR(36) UUID, NOT NULL, FOREIGN KEY REFERENCES `users`(id))
*   `total_amount` (DECIMAL(10, 2), NOT NULL)
*   `status` (ENUM('pending', 'processed', 'shipped', 'delivered', 'cancelled'), DEFAULT 'pending', NOT NULL)
*   `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
*   `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

#### `order_items` table

*   `id` (VARCHAR(36) / CHAR(36) UUID, PRIMARY KEY)
*   `order_id` (VARCHAR(36) / CHAR(36) UUID, NOT NULL, FOREIGN KEY REFERENCES `orders`(id))
*   `product_id` (VARCHAR(36) / CHAR(36) UUID, NOT NULL, FOREIGN KEY REFERENCES `products`(id))
*   `quantity` (INT, NOT NULL)
*   `price_at_purchase` (DECIMAL(10, 2), NOT NULL) -- Price at the time of order creation
*   `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP)
*   `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

---

### 3. Business Logic

The core backend processes will include:

1.  **User Authentication:**
    *   Hashing user passwords using `bcrypt` before storing them in the `users` table.
    *   Comparing provided password with stored hash during login.
    *   Upon successful login, creating a server-side session using `express-session` and storing `user.id`, `user.username`, and `user.role` in `req.session.user`. This session ID is sent to the client as an `HttpOnly` cookie.
    *   Destroying the session on logout.
2.  **Product Management:**
    *   Retrieving `products` from the database, potentially with pagination, filtering by category, and sorting.
    *   Validating input data for new/updated products (name, description, price, stock_quantity, category_id).
    *   Handling image uploads for products using `multer` to store files locally at the specified `/var/www/storage/uploads/products/{yyyy}/{uuid}.{ext}` path, and updating the `image_url` field in the `products` table with this exact path.
    *   Ensuring only `admin` users can create, update, or delete `products`.
3.  **Order Processing:**
    *   When an order is created:
        *   Validate that all `product_id`s exist and `quantity` is available in `stock_quantity`.
        *   Initiate a database transaction.
        *   Deduct `quantity` from `stock_quantity` for each product.
        *   Create a new entry in the `orders` table.
        *   Create entries in the `order_items` table for each product in the order, capturing the `price_at_purchase` to handle price changes.
        *   Commit the transaction. If any step fails, roll back the transaction.
    *   Retrieving orders: Users can only see their own orders. Admins can view all orders.
    *   Updating order status: Only admins can change the `status` of an order.
4.  **Category Management:**
    *   Basic CRUD operations for categories, restricted to `admin` users.
5.  **Role-Based Access Control (RBAC):**
    *   Middleware will check `req.session.user.role` to determine if a user has sufficient privileges (`user` or `admin`) to access specific endpoints or perform certain actions, strictly adhering to the `admin-user` RBAC model.

---

### 4. Security

#### 4.1 Authentication (Session-based)

*   **Session Management:** `express-session` will be used to manage sessions. Sessions will be stored in MySQL using `connect-session-mysql` to ensure persistence across server restarts and scalability across multiple instances.
*   **Session ID:** A cryptographically strong session ID will be generated and stored in a secure, HttpOnly cookie to prevent XSS attacks.
*   **Session Expiration:** Sessions will have an appropriate expiration time and activity-based timeout.
*   **Password Hashing:** All user passwords will be hashed using `bcrypt` (with a strong salt factor, e.g., 10-12 rounds) before being stored in the database.
*   **Rate Limiting:** Implement rate limiting on authentication endpoints (`/api/auth/login`, `/api/auth/register`) to mitigate brute-force attacks.

#### 4.2 Authorization (RBAC - admin-user)

*   **Role-Based Access Control:** An RBAC model with `admin` and `user` roles will be enforced.
    *   **`admin`:** Full access to all API endpoints, including creating, updating, and deleting products and categories, and managing orders.
    *   **`user`:** Can register, login, view products, place orders, and view their own orders/profile.
*   **Middleware:** Authorization checks will be implemented as Express middleware functions that inspect `req.session.user.role` and deny access if the user's role does not meet the required permission level for the specific route or action.

#### 4.3 General Security Practices

*   **Input Validation:** All incoming data from client requests will be rigorously validated on the server-side to prevent injection attacks (SQL, XSS, etc.) and ensure data integrity.
*   **SQL Injection Prevention:** Use parameterized queries or prepared statements via the chosen MySQL client library (e.g., `mysql2` or `sequelize` ORM) to prevent SQL injection.
*   **CORS:** Properly configure Cross-Origin Resource Sharing (CORS) to allow requests only from trusted frontend origins.
*   **HTTPS:** Enforce HTTPS in production to encrypt all traffic between the client and server, protecting sensitive data like session cookies and user credentials from eavesdropping.
*   **Environment Variables:** Sensitive information (database credentials, session secrets, etc.) will be stored in environment variables, not hardcoded.
*   **Error Handling:** Implement robust error handling to avoid leaking sensitive server or database information in error responses.

---

### 5. Performance

1.  **Database Indexing:**
    *   Create indexes on frequently queried columns: `users.email`, `users.username`, `products.category_id`, `orders.user_id`, `order_items.order_id`, `order_items.product_id`.
    *   Consider composite indexes for common multi-column WHERE clauses.
2.  **Optimized SQL Queries:**
    *   Avoid `SELECT *`; explicitly list required columns.
    *   Use `JOIN` clauses efficiently.
    *   Implement pagination and limit clauses for listing endpoints (`/api/products`, `/api/orders`).
3.  **Caching:**
    *   Implement server-side caching (e.g., Redis) for frequently accessed, read-heavy data like product listings or categories that do not change often.
    *   Client-side caching can be managed via HTTP caching headers.
4.  **Image Optimization:**
    *   Use image processing libraries (e.g., `sharp` or `jimp`) to resize, compress, and convert uploaded product images to web-optimized formats (e.g., WebP) to reduce load times.
5.  **Asynchronous Operations:**
    *   Utilize Node.js's asynchronous nature by performing I/O operations (database queries, file system writes) non-blockingly. Use `async/await` for cleaner async code.
6.  **Connection Pooling:**
    *   Configure the MySQL client to use connection pooling to efficiently manage database connections, reducing overhead for new requests.
7.  **Server Monitoring:**
    *   Implement monitoring tools to track application performance, database query times, and server resource utilization to identify bottlenecks.

---

### 6. Code Examples

These examples use Express, `bcrypt`, `express-session`, `connect-session-mysql`, `uuid` and `multer`. A MySQL client (e.g., `mysql2/promise`) is assumed for database interactions.

#### 6.1 Server Setup and Session Configuration

```javascript
// app.js
const express = require('express');
const session = require('express-session');
const MySQLStore = require('connect-session-mysql')(session); // Ensure this package is installed
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs'); // For ensuring upload directory exists
const multer = require('multer');

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const app = express();

app.use(express.json()); // For parsing application/json

// Session store configuration
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    port: 3306, // Default MySQL port
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ecommerce_db',
    clearExpired: true,
    checkExpirationInterval: 900000, // Every 15 minutes
    expiration: 86400000 // 1 day
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey', // Use a strong, unique secret
    store: sessionStore,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        httpOnly: true, // Prevent client-side JS access to cookie
        maxAge: 86400000 // 1 day
    }
}));

// Basic middleware for error handling (should be at the end)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Import and use routes
// const authRoutes = require('./routes/auth');
// const productRoutes = require('./routes/products');
// app.use('/api/auth', authRoutes);
// app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

#### 6.2 Authentication (Registration & Login)

```javascript
// routes/auth.js (example)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
// Assume 'pool' is imported/available from app.js or a separate db module
// const pool = require('../config/db'); // Example

// User Registration
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        await pool.query(
            'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [userId, username, email, hashedPassword, 'user']
        );
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const [users] = await pool.query('SELECT id, username, email, password_hash, role FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Establish session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.status(200).json({
            message: 'Logged in successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// User Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie, which stores the session ID
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
```

#### 6.3 Role-Based Access Control Middleware

```javascript
// middleware/auth.js
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // User is authenticated via session
    } else {
        res.status(401).json({ message: 'Unauthorized: No active session' });
    }
};

const authorizeRole = (requiredRole) => (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === requiredRole) {
        next(); // User has the required role from session
    } else {
        res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
};

const isAdmin = authorizeRole('admin'); // Convenience middleware for admin role
const isUser = authorizeRole('user');   // Convenience middleware for user role

module.exports = { isAuthenticated, authorizeRole, isAdmin, isUser };
```

#### 6.4 Product Retrieval & Creation (with RBAC)

```javascript
// routes/products.js (example)
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Node.js file system module

// Ensure the storage directory exists, adhering to the locked storage path convention
const UPLOADS_BASE_PATH = '/var/www/storage/uploads';
const PRODUCT_UPLOAD_PATH = path.join(UPLOADS_BASE_PATH, 'products'); // resource = 'products'

// Use synchronous mkdirSync for startup to ensure path exists before requests
fs.mkdirSync(PRODUCT_UPLOAD_PATH, { recursive: true });

// Multer storage configuration for product images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const year = new Date().getFullYear().toString(); // yyyy = current year
        const yearPath = path.join(PRODUCT_UPLOAD_PATH, year);
        fs.mkdirSync(yearPath, { recursive: true }); // Create year directory if not exists
        cb(null, yearPath);
    },
    filename: (req, file, cb) => {
        const fileId = uuidv4(); // uuid = generated UUID
        const fileExtension = path.extname(file.originalname); // ext = original extension
        cb(null, `${fileId}${fileExtension}`); // Conforms to {uuid}.{ext}
    }
});

const upload = multer({ storage: storage });

// Get all products from the 'products' table
router.get('/', async (req, res) => {
    try {
        const [products] = await pool.query('SELECT id, name, description, price, category_id, stock_quantity, image_url FROM products');
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error fetching products' });
    }
});

// Create a new product (Admin only) in the 'products' table
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    const { name, description, price, categoryId, stockQuantity } = req.body;
    if (!name || !price || !categoryId || stockQuantity === undefined) {
        return res.status(400).json({ message: 'Missing required product fields' });
    }

    try {
        const productId = uuidv4();
        await pool.query(
            'INSERT INTO products (id, name, description, price, category_id, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
            [productId, name, description, price, categoryId, stockQuantity]
        );
        res.status(201).json({ message: 'Product created successfully', productId });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error creating product' });
    }
});

// Upload product image (Admin only)
router.post('/:id/upload-image', isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
    const productId = req.params.id;
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        // Construct the full, absolute image URL according to the locked storage path convention
        const year = new Date().getFullYear().toString();
        const imageUrl = path.join(UPLOADS_BASE_PATH, 'products', year, req.file.filename);
        
        await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, productId]);
        res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ message: 'Server error uploading image' });
    }
});

module.exports = router;
```
