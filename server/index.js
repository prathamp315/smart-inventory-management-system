const express = require("express");
const rateLimiter = require("express-rate-limit");
const cors = require("cors");
const connectToMongoDB = require("./connectToDb");
const { Product, Purchase, Supplier, Return, Bill, SyncLog } = require("./models/models");
const {
  handleAddNewProduct,
  handleGetAllProducts,
  handleAddNewPurchase,
  handleGetAllPurchases,
  handleGetAllExpiringPurchases,
  handleProcessReturn,
  handleGetAllReturns,
  handleBillProcessing,
  handleGetAllBills,
  handleAddSupplier,
  handleGetAllSuppliers,
  handleInventorySummary,
  handleUpdateProduct,
  createPurchaseRequisition,
  getAllPurchaseRequisitions,
  approvePurchaseRequisition,
  rejectPurchaseRequisition,
  createBOM,
  getAllBOMs,
  getBOMByProduct,
  createManufacturingOrder,
  startManufacturingOrder,
  completeManufacturingOrder,
  cancelManufacturingOrder,
  getAllManufacturingOrders,
} = require("./controllers/controllers");
const { registerUser, loginUser } = require("./controllers/authController");
const { getKPIs } = require("./controllers/kpiController");
const {
  getConsumptionForecast,
  getExceptions,
  getTraceability,
  getTimelineEvents,
  simulateManufacturing,
  getSmartInsights,
  seedDummyData,
} = require("./controllers/insightsController");
const {
  getDemandSupply,
  getCosting,
  getHealthScore,
  getProductionPlan,
  getSupplierPerformance,
  getRequisitionPriority,
  autoSeedData,
} = require("./controllers/advancedInsightsController");
const {
  getRecommendations,
  getDemandSupplyV2,
  getProductionPlanV2,
  getExceptionsV2,
  getCostingAll,
  seedDemoData,
  autoSeedDecision,
} = require("./controllers/decisionController");
const {
  getRootCause,
  getStory,
  getAnomalies,
  getAging,
  getImpactPreview,
  getRiskProducts,
} = require("./controllers/intelligenceController");
const authMiddleware = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");
const bcrypt = require("bcryptjs");
const { User } = require("./models/models");
require("dotenv").config();
const PORT = process.env.PORT || 5000;

// Auto-seed RBAC users on startup
const autoSeedUsers = async () => {
  const users = [
    { name: "Admin User", email: "admin@onesmart.com", password: "admin123", role: "Admin" },
    { name: "Inventory Manager", email: "inventory@onesmart.com", password: "inventory123", role: "InventoryManager" },
    { name: "Procurement Manager", email: "procurement@onesmart.com", password: "procurement123", role: "ProcurementManager" },
    { name: "Production Manager", email: "production@onesmart.com", password: "production123", role: "ProductionManager" },
    { name: "Sales Executive", email: "sales@onesmart.com", password: "sales123", role: "SalesExecutive" },
  ];
  try {
    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ name: u.name, email: u.email, password: hashed, role: u.role });
        console.log(`Auto-seed: Created user ${u.email} (${u.role})`);
      }
    }
  } catch (e) { console.error("Auto-seed users error:", e.message); }
};

connectToMongoDB(process.env.MONGO_URI).then(async () => {
  console.log("Connected to Database");
  // Auto-seed users and demo data on startup
  await autoSeedUsers();
  autoSeedData();
  autoSeedDecision();
});

const app = express();
const limiter = rateLimiter({
  windowMs: 60 * 60 * 1000, //1 hour window
  max: 20,
  message: "Too many requests from this IP, please try again after some time",
});

//middlewares
app.use(express.json());
app.use(cors());

// ===============================
// AUTH ROUTES (public)
// ===============================
app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);

// ===============================
// PRODUCT ROUTES (protected)
// ===============================
app.post("/api/products", authMiddleware, authorizeRoles("Admin", "InventoryManager"), handleAddNewProduct);
app.get("/api/products", authMiddleware, handleGetAllProducts);
app.put("/api/products/:id", authMiddleware, authorizeRoles("Admin", "InventoryManager"), handleUpdateProduct);

// ===============================
// PURCHASE ROUTES (protected)
// ===============================
app.post("/api/purchases", authMiddleware, authorizeRoles("Admin", "InventoryManager", "ProcurementManager"), handleAddNewPurchase);
app.get("/api/purchases", authMiddleware, handleGetAllPurchases);
app.get("/api/purchases/expiring", authMiddleware, handleGetAllExpiringPurchases);

// ===============================
// BILL / SALES ROUTES (protected)
// ===============================
app.get("/api/bills", authMiddleware, handleGetAllBills);
app.post("/api/bills", authMiddleware, authorizeRoles("Admin", "SalesExecutive"), handleBillProcessing);

// ===============================
// INVENTORY SUMMARY (protected)
// ===============================
app.get("/api/inventory/summary", authMiddleware, handleInventorySummary);

// ===============================
// RETURNS (protected)
// ===============================
app.post("/api/returns", authMiddleware, authorizeRoles("Admin", "SalesExecutive"), handleProcessReturn);
app.get("/api/returns", authMiddleware, handleGetAllReturns);

