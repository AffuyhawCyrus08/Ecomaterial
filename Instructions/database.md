As a Database Architect, I have designed a comprehensive MySQL database schema for your e-commerce site selling refined plastic products, metal scraps, and discarded fabrics. This design strictly adheres to your locked architecture decisions and mandatory consistency rules, ensuring a practical, scalable, and robust foundation for your application.

---

## 1. Database Overview

The chosen database technology is **MySQL**, a robust, open-source relational database management system (RDBMS). MySQL is well-suited for high-volume e-commerce applications due to its performance, scalability, and support for ACID properties (Atomicity, Consistency, Isolation, Durability), ensuring data integrity.

The architecture approach is a normalized relational schema, primarily adhering to 3rd Normal Form (3NF) to minimize data redundancy and improve data integrity. This design includes explicit primary keys, foreign keys for relationships, and appropriate indexing to optimize query performance for common e-commerce operations. User authentication will align with the `session` Auth Mode, and `admin-user` RBAC will be managed via a `role` field in the `users` table.

## 2. Schema Design

Here is the detailed schema design for each table:

### `users` table
*   **Purpose**: Stores user accounts, including customer profiles and administrative access.
*   **Fields**:
    *   `user_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `email` VARCHAR(255) NOT NULL UNIQUE
    *   `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hashed password for security'
    *   `first_name` VARCHAR(100) NULL
    *   `last_name` VARCHAR(100) NULL
    *   `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT 'Defines user permissions based on RBAC: admin-user'
    *   `profile_picture_path` VARCHAR(500) NULL COMMENT 'Path to user profile picture following /var/www/storage/uploads/user_profiles/{yyyy}/{uuid}.{ext}'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
*   **Primary Key**: `user_id`
*   **Indexes**: `email` (UNIQUE), `role`
*   **Relationships**: None

### `products` table
*   **Purpose**: Stores details of all products available for sale (refined plastic, metal scraps, discarded fabrics).
*   **Fields**:
    *   `product_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `name` VARCHAR(255) NOT NULL
    *   `description` TEXT NULL
    *   `price` DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
    *   `stock_quantity` INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)
    *   `category_id` INT NOT NULL
    *   `sku` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Stock Keeping Unit'
    *   `weight_kg` DECIMAL(10, 2) NULL COMMENT 'Weight in kilograms'
    *   `dimensions_cm` VARCHAR(100) NULL COMMENT 'e.g., "10x20x5" for LxWxH in cm'
    *   `material_type` ENUM('plastic', 'metal', 'fabric', 'other') NOT NULL COMMENT 'Specific material of the product'
    *   `condition` ENUM('new', 'recycled', 'used', 'scrap') NOT NULL COMMENT 'Condition of the product'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    *   `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Indicates if the product is currently visible and purchasable'
*   **Primary Key**: `product_id`
*   **Indexes**: `sku` (UNIQUE), `category_id`, `name`, `material_type`, `condition`
*   **Relationships**: `category_id` -> `categories.category_id`

### `product_images` table
*   **Purpose**: Stores paths to images associated with each product.
*   **Fields**:
    *   `image_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `product_id` INT NOT NULL
    *   `image_path` VARCHAR(500) NOT NULL COMMENT 'Path to product image following /var/www/storage/uploads/product_images/{yyyy}/{uuid}.{ext}'
    *   `alt_text` VARCHAR(255) NULL COMMENT 'Alternative text for accessibility and SEO'
    *   `display_order` INT DEFAULT 0 COMMENT 'Order in which images should be displayed'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
*   **Primary Key**: `image_id`
*   **Indexes**: `product_id`
*   **Relationships**: `product_id` -> `products.product_id` (ON DELETE CASCADE)

