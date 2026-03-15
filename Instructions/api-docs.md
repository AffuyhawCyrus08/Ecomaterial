This document outlines the API for an e-commerce platform specializing in refined plastic products, metal scraps, and discarded fabrics. It details the available endpoints, authentication mechanisms, and data structures, strictly adhering to the locked architecture decisions for cross-file consistency.

---

## API Documentation

### 1. API Overview

The API provides programmatic access to manage products, users, orders, and other e-commerce functionalities for a modern online store. It is built using Node.js and Express, backed by a MySQL database. All API interactions are secured using a **session-based** authentication model, ensuring a seamless and secure experience for both regular users and administrators. The primary goal is to provide a clear, efficient, and developer-friendly interface for building and integrating with the e-commerce platform.

### 2. Endpoints

This section details the available API endpoints. All requests and responses are in JSON format.

---

#### Authentication Endpoints

##### `POST /api/auth/register`

Registers a new user account.

*   **Description:** Allows new users to create an account by providing their credentials.
*   **Authentication:** None (Public)
*   **Authorization:** None
*   **Request Parameters:**
    *   **Body:**
        *   `email` (string, required): User's email address. Must be unique.
        *   `password` (string, required): User's desired password.
        *   `firstName` (string, required): User's first name.
        *   `lastName` (string, required): User's last name.
*   **Request Example:**
    ```json
    {
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        "firstName": "John",
        "lastName": "Doe"
    }
    ```
*   **Response:**
    *   **`201 Created`**: User successfully registered.
        ```json
        {
            "message": "User registered successfully",
            "userId": 101,
            "email": "john.doe@example.com"
        }
        ```
    *   **`400 Bad Request`**: Invalid input or email already exists.
        ```json
        {
            "error": "Email already registered."
        }
        ```
        ```json
        {
            "error": "Password must be at least 8 characters long."
        }
        ```

##### `POST /api/auth/login`

Authenticates a user and establishes a session.

*   **Description:** Authenticates a user with provided credentials. Upon successful login, a server-side session is created, and a session cookie is set on the client, which must be sent with subsequent authenticated requests.
*   **Authentication:** None (Public)
*   **Authorization:** None
*   **Request Parameters:**
    *   **Body:**
        *   `email` (string, required): User's email address.
        *   `password` (string, required): User's password.
*   **Request Example:**
    ```json
    {
        "email": "john.doe@example.com",
        "password": "SecurePassword123!"
    }
    ```
*   **Response:**
    *   **`200 OK`**: Login successful. Session cookie is set.
        ```json
        {
            "message": "Login successful",
            "user": {
                "id": 101,
                "email": "john.doe@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "role": "user"
            }
        }
        ```
    *   **`401 Unauthorized`**: Invalid credentials.
        ```json
        {
            "error": "Invalid email or password."
        }
        ```

##### `POST /api/auth/logout`

Logs out the current user and destroys the session.

*   **Description:** Terminates the current user's session, invalidating the session cookie.
*   **Authentication:** Required (User/Admin)
*   **Authorization:** Authenticated User
*   **Request Parameters:** None
*   **Request Example:**
    ```
    POST /api/auth/logout
    ```
*   **Response:**
    *   **`200 OK`**: Logout successful.
        ```json
        {
            "message": "Logout successful"
        }
        ```
    *   **`401 Unauthorized`**: No active session found.
        ```json
        {
            "error": "Not authenticated."
        }
        ```

---

#### Product Endpoints

##### `GET /api/products`

Retrieves a list of products.

*   **Description:** Fetches all available products with optional filtering and pagination. The product table name is `products`.
*   **Authentication:** Optional (Public access by default)
*   **Authorization:** Public / Authenticated User
*   **Request Parameters:**
    *   **Query:**
        *   `search` (string, optional): Search term for product names or descriptions.
        *   `category_id` (integer, optional): Filter products by category ID.
        *   `min_price` (number, optional): Minimum price filter.
        *   `max_price` (number, optional): Maximum price filter.
        *   `limit` (integer, optional): Number of products to return (default: 10).
        *   `offset` (integer, optional): Number of products to skip (for pagination, default: 0).
*   **Request Example:**
    ```
    GET /api/products?search=plastic&limit=5&category_id=1
    ```
