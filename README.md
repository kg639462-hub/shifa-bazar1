# 🌿 Ash-Shifa Herbals — Modified MERN Stack Dispensary E-Commerce

A clinical-grade, full-stack e-commerce web platform for **Ash-Shifa Herbals**, engineered using a modified MERN stack architecture (**React.js, Node.js, Express.js**) integrated with **Supabase** (PostgreSQL database, session management, and authentication instead of MongoDB), with **Razorpay** payment gateway and **Cash on Delivery (COD)**.

---

## 📸 UI & Aesthetic Design Compliance

The frontend design replicates the clinical apothecary aesthetic specified in the attached design references:
- **Pale Mint/Sage Dispensary Canvas**: `#f0faf4` soft botanical background with clean white cards (`#ffffff`).
- **Deep Forest Green Accent**: `#0a2e1e` for primary buttons, active badges, and status pills.
- **Botanical Typography**: Serif headers (`Playfair Display`) paired with clinical sans-serif body text (`Inter`).
- **Verified Clinical Badges**: Standard RX, Batch Verified, GMP Certified, 100% Monograph Verified, and HIPAA Regulated indicators.
- **Customizable Logo Component**: Kept separate in `client/src/components/common/DispensaryLogo.jsx` featuring the clean placeholder `[img]` format so you can easily replace it with your custom SVG or PNG image file anytime.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | React 18 + Vite | Single Page Application (SPA), state management, responsive UI |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first styling reflecting the attached apothecary UI |
| **Backend** | Node.js + Express.js | REST API, payment order initialization, signature verification, order lifecycle |
| **Database & Auth** | **Supabase (PostgreSQL)** | Replaces MongoDB. Provides Auth JWTs, relational tables, and Row Level Security (RLS) |
| **Payment Gateways** | **Razorpay** + **Cash on Delivery** | Online UPI/Cards/NetBanking gateway + Doorstep COD confirmation |

---

## 🌟 Key Features & Requirements

### 1. 🖼️ Product Details Page (Strict 4-Image Gallery)
- **Strict Requirement**: Exactly 4 high-resolution images for every botanical remedy.
- Interactive gallery with main viewport, image navigation controls, and a dedicated 4-thumbnail inspection bar (`01`, `02`, `03`, `04`).
- Details include: Latin botanical binomial, extraction ratio, standardized ingredients, recommended dosage, and Batch Certificate of Analysis (COA).

### 2. 💳 Dual Payment Methods (Razorpay & COD)
- **Razorpay**:
  - Backend initializes Razorpay orders with amount converted to subunits (paise).
  - Razorpay checkout SDK modal opens for UPI, Cards, and NetBanking.
  - Backend HMAC-SHA256 crypto verifies payment signature and updates database to `paid`.
- **Cash on Delivery (COD)**:
  - Validates delivery details and registers the order with `payment_method: 'cod'` and `order_status: 'confirmed'`.

### 3. 🛑 Order Cancellation Engine (Before Shipping)
- **Strict Requirement**: Authenticated users can cancel orders prior to cold-pack dispatch.
- **Business Logic & Database Guard**:
  - Orders in status `pending`, `confirmed`, or `processing` display an active **"Cancel Order"** button.
  - Interactive modal captures cancellation reasons and notes.
  - Once cancelled, Supabase updates `order_status = 'cancelled'`, `cancellation_reason`, and `cancelled_at`.
  - Orders already in transit (`shipped` or `delivered`) cannot be cancelled online, protected both on the backend and by database Row Level Security (RLS) policies.

### 4. 🏷️ Interchangeable Logo Component
- As requested, the logo is isolated in `client/src/components/common/DispensaryLogo.jsx`:
  ```jsx
  // client/src/components/common/DispensaryLogo.jsx
  // Swap the placeholder [img] div with your image logo:
  <img src="/your-logo.png" alt="Ash-Shifa Herbals" className="h-9 w-auto" />
  ```

---

## 📂 Project Directory Structure

