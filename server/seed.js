/**
 * Run once to populate the DB with demo data:
 *   node seed.js
 *
 * Safe to re-run — skips rows that already exist.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool, migrate } = require("./db");

const VENDORS = [
  {
    email: "mama@kivo.app", password: "demo1234", name: "Mama Njeri",
    businessName: "Mama Njeri's Kitchen",
    vendor: {
      category: "Local Food", description: "Authentic East African home cooking. Ugali, nyama choma, sukuma wiki and more.",
      image: "🍛", tag: "Top Rated", tag_color: "#ff6b35",
      rating: 4.8, review_count: 312, distance: "0.8 km",
      delivery_time: "20–30 min", delivery_fee: 1.50,
    },
    menu: [
      { name: "Ugali & Beef Stew",        price: 4.50, image: "🍖", description: "Creamy ugali with slow-cooked beef stew",           popular: true  },
      { name: "Nyama Choma Plate",         price: 7.00, image: "🥩", description: "Grilled goat with kachumbari and ugali",            popular: true  },
      { name: "Githeri Special",           price: 3.00, image: "🫘", description: "Maize & beans with tomatoes and onions",            popular: false },
      { name: "Sukuma Wiki + Chapati",     price: 2.50, image: "🫓", description: "Sautéed collard greens with 3 fresh chapatis",      popular: false },
      { name: "Pilau Rice",                price: 5.00, image: "🍚", description: "Fragrant spiced rice with beef",                    popular: true  },
    ],
  },
  {
    email: "burgers@kivo.app", password: "demo1234", name: "Burger Stack Owner",
    businessName: "Burger Stack",
    vendor: {
      category: "Burgers", description: "Handcrafted smash burgers made fresh daily. Big flavors, bigger stacks.",
      image: "🍔", tag: "Popular", tag_color: "#f59e0b",
      rating: 4.6, review_count: 198, distance: "1.2 km",
      delivery_time: "25–35 min", delivery_fee: 2.00,
    },
    menu: [
      { name: "Classic Smash Burger",  price: 6.00, image: "🍔", description: "Double smashed patty, American cheese, pickles",       popular: true  },
      { name: "BBQ Bacon Stack",        price: 8.00, image: "🥓", description: "Triple patty with crispy bacon and smoky BBQ sauce",  popular: true  },
      { name: "Spicy Chicken Burger",   price: 6.50, image: "🌶️", description: "Crispy chicken with jalapeños and sriracha mayo",    popular: false },
      { name: "Loaded Fries",           price: 3.50, image: "🍟", description: "Thick-cut fries with cheese sauce",                  popular: false },
      { name: "Milkshake",              price: 3.00, image: "🥤", description: "Vanilla, chocolate or strawberry",                   popular: false },
    ],
  },
  {
    email: "pizza@kivo.app", password: "demo1234", name: "Pizza Co Owner",
    businessName: "Nairobi Pizza Co.",
    vendor: {
      category: "Pizza", description: "Neapolitan-style pizzas baked in a wood-fired oven.",
      image: "🍕", tag: "New", tag_color: "#10b981",
      rating: 4.5, review_count: 245, distance: "1.8 km",
      delivery_time: "30–45 min", delivery_fee: 2.50,
    },
    menu: [
      { name: "Margherita",         price: 9.00,  image: "🍕", description: "San Marzano tomatoes, fresh mozzarella, basil", popular: true  },
      { name: "Nyama Choma Pizza",  price: 12.00, image: "🍖", description: "Goat meat, kachumbari salsa, mozzarella",       popular: true  },
      { name: "Pepperoni Classic",  price: 11.00, image: "🫓", description: "Loaded with premium pepperoni",                popular: false },
      { name: "Veggie Garden",      price: 9.50,  image: "🥦", description: "Roasted capsicum, mushroom, olives",           popular: false },
    ],
  },
  {
    email: "drinks@kivo.app", password: "demo1234", name: "Chill & Sip Owner",
    businessName: "Chill & Sip",
    vendor: {
      category: "Drinks", description: "Fresh juices, smoothies and cold drinks made to order.",
      image: "🥤", tag: "Fast Delivery", tag_color: "#6366f1",
      rating: 4.7, review_count: 156, distance: "0.5 km",
      delivery_time: "10–20 min", delivery_fee: 1.00,
    },
    menu: [
      { name: "Tropical Blast",    price: 3.50, image: "🥭", description: "Mango, pineapple, passion fruit blend",         popular: true  },
      { name: "Green Detox",       price: 4.00, image: "🥬", description: "Spinach, cucumber, apple, ginger, lemon",      popular: true  },
      { name: "Avocado Smoothie",  price: 4.50, image: "🥑", description: "Creamy avocado with honey and milk",           popular: false },
      { name: "Fresh Lemonade",    price: 2.50, image: "🍋", description: "Hand-squeezed with mint and ginger",           popular: false },
    ],
  },
  {
    email: "grill@kivo.app", password: "demo1234", name: "Grill House Owner",
    businessName: "The Grill House",
    vendor: {
      category: "Grills", description: "Premium grilled meats prepared over charcoal. The best nyama in town.",
      image: "🍖", tag: "Best Seller", tag_color: "#ef4444",
      rating: 4.9, review_count: 421, distance: "2.1 km",
      delivery_time: "35–50 min", delivery_fee: 3.00,
    },
    menu: [
      { name: "Whole Grilled Chicken", price: 14.00, image: "🍗", description: "Marinated overnight, charcoal grilled",              popular: true  },
      { name: "Mixed Grill Platter",   price: 18.00, image: "🥩", description: "Beef, chicken and sausage with sauces and sides",    popular: true  },
      { name: "Pork Ribs",             price: 16.00, image: "🍖", description: "Slow-cooked fall-off-the-bone ribs",                 popular: false },
      { name: "Grilled Fish",          price: 13.00, image: "🐟", description: "Whole tilapia in lemon herb marinade",               popular: false },
    ],
  },
];

const DEMO_CUSTOMER = {
  name: "Demo Customer", email: "customer@kivo.app",
  phone: "+254 700 000000", password: "demo1234", role: "customer",
};

async function seed() {
  await migrate();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── Demo customer
    const existC = await client.query("SELECT id FROM users WHERE email=$1", [DEMO_CUSTOMER.email]);
    if (!existC.rows.length) {
      const hash = await bcrypt.hash(DEMO_CUSTOMER.password, 12);
      await client.query(
        `INSERT INTO users (name, email, phone, password, role) VALUES ($1,$2,$3,$4,$5)`,
        [DEMO_CUSTOMER.name, DEMO_CUSTOMER.email, DEMO_CUSTOMER.phone, hash, "customer"]
      );
      console.log("  ✅ Demo customer created");
    } else {
      console.log("  ⏭  Demo customer already exists");
    }

    // ── Vendor accounts + profiles + menus
    for (const v of VENDORS) {
      const existU = await client.query("SELECT id FROM users WHERE email=$1", [v.email]);
      let userId;

      if (!existU.rows.length) {
        const hash = await bcrypt.hash(v.password, 12);
        const { rows } = await client.query(
          `INSERT INTO users (name, email, password, role, business_name) VALUES ($1,$2,$3,'vendor',$4) RETURNING id`,
          [v.name, v.email, hash, v.businessName]
        );
        userId = rows[0].id;
        console.log(`  ✅ Vendor user: ${v.businessName}`);
      } else {
        userId = existU.rows[0].id;
        console.log(`  ⏭  Vendor user exists: ${v.businessName}`);
      }

      const existV = await client.query("SELECT id FROM vendors WHERE user_id=$1", [userId]);
      let vendorId;

      if (!existV.rows.length) {
        const { rows } = await client.query(
          `INSERT INTO vendors
             (user_id, name, category, description, image, tag, tag_color, rating, review_count, distance, delivery_time, delivery_fee)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
          [userId, v.businessName, v.vendor.category, v.vendor.description,
           v.vendor.image, v.vendor.tag, v.vendor.tag_color,
           v.vendor.rating, v.vendor.review_count, v.vendor.distance,
           v.vendor.delivery_time, v.vendor.delivery_fee]
        );
        vendorId = rows[0].id;
        console.log(`     → Vendor profile created (id ${vendorId})`);
      } else {
        vendorId = existV.rows[0].id;
        console.log(`     → Vendor profile exists (id ${vendorId})`);
      }

      // Menu items — skip if vendor already has items
      const existM = await client.query("SELECT id FROM menu_items WHERE vendor_id=$1 LIMIT 1", [vendorId]);
      if (!existM.rows.length) {
        for (const item of v.menu) {
          await client.query(
            `INSERT INTO menu_items (vendor_id, name, description, price, image, popular, available)
             VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
            [vendorId, item.name, item.description, item.price, item.image, item.popular]
          );
        }
        console.log(`     → ${v.menu.length} menu items seeded`);
      } else {
        console.log(`     → Menu already seeded`);
      }
    }

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete!\n");
    console.log("Demo accounts:");
    console.log("  Customer : customer@kivo.app / demo1234");
    console.log("  Vendor 1 : mama@kivo.app / demo1234");
    console.log("  Vendor 2 : burgers@kivo.app / demo1234");
    console.log("  Vendor 3 : pizza@kivo.app / demo1234");
    console.log("  Vendor 4 : drinks@kivo.app / demo1234");
    console.log("  Vendor 5 : grill@kivo.app / demo1234\n");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error("SEED FAILED:", e.message); process.exit(1); });