# Enterprise Multi-Branch Point of Sale (POS) System

A scalable, full-stack Point of Sale (POS) and retail management platform built with **Spring Boot (Java 17)**, **React 19**, **MySQL**, **JWT Authentication**, and integrated with **Razorpay** and **Stripe** payment gateways.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Backend Setup & Execution](#backend-setup--execution)
- [Frontend Setup & Execution](#frontend-setup--execution)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Payment Gateway Configuration](#payment-gateway-configuration)
  - [Razorpay Test Keys](#razorpay-test-keys)
  - [Stripe Test Keys](#stripe-test-keys)
- [API Overview](#api-overview)
- [Security & Production Readiness](#security--production-readiness)
- [Screenshots](#screenshots)
- [License](#license)

---

## Overview

This POS platform provides enterprise-grade retail capabilities for single and multi-branch retail businesses. It allows Store Administrators to manage catalog inventory, branch employees, shift accounting, GST and tax schedules, and subscription plans, while giving Cashiers and Branch Managers an intuitive, low-latency POS terminal for rapid barcode scanning, invoice generation, customer accounts, and split tender checkout.

---

## Key Features

- **Multi-Branch Hierarchy**: Single store ownership model supporting unlimited physical branches with independent inventories and employee assignments.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across `ROLE_ADMIN`, `ROLE_STORE_ADMIN`, `ROLE_BRANCH_MANAGER`, `ROLE_STORE_MANAGER`, and `ROLE_CASHIER`.
- **Modern POS Terminal**: Fast checkout interface supporting barcode lookup, dynamic tax / GST calculation (CGST, SGST, IGST), discount codes, and split tender payment.
- **Inventory & Stock Alerts**: Automated inventory deduction, low-stock threshold monitoring, and stock replenishment tracking.
- **Shift & Register Management**: Cash drawer tracking with opening cash, closing cash, cash drops, and register reconciliation.
- **Receipt & Invoice Generation**: PDF invoice generation (via OpenPDF) and thermal receipt printer support.
- **Payment Gateways**:
  - **Razorpay**: Hosted checkout, UPI, cards, net banking, signature verification, and automated subscription renewal.
  - **Stripe**: Gateway integration stub for international payments and wallets.
- **SaaS Subscription Billing**: Tiered subscription plans (Starter, Growth, Enterprise) with automated feature gating and payment verification.
- **Enterprise Settings**: Centralized business profile management, PAN/GST registration, branch prefixes, tax policies, and security controls.
- **Business Intelligence & Analytics**: Real-time sales dashboards, top-selling products, cashier performance metrics, hourly sales heatmaps, and audit logs.
- **Dual-Theme Design System**: Clean, modern enterprise UI with instant Light and Dark mode switching inspired by Linear, Notion, and Vercel.

---

## Technology Stack

### Backend
- **Language**: Java 17 (LTS)
- **Framework**: Spring Boot 4.0.6
- **Security**: Spring Security 6 (Stateless JWT Authentication via JJWT 0.12.7)
- **Persistence**: Spring Data JPA / Hibernate ORM
- **Database**: MySQL 8.x
- **Build Tool**: Apache Maven (Wrapper included)
- **Third-Party SDKs**: Razorpay Java SDK (`1.4.8`), Stripe Java SDK (`29.5.0`), OpenPDF (`2.0.3`)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 8 with Hot Module Replacement (HMR)
- **State Management**: Redux Toolkit & React-Redux
- **Routing**: React Router v7
- **Styling**: Modern CSS Design System (Custom properties, dark/light themes)
- **UI Components**: Radix UI primitives, Lucide React icons, Sonner toast notifications
- **Data Visualization**: Recharts 3.x
- **HTTP Client**: Axios with automatic JWT injection and 401 refresh handling

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React 19 Frontend                        │
│   (Vite, Redux Toolkit, React Router, Design Tokens)        │
└───────────────┬─────────────────────────────▲───────────────┘
                │ HTTP / REST                 │ JSON Response
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│               Spring Boot Backend (Port 5000)               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Spring Security Filter Chain (JwtValidator Filter) │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  REST Controllers (@RestController)                │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Business Logic Service Layer (@Service)            │   │
│   └───────────────┬──────────────────────┬──────────────┘   │
│                   │                      │                  │
│                   ▼                      ▼                  │
│       ┌──────────────────────┐  ┌───────────────────────┐   │
│       │ Payment Gateways     │  │ Spring Data JPA Repos │   │
│       │ (Razorpay / Stripe)  │  └───────────┬───────────┘   │
│       └──────────────────────┘              │               │
└─────────────────────────────────────────────┼───────────────┘
                                              ▼
                                 ┌─────────────────────────┐
                                 │   MySQL 8.0 Database    │
                                 │       (POS_db)          │
                                 └─────────────────────────┘
```

---

## Project Structure

```
Point of sale system/
├── .gitignore                          # Root gitignore protecting sensitive credentials & build files
├── README.md                           # Master project documentation
│
├── Point-of-sale-system/               # Spring Boot Backend Project
│   ├── mvnw                            # Linux/macOS Maven wrapper script
│   ├── mvnw.cmd                        # Windows Maven wrapper script
│   ├── pom.xml                         # Maven dependencies and build configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/parth/Point_of_sale_system/
│       │   │   ├── configuration/      # SecurityConfig, JwtProvider, JwtValidator, JwtConstant
│       │   │   ├── controller/         # REST API Controllers (Auth, Product, Branch, Orders, etc.)
│       │   │   ├── dto/                # Data Transfer Objects (Requests & Responses)
│       │   │   ├── exception/          # Global exception handler & custom exceptions
│       │   │   ├── gateway/            # Razorpay & Stripe payment gateway integrations
│       │   │   ├── modal/              # JPA Entities (User, Store, Branch, Product, Order, etc.)
│       │   │   ├── repository/         # Spring Data JPA Repositories
│       │   │   └── service/            # Business logic interfaces & implementations
│       │   └── resources/
│       │       ├── application.properties               # Public configuration template (uses ${ENV_VARS})
│       │       ├── application-local.properties         # Local dev secrets (git-ignored)
│       │       └── application-local.properties.example # Example configuration template for developers
│       └── test/                       # Unit and integration test suites
│
└── frontend/                           # React 19 Frontend Client
    ├── .env.example                    # Frontend environment template
    ├── index.html                      # HTML root template
    ├── package.json                    # Node dependencies and scripts
    ├── vite.config.js                  # Vite configuration
    └── src/
        ├── assets/                     # Static icons and assets
        ├── components/                 # Reusable UI components (Layout, Topbar, Sidebar, Modals)
        ├── pages/                      # Page views (Admin, Manager, Cashier, Auth, Profile)
        ├── services/                   # Axios API services (api.js, storeSettingsService.js, etc.)
        ├── store/                      # Redux Toolkit store and slices (authSlice, uiSlice, etc.)
        ├── App.jsx                     # Route declarations and role gates
        └── index.css                   # Enterprise design tokens (Dual Light / Dark themes)
```

---

## Prerequisites

Before running the application locally, ensure you have installed:

1. **Java Development Kit (JDK 17 or higher)**
   - Check version: `java -version`
2. **Node.js (v18.x or v20.x+) and npm**
   - Check version: `node -v` and `npm -v`
3. **MySQL Server (v8.0+)**
   - Check version: `mysql --version`
4. **Git**
   - Check version: `git --version`

---

## Database Setup

1. Start your local MySQL service.
2. Connect to MySQL using your client (e.g., MySQL Workbench, DBeaver, or command line):

```sql
CREATE DATABASE POS_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Ensure your MySQL user has privileges to read and write to `POS_db`:

```sql
GRANT ALL PRIVILEGES ON POS_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

---

## Backend Setup & Execution

### 1. Configure Local Properties

Navigate to `Point-of-sale-system/src/main/resources/`:

```bash
cd Point-of-sale-system/src/main/resources
cp application-local.properties.example application-local.properties
```

Open `application-local.properties` and customize your local credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/POS_db?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true
spring.datasource.username=root
spring.datasource.password=YOUR_LOCAL_MYSQL_PASSWORD

# JWT Secret - generate a secure random 256-bit string
jwt.secret=YOUR_LOCAL_DEV_JWT_SECRET_AT_LEAST_256_BITS_LONG

# Razorpay Test Credentials (Optional for local testing)
razorpay.key.id=rzp_test_YOUR_KEY_ID
razorpay.key.secret=YOUR_RAZORPAY_SECRET_KEY
```

> **Note**: `application-local.properties` is protected by `.gitignore` and will never be committed to git.

### 2. Build the Backend

From the `Point-of-sale-system` directory:

- **Windows**:
  ```cmd
  mvnw.cmd clean compile
  ```
- **macOS / Linux**:
  ```bash
  chmod +x mvnw
  ./mvnw clean compile
  ```

### 3. Run the Backend Application

- **Windows**:
  ```cmd
  mvnw.cmd spring-boot:run
  ```
- **macOS / Linux**:
  ```bash
  ./mvnw spring-boot:run
  ```

The backend server will start on **`http://localhost:5000`**.

---

## Frontend Setup & Execution

### 1. Install Dependencies

From the `frontend` directory:

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Ensure `VITE_API_URL` points to your backend instance:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Server

```bash
npm run dev
```

The frontend client will start on **`http://localhost:5173`**.

### 4. Build for Production

```bash
npm run build
```

Production-ready assets will be generated in `frontend/dist`.

---

## Environment Variables Configuration

For containerized deployments (Docker / Kubernetes) or cloud hosting (AWS, GCP, Heroku, Render), configure the following environment variables:

| Variable | Description | Default (Local) | Required in Prod |
|----------|-------------|-----------------|:----------------:|
| `DB_URL` | JDBC URL for MySQL database | `jdbc:mysql://localhost:3306/POS_db?...` | Yes |
| `DB_USERNAME` | MySQL username | `root` | Yes |
| `DB_PASSWORD` | MySQL password | `""` | Yes |
| `JWT_SECRET` | 256-bit+ HMAC-SHA signing key for JWT tokens | Development fallback key | **Yes** |
| `RAZORPAY_KEY_ID` | Razorpay public API key ID | `""` | If Razorpay used |
| `RAZORPAY_KEY_SECRET` | Razorpay private API key secret | `""` | If Razorpay used |
| `STRIPE_SECRET_KEY` | Stripe secret API key (`sk_...`) | `""` | If Stripe used |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable API key (`pk_...`) | `""` | If Stripe used |
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` | No |
| `MAIL_PORT` | SMTP server port | `587` | No |
| `MAIL_USERNAME` | SMTP account email address | `""` | If email enabled |
| `MAIL_PASSWORD` | SMTP app password | `""` | If email enabled |
| `VITE_API_URL` | Frontend URL pointing to Spring Boot backend | `http://localhost:5000` | Yes |

---

## Payment Gateway Configuration

### Razorpay Test Keys

1. Sign up or log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Test Mode** via the top toggle.
3. Navigate to **Account & Settings** → **API Keys**.
4. Click **Generate Test Key**.
5. Copy your **Key ID** (`rzp_test_...`) and **Key Secret**.
6. Paste these into `application-local.properties` (or set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`).

### Stripe Test Keys

1. Sign up or log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Toggle on **Test mode**.
3. Navigate to **Developers** → **API keys**.
4. Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
5. Configure them via `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

---

## API Overview

All API requests (except `/api/auth/**`) require the HTTP header:
```http
Authorization: Bearer <your_jwt_token>
```

### Key API Endpoints

| Category | Endpoint | Method | Role Allowed | Description |
|----------|----------|--------|--------------|-------------|
| **Auth** | `/api/auth/signup` | `POST` | Public | Register new Store Admin |
| **Auth** | `/api/auth/login` | `POST` | Public | Authenticate user & issue JWT |
| **Store** | `/api/store/settings` | `GET`, `PUT` | `STORE_ADMIN` | Read/update business profile & settings |
| **Branch** | `/api/branch` | `GET`, `POST` | `STORE_ADMIN`, `BRANCH_MANAGER` | List or create branches |
| **Employees** | `/api/employee` | `GET`, `POST` | `STORE_ADMIN`, `BRANCH_MANAGER` | Staff management |
| **Catalog** | `/api/product` | `GET`, `POST`, `PUT`, `DELETE` | `BRANCH_MANAGER`, `STORE_MANAGER` | Product catalog CRUD |
| **Inventory** | `/api/inventory` | `GET`, `PUT` | `BRANCH_MANAGER`, `STORE_MANAGER` | Stock tracking & adjustments |
| **POS Terminal** | `/api/cashier/orders` | `POST` | `CASHIER`, `BRANCH_MANAGER` | Process point-of-sale checkout |
| **Shift** | `/api/shift/open`, `/close`| `POST` | `CASHIER`, `BRANCH_MANAGER` | Register opening and closing cash |
| **Subscriptions**| `/api/subscriptions/plans` | `GET` | `STORE_ADMIN` | List available subscription tiers |
| **Billing** | `/api/subscription-payment/create-order` | `POST` | `STORE_ADMIN` | Initiate Razorpay plan checkout |
| **Analytics** | `/api/bi/overview` | `GET` | `STORE_ADMIN` | Store business intelligence dashboard |

---

## Security & Production Readiness

- **Zero Hardcoded Secrets**: All sensitive database credentials, JWT secrets, payment tokens, and mail passwords are fully decoupled into local configuration files and environment variable placeholders.
- **Git Protection**: The root `.gitignore` rigorously ignores `.env`, `application-local.properties`, build artifacts (`target/`, `dist/`), and IDE configurations (`.idea/`).
- **CORS Configured**: Cross-Origin Resource Sharing is controlled via Spring Security's `CorsConfigurationSource`.
- **Stateless Sessions**: JWT tokens are validated per-request using `OncePerRequestFilter`; user passwords are encrypted using `BCryptPasswordEncoder`.

---

## Screenshots

| Store Admin Dashboard | POS Terminal Checkout |
|:---:|:---:|
| *(Add Dashboard Screenshot)* | *(Add POS Terminal Screenshot)* |

| Branch & Inventory Management | Enterprise Settings & Billing |
|:---:|:---:|
| *(Add Inventory Screenshot)* | *(Add Settings Screenshot)* |

---

## License

This project is licensed under the [MIT License](LICENSE).