```text
ASH-SHFA/
├── client/                              # React.js Frontend
│   ├── index.html                       # HTML entry point with fonts & Razorpay SDK
│   ├── vite.config.js                   # Vite configuration with API proxy to port 5000
│   ├── tailwind.config.js               # Dispensary sage & forest green palette
│   ├── src/
│   │   ├── api/                         # API connectors (products, orders, payment)
│   │   ├── components/
│   │   │   ├── catalog/                 # Product cards & compendium grid
│   │   │   ├── product/                 # STRICT 4-Image Gallery component
│   │   │   ├── cart/                    # Cart items & Dispensary summary
│   │   │   ├── checkout/                # Razorpay & COD checkout modal
│   │   │   ├── orders/                  # Order card & pre-shipping cancellation modal
│   │   │   └── common/
│   │   │       ├── DispensaryLogo.jsx   # Swappable logo placeholder
│   │   │       ├── Header.jsx           # Top navigation bar
│   │   │       └── Footer.jsx           # Clinical compliance badges
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Supabase authentication & user state
│   │   │   └── CartContext.jsx          # Cart state, quantities & pricing
│   │   ├── pages/
│   │   │   ├── HomePage.jsx             # Botanical Compendium catalog
│   │   │   ├── ProductDetailPage.jsx    # 4-image gallery product page
│   │   │   ├── CartPage.jsx             # Prescription cart view
│   │   │   ├── SignInPage.jsx           # Dispensary Sign In (matching screenshot)
│   │   │   ├── RegisterPage.jsx         # Patient Enrollment (matching screenshot)
│   │   │   ├── OrdersPage.jsx           # Order tracking & cancellation management
│   │   │   └── ContactPage.jsx          # Practitioner inquiries
│   │   ├── App.jsx
│   │   └── main.jsx
├── server/                              # Node.js + Express Backend
│   ├── config/
│   │   └── supabase.js                  # Supabase client initialization
│   ├── controllers/
│   │   ├── productController.js         # Products catalog & 4-image verification
│   │   ├── orderController.js           # Order queries & cancellation controller
│   │   └── paymentController.js         # Razorpay create/verify & COD logic
│   ├── middleware/
│   │   └── authMiddleware.js            # Supabase JWT verification
│   ├── routes/
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── authRoutes.js
│   └── server.js                        # Express server entry point
├── supabase/                            # Supabase PostgreSQL Database Setup
│   ├── schema.sql                       # Tables: profiles, products, orders, order_items
│   ├── rls_policies.sql                 # Row Level Security & cancellation guard rules
│   ├── seed.sql                         # Authentic products with strictly 4 images
│   └── README.md                        # Step-by-step database setup guide
└── package.json                         # Root scripts
```

---

## ⚡ Step-by-Step Setup Guide

### 1. Database Setup in Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Run the SQL scripts in this exact order:
   - `supabase/schema.sql`
   - `supabase/rls_policies.sql`
   - `supabase/seed.sql`
4. Copy your **Project URL**, **anon key**, and **service_role key** from **Project Settings -> API**.

### 2. Configure Environment Variables

#### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

CLIENT_URL=http://localhost:5173
```

#### Frontend (`client/.env`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 3. Install Dependencies & Run

Open two terminal tabs:

**Terminal 1 (Backend Server):**
```bash
cd server
npm install
npm run dev
```
*Server runs on `http://localhost:5000`*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm install
npm run dev
```
*Client runs on `http://localhost:5173`*

---

## 🧪 Testing the Specific Features

1. **Strict 4-Image Product Gallery**:
   - Navigate to any product in the compendium. Notice the 4 distinct interactive views (`View 1` to `View 4`) with numbered thumbnail navigation cards.
2. **Dual Payment Options (Razorpay + COD)**:
   - Add remedies to cart -> Click **"Proceed to Clinical Checkout"**.
   - Select either **Razorpay Gateway** or **Cash on Delivery (COD)**.
   - For Razorpay, the order is initialized through `/api/payment/razorpay/create-order` and verified with HMAC SHA256 before confirmation.
3. **Order Cancellation Before Shipping**:
   - Go to **My Orders & History** (`/orders`).
   - Notice the active **"Cancel Order"** button for pre-shipping preparations.
   - Click it, select a reason (e.g. *Change of botanical regimen*), and confirm.
   - The status in Supabase updates to `cancelled` and is timestamped accordingly.