### `categories` table
*   **Purpose**: Organizes products into categories and supports hierarchical subcategories.
*   **Fields**:
    *   `category_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `name` VARCHAR(100) NOT NULL UNIQUE
    *   `description` TEXT NULL
    *   `parent_category_id` INT NULL COMMENT 'Self-referencing foreign key for subcategories'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
*   **Primary Key**: `category_id`
*   **Indexes**: `name` (UNIQUE), `parent_category_id`
*   **Relationships**: `parent_category_id` -> `categories.category_id` (ON DELETE SET NULL)

### `addresses` table
*   **Purpose**: Stores shipping and billing addresses for users.
*   **Fields**:
    *   `address_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `user_id` INT NOT NULL
    *   `address_line1` VARCHAR(255) NOT NULL
    *   `address_line2` VARCHAR(255) NULL
    *   `city` VARCHAR(100) NOT NULL
    *   `state_province` VARCHAR(100) NULL
    *   `postal_code` VARCHAR(20) NOT NULL
    *   `country` VARCHAR(100) NOT NULL
    *   `is_default_shipping` BOOLEAN DEFAULT FALSE COMMENT 'Indicates if this is the user''s default shipping address'
    *   `is_default_billing` BOOLEAN DEFAULT FALSE COMMENT 'Indicates if this is the user''s default billing address'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
*   **Primary Key**: `address_id`
*   **Indexes**: `user_id`
*   **Relationships**: `user_id` -> `users.user_id` (ON DELETE CASCADE)

### `orders` table
*   **Purpose**: Records customer orders, linking users to their purchases.
*   **Fields**:
    *   `order_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `user_id` INT NOT NULL
    *   `order_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    *   `total_amount` DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0)
    *   `status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'pending'
    *   `shipping_address_id` INT NOT NULL
    *   `billing_address_id` INT NOT NULL
    *   `payment_status` ENUM('paid', 'unpaid', 'refunded', 'pending') NOT NULL DEFAULT 'pending'
    *   `payment_method` VARCHAR(50) NULL COMMENT 'e.g., "Credit Card", "PayPal", "Stripe"'
    *   `tracking_number` VARCHAR(100) NULL COMMENT 'Shipping tracking number'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
*   **Primary Key**: `order_id`
*   **Indexes**: `user_id`, `status`, `order_date`, `shipping_address_id`, `billing_address_id`
*   **Relationships**:
    *   `user_id` -> `users.user_id` (ON DELETE RESTRICT)
    *   `shipping_address_id` -> `addresses.address_id` (ON DELETE RESTRICT)
    *   `billing_address_id` -> `addresses.address_id` (ON DELETE RESTRICT)

### `order_items` table
*   **Purpose**: Details the specific products and quantities included in each order.
*   **Fields**:
    *   `order_item_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `order_id` INT NOT NULL
    *   `product_id` INT NOT NULL
    *   `quantity` INT NOT NULL CHECK (quantity > 0)
    *   `unit_price` DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0) COMMENT 'Price of the product at the time of order'
    *   `subtotal` DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0) COMMENT 'quantity * unit_price'
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
*   **Primary Key**: `order_item_id`
*   **Indexes**: `order_id`, `product_id`
*   **Relationships**:
    *   `order_id` -> `orders.order_id` (ON DELETE CASCADE)
    *   `product_id` -> `products.product_id` (ON DELETE RESTRICT)

### `carts` table
*   **Purpose**: Stores active shopping carts, one per user.
*   **Fields**:
    *   `cart_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `user_id` INT NOT NULL UNIQUE
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
*   **Primary Key**: `cart_id`
*   **Indexes**: `user_id` (UNIQUE)
*   **Relationships**: `user_id` -> `users.user_id` (ON DELETE CASCADE)

### `cart_items` table
*   **Purpose**: Stores products and their quantities currently in a user's shopping cart.
*   **Fields**:
    *   `cart_item_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `cart_id` INT NOT NULL
    *   `product_id` INT NOT NULL
    *   `quantity` INT NOT NULL DEFAULT 1 CHECK (quantity > 0)
    *   `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
*   **Primary Key**: `cart_item_id`
*   **Indexes**: `cart_id`, `product_id`, UNIQUE(`cart_id`, `product_id`)
*   **Relationships**:
    *   `cart_id` -> `carts.cart_id` (ON DELETE CASCADE)
    *   `product_id` -> `products.product_id` (ON DELETE CASCADE)

### `reviews` table
*   **Purpose**: Stores customer reviews and ratings for products.
*   **Fields**:
    *   `review_id` INT AUTO_INCREMENT PRIMARY KEY
    *   `product_id` INT NOT NULL
    *   `user_id` INT NOT NULL
    *   `rating` TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5) COMMENT 'Rating from 1 to 5 stars'
    *   `comment` TEXT NULL
    *   `review_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    *   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    *   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
