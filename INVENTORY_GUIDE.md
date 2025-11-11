# Shopping Basket - Inventory Management Guide

## 🔥 Firebase Realtime Database Integration

All inventory data is now stored and synced in real-time with Firebase Realtime Database.

### Database Structure

```
Shopping_Basket/
├── products/
│   └── {productId}/
│       ├── id
│       ├── title
│       ├── category
│       ├── price
│       ├── discountPrice
│       ├── discount
│       ├── weight
│       ├── rating
│       └── image (URL)
├── users/
│   └── {userId}/
│       ├── fullName
│       ├── email
│       ├── phone
│       ├── role
│       └── createdAt
├── carts/
│   └── {userId}/
│       ├── items[]
│       └── updatedAt
└── orders/
    └── {orderId}/
        ├── customerName
        ├── items
        ├── total
        ├── status
        └── date
```

## ✨ Features

### Admin Panel - Inventory Management

#### 1. **Real-time Product Sync**
- Products are automatically synced from Firebase
- Any changes are reflected immediately across all connected clients
- No page refresh needed

#### 2. **Add New Product**
- Click "➕ Add Product" button
- Fill in product details:
  - Product Title (required)
  - Category (required)
  - Price in ₹ (required)
  - Weight (optional)
  - Discount checkbox
  - Discount Price (if discount enabled)
  - Rating (1-5)
  - Image URL (required)
- Image preview shows before saving
- Product is saved to Firebase instantly

#### 3. **Edit Product**
- Click "✏️ Edit" on any product card
- Modify any product details
- Changes are saved to Firebase
- Updates reflect immediately in customer store

#### 4. **Delete Product**
- Click "🗑️ Delete" on any product card
- Confirmation dialog appears
- Product is removed from Firebase
- Removed from all views instantly

#### 5. **Search Products**
- Real-time search by product name or category
- Filter updates as you type

### Customer Store

#### 1. **Real-time Product Display**
- Products load from Firebase automatically
- Shows all products added by admin
- Prices displayed in ₹ (Rupees)
- Discount badges show percentage off
- Add to cart functionality

#### 2. **Shopping Features**
- Add products to cart
- Cart count updates in header
- Cart data saved to Firebase per user

## 🎯 How to Use

### For Admin:

1. **Login as Admin**
   ```
   Email: admin@gmail.com
   Password: admin123
   ```

2. **Navigate to Inventory**
   - Click "Inventory" in the sidebar
   - View all products in grid layout

3. **Add a Product**
   - Click "➕ Add Product"
   - Enter product information
   - Use image URL from:
     - Unsplash: `https://images.unsplash.com/...`
     - Any public image hosting service
   - Click "Add Product" to save

4. **Edit a Product**
   - Find the product in grid
   - Click "✏️ Edit"
   - Modify details
   - Click "Update Product"

5. **Delete a Product**
   - Find the product
   - Click "🗑️ Delete"
   - Confirm deletion

### For Customers:

1. **Register/Login**
   - Create account with email/password
   - Or login with existing credentials

2. **Browse Products**
   - View all products from Firebase
   - See real-time updates when admin adds/removes products
   - Check prices in ₹

3. **Add to Cart**
   - Click "🛒 Add to Cart" on any product
   - Cart count updates in header
   - Cart saved to Firebase

## 🖼️ Image URL Guidelines

### Recommended Image Sources:

1. **Unsplash** (Free high-quality images)
   ```
   https://images.unsplash.com/photo-[ID]?w=400&h=300&fit=crop
   ```

2. **Pexels** (Free stock photos)
   ```
   https://images.pexels.com/photos/[ID]/[filename].jpeg
   ```

3. **Direct Image URLs**
   - Must be publicly accessible
   - Recommended size: 400x300 or larger
   - Formats: JPG, PNG, WebP

### Image Best Practices:
- Use high-resolution images
- Ensure images are publicly accessible
- Avoid copyrighted images
- Use consistent aspect ratios

## 📝 Product Data Format

```javascript
{
  title: "Product Name",
  category: "Category Name",
  price: 99.99,              // Regular price in ₹
  discountPrice: 79.99,      // Discounted price (or null)
  discount: true,            // Boolean
  weight: "500g",            // String (e.g., "1kg", "500ml")
  rating: 4.5,               // Number between 1-5
  image: "https://..."       // Public image URL
}
```

## 🔄 Real-time Updates

All changes happen in real-time:
- **Admin adds product** → Appears in customer store instantly
- **Admin edits product** → Updates everywhere immediately
- **Admin deletes product** → Removes from all views
- **Customer adds to cart** → Saved to Firebase automatically

## 🚀 Initial Setup

When you first run the application:

1. Products are automatically initialized from `src/data/products.js`
2. Initial 15 products are added to Firebase
3. Subsequent operations use Firebase as the source of truth
4. Local data file is only used for initial setup

## 💾 Data Persistence

- All product data stored in Firebase Realtime Database
- No local storage for products
- Survives page refreshes
- Accessible from any device
- Real-time synchronization across all sessions

## 🎨 Categories Available

- Nuts & Seeds
- Fruits
- Bakery
- Dairy & Eggs
- Beverages
- Pantry
- Seafood
- Grains
- Oils & Vinegars
- Snacks
- Pasta & Noodles

Add new categories as needed!

## 🔐 Security Notes

- Image URLs must be publicly accessible
- Don't use sensitive/private image URLs
- Firebase rules should be configured for production
- Admin credentials are hardcoded (change for production)

## 📱 Responsive Design

- Works on desktop, tablet, and mobile
- Grid adjusts to screen size
- Modal forms are mobile-friendly
- Touch-friendly buttons and controls
