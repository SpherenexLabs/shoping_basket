"""
Firebase Product Import Script
Run this script to import products directly to Firebase Realtime Database
"""

import firebase_admin
from firebase_admin import credentials, db
import json

# Firebase configuration
FIREBASE_CONFIG = {
    "databaseURL": "https://v2v-communication-d46c6-default-rtdb.firebaseio.com"
}

# Products data
PRODUCTS = {
    "1": {
        "category": "Nuts & Seeds",
        "discount": True,
        "discountPrice": 19.99,
        "id": "1",
        "image": "https://images.unsplash.com/photo-1508747703725-719777637510?w=400&h=300&fit=crop",
        "price": 24.99,
        "rating": 4.8,
        "title": "Premium Organic Almonds",
        "weight": "500g"
    },
    "-OdlR9wRxyHhdGrG9BP6": {
        "category": "Fruits",
        "discount": True,
        "discountPrice": 6.49,
        "id": "2",
        "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop",
        "price": 8.99,
        "rating": 4.5,
        "title": "Fresh Strawberries Pack",
        "weight": "1kg"
    },
    "-OdlR9wSUh0nFf5qgwJB": {
        "category": "Bakery",
        "discount": False,
        "id": "3",
        "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
        "price": 4.99,
        "rating": 4.3,
        "title": "Whole Grain Bread",
        "weight": "750g"
    },
    "-OdlR9wUSaLznOvv5sZm": {
        "category": "Dairy & Eggs",
        "discount": True,
        "discountPrice": 5.49,
        "id": "4",
        "image": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop",
        "price": 6.99,
        "rating": 4.9,
        "title": "Organic Free Range Eggs",
        "weight": "12 eggs"
    },
    "-OdlR9wWu5YZ2YzRRmK5": {
        "category": "Dairy & Eggs",
        "discount": False,
        "id": "5",
        "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
        "price": 5.99,
        "rating": 4.6,
        "title": "Greek Yogurt Natural",
        "weight": "500g"
    },
    "-OdlR9wYNS4OWP1T2_Qq": {
        "category": "Beverages",
        "discount": True,
        "discountPrice": 14.99,
        "id": "6",
        "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
        "price": 18.99,
        "rating": 4.7,
        "title": "Premium Coffee Beans",
        "weight": "1kg"
    },
    "-OdlR9wZPvWgker3gSSZ": {
        "category": "Pantry",
        "discount": True,
        "discountPrice": 9.99,
        "image": "https://foodcare.in/cdn/shop/files/71gyVTaNOYL.jpg?v=1738908479",
        "price": 12.99,
        "rating": 4.8,
        "title": "Organic Honey Raw",
        "weight": "500g"
    },
    "-OdlR9wbAgwoSKKvXsOQ": {
        "category": "Seafood",
        "discount": False,
        "id": "8",
        "image": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop",
        "price": 22.99,
        "rating": 4.9,
        "title": "Fresh Salmon Fillet",
        "weight": "400g"
    },
    "-OdlR9wdXqVgJjAN0PCK": {
        "category": "Grains",
        "discount": True,
        "discountPrice": 7.99,
        "id": "9",
        "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
        "price": 9.99,
        "rating": 4.4,
        "title": "Quinoa Organic",
        "weight": "1kg"
    },
    "-OdlR9weRSH7HurgU2OG": {
        "category": "Oils & Vinegars",
        "discount": False,
        "id": "10",
        "image": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop",
        "price": 16.99,
        "rating": 4.7,
        "title": "Extra Virgin Olive Oil",
        "weight": "750ml"
    },
    "-OdlR9whG2iYCc03GoeB": {
        "category": "Snacks",
        "discount": True,
        "discountPrice": 5.99,
        "id": "11",
        "image": "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=400&h=300&fit=crop",
        "price": 7.99,
        "rating": 4.6,
        "title": "Dark Chocolate Premium",
        "weight": "200g"
    },
    "-OdlR9wkPbJF8zXhHZTz": {
        "category": "Beverages",
        "discount": True,
        "discountPrice": 8.99,
        "image": "https://www.bigvalueshop.com/wp-content/uploads/2021/07/Organic-India-Tulsi-Green-Tea-Classic_cover3.jpg",
        "price": 11.99,
        "rating": 4.5,
        "title": "Green Tea Organic",
        "weight": "100g (50 bags)"
    },
    "-OdlR9wkPbJF8zXhHZU-": {
        "category": "Pasta & Noodles",
        "discount": False,
        "image": "https://m.media-amazon.com/images/I/51fmOyyARxL.jpg",
        "price": 3.99,
        "rating": 4.3,
        "title": "Pasta Whole Wheat",
        "weight": "500g"
    },
    "-OdlR9wlDDStPB6Bb45u": {
        "category": "Dairy & Eggs",
        "discount": True,
        "discountPrice": 10.99,
        "id": "14",
        "image": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop",
        "price": 13.99,
        "rating": 4.8,
        "title": "Cheddar Cheese Aged",
        "weight": "400g"
    },
    "-OdlR9wqjBq_G0DOt0kA": {
        "category": "Nuts & Seeds",
        "discount": True,
        "discountPrice": 12.99,
        "id": "15",
        "image": "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
        "price": 15.99,
        "rating": 4.7,
        "title": "Mixed Nuts Premium",
        "weight": "600g"
    },
    "-OdlU2hK7JLxe8YIZsnv": {
        "category": "Beverages",
        "discount": True,
        "discountPrice": 25,
        "id": "-OdlU2hK7JLxe8YIZsnv",
        "image": "https://5.imimg.com/data5/SELLER/Default/2022/2/AL/QD/HP/3067591/coffee-powder-500x500.jpg",
        "price": 30,
        "rating": 4.5,
        "title": "Coffee Powder",
        "weight": "20g"
    }
}

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        firebase_admin.get_app()
        print("✓ Firebase already initialized")
    except ValueError:
        # Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS env var)
        # Or you can specify path to service account key:
        # cred = credentials.Certificate("path/to/serviceAccountKey.json")
        # firebase_admin.initialize_app(cred, FIREBASE_CONFIG)
        
        firebase_admin.initialize_app(options=FIREBASE_CONFIG)
        print("✓ Firebase initialized successfully")

def import_products():
    """Import products to Firebase Realtime Database"""
    try:
        print("\n📦 Starting product import...")
        print(f"   Database: {FIREBASE_CONFIG['databaseURL']}")
        print(f"   Path: Shopping_Basket/products")
        print(f"   Total products: {len(PRODUCTS)}\n")
        
        # Get reference to products node
        ref = db.reference('Shopping_Basket/products')
        
        # Set all products at once
        ref.set(PRODUCTS)
        
        print("✅ Successfully imported all products!")
        print("\nImported products:")
        for key, product in PRODUCTS.items():
            print(f"   - {product['title']} (₹{product['price']})")
        
        print("\n✓ Import complete! Check your Firebase Console.")
        
    except Exception as e:
        print(f"\n❌ Import failed: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Install firebase-admin: pip install firebase-admin")
        print("2. Set up authentication:")
        print("   - Download service account key from Firebase Console")
        print("   - Set environment variable: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json")
        print("   - Or pass credentials directly in the script")

if __name__ == "__main__":
    print("=" * 60)
    print("   Firebase Product Import Script")
    print("=" * 60)
    
    initialize_firebase()
    import_products()
    
    print("\n" + "=" * 60)