*   **Response:**
    *   **`200 OK`**: List of products.
        ```json
        {
            "total": 150,
            "limit": 5,
            "offset": 0,
            "products": [
                {
                    "id": 1,
                    "name": "Recycled PET Pellets",
                    "description": "High-quality recycled PET pellets for manufacturing.",
                    "category_id": 1,
                    "price": 0.85,
                    "unit": "KG",
                    "stock": 15000,
                    "imageUrl": "/uploads/products/2023/product_pet_1234.jpg",
                    "createdAt": "2023-10-26T10:00:00Z",
                    "updatedAt": "2023-10-26T10:00:00Z"
                },
                {
                    "id": 2,
                    "name": "Mixed Metal Scraps (Aluminum)",
                    "description": "Assorted aluminum scraps suitable for melting.",
                    "category_id": 2,
                    "price": 1.20,
                    "unit": "KG",
                    "stock": 5000,
                    "imageUrl": "/uploads/products/2023/product_alu_5678.jpg",
                    "createdAt": "2023-10-26T10:05:00Z",
                    "updatedAt": "2023-10-26T10:05:00Z"
                }
            ]
        }
        ```
    *   **`400 Bad Request`**: Invalid query parameters.
        ```json
        {
            "error": "Invalid value for 'limit'. Must be a positive integer."
        }
        ```

##### `POST /api/products`

Creates a new product.

*   **Description:** Adds a new product to the `products` table. Only administrators can perform this action.
*   **Authentication:** Required
*   **Authorization:** Admin
*   **Request Parameters:**
    *   **Body:**
        *   `name` (string, required): Name of the product.
        *   `description` (string, required): Detailed description of the product.
        *   `category_id` (integer, required): ID of the product's category.
        *   `price` (number, required): Price of the product.
        *   `unit` (string, required): Unit of measure (e.g., "KG", "PIECE", "METER").
        *   `stock` (integer, required): Current stock quantity.
        *   `imageUrl` (string, optional): Primary image URL for the product (can be updated via image upload endpoint).
*   **Request Example:**
    ```json
    {
        "name": "Discarded Cotton Fabric Bales",
        "description": "Large bales of discarded cotton fabric, suitable for recycling or repurposing.",
        "category_id": 3,
        "price": 0.50,
        "unit": "KG",
        "stock": 20000
    }
    ```
*   **Response:**
    *   **`201 Created`**: Product successfully created.
        ```json
        {
            "message": "Product created successfully",
            "product": {
                "id": 3,
                "name": "Discarded Cotton Fabric Bales",
                "category_id": 3,
                "price": 0.50,
                "stock": 20000,
                "createdAt": "2023-10-26T11:30:00Z"
            }
        }
        ```
    *   **`401 Unauthorized`**: Not authenticated.
    *   **`403 Forbidden`**: User is not an administrator.
    *   **`400 Bad Request`**: Invalid input data.

##### `GET /api/products/{productId}`

Retrieves details for a single product.

*   **Description:** Fetches the full details of a product by its ID.
*   **Authentication:** Optional (Public access by default)
*   **Authorization:** Public / Authenticated User
*   **Request Parameters:**
    *   **Path:**
        *   `productId` (integer, required): The ID of the product to retrieve.
*   **Request Example:**
    ```
    GET /api/products/1
    ```
*   **Response:**
    *   **`200 OK`**: Product details.
        ```json
        {
            "id": 1,
            "name": "Recycled PET Pellets",
            "description": "High-quality recycled PET pellets for manufacturing.",
            "category_id": 1,
            "price": 0.85,
            "unit": "KG",
            "stock": 15000,
            "imageUrl": "/uploads/products/2023/product_pet_1234.jpg",
            "createdAt": "2023-10-26T10:00:00Z",
            "updatedAt": "2023-10-26T10:00:00Z"
        }
        ```
    *   **`404 Not Found`**: Product with the given ID does not exist.
        ```json
        {
            "error": "Product not found."
        }
        ```

##### `PUT /api/products/{productId}`

Updates an existing product.

