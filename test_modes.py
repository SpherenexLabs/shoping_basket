"""
Test Mode Controller
Use this script to test the mode-based cart operations
"""

import firebase_admin
from firebase_admin import credentials, db
import time

FIREBASE_CONFIG = {
    "databaseURL": "https://v2v-communication-d46c6-default-rtdb.firebaseio.com"
}

def initialize_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(options=FIREBASE_CONFIG)
        print("✓ Firebase initialized")

def set_mode(mode, product_name=None, product_weight=None):
    """Set mode and optionally product name and weight"""
    mode_ref = db.reference('Shopping_Basket/Modes')
    mode_ref.set(mode)
    print(f"✓ Set Mode to: {mode}")
    
    if product_name:
        product_ref = db.reference('Shopping_Basket/Product_Name')
        product_ref.set(product_name)
        print(f"✓ Set Product_Name to: {product_name}")
    
    if product_weight is not None:
        weight_ref = db.reference('Shopping_Basket/Product_Weight')
        weight_ref.set(str(product_weight))
        print(f"✓ Set Product_Weight to: {product_weight}g")
    
    time.sleep(0.5)

def test_modes():
    print("\n" + "="*60)
    print("  Mode Controller Test")
    print("="*60)
    
    print("\n1️⃣  Testing Mode 1: Add to Cart")
    set_mode(1, "Premium Organic Almonds", 500)  # 500g
    time.sleep(2)
    
    print("\n1️⃣  Adding another item")
    set_mode(1, "Fresh Strawberries Pack", 1500)  # 500g + 1000g = 1500g total
    time.sleep(2)
    
    print("\n1️⃣  Adding same item (increase quantity)")
    set_mode(1, "Premium Organic Almonds", 2000)  # 500g + 1000g + 500g = 2000g total
    time.sleep(2)
    
    print("\n2️⃣  Testing Mode 2: Remove from Cart")
    set_mode(2, "Premium Organic Almonds", 1500)  # 2000g - 500g = 1500g
    time.sleep(2)
    
    # Set hardware weight for testing
    print("\n⚖️  Setting hardware weight to 1500g")
    weight_ref = db.reference('Shopping_Basket/Weight')
    weight_ref.set("1500.0")
    time.sleep(1)
    
    print("\n4️⃣  Testing Mode 4: Generate Bill (weight should match)")
    set_mode(4)
    time.sleep(3)
    
    print("\n3️⃣  Testing Mode 3: Reset Cart")
    set_mode(3)
    time.sleep(2)
    
    print("\n✅ Test complete! Check your React app console for results.")
    print("="*60 + "\n")

if __name__ == "__main__":
    initialize_firebase()
    
    choice = input("\nRun full test sequence? (y/n): ")
    if choice.lower() == 'y':
        test_modes()
    else:
        print("\nManual mode setter:")
        print("Modes: 1=Add, 2=Remove, 3=Reset, 4=Bill")
        
        while True:
            try:
                mode = int(input("\nEnter mode (1-4, 0 to exit): "))
                if mode == 0:
                    break
                
                product = None
                weight = None
                if mode in [1, 2]:
                    product = input("Enter product name: ")
                    weight_input = input("Enter total cart weight in grams (or press Enter to skip): ")
                    if weight_input:
                        weight = float(weight_input)
                
                set_mode(mode, product, weight)
                
            except KeyboardInterrupt:
                print("\n\nExiting...")
                break
            except Exception as e:
                print(f"Error: {e}")