*   **Primary Key**: `review_id`
*   **Indexes**: `product_id`, `user_id`, `rating`, UNIQUE(`product_id`, `user_id`)
*   **Relationships**:
    *   `product_id` -> `products.product_id` (ON DELETE CASCADE)
    *   `user_id` -> `users.user_id` (ON DELETE CASCADE)

## 3. Entity Relationship Diagram

```mermaid
erDiagram
    users {
        INT user_id PK
        VARCHAR(255) email UK
        VARCHAR(255) password_hash
        ENUM role
        VARCHAR(500) profile_picture_path
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    addresses {
        INT address_id PK
        INT user_id FK
        VARCHAR(255) address_line1
        VARCHAR(100) city
        VARCHAR(20) postal_code
        BOOLEAN is_default_shipping
    }

    categories {
        INT category_id PK
        VARCHAR(100) name UK
        INT parent_category_id FK "nullable"
    }

    products {
        INT product_id PK
        VARCHAR(255) name
        DECIMAL(10,2) price
        INT stock_quantity
        INT category_id FK
        VARCHAR(100) sku UK
        ENUM material_type
        ENUM condition
        BOOLEAN is_active
    }

    product_images {
        INT image_id PK
        INT product_id FK
        VARCHAR(500) image_path
        VARCHAR(255) alt_text
    }

    carts {
        INT cart_id PK
        INT user_id FK UK
    }

    cart_items {
        INT cart_item_id PK
        INT cart_id FK
        INT product_id FK
        INT quantity
    }

    orders {
        INT order_id PK
        INT user_id FK
        TIMESTAMP order_date
        DECIMAL(10,2) total_amount
        ENUM status
        INT shipping_address_id FK
        INT billing_address_id FK
        ENUM payment_status
    }

    order_items {
        INT order_item_id PK
        INT order_id FK
        INT product_id FK
        INT quantity
        DECIMAL(10,2) unit_price
    }

    reviews {
        INT review_id PK
        INT product_id FK
        INT user_id FK
        TINYINT rating
        TEXT comment
    }

    users ||--o{ addresses : "has"
    users ||--o{ carts : "owns"
    users ||--o{ orders : "places"
    users ||--o{ reviews : "writes"

    categories ||--o{ products : "contains"
    categories ||--o| categories : "has_parent"

    products ||--o{ product_images : "illustrates"
    products ||--o{ cart_items : "in"
    products ||--o{ order_items : "purchased_in"
    products ||--o{ reviews : "rated"

    carts ||--o{ cart_items : "contains"

    orders ||--o{ order_items : "details"
    addresses ||--o{ orders : "ships_to"
    addresses ||--o{ orders : "bills_to"
```

## 4. Data Integrity