// ===============================
// SYNC ROUTES (protected)
// ===============================
app.get("/api/sync", authMiddleware, async (req, res) => {
  try {
    const [products, purchases, bills, returns] = await Promise.all([
      Product.find(),
      Purchase.find(),
      Bill.find(),
      Return.find(),
    ]);
    res.json({ products, purchases, bills, returns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sync", authMiddleware, async (req, res) => {
  try {
    const { products, purchases, bills, returns } = req.body;
    if (products) {
      for (const p of products) {
        await Product.updateOne({ _id: p._id }, p, { upsert: true });
      }
    }
    if (purchases) {
      for (const p of purchases) {
        await Purchase.updateOne({ _id: p._id }, p, { upsert: true });
      }
    }
    if (bills) {
      for (const b of bills) {
        await Bill.updateOne({ _id: b._id }, b, { upsert: true });
      }
    }
    if (returns) {
      for (const r of returns) {
        await Return.updateOne({ _id: r._id }, r, { upsert: true });
      }
    }
    res.json({ msg: "Sync successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// SUPPLIER ROUTES (protected)
// ===============================
app.post("/api/suppliers", authMiddleware, authorizeRoles("Admin", "InventoryManager", "ProcurementManager"), handleAddSupplier);
app.get("/api/suppliers", authMiddleware, handleGetAllSuppliers);

// ===============================
// PURCHASE REQUISITION ROUTES (protected)
// ===============================
app.post("/api/requisitions", authMiddleware, authorizeRoles("Admin", "ProcurementManager", "InventoryManager"), createPurchaseRequisition);
app.get("/api/requisitions", authMiddleware, getAllPurchaseRequisitions);
app.put("/api/requisitions/:id/approve", authMiddleware, authorizeRoles("Admin", "ProcurementManager"), approvePurchaseRequisition);
app.put("/api/requisitions/:id/reject", authMiddleware, authorizeRoles("Admin", "ProcurementManager"), rejectPurchaseRequisition);

// ===============================
// BOM ROUTES (protected)
// ===============================
app.post("/api/bom", authMiddleware, authorizeRoles("Admin", "ProductionManager"), createBOM);
app.get("/api/bom", authMiddleware, getAllBOMs);
app.get("/api/bom/:productId", authMiddleware, getBOMByProduct);

// ===============================
// MANUFACTURING ROUTES (protected)
// ===============================
app.post("/api/manufacturing", authMiddleware, authorizeRoles("Admin", "ProductionManager"), createManufacturingOrder);
app.get("/api/manufacturing", authMiddleware, getAllManufacturingOrders);
app.put("/api/manufacturing/:id/start", authMiddleware, authorizeRoles("Admin", "ProductionManager"), startManufacturingOrder);
app.put("/api/manufacturing/:id/complete", authMiddleware, authorizeRoles("Admin", "ProductionManager"), completeManufacturingOrder);
app.put("/api/manufacturing/:id/cancel", authMiddleware, authorizeRoles("Admin", "ProductionManager"), cancelManufacturingOrder);

// ===============================
// KPI ROUTES (protected)
// ===============================
app.get("/api/kpis", authMiddleware, getKPIs);

// ===============================
// INSIGHTS & SMART FEATURES (protected)
// ===============================
app.get("/api/insights/consumption", authMiddleware, getConsumptionForecast);
app.get("/api/insights/exceptions", authMiddleware, getExceptions);
app.get("/api/insights/smart", authMiddleware, getSmartInsights);
app.post("/api/insights/simulate", authMiddleware, simulateManufacturing);
app.post("/api/insights/seed-dummy", authMiddleware, seedDummyData);

// ===============================
// TRACEABILITY (protected)
// ===============================
app.get("/api/traceability/:productId", authMiddleware, getTraceability);
app.get("/api/traceability/:productId/timeline", authMiddleware, getTimelineEvents);

// ===============================
// ADVANCED INTELLIGENCE LAYER (protected)
// ===============================
app.get("/api/insights/demand-supply", authMiddleware, getDemandSupply);
app.get("/api/insights/costing/:productId", authMiddleware, getCosting);
app.get("/api/insights/health", authMiddleware, getHealthScore);
app.get("/api/insights/production-plan", authMiddleware, getProductionPlan);
app.get("/api/insights/suppliers", authMiddleware, getSupplierPerformance);
app.get("/api/insights/requisition-priority", authMiddleware, getRequisitionPriority);

// ===============================
// DECISION SUPPORT LAYER (protected)
// ===============================
app.get("/api/insights/recommendations", authMiddleware, getRecommendations);
app.get("/api/insights/demand-supply-v2", authMiddleware, getDemandSupplyV2);
app.get("/api/insights/production-plan-v2", authMiddleware, getProductionPlanV2);
app.get("/api/insights/exceptions-v2", authMiddleware, getExceptionsV2);
app.get("/api/insights/costing-all", authMiddleware, getCostingAll);
app.post("/api/demo/seed", authMiddleware, seedDemoData);

// ===============================
// INTELLIGENCE & INSIGHT LAYER (protected)
// ===============================
app.get("/api/insights/root-cause", authMiddleware, getRootCause);
app.get("/api/insights/story", authMiddleware, getStory);
app.get("/api/insights/anomalies", authMiddleware, getAnomalies);
app.get("/api/insights/aging", authMiddleware, getAging);
app.post("/api/insights/impact-preview", authMiddleware, getImpactPreview);
app.get("/api/insights/risk", authMiddleware, getRiskProducts);

app.listen(PORT, () => {
  console.log(`App is running at http://localhost:${PORT}`);
});

module.exports = app;
