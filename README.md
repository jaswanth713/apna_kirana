# Apna Kirana — Regional General Store E-Commerce Platform 🛒⚡

A modern, fast, full-stack local/regional grocery and daily essentials e-commerce application with a customer storefront, Cash on Delivery (COD) checkout, fast order tracking, and a comprehensive store-owner admin dashboard.

---

## 🚀 Technology Stack

- **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.0 ORM, Alembic Migrations, Pydantic v2
- **Database:** Serverless PostgreSQL on Neon
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios
- **Authentication:** JWT Access Tokens with Role-Based Access Control (`customer` & `admin`)
- **Testing:** Pytest & TestClient (43/43 automated backend tests passing)

---

## ✨ Features

### 🛍️ Customer Storefront
- **Live Catalog:** 10 categories (Snacks, Dairy, Staples, Beverages, etc.) and 30+ seeded products.
- **Search & Filter:** Keyword search, category filtering, price sliders, sorting (Price, Name, Newest), and in-stock toggles.
- **Delivery PIN Verification:** Real-time serviceable PIN code check with fee calculation & free-delivery thresholds.
- **Shopping Cart:** Guest cart with automatic synchronization upon customer login.
- **Checkout & Address Management:** Saved multiple delivery addresses, default address selector, and Cash on Delivery (COD).
- **Order Tracking:** Live order timeline (`PENDING` → `CONFIRMED` → `PREPARING` → `OUT_FOR_DELIVERY` → `DELIVERED`), invoice preview, and cancellation with automated stock restoration.

### 🛡️ Store Owner Admin Dashboard (`/admin`)
- **Live Business Metrics:** Total Sales (₹), Active Orders, Delivered Orders, Total Customers, and Low-Stock counts.
- **Product Management:** Add, edit, price/discount modifier, quick stock updater, and safe soft-deactivation.
- **Category Hierarchy:** Add, edit, and organize categories with display ordering.
- **Order Fulfillment Stepper:** Single-click order advancement and cancellation handling.
- **PIN Code Management:** Configure serviceable postal regions, custom delivery fees, and free-delivery thresholds.
- **Customer Directory:** Registered customer spend summary and order history.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Neon PostgreSQL database URL

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux / Mac
source venv/bin/activate

pip install -r requirements.txt

# Run migrations & seed data
alembic upgrade head
python -m app.utils.seed

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
- **API Docs (Swagger):** `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- **Storefront:** `http://localhost:5173/`

### 4. Running Tests
```bash
cd backend
pytest -v
```

---

## 📄 License
MIT License
