# Firebase Product Import Setup

## Prerequisites

1. **Install Firebase Admin SDK**:
   ```bash
   pip install firebase-admin
   ```

2. **Get Firebase Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/project/v2v-communication-d46c6/settings/serviceaccounts/adminsdk)
   - Click "Project Settings" → "Service Accounts"
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in this folder

## Running the Import Script

### Option 1: Using Environment Variable (Recommended)

```bash
# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\USER\Desktop\shopping_basket\serviceAccountKey.json"
python import_products.py

# Windows (CMD)
set GOOGLE_APPLICATION_CREDENTIALS=C:\Users\USER\Desktop\shopping_basket\serviceAccountKey.json
python import_products.py

# Linux/Mac
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
python import_products.py
```

### Option 2: Modify the Script

Edit `import_products.py` and update the `initialize_firebase()` function:

```python
def initialize_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred, FIREBASE_CONFIG)
```

Then run:
```bash
python import_products.py
```

## What the Script Does

1. Connects to Firebase: `https://v2v-communication-d46c6-default-rtdb.firebaseio.com`
2. Imports 16 products to: `Shopping_Basket/products`
3. Each product includes:
   - Title, Category, Price, Discount info
   - Image URL, Rating, Weight
   - Unique ID

## Verify Import

After running the script, check:
1. Firebase Console → Realtime Database → `Shopping_Basket/products`
2. Refresh your React app to see products

## Troubleshooting

### Error: "Failed to determine service account"
- Make sure `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- Or add credentials directly in the script

### Error: "Permission denied"
- Check Firebase Realtime Database Rules
- Ensure service account has proper permissions

### Error: "Module not found"
```bash
pip install --upgrade firebase-admin
```

## Mode-Based Cart Operations

The app now listens to `Shopping_Basket/Modes` for hardware integration:

- **Mode = 1**: Add item to cart (reads from `Product_Name`)
- **Mode = 2**: Remove item from cart (decrements quantity)
- **Mode = 3**: Reset/Clear entire cart
- **Mode = 4**: Generate bill and create order

When adding items, the app updates:
- `Product_Name`: Current product title
- `Direction`: 'S' (success) or 'E' (error)
- `Weight`: Total bill amount (Mode 4)

