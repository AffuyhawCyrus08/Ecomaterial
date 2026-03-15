This document provides a comprehensive security implementation guide for an e-commerce site specializing in refined plastic products, metal scraps, and discarded fabrics. It adheres strictly to the locked architectural decisions and consistency rules outlined, specifically enforcing **session-based authentication** across all API interactions and client-server communication.

---

# Security Implementation Guide for E-commerce Platform

## 1. Security Overview

This e-commerce platform, designed as a premium SaaS-style experience, handles sensitive customer data, product information, and transaction details. A robust security posture is paramount to protect customer trust, maintain business continuity, and comply with relevant regulations.

### Security Requirements Summary
The application requires strong security across all layers to ensure:
*   **Confidentiality:** Protecting sensitive customer data (PII), `products` data, and internal business logic from unauthorized access.
*   **Integrity:** Ensuring that data (e.g., product prices, order details, inventory counts) cannot be altered by unauthorized entities and remains accurate and trustworthy.
*   **Availability:** Guaranteeing that the e-commerce platform is accessible and operational for legitimate users, resisting denial-of-service attacks and ensuring reliable service.
*   **Accountability:** Maintaining comprehensive audit trails for security-sensitive actions performed by users and administrators.
*   **Non-repudiation:** Ensuring that users cannot falsely deny having performed an action (e.g., placing an order, making a payment).

### Threat Model Overview
We are protecting:
*   **Customer Data:** Personally Identifiable Information (PII) such as names, addresses, contact details, purchase history.
*   **Financial Transactions:** Order details, payment processing information (though often handled by third-party gateways).
*   **Product & Inventory Data:** Product descriptions, images, pricing, stock levels for `products`.
*   **Admin Data:** Management credentials, internal operational data.
*   **System Resources:** Server infrastructure, database, file storage.

From whom:
*   **External Malicious Actors:** Cybercriminals attempting data breaches (SQL Injection, XSS), account takeovers, financial fraud, denial-of-service attacks, and intellectual property theft.
*   **Insider Threats:** Disgruntled employees or compromised administrative accounts abusing their privileges to steal or manipulate data.
*   **Automated Bots:** Scraping product data, attempting credential stuffing, or exploiting vulnerabilities.
*   **Supply Chain Attacks:** Vulnerabilities introduced via third-party libraries or components.

### Compliance Considerations
*   **GDPR (General Data Protection Regulation):** Given the processing of personal data for EU citizens, GDPR compliance is critical. This impacts data collection, storage, processing, user rights (right to access, rectification, erasure), data breach notification, and privacy by design principles.
*   **PCI-DSS (Payment Card Industry Data Security Standard):** While payment processing will likely be outsourced to PCI-DSS compliant third-party gateways (e.g., Stripe, PayPal), the application must ensure it never directly stores or processes sensitive cardholder data. All interactions with payment gateways must be secure. If any part of the application *does* handle card data, full PCI-DSS compliance would be required. For this guide, we assume direct card data handling is minimized or avoided.
*   **HIPAA (Health Insurance Portability and Accountability Act):** Not applicable as the application does not handle Protected Health Information (PHI).

## 2. Authentication & Authorization

### Recommended Authentication Method
The system will employ a **session-based authentication** model, consistent with the locked architectural decisions of `Auth Mode: session` and `API Style: session`. Upon successful login, the Node.js + Express backend will create a session and store a session ID in a secure, HttpOnly, Secure cookie sent to the React frontend. Subsequent API requests from the frontend will automatically include this session cookie for authentication. No token-based authentication will be used.

### Password Security
*   **Hashing Algorithm:** Passwords must be hashed using a strong, industry-standard, computationally expensive, salt-aware algorithm like **bcrypt**. Each password hash must have a unique salt.
*   **Password Requirements:**
    *   Minimum length: 12 characters.
    *   Complexity: Require a mix of uppercase letters, lowercase letters, numbers, and special characters.
    *   Disallow common or previously breached passwords (using a service like Have I Been Pwned API).
*   **Password Reset Flow:**
    *   **Token Generation:** When a user requests a password reset, generate a unique, time-limited, single-use token. Store the hashed token in the database.
    *   **Email Delivery:** Send the reset token via a secure link (HTTPS) to the user's verified email address.
    *   **Token Validation:** Upon receiving the request with the token, validate its authenticity, expiry, and single-use status.
    *   **New Password Setting:** Allow the user to set a new password only after successful token validation. Invalidate the token immediately after use.

### Session Management Best Practices
*   **Secure Cookies:**
    *   `HttpOnly`: Prevent client-side scripts (XSS) from accessing the session cookie.
    *   `Secure`: Ensure the cookie is only sent over HTTPS connections.
    *   `SameSite=Lax` or `Strict`: Mitigate CSRF attacks. `Strict` is more secure but might impact cross-site navigation, `Lax` is often a good balance.
    *   `Expires` or `Max-Age`: Set an appropriate session expiration time (e.g., 30 minutes of inactivity for sensitive admin sessions, longer for regular users).
*   **Session ID Regeneration:**
    *   Generate a new session ID upon successful login to prevent session fixation attacks.
    *   Generate a new session ID when a user's privilege level changes (e.g., after an admin logs in, or a user elevates to an admin role).
*   **Session Invalidation:**
    *   Explicitly invalidate sessions upon logout.
    *   Implement server-side session revocation for compromised sessions or password changes.
*   **Session Store:** Use a secure, scalable session store (e.g., Redis, MySQL with proper indexing) for Express sessions.