*   **Description:** Modifies the details of an existing product identified by `productId`. Only administrators can perform this action.
*   **Authentication:** Required
*   **Authorization:** Admin
*   **Request Parameters:**
    *   **Path:**
        *   `productId` (integer, required): The ID of the product to update.
    *   **Body:** (All fields are optional, only provided fields will be updated)
        *   `name` (string): New name for the product.
        *   `description` (string): New description.
        *   `category_id` (integer): New category ID.
        *   `price` (number): New price.
        *   `unit` (string): New unit of measure.
        *   `stock` (integer): New stock quantity.
*   **Request Example:**
    ```json
    {
        "price": 0.55,
        "stock": 25000
    }
    ```
*   **Response:**
    *   **`200 OK`**: Product successfully updated.
        ```json
        {
            "message": "Product updated successfully",
            "product": {
                "id": 3,
                "name": "Discarded Cotton Fabric Bales",
                "price": 0.55,
                "stock": 25000,
                "updatedAt": "2023-10-26T12:00:00Z"
            }
        }
        ```
    *   **`401 Unauthorized`**: Not authenticated.
    *   **`403 Forbidden`**: User is not an administrator.
    *   **`404 Not Found`**: Product with the given ID does not exist.
    *   **`400 Bad Request`**: Invalid input data.

##### `DELETE /api/products/{productId}`

Deletes a product.

*   **Description:** Removes a product from the `products` table. Only administrators can perform this action.
*   **Authentication:** Required
*   **Authorization:** Admin
*   **Request Parameters:**
    *   **Path:**
        *   `productId` (integer, required): The ID of the product to delete.
*   **Request Example:**
    ```
    DELETE /api/products/3
    ```
*   **Response:**
    *   **`204 No Content`**: Product successfully deleted.
    *   **`401 Unauthorized`**: Not authenticated.
    *   **`403 Forbidden`**: User is not an administrator.
    *   **`404 Not Found`**: Product with the given ID does not exist.

##### `POST /api/products/{productId}/images`

Uploads product images.

*   **Description:** Uploads one or more images for a specific product. The uploaded files are stored following the path convention `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`. The API response will include the public URL(s) to access these images. Only administrators can perform this action.
*   **Authentication:** Required
*   **Authorization:** Admin
*   **Request Parameters:**
    *   **Path:**
        *   `productId` (integer, required): The ID of the product to attach images to.
    *   **Body:** (Multipart Form Data)
        *   `images` (file, required): One or more image files (e.g., `image/jpeg`, `image/png`).
*   **Request Example:**
    ```
    POST /api/products/1/images
    Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

    ------WebKitFormBoundary7MA4YWxkTrZu0gW
    Content-Disposition: form-data; name="images"; filename="product_image1.jpg"
    Content-Type: image/jpeg

    <binary image data>
    ------WebKitFormBoundary7MA4YWxkTrZu0gW
    Content-Disposition: form-data; name="images"; filename="product_image2.png"
    Content-Type: image/png

    <binary image data>
    ------WebKitFormBoundary7MA4YWxkTrZu0gW--
    ```
*   **Response:**
    *   **`200 OK`**: Images uploaded successfully.
        ```json
        {
            "message": "Images uploaded successfully",
            "productId": 1,
            "uploadedImages": [
                {
                    "filename": "product_image1.jpg",
                    "url": "/uploads/products/2023/16a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c.jpg"
                },
                {
                    "filename": "product_image2.png",
                    "url": "/uploads/products/2023/9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d.png"
                }
            ]
        }
        ```
        *Note: The `url` field represents the public path to access the image, derived from the server-side storage path `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`.*
    *   **`401 Unauthorized`**: Not authenticated.
    *   **`403 Forbidden`**: User is not an administrator.
    *   **`404 Not Found`**: Product with the given ID does not exist.
    *   **`400 Bad Request`**: No files uploaded, or invalid file type.

---

### 3. Authentication & Authorization

This API uses a **session-based** authentication model, consistent with the `session` Auth Mode and API Style.

#### Authentication Flow:

