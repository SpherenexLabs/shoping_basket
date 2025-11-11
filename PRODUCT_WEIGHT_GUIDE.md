# Product_Weight Field Implementation

## Overview
A new `Product_Weight` field has been added to Firebase to track the cumulative weight of scanned items in the cart. This value is compared with the actual hardware weight (`Weight` field) for validation.

## Firebase Structure

```
Shopping_Basket/
├── Product_Name: "Fresh Strawberries Pack"    // Last scanned item
├── Product_Weight: "1500.25"                   // Total cart weight in grams
├── Weight: "1502.18"                           // Actual hardware weight in grams
├── Modes: 1-4
└── Direction: "S" or "E"
```

## How It Works

### 1. **Weight Calculation**
When items are added to cart, the system:
- Parses each product's weight (kg, g, ml, eggs)
- Converts to grams
- Multiplies by quantity
- Sums total for all items
- Updates `Product_Weight` in Firebase

**Example:**
```javascript
Cart:
- Premium Organic Almonds (500g) × 1 = 500g
- Fresh Strawberries Pack (1kg) × 1 = 1000g
Total Product_Weight = 1500g
```

### 2. **Weight Validation** (Mode 4)
When generating bill:
- Reads `Product_Weight` (calculated from scanned items)
- Reads `Weight` (actual hardware sensor)
- Compares the two values
- Allows ±2g tolerance

**Validation Logic:**
```javascript
cartWeight = Product_Weight (from scanned items)
actualWeight = Weight (from hardware)
difference = |cartWeight - actualWeight|

if (difference <= 2g):
  ✅ "Weight matches! You can proceed with payment"
else:
  ❌ "You are not eligible to purchase"
```

### 3. **Auto-Update on Cart Changes**

**Adding Item (Mode 1):**
```
Before: Product_Weight = 500g
Add: Fresh Strawberries (1000g)
After: Product_Weight = 1500g
```

**Removing Item (Mode 2):**
```
Before: Product_Weight = 1500g
Remove: Premium Almonds (500g)
After: Product_Weight = 1000g
```

**Reset Cart (Mode 3):**
```
Product_Name = ""
Product_Weight = "0"
```

## Mode Operations

| Mode | Product_Name | Product_Weight | Weight | Direction |
|------|-------------|----------------|---------|-----------|
| **1** (Add) | "Strawberries" | "1500.00" | (unchanged) | "S" |
| **2** (Remove) | "Almonds" | "1000.00" | (unchanged) | "S" |
| **3** (Reset) | "" | "0" | (unchanged) | "S" |
| **4** (Bill) | (unchanged) | (read for validation) | (read from hardware) | "S" or "E" |

## Weight Parsing Examples

The system intelligently parses different weight formats:

```javascript
"500g"        → 500 grams
"1kg"         → 1000 grams
"750ml"       → 750 grams (1ml ≈ 1g)
"1L"          → 1000 grams
"12 eggs"     → 600 grams (50g per egg)
"1.5kg"       → 1500 grams
"250g"        → 250 grams
```

## Testing

### Manual Test via Firebase Console:
1. Add item: Set `Product_Name` = "Premium Organic Almonds"
2. Set `Modes` = 1
3. Check `Product_Weight` updates to "500.00"
4. Add another: Set `Product_Name` = "Fresh Strawberries Pack"
5. Set `Modes` = 1
6. Check `Product_Weight` updates to "1500.00"
7. Set hardware `Weight` = "1501.5" (within tolerance)
8. Set `Modes` = 4
9. Payment modal should show: ✅ Weight matches

### Using Python Test Script:
```bash
python test_modes.py
```

The script will:
- Add items and update Product_Weight
- Set matching hardware Weight
- Trigger payment (should pass validation)

## Hardware Integration

Your hardware should:
1. **On item scan**: Write to `Product_Name`
2. **Read back**: `Product_Weight` (expected total)
3. **Measure**: Update `Weight` with sensor reading
4. **Validate**: Compare Product_Weight vs Weight
5. **Proceed**: Set `Modes` = 4 only if weights match

## Error Scenarios

### Scenario 1: Item Not Scanned
```
Product_Weight: 500g (1 item scanned)
Weight: 1500g (2 items on scale)
Difference: 1000g > 2g tolerance
Result: ❌ Payment blocked
```

### Scenario 2: Wrong Item
```
Product_Weight: 1000g (expecting strawberries)
Weight: 500g (almonds placed instead)
Difference: 500g > 2g tolerance
Result: ❌ Payment blocked
```

### Scenario 3: Perfect Match
```
Product_Weight: 1500.00g
Weight: 1500.50g
Difference: 0.5g < 2g tolerance
Result: ✅ Payment allowed
```

## Benefits

1. **Accuracy**: Uses actual scanned item data, not manual input
2. **Hardware Independent**: Works with any weight sensor
3. **Real-time**: Updates on every cart change
4. **Transparent**: Customer sees both weights during checkout
5. **Fraud Prevention**: Can't checkout with unscanned items

## Data Flow

```
User Action → App Updates → Firebase Write
    ↓
Product_Name: "Item Name"
Product_Weight: "calculated_grams"
    ↓
Hardware Reads Product_Weight
    ↓
Hardware Measures Actual Weight
    ↓
Hardware Writes to Weight field
    ↓
Hardware Sets Modes = 4
    ↓
App Compares Product_Weight vs Weight
    ↓
✅ Match → Payment    OR    ❌ Mismatch → Block
```

## API for Hardware

Your hardware can use Firebase REST API:

**Read Product_Weight:**
```http
GET https://v2v-communication-d46c6-default-rtdb.firebaseio.com/Shopping_Basket/Product_Weight.json
```

**Write Weight:**
```http
PUT https://v2v-communication-d46c6-default-rtdb.firebaseio.com/Shopping_Basket/Weight.json
Body: "1500.25"
```

**Trigger Payment:**
```http
PUT https://v2v-communication-d46c6-default-rtdb.firebaseio.com/Shopping_Basket/Modes.json
Body: 4
```
