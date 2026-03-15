```markdown
# Tech Stack Recommendations

This document outlines the recommended technology stack for building a premium, SaaS-style e-commerce application for selling refined plastic products, metal scraps, and discarded fabrics. The choices emphasize clarity, elegance, efficiency, and enterprise-readiness, while adhering to all locked architectural decisions.

---

## 1. Frontend Technologies

**Recommended Stack:** React with Vite, Chakra UI, React Query, and Framer Motion.

*   **React + Vite (Locked Decision):** React is an excellent choice for developing complex, component-based user interfaces, perfectly aligning with the need for a "consistent component-based design system" and managing "complex workflows." Vite offers an extremely fast development experience, essential for productivity. Its declarative nature and extensive ecosystem make it ideal for building the "dashboard-driven" layouts and "all key screens and states" required for an enterprise-ready SaaS product.
*   **Chakra UI:** For implementing the "refined color palette, strong typography hierarchy, generous spacing," and ensuring the design "feels modern and high-end," Chakra UI is recommended. It provides a robust, accessible, and highly customizable component library that simplifies building responsive, intuitive layouts (sidebars, top navigation, cards, tables, modals) while enforcing design consistency and supporting theming to achieve the desired aesthetic. Its focus on accessibility aligns with the "accessibility-aware" requirement.
*   **React Query:** To manage server-side data fetching, caching, and synchronization efficiently across various dashboards, data views, and forms, React Query is crucial. It drastically simplifies data management, improves application performance, and handles loading, error, and empty states gracefully, contributing to a smooth user experience.
*   **Framer Motion:** For delivering "smooth purposeful micro-interactions and subtle animations," Framer Motion is an intuitive and powerful animation library. It allows developers to easily implement engaging transitions and feedback mechanisms without distraction, enhancing usability and the premium feel of the application.

## 2. Backend Technologies

**Recommended Stack:** Node.js with Express, Sequelize ORM, and Express-session for authentication.

*   **Node.js + Express (Locked Decision):** Node.js, combined with the Express.js framework, provides a high-performance, scalable, and non-blocking I/O backend. This stack is ideal for building RESTful APIs to power the e-commerce functionality, user management, and product catalog. Its JavaScript-centric nature allows for a unified language across the frontend and backend, streamlining development and maintenance.
*   **Sequelize ORM:** To interact with the MySQL database efficiently and securely, Sequelize is recommended as a robust Object-Relational Mapper (ORM). It provides an abstraction layer over raw SQL queries, making database operations more manageable, reducing common SQL injection vulnerabilities, and simplifying the definition of models (e.g., `products`, users, orders) and their relationships.
*   **Session-based Authentication (Locked Decision):** In line with the `session` Auth Mode and API Style, `express-session` will be used for managing user sessions. This involves storing session data (e.g., user ID) on the server and issuing a session cookie to the client, which is then sent with subsequent requests to maintain user state and authenticate API calls. This approach ensures secure access control for both `admin` and regular `user` roles (RBAC: admin-user).
*   **File Storage Integration:** For handling product images and other media, the backend will manage uploads to the specified path: `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`. Libraries like Multer will facilitate file uploads, and the application will generate the necessary UUIDs and directory structures.

## 3. Database

**Recommended Database:** MySQL.

*   **MySQL (Locked Decision):** MySQL is a mature, reliable, and widely-used relational database management system. It is well-suited for the structured data requirements of an e-commerce application, including product catalogs, user profiles, order histories, inventory, and categories. Its ACID compliance ensures data integrity, which is critical for transactional operations in an e-commerce context.
*   **Schema Design:** The database will include tables for managing products (using the exact table name `products`), users (with defined roles for `admin-user` RBAC), orders, categories, and inventory. MySQL's robust indexing and querying capabilities will support efficient data retrieval and complex search functionalities required for a premium SaaS experience.

## 4. Infrastructure

**Recommended Infrastructure:** Cloud-native deployment on a robust cloud provider (e.g., AWS), leveraging managed services.

*   **Cloud Provider (e.g., AWS):** Utilizing a leading cloud provider like Amazon Web Services (AWS) offers a scalable, reliable, and secure environment for hosting the SaaS application. AWS provides a comprehensive suite of services that can grow with the application's demands.
*   **Compute (AWS EC2 or ECS/Fargate):** For the Node.js Express backend, either EC2 instances (for fine-grained control) or a containerized approach using AWS Elastic Container Service (ECS) with Fargate (for serverless container management) is recommended. Fargate simplifies deployment and scaling by abstracting away server management.
*   **Database Service (AWS RDS for MySQL):** AWS Relational Database Service (RDS) for MySQL provides a managed, highly available, and scalable database solution. RDS handles backups, patching, and replication, ensuring data durability and performance without manual overhead.
*   **File Storage (AWS S3 mounted to the path):** For handling product images and other uploaded assets according to the path `/var/www/storage/uploads/{resource}/{yyyy}/{uuid}.{ext}`, AWS S3 is the ideal solution for highly durable, scalable, and cost-effective object storage. S3 buckets can be mounted or integrated with the application server to conform to the specified storage path convention, ensuring robust file management.
*   **Content Delivery Network (AWS CloudFront):** To deliver static assets (images, JavaScript, CSS) and improve load times for global users, a CDN like AWS CloudFront will cache content closer to end-users, enhancing the "efficient" and "premium" user experience.
*   **CI/CD Pipeline (e.g., GitHub Actions, AWS CodePipeline):** Implementing a robust Continuous Integration/Continuous Deployment (CI/CD) pipeline is essential for automated testing, building, and deployment, ensuring rapid and reliable delivery of new features and updates for an "enterprise-ready" product.
*   **Monitoring & Logging (AWS CloudWatch, Prometheus/Grafana):** Comprehensive monitoring and logging solutions are crucial for maintaining application health, identifying issues, and understanding performance. AWS CloudWatch provides integrated monitoring for AWS resources, while tools like Prometheus and Grafana can offer advanced observability.
```