### Role-Based Access Control (RBAC) Implementation
The application will implement an `admin-user` RBAC model, defining distinct permissions for each role:
*   **`admin` Role:** Full access to all backend functionalities, including `products` management (add, edit, delete), order fulfillment, user management, site configuration, and analytics.
*   **`user` Role (Customer):** Access to personal profile, order history, browsing `products`, adding to cart, checkout, and initiating returns. Cannot access administrative functions.

**Implementation:**
*   Each user record in the database will have an associated `role` field (e.g., `enum('user', 'admin')` in MySQL).
*   Middleware in Express will check the user's role before allowing access to specific API endpoints.

**Example Express Middleware:**
```javascript
// authMiddleware.js
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).send('Unauthorized: No active session.');
};

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userRole) {
            return res.status(401).send('Unauthorized: No user role found in session.');
        }
        // Assuming userRole is stored in req.session.userRole after login
        if (req.session.userRole === requiredRole || req.session.userRole === 'admin') {
            // Admins can access all user-level functionalities
            return next();
        }
        res.status(403).send('Forbidden: Insufficient privileges.');
    };
};

// Example usage in an Express route file:
// const express = require('express');
// const router = express.Router();
// const { isAuthenticated, authorizeRole } = require('./authMiddleware');

// router.get('/profile', isAuthenticated, authorizeRole('user'), (req, res) => {
//     // Only authenticated users with 'user' or 'admin' role can access
//     res.json({ message: `Welcome ${req.session.username}` });
// });

// router.post('/products', isAuthenticated, authorizeRole('admin'), (req, res) => {
//     // Only authenticated users with 'admin' role can create products
//     res.status(201).send('Product created');
// });
```

### Multi-Factor Authentication Considerations
*   **For `admin` users:** MFA should be **mandatory** to protect critical administrative functions. Implement solutions like TOTP (Time-based One-Time Password) using authenticator apps (e.g., Google Authenticator, Authy).
*   **For `user` (customer) accounts:** MFA should be **optional but highly recommended**. Provide options for users to enable it for their accounts.

## 3. Input Validation & Data Sanitization

Robust input validation and data sanitization are critical to prevent a wide range of web vulnerabilities, including injection attacks and XSS.

### Input Validation Rules for All User Inputs
All incoming data from the React frontend to the Node.js + Express backend must be validated. Validation should occur on both the client-side (for user experience) and, critically, on the server-side (for security).
*   **Whitelisting:** Prefer whitelisting (defining what *is* allowed) over blacklisting (defining what *is not* allowed).
*   **Data Type & Format:** Validate strings, numbers, dates, booleans. For example, email addresses must conform to a valid email format, phone numbers to a specific pattern, `products` quantities must be positive integers.
*   **Length Constraints:** Enforce minimum and maximum lengths for text fields (e.g., username, password, product description).
*   **Range Constraints:** For numerical inputs (e.g., `products` prices, quantities), ensure they fall within acceptable ranges.
*   **Enumerated Values:** If an input must be one of a predefined set of values (e.g., product category), validate against that set.
*   **Specific Contexts:** Validate URLs, file names, and other context-specific inputs against their expected formats.

### SQL Injection Prevention Techniques
Given MySQL as the database, **Parameterized Queries** (also known as Prepared Statements) are the primary and most effective defense against SQL Injection. **Never concatenate user input directly into SQL queries.**

**Node.js MySQL Example (using `mysql2` library which supports prepared statements):**
```javascript
// In a data access layer function
const mysql = require('mysql2/promise'); // Using promise-based API

async function getProductById(productId) {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'user',
        password: 'password',
        database: 'ecommerce'
    });
    try {
        // Correct: Using prepared statements (values are passed as an array)
        const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [productId]);
        return rows[0];
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

async function createProduct(name, description, price, stock) {
    const connection = await mysql.createConnection({ /* ... db config ... */ });
    try {
        const query = 'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)';
        const [result] = await connection.execute(query, [name, description, price, stock]);
        return result.insertId;
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Example of what NOT to do (vulnerable to SQL Injection):
// async function getProductByIdVulnerable(productId) {
//     const connection = await mysql.createConnection({ /* ... db config ... */ });
//     try {
//         const [rows] = await connection.execute(`SELECT * FROM products WHERE id = ${productId}`); // DANGER!
//         return rows[0];
//     } catch (error) {
//         console.error('Database error:', error);
//         throw error;
//     } finally {
//         await connection.end();
//     }
// }
```

### XSS (Cross-Site Scripting) Prevention
XSS occurs when malicious scripts are injected into web pages viewed by other users.
*   **Output Encoding:** The primary defense. All user-generated content rendered on the frontend (React) must be properly encoded. React inherently escapes values interpolated into JSX, which helps prevent basic XSS.
    *   **Server-Side Sanitization:** For content that allows rich text (e.g., `products` descriptions), use a robust sanitization library like `DOMPurify` on the Node.js backend before storing it and before rendering. This removes dangerous HTML tags and attributes.
    *   **Content Security Policy (CSP):** Implement a strict CSP (see API Security section) to restrict the sources from which scripts, styles, and other resources can be loaded, significantly mitigating XSS.

**Example Server-side Sanitization (Node.js):**
```javascript
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeHtmlInput(htmlString) {
    // Sanitize HTML input for rich text areas like product descriptions
    return purify.sanitize(htmlString, { USE_PROFILES: { html: true } });
}

// In an Express route:
// router.post('/products', isAuthenticated, authorizeRole('admin'), (req, res) => {
//     let { name, description, price, stock } = req.body;
//     // ... other validations ...
//     description = sanitizeHtmlInput(description); // Sanitize description
//     // ... save to database ...
// });
```