1.  **Registration:** Users create an account via `POST /api/auth/register`.
2.  **Login:** Users authenticate using `POST /api/auth/login` with their email and password.
3.  **Session Establishment:** Upon successful login, the server creates a session for the user and sends a `Set-Cookie` header containing a session ID. This cookie is typically `HttpOnly` and `Secure`.
4.  **Subsequent Requests:** For all subsequent authenticated requests, the client automatically sends the session cookie with the request. The server validates this cookie to identify the user and retrieve their session data. No explicit `Authorization` header (like `Bearer Token`) is required or used for session authentication.
5.  **Logout:** Users can terminate their session using `POST /api/auth/logout`, which invalidates the session ID and removes the cookie.

#### Authorization (RBAC: `admin-user`):

The API implements Role-Based Access Control (RBAC) with two primary roles:

*   **`user`**:
    *   Can register, log in, and log out.
    *   Can view all public product and category information.
    *   Can view and manage their own profile.
    *   Can create and view their own orders.
    *   Can manage their shopping cart.
*   **`admin`**:
    *   Possesses all `user` permissions.
    *   Can perform CRUD operations on all `products` (create, update, delete).
    *   Can upload product images.
    *   Can manage categories.
    *   Can view and update the status of all orders.
    *   Can manage user roles (if such endpoints were exposed).

If an unauthenticated user attempts to access a protected endpoint, a `401 Unauthorized` status will be returned. If an authenticated user lacks the necessary `admin` role for a specific action, a `403 Forbidden` status will be returned.

### 4. Rate Limiting

To ensure fair usage and protect the API from abuse, the following rate limits are applied:

*   **Authenticated Endpoints:**
    *   100 requests per minute per authenticated user session.
*   **Unauthenticated Endpoints (e.g., product browsing, login, registration):**
    *   60 requests per minute per IP address.