*   **Referential Integrity**: Maintained through Foreign Key constraints.
    *   `ON DELETE CASCADE`: Used where a child record cannot exist without its parent (e.g., deleting a `product` deletes its `product_images`, deleting a `user` deletes their `carts`, `addresses`, `reviews`).
    *   `ON DELETE RESTRICT`: Used for critical relationships where deleting the parent would invalidate existing data (e.g., preventing deletion of a `user` if they have `orders`, or a `product` if it's part of an `order_item`).
    *   `ON DELETE SET NULL`: Used for self-referencing foreign keys like `categories.parent_category_id`, allowing a subcategory to become a top-level category if its parent is deleted.
*   **Domain Integrity**: Enforced using `ENUM` types for predefined values (`users.role`, `products.material_type`, `products.condition`, `orders.status`, `orders.payment_status`), and `CHECK` constraints for numerical ranges (`products.price >= 0`, `reviews.rating BETWEEN 1 AND 5`).
*   **Entity Integrity**: Ensured by `PRIMARY KEY` constraints on all tables, guaranteeing unique identification for each record.
*   **Uniqueness Constraints**: `UNIQUE` indexes are applied to fields that must be unique across the table (e.g., `users.email`, `products.sku`, `categories.name`, `carts.user_id`, `(cart_id, product_id)` in `cart_items`, `(product_id, user_id)` in `reviews`).
*   **Nullability**: `NOT NULL` constraints are used for essential fields (e.g., `users.email`, `products.name`, `orders.total_amount`) to ensure critical data is always present.

## 5. Indexes & Performance

Beyond the automatically indexed primary keys and foreign keys, the following additional indexes are recommended for optimizing common queries:

*   **`users`**:
    *   `email` (UNIQUE): Essential for fast user lookup during login and account management.
    *   `role`: Improves performance for filtering users by their role (e.g., fetching all admins).
*   **`products`**:
    *   `sku` (UNIQUE): Enables quick product lookup by SKU.
    *   `category_id`: Speeds up queries for products within specific categories.
    *   `name`: Useful for product search functionality.
    *   `material_type`, `condition`: Optimizes filtering and faceted search based on product attributes.
*   **`categories`**:
    *   `name` (UNIQUE): For quick retrieval and validation of category names.
    *   `parent_category_id`: Supports efficient traversal of the category hierarchy.
*   **`addresses`**:
    *   `user_id`: To retrieve all addresses associated with a specific user quickly.
*   **`orders`**:
    *   `user_id`: Essential for fetching a customer's order history.
    *   `status`, `order_date`: Critical for administrative dashboards and reporting (e.g., "all pending orders this week").
    *   `shipping_address_id`, `billing_address_id`: Speeds up joins with the `addresses` table.
*   **`order_items`**:
    *   `order_id`, `product_id`: Forms a composite index that is highly effective for fetching items within an order or identifying which orders contain a specific product.
*   **`carts`**:
    *   `user_id` (UNIQUE): Provides fast access to a user's shopping cart.
*   **`cart_items`**:
    *   `cart_id`, `product_id` (UNIQUE composite): Ensures efficient retrieval of items in a cart and prevents duplicate product entries for the same cart.
*   **`reviews`**:
    *   `product_id`, `user_id` (UNIQUE composite): Ensures a user can only submit one review per product and optimizes fetching reviews for a product or by a user.
    *   `rating`: Useful for calculating average ratings and filtering products by rating.

## 6. Sample Queries

### Get a user's shopping cart items with product details:
```sql
SELECT
    ci.quantity,
    p.name AS product_name,
    p.price,
    pi.image_path AS product_image
FROM
    cart_items ci
JOIN
    products p ON ci.product_id = p.product_id
JOIN
    carts c ON ci.cart_id = c.cart_id
LEFT JOIN
    product_images pi ON p.product_id = pi.product_id AND pi.display_order = 0 -- Get primary image
WHERE
    c.user_id = 123; -- Replace with actual user_id
```

### Fetch all orders for a specific user, including shipping address:
```sql
SELECT
    o.order_id,
    o.order_date,
    o.total_amount,
    o.status,
    sa.address_line1 AS shipping_address_line1,
    sa.city AS shipping_city,
    sa.postal_code AS shipping_postal_code,
    sa.country AS shipping_country
FROM
    orders o
JOIN
    addresses sa ON o.shipping_address_id = sa.address_id
WHERE
    o.user_id = 123 -- Replace with actual user_id
ORDER BY
    o.order_date DESC;
```

### Retrieve products from a specific category, ordered by price:
```sql
SELECT
    p.product_id,
    p.name,
    p.price,
    p.stock_quantity,
    c.name AS category_name
FROM
    products p
JOIN
    categories c ON p.category_id = c.category_id
WHERE
    c.name = 'Refined Plastic Pellets' -- Replace with actual category name
    AND p.is_active = TRUE
ORDER BY
    p.price ASC;
```

### Add a new product (Admin action):
```sql
INSERT INTO products (
    name, description, price, stock_quantity, category_id, sku,
    weight_kg, dimensions_cm, material_type, condition, is_active
) VALUES (
    'Aluminum Scrap - Grade A',
    'High-purity aluminum scrap, cleaned and sorted, ideal for recycling.',
    2.50,
    10000,
    (SELECT category_id FROM categories WHERE name = 'Metal Scraps'), -- Assumes category exists
    'AL-SCRAP-GA-001',
    500.00,
    'Bulk',
    'metal',
    'scrap',
    TRUE
);
```

### Update product stock after an order is placed:
```sql
UPDATE products
SET stock_quantity = stock_quantity - 50 -- Replace 50 with quantity ordered
WHERE product_id = 456 AND stock_quantity >= 50; -- Replace 456 with actual product_id
```

### Get average rating and total reviews for a product:
```sql
SELECT
    AVG(r.rating) AS average_rating,
    COUNT(r.review_id) AS total_reviews
FROM
    reviews r
WHERE
    r.product_id = 789; -- Replace with actual product_id
```

## 7. Migration Strategy

A robust migration strategy is crucial for managing database schema evolution throughout the project's lifecycle, ensuring consistency across development, staging, and production environments.

1.  **Version-Controlled Migrations**:
    *   All database schema changes (creation, alteration, deletion of tables/columns, index management) will be defined in sequential, versioned SQL scripts.
    *   These scripts will be stored in the project's version control system (e.g., Git) alongside the application code.
    *   Scripts will follow a naming convention like `V{version_number}__Description_of_change.sql` (e.g., `V1__create_initial_schema.sql`, `V2__add_product_materials_column.sql`).

2.  **Migration Tooling Integration**:
    *   The Node.js application will utilize a database migration tool (e.g., Flyway, Liquibase, or ORM-specific tools like `sequelize-cli` or `knex.js`).
    *   This tool will track applied migrations in a dedicated table within the database (e.g., `schema_version` for Flyway) and apply any pending scripts automatically during application deployment or manual execution.

3.  **Initial Schema Setup (`V1__create_initial_schema.sql`)**:
    *   The first migration script will contain all `CREATE TABLE` statements for the entire schema defined above, including primary keys, unique constraints, foreign keys, default values, `CHECK` constraints, and initial indexes.
    *   Example for `users` table creation within this script:
        ```sql
        CREATE TABLE users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NULL,
            last_name VARCHAR(100) NULL,
            role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
            profile_picture_path VARCHAR(500) NULL COMMENT 'Path to user profile picture, e.g., /var/www/storage/uploads/user_profiles/{yyyy}/{uuid}.{ext}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_users_role ON users(role);
        ```

4.  **Incremental Schema Evolution**:
    *   Any subsequent schema modification (e.g., adding `tracking_number` to `orders`, modifying `DECIMAL` precision) will result in a new migration script containing `ALTER TABLE` statements.
    *   For example, `V2__add_order_tracking_number.sql` would contain:
        ```sql
        ALTER TABLE orders
        ADD COLUMN tracking_number VARCHAR(100) NULL AFTER payment_method;
        ```

5.  **Data Migration**:
    *   If a schema change requires modifying existing data (e.g., populating a new `NOT NULL` column, data type conversion), the migration script will include `UPDATE` statements to transform the data appropriately.
    *   These data migrations should be carefully designed and tested to avoid data loss.

6.  **Rollback Considerations**:
    *   While many migration tools support "down" migrations for rollback, the best practice is to design "forward-only" migrations that are additive and non-destructive.
    *   In a production environment, rollbacks are typically handled by deploying a previous, known-good database snapshot (if critical data loss is acceptable) or through subsequent "fix-forward" migrations.

7.  **Environment Specificity**:
    *   Separate databases will be used for development, testing (staging), and production.
    *   Migrations will be thoroughly tested in lower environments before being promoted to production to catch any issues early.

This systematic approach ensures that the database schema remains consistent with the application's requirements, facilitates collaboration, and allows for controlled and reliable database evolution.