### CSRF (Cross-Site Request Forgery) Protection
CSRF attacks trick users into executing unwanted actions on a web application where they are authenticated.
*   **Anti-CSRF Tokens:** Implement a synchronized token pattern.
    *   The server generates a unique, random token and embeds it in the HTML form/page (for GET requests that render forms) or sends it via an API endpoint that the React app fetches.
    *   The React app includes this token in all state-changing requests (POST, PUT, DELETE) in a custom header (e.g., `X-CSRF-Token`) or as a hidden field.
    *   The server verifies the token received in the request against the token stored in the user's session.
*   **`SameSite` Cookie Attribute:** As mentioned in Session Management, setting `SameSite=Lax` or `Strict` on session cookies provides significant protection against CSRF by preventing the cookie from being sent with cross-site requests. This is a crucial defense.

**Example Node.js with `csurf` middleware:**
```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csurf = require('csurf');
const app = express();

app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET, // Use a strong, unique secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'Lax', // or 'Strict'
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// CSRF protection middleware
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Add CSRF token to responses for the React app to consume
app.use((req, res, next) => {
    // For API style, the React app might fetch this via a dedicated endpoint
    // or it could be set as a custom header on the initial page load.
    // For now, setting it on the response for React to pick up.
    res.cookie('XSRF-TOKEN', req.csrfToken()); // Frontend reads this cookie and sends as header
    next();
});

// Example route for POST request
app.post('/api/orders', isAuthenticated, (req, res) => {
    // req.csrfToken() will be validated by the csurf middleware automatically
    // ... process order ...
    res.status(201).send('Order placed');
});
```
The React frontend would read the `XSRF-TOKEN` cookie and include it in an `X-XSRF-TOKEN` header for subsequent POST/PUT/DELETE requests.

### File Upload Security
The application will allow image uploads for `products`. All file uploads must follow strict security protocols, adhering to the locked storage path: `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`.

*   **Validation:**
    *   **File Type (MIME Type):** Validate on the server side using libraries like `file-type` to verify the actual file type, not just the extension. Only allow image types (e.g., `image/jpeg`, `image/png`, `image/webp`).
    *   **File Size:** Enforce strict maximum file size limits to prevent DoS attacks.
    *   **Dimensions:** For images, validate image dimensions to prevent overly large images or malicious image scaling.
*   **Storage Location:**
    *   Store uploaded files **outside the web root** directory (e.g., `/var/www/storage/uploads`). This prevents direct execution of uploaded files by the web server.
    *   Serve images via a dedicated, secured endpoint that performs access control if needed.
*   **Renaming Files:**
    *   Generate **cryptographically strong, unique filenames** (UUIDs) for all uploaded files. Never use user-provided filenames directly.
    *   Retain the original extension after validation, or enforce a standard, safe extension.
    *   **Example Path:** `/var/www/storage/uploads/products/2023/a1b2c3d4-e5f6-7890-1234-567890abcdef.png`
*   **Content Scanning:** Integrate antivirus scanning for uploaded files, especially if they might be accessed by internal users or processed.
*   **Permissions:** Set restrictive file system permissions on the upload directory to prevent unauthorized read/write access.

**Example Node.js File Upload (using `multer`):**
```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');
const fileType = require('file-type'); // For robust MIME type detection

const app = express();

const uploadDir = '/var/www/storage/uploads/products'; // Specific to products resource

// Ensure upload directory exists
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const year = new Date().getFullYear();
        const yearDir = path.join(uploadDir, String(year));
        await fs.mkdir(yearDir, { recursive: true }); // Create year subdirectory
        cb(null, yearDir);
    },
    filename: (req, file, cb) => {
        // Generate a UUID for the filename and append original extension
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: async (req, file, cb) => {
        // Robust MIME type validation - needs file buffer, so configure multer memoryStorage for this pre-write check
        // Or if diskStorage is used, read from disk *after* writing, which is less ideal for rejection
        // For this example, assuming file.buffer is available if using memoryStorage:
        // const fileBuffer = file.buffer; 
        // const type = await fileType.fromBuffer(fileBuffer);
        
        // A more practical approach with diskStorage might involve checking extension first then a post-upload deeper check
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
        }

        // Deeper check if buffering or after temporary storage
        // Note: For fileType.fromBuffer to work here, `multer` should be configured with `memoryStorage`
        // const fileBuffer = file.buffer; // If multer({ storage: multer.memoryStorage() })
        // const type = await fileType.fromBuffer(fileBuffer);
        // if (type && ['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
        //     cb(null, true);
        // } else {
        //     cb(new Error('Invalid file content type.'));
        // }
        cb(null, true); // For simplicity assuming extension check is sufficient, or a post-upload scan is done
    }
});

// Route for product image upload
app.post('/api/products/:productId/image', isAuthenticated, authorizeRole('admin'), upload.single('productImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    // Construct the full storage path based on locked decision
    const year = new Date().getFullYear();
    const filePath = `/var/www/storage/uploads/products/${year}/${req.file.filename}`;
    
    // Update product record in MySQL with image path
    // await updateProductImagePath(req.params.productId, filePath); 

    res.status(200).json({ message: 'Image uploaded successfully', path: filePath });
});
```
*Note: For `fileType.fromBuffer`, `multer` should be configured with `memoryStorage` if you want to perform buffer-based checks before writing to disk, or handle reading the file from `req.file.path` after it's written by `diskStorage` (less efficient).*

### Code Examples for Validation Functions
Using a library like `express-validator` (built on `validator.js`) is highly recommended for Express.