When a rate limit is exceeded, the API will respond with a `429 Too Many Requests` status code. The response will include standard `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers to inform the client about their current rate limit status and when they can retry.

### 5. Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request. Error responses follow a consistent JSON format:

| Status Code        | Meaning                                   | Description                                                                                                                                                                             | Example Response                                                 |
| :----------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| `2xx Success`      | Request was successfully received, understood, and accepted. | Varies by specific endpoint (`200 OK`, `201 Created`, `204 No Content`).                                                                                                              | `{ "message": "..." }` or resource data                          |
| `400 Bad Request`  | Client-side input error                   | The request could not be understood or was missing required parameters. Often due to invalid JSON, missing fields, or incorrect query parameters.                                      | `{"error": "Invalid input provided."}`                           |
| `401 Unauthorized` | Authentication required / failed          | The request requires user authentication, or the provided authentication credentials (session cookie) are invalid or expired.                                                         | `{"error": "Not authenticated."}`                                |
| `403 Forbidden`    | Insufficient permissions                  | The server understood the request but refuses to authorize it. This typically means the authenticated user (e.g., `user` role) does not have permission to access the requested resource. | `{"error": "Access denied. Insufficient permissions."}`          |
| `404 Not Found`    | Resource not found                        | The requested resource could not be found. This means the URL path or the specific ID in the path does not correspond to an existing resource.                                       | `{"error": "Product not found."}`                                |
| `405 Method Not Allowed` | HTTP method not supported         | The HTTP method used for the request (e.g., `PUT`) is not supported for the resource identified by the URL.                                                                             | `{"error": "Method Not Allowed."}`                               |
| `429 Too Many Requests` | Rate limit exceeded                  | The user has sent too many requests in a given amount of time. See Rate Limiting section.                                                                                               | `{"error": "Too Many Requests. Please try again later."}`        |
| `500 Internal Server Error` | Server-side error                  | A generic error message indicating an unexpected condition was encountered on the server. This is usually due to unhandled exceptions or issues on the backend.                        | `{"error": "An unexpected error occurred."}`                     |

### 6. Examples

#### Example 1: User Registration and Product Browsing

1.  **Register a new user:**
    *   **Request:**
        ```http
        POST /api/auth/register
        Content-Type: application/json

        {
            "email": "jane.doe@example.com",
            "password": "JaneStrongPassword123!",
            "firstName": "Jane",
            "lastName": "Doe"
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
            "message": "User registered successfully",
            "userId": 102,
            "email": "jane.doe@example.com"
        }
        ```

2.  **Login as the new user:**
    *   **Request:**
        ```http
        POST /api/auth/login
        Content-Type: application/json

        {
            "email": "jane.doe@example.com",
            "password": "JaneStrongPassword123!"
        }
        ```
    *   **Response (200 OK):** (Includes `Set-Cookie` header in actual HTTP response)
        ```json
        {
            "message": "Login successful",
            "user": {
                "id": 102,
                "email": "jane.doe@example.com",
                "firstName": "Jane",
                "lastName": "Doe",
                "role": "user"
            }
        }
        ```

3.  **Browse products (after login, session cookie automatically sent):**
    *   **Request:**
        ```http
        GET /api/products?limit=2&offset=0
        Cookie: connect.sid=s%3A...
        ```
    *   **Response (200 OK):**
        ```json
        {
            "total": 150,
            "limit": 2,
            "offset": 0,
            "products": [
                {
                    "id": 1,
                    "name": "Recycled PET Pellets",
                    "description": "High-quality recycled PET pellets for manufacturing.",
                    "category_id": 1,
                    "price": 0.85,
                    "unit": "KG",
                    "stock": 15000,
                    "imageUrl": "/uploads/products/2023/product_pet_1234.jpg",
                    "createdAt": "2023-10-26T10:00:00Z",
                    "updatedAt": "2023-10-26T10:00:00Z"
                },
                {
                    "id": 2,
                    "name": "Mixed Metal Scraps (Aluminum)",
                    "description": "Assorted aluminum scraps suitable for melting.",
                    "category_id": 2,
                    "price": 1.20,
                    "unit": "KG",
                    "stock": 5000,
                    "imageUrl": "/uploads/products/2023/product_alu_5678.jpg",
                    "createdAt": "2023-10-26T10:05:00Z",
                    "updatedAt": "2023-10-26T10:05:00Z"
                }
            ]
        }
        ```

#### Example 2: Admin Product Management

*(Assumes an admin user is already logged in and their session cookie is active)*

1.  **Create a new product (Admin only):**
    *   **Request:**
        ```http
        POST /api/products
        Content-Type: application/json
        Cookie: connect.sid=s%3A...

        {
            "name": "High-Density Polyethylene Granules",
            "description": "Post-consumer HDPE granules, natural color, suitable for injection molding.",
            "category_id": 1,
            "price": 0.95,
            "unit": "KG",
            "stock": 10000
        }
        ```
    *   **Response (201 Created):**
        ```json
        {
            "message": "Product created successfully",
            "product": {
                "id": 4,
                "name": "High-Density Polyethylene Granules",
                "category_id": 1,
                "price": 0.95,
                "stock": 10000,
                "createdAt": "2023-10-26T13:00:00Z"
            }
        }
        ```

2.  **Upload images for the new product (Admin only):**
    *   **Request:**
        ```http
        POST /api/products/4/images
        Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryXYZ
        Cookie: connect.sid=s%3A...

        ------WebKitFormBoundaryXYZ
        Content-Disposition: form-data; name="images"; filename="hdpe_granules.jpg"
        Content-Type: image/jpeg

        <binary image data of hdpe_granules.jpg>
        ------WebKitFormBoundaryXYZ--
        ```
    *   **Response (200 OK):**
        ```json
        {
            "message": "Images uploaded successfully",
            "productId": 4,
            "uploadedImages": [
                {
                    "filename": "hdpe_granules.jpg",
                    "url": "/uploads/products/2023/e8f7g6h5-4i3j-2k1l-0m9n-8o7p6q5r4s3t.jpg"
                }
            ]
        }
        ```

3.  **Update the product (Admin only):**
    *   **Request:**
        ```http
        PUT /api/products/4
        Content-Type: application/json
        Cookie: connect.sid=s%3A...

        {
            "price": 0.90,
            "stock": 12000
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "message": "Product updated successfully",
            "product": {
                "id": 4,
                "name": "High-Density Polyethylene Granules",
                "price": 0.90,
                "stock": 12000,
                "updatedAt": "2023-10-26T13:15:00Z"
            }
        }
        ```

4.  **Delete the product (Admin only):**
    *   **Request:**
        ```http
        DELETE /api/products/4
        Cookie: connect.sid=s%3A...
        ```
    *   **Response (204 No Content):** (No body, just status code)
