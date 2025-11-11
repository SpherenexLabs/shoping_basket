# Payment & Weight Validation System

## Features Implemented

### 1. **Weight Validation**
- Parses product weights from various formats:
  - Kilograms: "1kg" → 1000g
  - Grams: "500g" → 500g
  - Milliliters/Liters: "750ml" → 750g, "1L" → 1000g
  - Eggs: "12 eggs" → 600g (50g per egg)
- Calculates total cart weight based on items and quantities
- Compares with actual weight from Firebase (`Shopping_Basket/Weight`)
- Allows ±2 grams tolerance for measurement variations
- **Validation Results**:
  - ✅ **Match**: User can proceed with payment
  - ❌ **Mismatch**: User blocked with message "You are not eligible to purchase"

### 2. **Payment Integration**

#### **Online Payment (Razorpay)**
- Integration with Razorpay Test Mode
- Key ID: `rzp_test_1DP5mmOlF5G5ag`
- Amount auto-calculated with 5% tax
- Pre-fills customer name, email
- Handles payment success/failure
- Returns payment ID for tracking

#### **Offline Payment (Cash)**
- Admin notification for cash collection
- Confirmation dialog before proceeding
- Payment ID set as `CASH_PAYMENT`
- Alert sent to admin panel

### 3. **Order Management**
- Order number format: `ORD-{timestamp}`
- Stores comprehensive order data:
  - Customer details (ID, name, email)
  - Items with prices, quantities, weights
  - Subtotal, tax (5%), total amount
  - Payment method and payment ID
  - Weight validation results
  - Timestamp
- Saves to two locations:
  - `Shopping_Basket/orders/{orderNumber}` - Admin view
  - `Shopping_Basket/users/{uid}/purchases/{orderNumber}` - Customer history

### 4. **Mode-Based Operations**

The system listens to `Shopping_Basket/Modes` for hardware integration:

| Mode | Action | Firebase Updates |
|------|--------|------------------|
| **1** | Add item to cart | `Product_Name` → item title<br>`Direction` → 'S' |
| **2** | Remove/decrease item | `Direction` → 'S' or 'E' |
| **3** | Clear entire cart | `Product_Name` → ''<br>`Direction` → 'S' |
| **4** | Open payment modal | `Direction` → 'S'<br>`Weight` → (validated) |

## Usage Flow

### Customer Checkout Process:

1. **Add Items to Cart**
   - Scan QR codes or click "Add to Cart"
   - Each add updates `Product_Name` in Firebase
   
2. **Hardware Sets Mode = 4**
   - Triggers payment modal
   - System reads `Shopping_Basket/Weight` from hardware

3. **Weight Validation**
   - Cart weight calculated from products
   - Compared with actual weight
   - Shows validation status to customer

4. **If Weight Matches:**
   - Customer selects payment mode:
     - **💳 Online**: Razorpay checkout
     - **💵 Offline**: Cash payment confirmation
   
5. **Payment Processing:**
   - **Online**: Razorpay processes payment
   - **Offline**: Admin collects cash
   
6. **Order Creation:**
   - Order saved to Firebase
   - Purchase added to customer history
   - Cart cleared automatically
   - Success message displayed

7. **If Weight Mismatch:**
   - Customer sees error message
   - Cannot proceed to payment
   - Must rescan items correctly

## Firebase Data Structure

```
Shopping_Basket/
├── Modes: 1-4
├── Product_Name: "Fresh Strawberries Pack"
├── Weight: "13.63" (from hardware)
├── Direction: "S" or "E"
├── products/
│   └── {productId}/
│       ├── title: "Product Name"
│       ├── weight: "500g"
│       ├── price: 24.99
│       └── ...
├── orders/
│   └── ORD-{timestamp}/
│       ├── orderNumber
│       ├── customerId
│       ├── items[]
│       ├── totalAmount
│       ├── paymentMethod
│       ├── paymentId
│       ├── weightValidation{}
│       └── createdAt
├── users/
│   └── {uid}/
│       ├── customerId: "CUST0001"
│       ├── fullName
│       ├── email
│       └── purchases/
│           └── ORD-{timestamp}/
│               ├── orderNumber
│               ├── totalAmount
│               ├── paymentMethod
│               └── createdAt
└── carts/
    └── {uid}/
        ├── items[]
        └── updatedAt
```

## Testing Payment

### Test Razorpay (Online Payment):

**Test Card Numbers:**
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Test UPI:**
```
UPI ID: success@razorpay
```

**Test Net Banking:**
- Select any bank
- Use credentials: `Success` / `Success`

### Test Weight Validation:

**Scenario 1: Valid Weight**
```javascript
Cart: 1x "Fresh Strawberries Pack" (1kg = 1000g)
Firebase Weight: 1000.5g
Difference: 0.5g (< 2g tolerance)
Result: ✅ Payment allowed
```

**Scenario 2: Invalid Weight**
```javascript
Cart: 1x "Premium Organic Almonds" (500g)
Firebase Weight: 450g
Difference: 50g (> 2g tolerance)
Result: ❌ Payment blocked
```

## Admin View Features

Admins can see all orders with:
- Order number and timestamp
- Customer ID and name
- Payment method (Online/Offline)
- Total amount
- Weight validation status
- Real-time updates

## Security Notes

⚠️ **Important**: Currently using Razorpay **TEST** mode
- Test key: `rzp_test_1DP5mmOlF5G5ag`
- No real money transactions
- For production:
  1. Get live key from Razorpay dashboard
  2. Update `RAZORPAY_KEY_ID` in `PaymentModal.jsx`
  3. Enable webhook verification
  4. Add server-side validation

## Error Handling

- **Payment Failed**: User notified, can retry
- **Weight Mismatch**: Clear error message, blocked from payment
- **Network Error**: Caught and logged
- **Firebase Error**: Direction set to 'E', admin notified

## Mobile Responsive

- Payment modal adapts to screen size
- Touch-friendly buttons
- Scrollable content for small screens
