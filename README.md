# 🍔 FoodApp — Full Stack Food Ordering System

A complete food ordering system with:
- **Customer App** — React Native (Expo) mobile app
- **Admin Portal** — React web dashboard
- **Backend** — Node.js + Express + MongoDB + Razorpay

---

## 📁 Project Structure

```
food-app/
├── backend/           # Node.js + Express API
├── customer-app/      # React Native (Expo) app
└── admin-portal/      # React web admin dashboard
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Razorpay account (https://razorpay.com)
- Expo CLI: `npm install -g expo-cli`

---

## 1️⃣ Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foodapp
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

Start server:
```bash
npm run dev
```

Seed menu items (run once):
```bash
curl -X POST http://localhost:5000/api/menu/seed
```

---

## 2️⃣ Customer App Setup (React Native)

```bash
cd customer-app
npm install
```

Edit `src/config/api.js`:
```js
// Replace with your machine's local IP (NOT localhost)
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
export const API_BASE_URL = 'http://192.168.1.XXX:5000/api';
```

Start the app:
```bash
npx expo start
```

Scan QR code with Expo Go app on your phone.

### Razorpay React Native Setup

For bare React Native (not Expo Go), install the native module:
```bash
npm install react-native-razorpay
cd ios && pod install
```

> ⚠️ `react-native-razorpay` requires a bare React Native project or Expo bare workflow. 
> For Expo Go testing, you can mock the payment step.

---

## 3️⃣ Admin Portal Setup

```bash
cd admin-portal
npm install
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Start admin portal:
```bash
npm start
```

Open http://localhost:3000

---

## 🔑 Razorpay Configuration

1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Generate Test Mode keys
4. Add to backend `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   ```

Test card details:
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

---

## 📱 Customer App Flow

```
Home Screen (Browse Menu)
    ↓ Add items to cart
Cart Screen (Review order)
    ↓ Proceed to checkout
Checkout Screen (Fill details)
    ↓ Pay via Razorpay
Order Success Screen
```

## 🖥️ Admin Portal Features

- **Dashboard Stats** — Total orders, pending, active, delivered, revenue
- **Order List** — All orders sorted by latest first
- **Status Management** — Advance order through stages:
  `Pending → Confirmed → Preparing → Out for Delivery → Delivered`
- **Cancel Orders** — Cancel any active order
- **Live Updates** — Auto-refreshes every 15 seconds
- **New Order Notifications** — Toast alert when new orders arrive

---

## 🛣️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| POST | `/api/menu/seed` | Seed sample menu |
| GET | `/api/orders` | Get all orders (admin) |
| POST | `/api/orders` | Create new order |
| PATCH | `/api/orders/:id/status` | Update order status |
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |

---

## 🗄️ MongoDB Collections

### MenuItem
```json
{
  "name": "Margherita Pizza",
  "description": "Classic tomato & mozzarella",
  "price": 299,
  "category": "Pizza",
  "image": "https://...",
  "isAvailable": true
}
```

### Order
```json
{
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "customerAddress": "123, Main St, Bengaluru",
  "items": [...],
  "totalAmount": 699,
  "status": "pending",
  "paymentStatus": "paid",
  "paymentId": "pay_XXXXX",
  "razorpayOrderId": "order_XXXXX",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## ⚙️ Deployment

### Backend (Railway / Render / EC2)
- Set environment variables in your hosting dashboard
- Change `MONGODB_URI` to your MongoDB Atlas URI

### Admin Portal (Vercel / Netlify)
- Set `REACT_APP_API_URL` to your deployed backend URL

### Customer App
- Change `API_BASE_URL` in `src/config/api.js` to your deployed backend URL
- Build with `expo build:android` or `expo build:ios`

---

## 📞 Support

For any issues:
1. Make sure MongoDB is running
2. Check `.env` files are correctly configured
3. Ensure backend is reachable from your phone (same WiFi network)
4. Verify Razorpay keys are correct
