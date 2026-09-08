import sys
import os
from datetime import datetime, timezone
import uuid

# Add parent directory to path so script can be run standalone
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.database import engine, SessionLocal, Base
from app.models import (
    User,
    Category,
    Product,
    ServiceablePincode,
    Address,
    CartItem,
    Order,
    OrderItem,
)
from app.security import get_password_hash


def seed_database():
    """
    Creates all tables in Neon PostgreSQL and populates initial seed data.
    """
    print("[*] Initializing Neon PostgreSQL Database Tables...")
    Base.metadata.create_all(bind=engine)
    print("[+] Database tables created/verified successfully.")

    db = SessionLocal()
    try:
        # 1. Seed Users (Admin + Test Customer)
        admin = db.query(User).filter(User.email == "admin@localstore.com").first()
        if not admin:
            admin = User(
                role="admin",
                full_name="Store Owner",
                email="admin@localstore.com",
                phone="9876543210",
                password_hash=get_password_hash("admin123"),
                is_active=True,
            )
            db.add(admin)
            print("  [+] Created Admin: admin@localstore.com / admin123 (Phone: 9876543210)")

        customer = db.query(User).filter(User.phone == "9876543211").first()
        if not customer:
            customer = User(
                role="customer",
                full_name="Rahul Sharma",
                email="customer@gmail.com",
                phone="9876543211",
                password_hash=get_password_hash("customer123"),
                is_active=True,
            )
            db.add(customer)
            print("  [+] Created Test Customer: customer@gmail.com / customer123 (Phone: 9876543211)")

        db.commit()

        # 2. Seed Serviceable PIN Codes
        pincodes_data = [
            {"pincode": "560001", "area_name": "MG Road / Central Market", "delivery_fee": 30.00, "min_order_amount": 100.00, "free_delivery_threshold": 499.00},
            {"pincode": "560034", "area_name": "Koramangala 4th Block", "delivery_fee": 25.00, "min_order_amount": 100.00, "free_delivery_threshold": 399.00},
            {"pincode": "560078", "area_name": "JP Nagar Phase 2", "delivery_fee": 35.00, "min_order_amount": 150.00, "free_delivery_threshold": 499.00},
            {"pincode": "560095", "area_name": "Koramangala 8th Block", "delivery_fee": 25.00, "min_order_amount": 100.00, "free_delivery_threshold": 399.00},
            {"pincode": "110001", "area_name": "Connaught Place / Central Area", "delivery_fee": 30.00, "min_order_amount": 100.00, "free_delivery_threshold": 499.00},
            {"pincode": "400001", "area_name": "Fort / South Market", "delivery_fee": 30.00, "min_order_amount": 100.00, "free_delivery_threshold": 499.00},
        ]

        for pin_data in pincodes_data:
            existing_pin = db.query(ServiceablePincode).filter(ServiceablePincode.pincode == pin_data["pincode"]).first()
            if not existing_pin:
                pin = ServiceablePincode(**pin_data)
                db.add(pin)
        db.commit()
        print(f"[+] Seeded {len(pincodes_data)} Serviceable PIN Codes.")

        # 3. Seed Sample Customer Address
        if customer:
            existing_addr = db.query(Address).filter(Address.user_id == customer.id).first()
            if not existing_addr:
                addr = Address(
                    user_id=customer.id,
                    recipient_name="Rahul Sharma",
                    phone="9876543211",
                    address_line="Flat 402, Green Glen Layout, Outer Ring Road",
                    landmark="Near HDFC Bank",
                    city="Bangalore",
                    state="Karnataka",
                    pincode="560034",
                    is_default=True,
                )
                db.add(addr)
                db.commit()
                print("  [+] Created default delivery address for test customer.")

        # 4. Seed Categories
        categories_data = [
            {
                "name": "Biscuits & Cookies",
                "slug": "biscuits-cookies",
                "description": "Crispy sweet & salty biscuits, cookies, and cream wafers.",
                "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
                "display_order": 1,
            },
            {
                "name": "Chips & Namkeen",
                "slug": "chips-namkeen",
                "description": "Crunchy potato chips, spicy bhujia, mixtures, and traditional snacks.",
                "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
                "display_order": 2,
            },
            {
                "name": "Chocolates & Sweets",
                "slug": "chocolates-sweets",
                "description": "Milk chocolates, dark chocolates, candies, and sweet bites.",
                "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=80",
                "display_order": 3,
            },
            {
                "name": "Beverages & Cold Drinks",
                "slug": "beverages-cold-drinks",
                "description": "Soft drinks, fruit juices, energy drinks, and packaged water.",
                "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
                "display_order": 4,
            },
            {
                "name": "Instant Food & Noodles",
                "slug": "instant-food-noodles",
                "description": "Instant 2-minute noodles, pastas, instant soups, and ready-to-eat packs.",
                "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80",
                "display_order": 5,
            },
            {
                "name": "Grocery & Staples",
                "slug": "grocery-staples",
                "description": "Fresh atta, premium rice, cooking oils, dals, and kitchen spices.",
                "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
                "display_order": 6,
            },
            {
                "name": "Personal Care & Soaps",
                "slug": "personal-care",
                "description": "Soaps, shampoos, hair care, toothpastes, and skincare essentials.",
                "image_url": "https://images.unsplash.com/photo-1608248597358-1582e389e779?w=500&auto=format&fit=crop&q=80",
                "display_order": 7,
            },
            {
                "name": "Household & Cleaning",
                "slug": "household-cleaning",
                "description": "Detergents, dishwash liquids, floor cleaners, and fresheners.",
                "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=80",
                "display_order": 8,
            },
            {
                "name": "Dairy & Breakfast",
                "slug": "dairy-breakfast",
                "description": "Fresh butter, cheese, UHT milk, corn flakes, and breakfast cereals.",
                "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80",
                "display_order": 9,
            },
            {
                "name": "Tea, Coffee & Drinks",
                "slug": "tea-coffee",
                "description": "Premium black tea, green tea, instant coffee, and health drinks.",
                "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
                "display_order": 10,
            },
        ]

        category_map = {}
        for cat_data in categories_data:
            existing_cat = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing_cat:
                cat = Category(**cat_data)
                db.add(cat)
                db.flush()
                category_map[cat.slug] = cat.id
            else:
                category_map[existing_cat.slug] = existing_cat.id
        db.commit()
        print(f"[+] Seeded {len(categories_data)} Store Categories.")

        # 5. Seed 30+ Realistic Indian Store Products
        products_data = [
            # Biscuits
            {
                "category_slug": "biscuits-cookies",
                "name": "Parle-G Original Gluco Biscuits",
                "slug": "parle-g-original-gluco-biscuits-250g",
                "brand": "Parle",
                "description": "India's favorite chai companion. Enriched with the goodness of wheat and milk for instant energy.",
                "price": 25.00,
                "discount_price": 22.00,
                "stock_quantity": 80,
                "unit": "Pack",
                "weight_or_quantity": "250g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "biscuits-cookies",
                "name": "Britannia Good Day Butter Cookies",
                "slug": "britannia-good-day-butter-cookies-200g",
                "brand": "Britannia",
                "description": "Rich, delicious butter cookies baked with a warm smile pattern and rich aroma.",
                "price": 40.00,
                "discount_price": 35.00,
                "stock_quantity": 65,
                "unit": "Pack",
                "weight_or_quantity": "200g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "biscuits-cookies",
                "name": "Oreo Vanilla Creme Sandwich Biscuits",
                "slug": "oreo-vanilla-creme-biscuits-120g",
                "brand": "Cadbury Oreo",
                "description": "Rich dark chocolate cookies filled with smooth, sweet vanilla cream.",
                "price": 35.00,
                "discount_price": 30.00,
                "stock_quantity": 50,
                "unit": "Pack",
                "weight_or_quantity": "120g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "biscuits-cookies",
                "name": "Sunfeast Dark Fantasy Choco Fills",
                "slug": "sunfeast-dark-fantasy-choco-fills-150g",
                "brand": "Sunfeast",
                "description": "Crispy baked crust holding a molten flowing chocolate core inside.",
                "price": 60.00,
                "discount_price": 50.00,
                "stock_quantity": 40,
                "unit": "Pack",
                "weight_or_quantity": "150g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
            },

            # Chips & Namkeen
            {
                "category_slug": "chips-namkeen",
                "name": "Lay's India's Magic Masala Potato Chips",
                "slug": "lays-indias-magic-masala-chips-50g",
                "brand": "Lay's",
                "description": "Crispy ridged potato chips infused with vibrant Indian spices and tangy flavors.",
                "price": 20.00,
                "discount_price": 18.00,
                "stock_quantity": 100,
                "unit": "Pack",
                "weight_or_quantity": "50g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "chips-namkeen",
                "name": "Kurkure Masala Munch Crisps",
                "slug": "kurkure-masala-munch-75g",
                "brand": "Kurkure",
                "description": "Tedhe-medhe crunchy corn puffs packed with zesty chatpata masala.",
                "price": 20.00,
                "discount_price": 18.00,
                "stock_quantity": 90,
                "unit": "Pack",
                "weight_or_quantity": "75g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "chips-namkeen",
                "name": "Haldiram's Nagpur Aloo Bhujia",
                "slug": "haldirams-aloo-bhujia-200g",
                "brand": "Haldiram's",
                "description": "Spicy mint flavored crispy potato sev namkeen crafted using classic Indian recipes.",
                "price": 60.00,
                "discount_price": 52.00,
                "stock_quantity": 45,
                "unit": "Pack",
                "weight_or_quantity": "200g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
            },

            # Chocolates & Sweets
            {
                "category_slug": "chocolates-sweets",
                "name": "Cadbury Dairy Milk Silk Chocolate Bar",
                "slug": "cadbury-dairy-milk-silk-60g",
                "brand": "Cadbury",
                "description": "Melt-in-your-mouth creamy milk chocolate bar, rich, smooth, and indulgent.",
                "price": 85.00,
                "discount_price": 75.00,
                "stock_quantity": 70,
                "unit": "Piece",
                "weight_or_quantity": "60g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "chocolates-sweets",
                "name": "Nestle KitKat 4 Finger Chocolate",
                "slug": "nestle-kitkat-4-finger-38g",
                "brand": "Nestle",
                "description": "Crisp wafer fingers enrobed in smooth milk chocolate. Have a break, have a KitKat!",
                "price": 30.00,
                "discount_price": 27.00,
                "stock_quantity": 60,
                "unit": "Piece",
                "weight_or_quantity": "38g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1575224300306-1b8da36134ce?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "chocolates-sweets",
                "name": "Amul 55% Rich Dark Chocolate",
                "slug": "amul-rich-dark-chocolate-150g",
                "brand": "Amul",
                "description": "Premium cocoa bean dark chocolate bar with delicate bitter-sweet notes.",
                "price": 110.00,
                "discount_price": 95.00,
                "stock_quantity": 30,
                "unit": "Piece",
                "weight_or_quantity": "150g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&auto=format&fit=crop&q=80",
            },

            # Beverages & Cold Drinks
            {
                "category_slug": "beverages-cold-drinks",
                "name": "Coca-Cola Refreshing Carbonated Drink 750ml",
                "slug": "coca-cola-pet-bottle-750ml",
                "brand": "Coca-Cola",
                "description": "The world's favorite sparkling cola drink, best enjoyed ice cold.",
                "price": 45.00,
                "discount_price": 40.00,
                "stock_quantity": 75,
                "unit": "Bottle",
                "weight_or_quantity": "750ml",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "beverages-cold-drinks",
                "name": "Thums Up Charged Soft Drink 750ml",
                "slug": "thums-up-soft-drink-750ml",
                "brand": "Thums Up",
                "description": "Strong, fizzy, and spicy cola with an unmistakable thunderous kick.",
                "price": 45.00,
                "discount_price": 40.00,
                "stock_quantity": 80,
                "unit": "Bottle",
                "weight_or_quantity": "750ml",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "beverages-cold-drinks",
                "name": "Frooti Fresh 'N' Juicy Mango Drink 1L",
                "slug": "frooti-mango-drink-1l",
                "brand": "Parle Agro",
                "description": "Delicious real mango pulp drink packed with rich Alphonso sweetness.",
                "price": 75.00,
                "discount_price": 65.00,
                "stock_quantity": 40,
                "unit": "Bottle",
                "weight_or_quantity": "1 L",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80",
            },

            # Instant Food & Noodles
            {
                "category_slug": "instant-food-noodles",
                "name": "Maggi 2-Minute Masala Instant Noodles (Pack of 4)",
                "slug": "maggi-2-minute-noodles-pack-of-4-280g",
                "brand": "Nestle Maggi",
                "description": "India's favorite comfort food made with roasted spice Tastemaker and fortified with iron.",
                "price": 60.00,
                "discount_price": 54.00,
                "stock_quantity": 120,
                "unit": "Pack",
                "weight_or_quantity": "280g (4 x 70g)",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "instant-food-noodles",
                "name": "Sunfeast YiPPee! Magic Masala Noodles",
                "slug": "sunfeast-yippee-magic-masala-240g",
                "brand": "Sunfeast",
                "description": "Non-sticky, round round slurp-worthy noodles infused with blend of 5 veggies and spice mix.",
                "price": 50.00,
                "discount_price": 44.00,
                "stock_quantity": 60,
                "unit": "Pack",
                "weight_or_quantity": "240g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80",
            },

            # Grocery & Staples
            {
                "category_slug": "grocery-staples",
                "name": "Aashirvaad Superior MP Sharbati Whole Wheat Atta 5kg",
                "slug": "aashirvaad-sharbati-atta-5kg",
                "brand": "Aashirvaad",
                "description": "100% pure whole wheat stone-ground chakki fresh flour for soft and fluffy rotis.",
                "price": 310.00,
                "discount_price": 275.00,
                "stock_quantity": 35,
                "unit": "Bag",
                "weight_or_quantity": "5 kg",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "grocery-staples",
                "name": "Fortune Sunlite Refined Sunflower Oil 1L",
                "slug": "fortune-sunlite-refined-sunflower-oil-1l",
                "brand": "Fortune",
                "description": "Light, healthy, refined cooking oil enriched with Vitamins A & D.",
                "price": 150.00,
                "discount_price": 135.00,
                "stock_quantity": 50,
                "unit": "Pouch",
                "weight_or_quantity": "1 L",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "grocery-staples",
                "name": "India Gate Feast Rozzana Basmati Rice 1kg",
                "slug": "india-gate-rozzana-basmati-rice-1kg",
                "brand": "India Gate",
                "description": "Long, aromatic aged Basmati grains perfect for daily pulao, biryani, and steamed rice.",
                "price": 125.00,
                "discount_price": 105.00,
                "stock_quantity": 40,
                "unit": "Pack",
                "weight_or_quantity": "1 kg",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "grocery-staples",
                "name": "Tata Salt Vacuum Evaporated Iodized Salt 1kg",
                "slug": "tata-salt-iodized-1kg",
                "brand": "Tata Salt",
                "description": "Desh ka Namak. Purity tested vacuum evaporated iodized salt essential for balanced iodine intake.",
                "price": 28.00,
                "discount_price": 26.00,
                "stock_quantity": 150,
                "unit": "Pack",
                "weight_or_quantity": "1 kg",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500&auto=format&fit=crop&q=80",
            },

            # Personal Care
            {
                "category_slug": "personal-care",
                "name": "Dettol Original Germ Protection Bathing Soap (Buy 3 Get 1 Free)",
                "slug": "dettol-original-soap-4x125g",
                "brand": "Dettol",
                "description": "Trusted antiseptic soap formulation providing 99.9% germ protection for the entire family.",
                "price": 190.00,
                "discount_price": 165.00,
                "stock_quantity": 45,
                "unit": "Pack",
                "weight_or_quantity": "4 x 125g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1608248597358-1582e389e779?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "personal-care",
                "name": "Dove Cream Beauty Bathing Bar Soap 100g",
                "slug": "dove-cream-beauty-bar-100g",
                "brand": "Dove",
                "description": "Enriched with 1/4th moisturizing cream to leave skin noticeably softer and smoother.",
                "price": 68.00,
                "discount_price": 59.00,
                "stock_quantity": 55,
                "unit": "Piece",
                "weight_or_quantity": "100g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "personal-care",
                "name": "Head & Shoulders Cool Menthol Anti-Dandruff Shampoo 180ml",
                "slug": "head-and-shoulders-cool-menthol-180ml",
                "brand": "Head & Shoulders",
                "description": "Cleanses hair and scalp with an invigorating menthol cooling sensation, fighting visible dandruff.",
                "price": 195.00,
                "discount_price": 172.00,
                "stock_quantity": 30,
                "unit": "Bottle",
                "weight_or_quantity": "180ml",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "personal-care",
                "name": "Colgate Strong Teeth Anticavity Toothpaste 200g",
                "slug": "colgate-strong-teeth-toothpaste-200g",
                "brand": "Colgate",
                "description": "Amino Shakti formula that strengthens enamel and provides all-round cavity defense.",
                "price": 115.00,
                "discount_price": 99.00,
                "stock_quantity": 60,
                "unit": "Tube",
                "weight_or_quantity": "200g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1559591937-e1032c589f2d?w=500&auto=format&fit=crop&q=80",
            },

            # Household & Cleaning
            {
                "category_slug": "household-cleaning",
                "name": "Vim Lemon Dishwash Gel with Real Lime Juice 500ml",
                "slug": "vim-lemon-dishwash-gel-500ml",
                "brand": "Vim",
                "description": "Cuts tough grease in 1 spoon without leaving any white residue on kitchen utensils.",
                "price": 125.00,
                "discount_price": 108.00,
                "stock_quantity": 40,
                "unit": "Bottle",
                "weight_or_quantity": "500ml",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "household-cleaning",
                "name": "Surf Excel Easy Wash Detergent Powder 1kg",
                "slug": "surf-excel-easy-wash-powder-1kg",
                "brand": "Surf Excel",
                "description": "Removes tough stains like oil, curry, mud, and ink with minimum brushing effort.",
                "price": 160.00,
                "discount_price": 142.00,
                "stock_quantity": 45,
                "unit": "Pack",
                "weight_or_quantity": "1 kg",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "household-cleaning",
                "name": "Harpic Power Plus Disinfectant Toilet Cleaner 500ml",
                "slug": "harpic-power-plus-toilet-cleaner-500ml",
                "brand": "Harpic",
                "description": "Thick disinfectant formula that removes 100% limescale and kills 99.9% toilet germs.",
                "price": 98.00,
                "discount_price": 86.00,
                "stock_quantity": 50,
                "unit": "Bottle",
                "weight_or_quantity": "500ml",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=500&auto=format&fit=crop&q=80",
            },

            # Dairy & Breakfast
            {
                "category_slug": "dairy-breakfast",
                "name": "Amul Butter Pasteurized Salted 100g",
                "slug": "amul-butter-pasteurized-100g",
                "brand": "Amul",
                "description": "Utterly Butterly Delicious. Made from pure sweet cream milk, unmatched on warm toast and parathas.",
                "price": 58.00,
                "discount_price": 56.00,
                "stock_quantity": 90,
                "unit": "Pack",
                "weight_or_quantity": "100g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "dairy-breakfast",
                "name": "Kellogg's Original Corn Flakes Cereal 500g",
                "slug": "kelloggs-corn-flakes-500g",
                "brand": "Kellogg's",
                "description": "Crispy golden corn flakes enriched with essential B-group vitamins and iron for active mornings.",
                "price": 220.00,
                "discount_price": 195.00,
                "stock_quantity": 25,
                "unit": "Box",
                "weight_or_quantity": "500g",
                "is_featured": False,
                "image_url": "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=500&auto=format&fit=crop&q=80",
            },

            # Tea, Coffee & Drinks
            {
                "category_slug": "tea-coffee",
                "name": "Tata Tea Premium Desh Ki Chai 500g",
                "slug": "tata-tea-premium-500g",
                "brand": "Tata Tea",
                "description": "Unique blend of fine Assam tea leaves and strong tea grains for bold taste and rich color.",
                "price": 290.00,
                "discount_price": 260.00,
                "stock_quantity": 35,
                "unit": "Pack",
                "weight_or_quantity": "500g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
            },
            {
                "category_slug": "tea-coffee",
                "name": "Nescafe Classic 100% Pure Instant Coffee Jar 50g",
                "slug": "nescafe-classic-instant-coffee-50g",
                "brand": "Nescafe",
                "description": "Signature rich aroma and unmistakable bold coffee taste crafted from slow-roasted Robusta beans.",
                "price": 180.00,
                "discount_price": 162.00,
                "stock_quantity": 40,
                "unit": "Jar",
                "weight_or_quantity": "50g",
                "is_featured": True,
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80",
            },
        ]

        for p_data in products_data:
            cat_slug = p_data.pop("category_slug")
            cat_id = category_map.get(cat_slug)
            if not cat_id:
                continue

            existing_prod = db.query(Product).filter(Product.slug == p_data["slug"]).first()
            if not existing_prod:
                prod = Product(category_id=cat_id, **p_data)
                db.add(prod)
        db.commit()
        print(f"[+] Seeded {len(products_data)} Realistic Store Products.")

        print("\n[+] Database initialization and seeding finished successfully on Neon PostgreSQL!")

    except Exception as exc:
        db.rollback()
        print(f"[!] Error seeding database: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
