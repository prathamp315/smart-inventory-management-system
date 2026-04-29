const bcrypt = require("bcryptjs");
const connectToMongoDB = require("./connectToDb");
const { User } = require("./models/models");
require("dotenv").config();

const dummyUsers = [
  {
    name: "Admin User",
    email: "admin@onesmart.com",
    password: "admin123",
    role: "Admin",
  },
  {
    name: "Inventory Manager",
    email: "inventory@onesmart.com",
    password: "inventory123",
    role: "InventoryManager",
  },
  {
    name: "Procurement Manager",
    email: "procurement@onesmart.com",
    password: "procurement123",
    role: "ProcurementManager",
  },
  {
    name: "Production Manager",
    email: "production@onesmart.com",
    password: "production123",
    role: "ProductionManager",
  },
  {
    name: "Sales Executive",
    email: "sales@onesmart.com",
    password: "sales123",
    role: "SalesExecutive",
  },
];

async function seedUsers() {
  try {
    await connectToMongoDB(process.env.MONGO_URI);
    console.log("Connected to Database");

    for (const userData of dummyUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User ${userData.email} already exists, skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
      });
      console.log(`Created user: ${userData.name} (${userData.role}) — ${userData.email}`);
    }

    console.log("\nDummy users seeded successfully!");
    console.log("\n--- Login Credentials ---");
    for (const u of dummyUsers) {
      console.log(`${u.role.padEnd(20)} | Email: ${u.email.padEnd(30)} | Password: ${u.password}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err.message);
    process.exit(1);
  }
}

seedUsers();