```javascript
const { body, validationResult } = require('express-validator');

// Validation for user registration
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters.')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
    body('email')
        .trim()
        .isEmail().withMessage('Invalid email format.')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 12 }).withMessage('Password must be at least 12 characters long.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[\S]+$/).withMessage('Password must include uppercase, lowercase, number, and special character.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validation for product creation
const validateProductCreation = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters.'),
    body('description')
        .trim()
        .isLength({ min: 10, max: 2000 }).withMessage('Product description must be between 10 and 2000 characters.'),
    body('price')
        .isFloat({ min: 0.01 }).withMessage('Price must be a positive number.'),
    body('stock')
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Example Express route usage
// app.post('/api/register', validateRegistration, async (req, res) => { /* ... */ });
// app.post('/api/products', isAuthenticated, authorizeRole('admin'), validateProductCreation, async (req, res) => { /* ... */ });
```

## 4. API Security

The RESTful APIs exposed by the Node.js + Express backend are critical entry points and require stringent security measures.

### API Authentication Mechanisms
Consistent with locked architectural decisions, **session-based authentication** will be used for API access.
*   Upon successful user login (via `/api/auth/login`), the server establishes a session and returns an `HttpOnly`, `Secure`, `SameSite=Lax` cookie containing the session ID.
*   The React frontend will automatically send this cookie with all subsequent API requests.
*   All API endpoints requiring authentication will verify the presence and validity of this session cookie on the server-side via middleware.

### Rate Limiting Implementation
Implement rate limiting to prevent brute-force attacks, credential stuffing, and resource exhaustion DoS attacks.
*   Use `express-rate-limit` middleware for this purpose.
*   Apply different limits based on endpoint sensitivity:
    *   **Login Endpoints:** Stricter limits (e.g., 5 requests per minute per IP).
    *   **Password Reset:** Stricter limits (e.g., 3 requests per hour per IP/email).
    *   **General API Endpoints:** More relaxed limits (e.g., 100 requests per 15 minutes per IP).

**Example Node.js Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const app = require('express')();

// Apply to all requests
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(apiLimiter);

// Specific stricter limiter for authentication
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per 5 minutes
    message: 'Too many authentication attempts from this IP, please try again after 5 minutes',
    // Optionally, store hit counts per user/email in database after first failure for more precise limits
    // store: new RedisStore({ client: redisClient })
});
app.post('/api/login', authLimiter, (req, res) => { /* ... */ });
app.post('/api/register', authLimiter, (req, res) => { /* ... */ });
app.post('/api/password-reset-request', authLimiter, (req, res) => { /* ... */ });
```

### Request Validation and Sanitization
As detailed in Section 3, all incoming API request bodies, query parameters, and URL parameters must be thoroughly validated and sanitized on the server-side before processing or storing. Libraries like `express-validator` are essential.

### CORS Configuration
Cross-Origin Resource Sharing (CORS) must be correctly configured to allow the React frontend (running on a different origin, e.g., `http://localhost:3000` during dev, `https://your-ecommerce.com` in production) to make requests to the Node.js backend API.
*   **Restrict `Access-Control-Allow-Origin`:** Only allow specific, trusted origins (your frontend domain). Avoid `*` in production.
*   **Allow necessary methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
*   **Allow necessary headers:** `Content-Type`, `X-CSRF-Token`. For session-based auth, cookies are handled automatically; no `Authorization` header for token-based auth is needed or expected.
*   **`credentials: true`:** For session-based authentication, the `Access-Control-Allow-Credentials` header must be set to `true` on the server, and the frontend must send requests with `credentials: 'include'`. This allows cookies (including session cookies) to be sent cross-origin.

**Example Node.js CORS Configuration (using `cors` middleware):**
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

const whitelist = ['http://localhost:3000', 'https://www.yourecommerce.com']; // Your React frontend origins
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) { // Allow requests with no origin (e.g., Postman, same-origin)
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'], // Add any custom headers your frontend sends (e.g., for CSRF)
    credentials: true, // Essential for sending session cookies cross-origin
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
```

### Security Headers
Utilize the `helmet` middleware in Express to automatically set various HTTP security headers that mitigate common attacks.

**Example Node.js Security Headers (using `helmet`):**
```javascript
const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(helmet()); // Sets many headers by default

// Customize CSP (Content Security Policy)
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"], // Be very specific here
        styleSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
        imgSrc: ["'self'", "data:", "https://trusted-image-cdn.com"],
        connectSrc: ["'self'", "https://api.yourecommerce.com", "ws://localhost:3000"], // WebSocket for real-time updates
        frameAncestors: ["'none'"], // Prevent clickjacking by disallowing embedding in iframes
        formAction: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        // If payment gateway requires external scripts, add their domains
        frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"], // Example for Stripe
    },
}));

// HSTS (HTTP Strict Transport Security) - enforce HTTPS
app.use(helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true // Add your domain to the HSTS preload list
}));

// X-Frame-Options (already covered by CSP frameAncestors: 'none')
// X-Content-Type-Options: nosniff
// X-DNS-Prefetch-Control
// Referrer-Policy
// These are included by default with app.use(helmet());
```

### API Versioning Security Considerations
As the e-commerce platform evolves, API versioning (`/api/v1`, `/api/v2`) will be necessary.
*   **Deprecation Strategy:** When a new API version is released, securely deprecate older versions. Provide clear timelines for deprecation and ensure that critical security fixes are backported to supported older versions until they are fully retired.
*   **Security Differences:** Each API version should undergo a full security review. Do not assume security fixes from a newer version automatically apply or are equivalent to older versions.
*   **Backward Compatibility:** While striving for backward compatibility, do not compromise security for it. If a security vulnerability in an older version cannot be patched without breaking changes, force migration to a newer, secure version.

## 5. Data Protection

Protecting sensitive data both at rest and in transit is a cornerstone of application security.

### Encryption at Rest (Database, Files)
*   **Database (MySQL):**
    *   **Transparent Data Encryption (TDE):** For MySQL Enterprise Edition, TDE can encrypt entire tablespaces or specific tables. This protects data even if the underlying storage is compromised.
    *   **Filesystem Encryption:** Encrypt the entire filesystem where the MySQL data files reside using solutions like LUKS (Linux Unified Key Setup). This is a strong option for community editions of MySQL.
    *   **Column-Level Encryption:** For highly sensitive fields (e.g., PII that cannot be masked), consider application-level encryption for specific columns using AES-256 before storing them in MySQL. This requires careful key management.
*   **File Storage (Uploaded Resources):**
    *   The `/var/www/storage/uploads` directory (and its subdirectories like `/products/{yyyy}`) must reside on an encrypted filesystem (e.g., using LUKS).
    *   Access to this storage should be highly restricted via file system permissions and network firewalls.

### Encryption in Transit (TLS/SSL)
All communication between the React frontend, Node.js backend, and other services (e.g., payment gateways, email services) **must** use **TLS 1.2 or higher**.
*   **HTTPS Enforcement:** Configure the web server (e.g., Nginx, Apache, or Express directly with `https` module) to serve all traffic over HTTPS. Redirect all HTTP requests to HTTPS.
*   **Strong TLS Configuration:**
    *   Use modern cipher suites, disallowing weak or compromised ciphers.
    *   Enable Perfect Forward Secrecy (PFS).
    *   Regularly update TLS certificates and keys.
    *   Implement HSTS (HTTP Strict Transport Security) to force browsers to interact with the site only over HTTPS for a defined period.

### Sensitive Data Handling (PII, Passwords, API keys)
*   **PII (Personally Identifiable Information):**
    *   **Minimize Collection:** Only collect PII that is absolutely necessary for business operations.
    *   **Access Control:** Restrict access to PII within the application and database to authorized roles (`admin`).
    *   **Encryption:** Encrypt sensitive PII at rest if possible, and always in transit.
    *   **Retention Policy:** Define and enforce clear data retention policies for PII, deleting data when it's no longer needed.
*   **Passwords:**
    *   As detailed in Section 2, never store passwords in plain text. Use bcrypt for hashing and salting.
    *   Never transmit passwords in plain text, always over HTTPS.
    *   Avoid storing password history directly, but enforce rules against reusing old passwords.
*   **API Keys & Secrets:**
    *   **Environment Variables:** Store all sensitive API keys, database credentials, session secrets (e.g., `process.env.DB_PASSWORD`, `process.env.SESSION_SECRET`) as environment variables. **Never hardcode them in the codebase.**
    *   **Secret Management Services:** For production environments, consider using dedicated secret management solutions like AWS Secrets Manager, Google Secret Manager, HashiCorp Vault, or Kubernetes Secrets (though these need careful handling). This provides centralized, secure storage and rotation.
    *   **Access Control:** Restrict access to environment variables and secret stores to authorized deployment pipelines and runtime environments.

### Environment Variables and Secrets Management
*   **Local Development:** Use `.env` files with a tool like `dotenv` for local development. Ensure `.env` is in `.gitignore`.
*   **Deployment:** Inject environment variables at deployment time.
    *   For containerized deployments (Docker/Kubernetes), use Kubernetes Secrets, Docker secrets.
    *   For server deployments, use your cloud provider's secret manager, environment variables managed by your CI/CD pipeline, or direct server configuration (e.g., `/etc/environment` for server-wide variables, though less flexible for different applications).

### Data Masking and Anonymization
*   **Non-Production Environments:** For development, staging, and testing environments, sensitive production data (especially PII and financial details) should be replaced with masked, faked, or anonymized data.
*   **Logging:** Mask sensitive information in logs to prevent accidental exposure (e.g., mask credit card numbers, email addresses, IP addresses).
*   **Reporting:** Anonymize data for analytics and reporting purposes where individual identification is not required.

## 6. Vulnerability Prevention (OWASP Top 10)

Addressing the OWASP Top 10 is crucial for comprehensive application security.

### Injection Attacks Prevention
*   **SQL Injection:** Use parameterized queries/prepared statements for all database interactions (Node.js + MySQL).
*   **Command Injection:** Never execute system commands directly with user-supplied input. If external commands must be run, use a safe API (e.g., Node.js `child_process.spawn` with `shell: false`) and strictly validate arguments.
*   **NoSQL Injection (N/A for MySQL):** This concern is not applicable as MySQL is the chosen database.

### Broken Authentication Countermeasures
*   **Secure Session Management:** As detailed in Section 2 (HttpOnly, Secure, SameSite cookies, session ID regeneration, invalidation).
*   **Strong Password Hashing:** Use bcrypt with appropriate work factors.
*   **Password Complexity & Requirements:** Enforce strong password policies.
*   **Rate Limiting:** On login attempts and password reset requests.
*   **MFA:** Mandatory for admins, optional for users.
*   **Account Lockout:** Implement temporary account lockouts after a certain number of failed login attempts to deter brute-force attacks.
*   **Secure Password Reset:** Time-limited, single-use tokens, email verification.

### Sensitive Data Exposure Prevention
*   **Encryption at Rest & In Transit:** (TLS, database/filesystem encryption).
*   **Restrict PII:** Minimize collection, apply strict access controls, use data masking for non-prod environments and logs.
*   **Environment Variables:** Store secrets outside codebase.
*   **Error Handling:** Do not expose sensitive error messages (stack traces, database errors) to end-users.
*   **Configuration:** Disable debug modes, directory listings, and verbose error reporting in production.

### XML External Entities (XXE) Prevention
While Node.js applications primarily use JSON, if any part of the application processes XML input (e.g., integration with legacy systems), disable DTDs (Document Type Definitions) and external entity processing in the XML parser.

**Example (if using `libxmljs` or similar XML parser):**
```javascript
// const libxmljs = require('libxmljs');
// // When parsing XML, ensure to disable external entity loading
// const xmlDoc = libxmljs.parseXml(xmlString, { noblanks: true, noent: true, nocdata: true });
// // The 'noent' option (NOENT) would typically disable entity replacement.
// // For complete XXE prevention, avoid DTDs and external entity resolution.
```

### Broken Access Control Mitigation
*   **RBAC (admin-user):** Implement and enforce role-based access control meticulously.
*   **Least Privilege:** Users and services should only have the minimum necessary permissions to perform their functions.
*   **Auth Checks on Every Request:** Every API endpoint that requires authorization must explicitly check the user's permissions. Do not rely solely on client-side controls.
*   **No Hardcoded IDs:** Avoid sequential IDs or predictable resource identifiers where possible, or protect them with strong authorization.
*   **Horizontal Access Control:** Ensure users can only access their own resources (e.g., a customer can only view their own orders, not another customer's).

### Security Misconfiguration Checklist
*   **Default Credentials:** Change all default passwords for databases, servers, and services.
*   **Unused Features:** Disable or remove unnecessary services, ports, components, and functionalities.
*   **Error Messages:** Configure generic error messages for production environments.
*   **Directory Listings:** Disable directory listings on web servers.
*   **Permissions:** Apply principle of least privilege to file system and database permissions.
*   **Security Headers:** Implement strong security headers (CSP, HSTS, X-Frame-Options, etc.).
*   **Patch Management:** Keep all operating systems, web servers, databases, and application dependencies up-to-date.
*   **Cloud Security:** Configure cloud resources (VMs, S3 buckets, databases) with secure network policies, IAM roles, and encryption.

### Cross-Site Scripting (XSS) Defense
*   **Output Encoding:** Encode all untrusted user input before rendering it in HTML (React handles this by default for JSX interpolations, but custom HTML might need explicit encoding).
*   **Input Sanitization:** Sanitize user-generated rich HTML content on the server-side (e.g., `products` descriptions) using a library like `DOMPurify`.
*   **Content Security Policy (CSP):** Implement a strict CSP to restrict executable scripts, significantly reducing the impact of XSS.
*   **HttpOnly Cookies:** Use `HttpOnly` flag for session cookies to prevent JavaScript access.

### Insecure Deserialization Protection
*   Avoid deserializing untrusted data whenever possible.
*   If deserialization is necessary, use safe, non-executable data formats (e.g., JSON) and ensure strict schema validation.
*   Be aware of Node.js specific threats like **Prototype Pollution** when merging or processing untrusted JSON objects without proper validation. Use libraries designed to prevent this (e.g., `lodash.merge` with safeguards, or custom recursive merging logic).

### Using Components with Known Vulnerabilities (Dependency Scanning)
*   **Regular Updates:** Keep all Node.js modules, Express middleware, React libraries, and system dependencies updated to their latest stable versions.
*   **Dependency Scanning Tools:**
    *   `npm audit`: Regularly run `npm audit` to check for known vulnerabilities in Node.js dependencies.
    *   **Snyk, OWASP Dependency-Check, RenovateBot:** Integrate these tools into the CI/CD pipeline to automate dependency vulnerability scanning and potentially auto-remediate.

### Insufficient Logging and Monitoring Solutions
*   **Comprehensive Logging:** Log all security-relevant events (successful/failed logins, admin actions, access denied, critical errors, file uploads, data modifications).
*   **Centralized Logging:** Aggregate logs from the application, web server, database, and infrastructure into a centralized logging system (e.g., ELK Stack, Splunk, cloud logging services) for easier analysis and monitoring.
*   **Security Monitoring & Alerting:** Configure alerts for suspicious activities (e.g., repeated failed logins, unusual access patterns, high error rates, critical system events).
*   **Audit Trails:** Maintain clear, immutable audit trails for all actions affecting sensitive data or system configuration, including who did what, when, and from where.

## 7. Secure Coding Guidelines

Establishing secure coding practices is essential to build security into the application from the ground up.

### Code Review Security Checklist
*   **Input Validation:** Are all inputs (query params, body, headers, cookies) properly validated and sanitized?
*   **Authentication & Authorization:** Are all protected endpoints enforcing `isAuthenticated` and `authorizeRole` checks? Is session management secure?
*   **Error Handling:** Are generic error messages returned to users, with sensitive details logged internally?
*   **Sensitive Data:** Are PII, passwords, and API keys handled securely (hashed, encrypted, env variables)?
*   **SQL Injection:** Are parameterized queries used for all database interactions?
*   **XSS/CSRF:** Is output encoding used? Is CSRF protection implemented for state-changing operations?
*   **File Uploads:** Are file types, sizes, and names validated? Are files stored securely outside the web root (in `/var/www/storage/uploads`)?
*   **Dependencies:** Are known vulnerable dependencies being used? (Check `package.json` against `npm audit`).
*   **Logging:** Are sufficient security events logged? Is sensitive data masked in logs?
*   **Configuration:** Are insecure defaults or hardcoded secrets present?
*   **API Security:** Are rate limiting, CORS, and security headers correctly configured?
*   **Resource Management:** Are resources properly closed (database connections, file handles)?
*   **Concurrency:** Are race conditions handled correctly, especially for inventory/order operations?

### Common Security Anti-Patterns to Avoid
*   **Directly using `eval()` or `new Function()` with untrusted input:** Can lead to code injection.
*   **Hardcoding secrets:** Passwords, API keys, database credentials must be in environment variables or a secure secret store.
*   **Skipping input validation:** A direct path to injection and other attacks.
*   **Returning raw error messages/stack traces to users:** Exposes internal system details.
*   **Using `==` instead of `===` for comparisons:** Can lead to unexpected type coercion and security bypasses.
*   **Insecure default configurations:** Always review and harden default settings for frameworks, libraries, and servers.
*   **Ignoring `npm audit` warnings:** Address dependency vulnerabilities promptly.
*   **Client-side only validation for security:** Never trust client-side validation; always re-validate on the server.

### Secure Error Handling (No Stack Traces to Users)
*   In production, all errors should be caught by a centralized error handling middleware in Express.
*   For end-users, return generic, non-informative error messages (e.g., "An unexpected error occurred. Please try again later." or "Invalid input provided.").
*   Log the full error details, including stack traces, internally for debugging.

**Example Express Error Handling:**
```javascript
// At the end of your Express app setup, after all routes and other middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack); // Log full error internally

    // Check for specific error types (e.g., validation errors)
    if (err.name === 'ValidationError') { // Example for Joi/Yup validation errors
        return res.status(400).json({ message: 'Validation failed', details: err.details });
    }
    if (err.code === 'EBADCSRFTOKEN') { // CSRF token error
        return res.status(403).json({ message: 'Invalid CSRF token.' });
    }
    if (err.message === 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.') {
        return res.status(400).json({ message: err.message });
    }

    // Generic error for production
    if (process.env.NODE_ENV === 'production') {
        res.status(500).send('An unexpected server error occurred.');
    } else {
        // More verbose error for development
        res.status(500).json({ message: err.message, stack: err.stack });
    }
});
```

### Logging Best Practices (What to Log, What NOT to Log)
*   **What to Log (Security Relevant):**
    *   Successful and failed authentication attempts (username, IP, timestamp).
    *   Authorization failures (attempted action, user, IP, timestamp).
    *   Critical data modifications (who, what, when, where - e.g., `products` updates, order status changes).
    *   File uploads (uploader, filename, path, timestamp).
    *   System errors, exceptions, and warnings.
    *   Admin actions (user management, configuration changes).
    *   API requests/responses (for auditing/troubleshooting, but with care for sensitive data).
*   **What NOT to Log:**
    *   **Passwords:** Never log plaintext passwords.
    *   **Sensitive PII:** Mask or redact highly sensitive PII (credit card numbers, national IDs) from logs. Email addresses and full names should be logged only if necessary and handled with care.
    *   **Session IDs/Cookies:** Log session IDs as needed for troubleshooting, but avoid full cookie values.
    *   **API Keys/Secrets:** Never log these.
*   **Log Integrity:** Protect logs from tampering by ensuring they are stored in a secure, immutable, and access-controlled manner.

### Debug Mode Security
*   **Disable in Production:** Debug mode, verbose logging, and developer tools should be **completely disabled** in production environments.
*   **Feature Flags:** Use feature flags or environment variables (`process.env.NODE_ENV === 'development'`) to conditionally enable/disable debug-related functionalities.
*   **Local-Only Access:** If a debug interface is necessary, restrict access to it via IP whitelisting or strong authentication only from internal networks.

## 8. Security Testing

A robust security testing strategy is crucial to identify and remediate vulnerabilities throughout the development lifecycle.

### Security Testing Checklist
*   **Static Application Security Testing (SAST):** Analyze source code without executing it for common vulnerabilities (e.g., insecure functions, hardcoded secrets).
*   **Dynamic Application Security Testing (DAST):** Test the running application from the outside by simulating attacks (e.g., SQLi, XSS, broken authentication).
*   **Interactive Application Security Testing (IAST):** Combines elements of SAST and DAST, monitoring the application during execution to identify vulnerabilities.
*   **Software Composition Analysis (SCA):** Identify open-source components with known vulnerabilities.
*   **Manual Code Review:** Dedicated security experts review critical code paths, authentication/authorization logic, and sensitive data handling.
*   **Penetration Testing:** Ethical hackers simulate real-world attacks to find exploitable vulnerabilities.
*   **Vulnerability Scanning:** Use automated tools to scan servers, networks, and applications for known vulnerabilities.
*   **Configuration Review:** Ensure secure configurations for all infrastructure components (OS, web server, database, cloud services).

### Penetration Testing Recommendations
*   **Regular Schedule:** Conduct external penetration tests annually, or after significant new feature deployments.
*   **Scope:** The scope should include the entire e-commerce application (React frontend, Node.js backend API, MySQL database, file storage, and underlying infrastructure).
*   **Credentials:** Provide the pen testers with both `user` and `admin` credentials to test for privilege escalation and horizontal access control issues.
*   **Report & Remediation:** Thoroughly review penetration test reports and prioritize remediation of identified vulnerabilities. Re-test fixes to ensure effectiveness.

### Automated Security Scanning Tools
*   **SAST:** SonarQube, Snyk Code, Checkmarx.
*   **DAST:** OWASP ZAP (Zed Attack Proxy), Burp Suite Professional, Acunetix, Nessus.
*   **SCA:** Snyk, Retire.js, OWASP Dependency-Check, `npm audit`.
*   **Cloud Security Posture Management (CSPM):** For cloud deployments, use tools like Wiz, Orca Security, or native cloud provider tools (AWS Security Hub, Azure Security Center) to continuously monitor configuration.

### Dependency Vulnerability Scanning
*   **`npm audit`:** Integrate `npm audit` into the CI/CD pipeline. Fail builds if critical or high vulnerabilities are found that don't have known patches or are not explicitly triaged.
*   **Snyk/RenovateBot:** Use these tools for continuous monitoring of dependencies, alerting on new vulnerabilities, and even automatically creating pull requests for dependency updates.

## 9. Deployment Security

Securing the deployment environment is as critical as securing the application code itself.

### HTTPS Enforcement
*   **Load Balancer/Reverse Proxy:** Configure a load balancer (e.g., Nginx, AWS ALB, Cloudflare) or reverse proxy to terminate TLS connections.
*   **Redirect HTTP to HTTPS:** Ensure all HTTP traffic is automatically redirected to HTTPS.
*   **HSTS:** Implement HTTP Strict Transport Security (HSTS) via the `helmet` middleware or web server configuration to force browsers to interact via HTTPS.
*   **TLS Versions & Ciphers:** Only allow strong TLS 1.2+ protocols and robust cipher suites.

### Server Hardening Basics
*   **Minimalist OS:** Use a minimal operating system installation to reduce the attack surface.
*   **Regular Updates:** Keep the OS, Node.js runtime, MySQL, and all system packages fully patched and up-to-date.
*   **Firewall:** Configure host-based firewalls (e.g., `ufw` on Linux, AWS Security Groups) to only allow necessary incoming and outgoing traffic (e.g., SSH, HTTP/HTTPS, database connections from application servers).
*   **Disable Unnecessary Services:** Turn off all services not explicitly required for the application.
*   **SSH Security:**
    *   Disable password authentication for SSH.
    *   Use SSH key-based authentication.
    *   Disable root login via SSH.
    *   Change the default SSH port (22).
    *   Implement rate limiting for SSH access.
*   **Logging:** Configure comprehensive system and application logging.

### Environment Isolation (Dev/Staging/Prod)
*   **Physical/Logical Separation:** Maintain completely separate environments for development, staging, and production.
*   **Separate Credentials:** Use unique and separate credentials (database, API keys, admin access) for each environment.
*   **Data Isolation:** Do not use production data in non-production environments. Mask or generate synthetic data for dev/staging.
*   **Access Control:** Implement stricter access controls for production environments. Developers should typically not have direct access to production.
*   **Network Segmentation:** Use network segmentation (VPCs, subnets, security groups) to isolate environments and restrict communication between them.

### Firewall and Network Security
*   **Network Firewalls:** Implement firewalls at the network perimeter (e.g., AWS Security Groups, Network ACLs, VPNs).
*   **Principle of Least Privilege:** Configure firewalls to allow only the absolutely necessary ports and protocols between specific hosts or networks.
    *   Web servers: Ports 80 (redirect), 443 (HTTPS).
    *   Database servers: Port 3306 (MySQL) only accessible from application servers.
    *   SSH: Port 22 (or custom) only from administration IPs.
*   **Intrusion Detection/Prevention Systems (IDS/IPS):** Deploy IDS/IPS solutions to monitor network traffic for malicious activity and block attacks.
*   **DDoS Protection:** Utilize services like Cloudflare or AWS Shield for DDoS protection.

### Backup and Recovery Security
*   **Encrypted Backups:** All backups (database, file storage, configuration) must be encrypted at rest.
*   **Secure Storage:** Store backups in a secure, separate location from the production environment, with strict access controls.
*   **Regular Testing:** Regularly test the backup and recovery process to ensure data integrity and system recoverability in case of an incident.
*   **Retention Policy:** Define and adhere to a clear backup retention policy.
*   **Access Control:** Limit who can access, create, or restore backups.

## 10. Incident Response

A well-defined incident response plan is critical for minimizing the impact of security breaches.

### Security Incident Response Plan
Establish a comprehensive plan that outlines roles, responsibilities, and procedures for responding to security incidents:
1.  **Preparation:** Define roles and responsibilities, establish communication channels, create incident response runbooks, train staff.
2.  **Identification:** Monitor systems for indicators of compromise (IOCs), analyze logs, use alerts from security tools.
3.  **Containment:** Isolate affected systems, implement temporary fixes, prevent further spread of the attack.
4.  **Eradication:** Remove the root cause of the incident, patch vulnerabilities, clean compromised systems.
5.  **Recovery:** Restore affected systems and data from secure backups, monitor for re-occurrence, bring services back online.
6.  **Post-Incident Activity:** Conduct a post-mortem analysis, document lessons learned, update policies and procedures, improve security controls.

### Breach Notification Procedures
*   **Legal Counsel:** Involve legal counsel to understand breach notification requirements.
*   **GDPR:** For personal data breaches impacting EU citizens, notify the relevant supervisory authority within 72 hours of becoming aware of the breach, and affected individuals without undue delay if the breach poses a high risk to their rights and freedoms.
*   **Affected Parties:** Clearly define who needs to be notified (customers, partners, regulatory bodies, law enforcement).
*   **Communication Plan:** Develop templates for breach notifications, ensuring transparency while avoiding panic.

### Security Monitoring and Alerting
*   **Centralized Logging:** Aggregate all application, server, database, and network logs into a SIEM (Security Information and Event Management) system or cloud logging service.
*   **Real-time Monitoring:** Implement real-time monitoring for critical security events.
*   **Alerting:** Configure alerts for:
    *   Repeated failed login attempts (brute force).
    *   Unusual access patterns (e.g., login from new geography, after hours).
    *   High error rates or system outages.
    *   Unauthorized file access or modifications.
    *   Database query anomalies.
    *   New user/admin account creation.
    *   Changes to security configurations.
*   **Regular Review:** Regularly review logs and alerts, even those not triggering an alarm, to identify subtle or emerging threats.
