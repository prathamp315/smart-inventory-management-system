const { Product, Purchase, Bill, PurchaseRequisition, ManufacturingOrder, BillOfMaterials, Supplier, Return } = require("../models/models");

// Helper: get stock for a product
function getStock(purchases, productId) {
  let s = 0;
  purchases.forEach(p => p.items.forEach(i => { if (i.product.toString() === productId.toString()) s += i.remainingQty || 0; }));
  return s;
}

// Helper: get 7-day sales
function get7DaySales(bills, productId) {
  const sevenAgo = new Date(Date.now() - 7 * 86400000);
  let qty = 0;
  bills.forEach(b => { if (new Date(b.createdAt) >= sevenAgo) b.items.forEach(i => { const id = i.product?._id?.toString() || i.product?.toString(); if (id === productId.toString()) qty += i.quantity || 0; }); });
  return qty;
}

/* FEATURE 1 — DEMAND vs SUPPLY */
const getDemandSupply = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const result = [];
    for (const p of products) {
      const stock = getStock(purchases, p._id);
      const sold7d = get7DaySales(bills, p._id);
      const demandPerDay = parseFloat((sold7d / 7).toFixed(2));
      const daysCoverage = demandPerDay > 0 ? parseFloat((stock / demandPerDay).toFixed(1)) : stock > 0 ? 999 : 0;
      let status = "Balanced";
      if (daysCoverage <= 3) status = "Shortage";
      else if (daysCoverage <= 7) status = "At Risk";
      if (stock > 0 || sold7d > 0) result.push({ productId: p._id, product: p.name, demandPerDay, currentStock: stock, daysCoverage, sold7Days: sold7d, status });
    }
    result.sort((a, b) => a.daysCoverage - b.daysCoverage);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* FEATURE 2 — COSTING ENGINE */
const getCosting = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const bom = await BillOfMaterials.findOne({ finishedProduct: productId }).populate("materials.product");
    if (!bom) return res.status(404).json({ error: "BOM not defined" });
    const purchases = await Purchase.find();
    let totalCost = 0;
    const breakdown = [];
    for (const mat of bom.materials) {
      // Get latest purchase price (FIFO: oldest first, but use latest price)
      let unitPrice = 0;
      for (const pur of purchases) {
        for (const item of pur.items) {
          if (item.product.toString() === mat.product._id.toString() && item.purchasePrice > 0) unitPrice = item.purchasePrice;
        }
      }
      const cost = mat.quantityRequired * unitPrice;
      totalCost += cost;
      breakdown.push({ material: mat.product.name, qtyRequired: mat.quantityRequired, unitPrice, cost });
    }
    // Get MRP from latest purchase of finished product
    let mrp = 0;
    for (const pur of purchases) { for (const item of pur.items) { if (item.product.toString() === productId && item.mrp > 0) mrp = item.mrp; } }
    res.json({ product: product.name, costPerUnit: parseFloat(totalCost.toFixed(2)), mrp, profit: parseFloat((mrp - totalCost).toFixed(2)), margin: mrp > 0 ? parseFloat(((mrp - totalCost) / mrp * 100).toFixed(1)) : 0, breakdown });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* FEATURE 3 — BUSINESS HEALTH SCORE */
const getHealthScore = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find();
    const requisitions = await PurchaseRequisition.find();
    const mfgOrders = await ManufacturingOrder.find();
    // Inventory Score: 100 - (stockout% * 100)
    let lowCount = 0;
    for (const p of products) { const s = getStock(purchases, p._id); if (s <= (p.reorderLevel || 10)) lowCount++; }
    const inventoryScore = products.length > 0 ? Math.round(100 - (lowCount / products.length * 100)) : 50;
    // Sales Score: based on having recent sales
    const recentBills = bills.filter(b => new Date(b.createdAt) >= new Date(Date.now() - 7 * 86400000));
    const salesScore = Math.min(100, Math.round((recentBills.length / Math.max(1, bills.length)) * 100 + 40));
    // Production Score: completion rate
    const completed = mfgOrders.filter(o => o.status === "Completed").length;
    const total = mfgOrders.length;
    const productionScore = total > 0 ? Math.round((completed / total) * 100) : 50;
    // Procurement Score: approval rate
    const approved = requisitions.filter(r => r.status === "Approved").length;
    const totalReq = requisitions.length;
    const procurementScore = totalReq > 0 ? Math.round((approved / totalReq) * 100) : 50;
    const healthScore = Math.round((inventoryScore + salesScore + productionScore + procurementScore) / 4);
    res.json({ healthScore, breakdown: { inventory: inventoryScore, sales: salesScore, production: productionScore, procurement: procurementScore } });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* FEATURE 4 — AUTO PRODUCTION PLANNING */
const getProductionPlan = async (req, res) => {
  try {
    const planningDays = parseInt(req.query.days) || 7;
    const finishedProducts = await Product.find({ itemType: "Finished" });
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const boms = await BillOfMaterials.find().populate("materials.product");
    const plans = [];
    for (const fp of finishedProducts) {
      const stock = getStock(purchases, fp._id);
      const sold7d = get7DaySales(bills, fp._id);
      const demandPerDay = sold7d / 7;
      const requiredTotal = Math.ceil(demandPerDay * planningDays);
      const suggestedProduction = Math.max(0, requiredTotal - stock);
      const bom = boms.find(b => b.finishedProduct.toString() === fp._id.toString());
      // Check material availability
      let feasible = true;
      const materials = [];
      if (bom && suggestedProduction > 0) {
        for (const mat of bom.materials) {
          const needed = mat.quantityRequired * suggestedProduction;
          const available = getStock(purchases, mat.product._id);
          if (available < needed) feasible = false;
          materials.push({ material: mat.product.name, needed, available, sufficient: available >= needed });
        }
      }
      plans.push({ productId: fp._id, product: fp.name, currentStock: stock, demandPerDay: parseFloat(demandPerDay.toFixed(1)), planningDays, requiredTotal, suggestedProduction, feasible, materials });
    }
    plans.sort((a, b) => b.suggestedProduction - a.suggestedProduction);
    res.json(plans);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* FEATURE 5 — SUPPLIER PERFORMANCE */
const getSupplierPerformance = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    const purchases = await Purchase.find().populate("supplier");
    const returns = await Return.find().populate("purchase");
    const result = [];
    for (const sup of suppliers) {
      let totalPurchasedQty = 0, totalReturnedQty = 0;
      const supPurchaseIds = [];
      purchases.forEach(p => { if (p.supplier?._id?.toString() === sup._id.toString()) { p.items.forEach(i => { totalPurchasedQty += i.quantity || 0; }); supPurchaseIds.push(p._id.toString()); } });
      returns.forEach(r => { if (supPurchaseIds.includes(r.purchase?._id?.toString())) totalReturnedQty += r.returnedQty || 0; });
      const returnRate = totalPurchasedQty > 0 ? parseFloat((totalReturnedQty / totalPurchasedQty * 100).toFixed(1)) : 0;
      const score = Math.round(100 - returnRate);
      let status = "Excellent";
      if (score < 60) status = "Poor";
      else if (score < 75) status = "Average";
      else if (score < 90) status = "Good";
      result.push({ supplierId: sup._id, supplier: sup.supplierName, totalPurchased: totalPurchasedQty, totalReturned: totalReturnedQty, returnRate, score, status });
    }
    result.sort((a, b) => b.score - a.score);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* FEATURE 6 — SMART REQUISITION PRIORITIZATION */
const getRequisitionPriority = async (req, res) => {
  try {
    const requisitions = await PurchaseRequisition.find({ status: "Pending" }).populate("product");
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const result = [];
    for (const req2 of requisitions) {
      if (!req2.product) continue;
      const stock = getStock(purchases, req2.product._id);
      const sold7d = get7DaySales(bills, req2.product._id);
      const dailyConsumption = sold7d / 7;
      const daysLeft = dailyConsumption > 0 ? Math.round(stock / dailyConsumption) : (stock > 0 ? 999 : 0);
      let priority = "Low", color = "success";
      if (daysLeft < 3) { priority = "High"; color = "error"; }
      else if (daysLeft < 7) { priority = "Medium"; color = "warning"; }
      result.push({ requisitionId: req2._id, requisitionNumber: req2.requisitionNumber, product: req2.product.name, productId: req2.product._id, quantity: req2.quantity, requestedBy: req2.requestedBy, daysLeft, priority, color, currentStock: stock, dailyConsumption: parseFloat(dailyConsumption.toFixed(1)) });
    }
    result.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

/* AUTO-SEED on startup */
const autoSeedData = async () => {
  try {
    const existingBills = await Bill.find();
    const existingPurchases = await Purchase.find();
    if (existingBills.length >= 5 && existingPurchases.length >= 4) { console.log("Auto-seed: sufficient data exists"); return; }
    console.log("Auto-seed: seeding demo data...");
    // Products
    const findOrCreate = async (name, data) => { let p = await Product.findOne({ name }); if (!p) p = await Product.create(data); return p; };
    const sugar = await findOrCreate("Sugar", { name: "Sugar", itemType: "Raw", reorderLevel: 15, specific: { weight: "1kg" } });
    const milk = await findOrCreate("Milk", { name: "Milk", itemType: "Raw", reorderLevel: 20, specific: { volume: "1L" } });
    const bottle = await findOrCreate("Bottle", { name: "Bottle", itemType: "Raw", reorderLevel: 50, specific: { volume: "500ml" } });
    const flour = await findOrCreate("Flour", { name: "Flour", itemType: "Raw", reorderLevel: 25, specific: { weight: "1kg" } });
    const juice = await findOrCreate("Mango Juice", { name: "Mango Juice", itemType: "Finished", reorderLevel: 10, specific: { flavor: "Mango", volume: "500ml" } });
    const cake = await findOrCreate("Vanilla Cake", { name: "Vanilla Cake", itemType: "Finished", reorderLevel: 5, specific: { flavor: "Vanilla", weight: "500g" } });
    // Suppliers
    let sup1 = await Supplier.findOne({ supplierName: "FreshMart Suppliers" });
    if (!sup1) sup1 = await Supplier.create({ supplierName: "FreshMart Suppliers", contactPerson: "Rahul Sharma", phone: "9876543210", email: "rahul@freshmart.com", address: "Mumbai", gstNumber: "GST-FM-001" });
    let sup2 = await Supplier.findOne({ supplierName: "PackCo Industries" });
    if (!sup2) sup2 = await Supplier.create({ supplierName: "PackCo Industries", contactPerson: "Priya Patel", phone: "9123456780", email: "priya@packco.com", address: "Pune", gstNumber: "GST-PC-002" });
    // Purchases
    const now = Date.now();
    if (existingPurchases.length < 4) {
      await Purchase.create({ supplier: sup1._id, purchaseDate: new Date(now - 10*86400000), status: "Completed", source: "Manual", items: [{ product: sugar._id, quantity: 100, purchasePrice: 40, discount: 0, mrp: 50, remainingQty: 12, expiryDate: new Date(now + 5*86400000) }], totalAmount: 4000 });
      await Purchase.create({ supplier: sup1._id, purchaseDate: new Date(now - 8*86400000), status: "Completed", source: "Manual", items: [{ product: milk._id, quantity: 200, purchasePrice: 30, discount: 5, mrp: 45, remainingQty: 140, expiryDate: new Date(now + 4*86400000) }], totalAmount: 6000 });
      await Purchase.create({ supplier: sup2._id, purchaseDate: new Date(now - 14*86400000), status: "Completed", source: "Manual", items: [{ product: bottle._id, quantity: 500, purchasePrice: 10, discount: 0, mrp: 15, remainingQty: 480 }], totalAmount: 5000 });
      await Purchase.create({ supplier: sup1._id, purchaseDate: new Date(now - 6*86400000), status: "Completed", source: "Manual", items: [{ product: flour._id, quantity: 150, purchasePrice: 35, discount: 0, mrp: 48, remainingQty: 120 }], totalAmount: 5250 });
      await Purchase.create({ supplier: sup2._id, purchaseDate: new Date(now - 5*86400000), status: "Completed", source: "Manual", items: [{ product: juice._id, quantity: 80, purchasePrice: 0, discount: 0, mrp: 25, remainingQty: 35 }], totalAmount: 0 });
    }
    // Bills
    if (existingBills.length < 5) {
      for (let i = 0; i < 10; i++) {
        const d = new Date(now - i * 86400000);
        const sq = Math.floor(Math.random() * 8) + 4;
        const mq = Math.floor(Math.random() * 5) + 2;
        const jq = Math.floor(Math.random() * 4) + 1;
        await Bill.create({ billNo: `AUTO-${Date.now()}-${i}`, customerName: `Customer ${i+1}`, paymentMethod: ["Cash","UPI","Card"][i%3], items: [
          { product: sugar._id, productName: "Sugar", quantity: sq, pricePerUnit: 50, discount: 0, discountedPrice: 50, total: 50*sq },
          { product: milk._id, productName: "Milk", quantity: mq, pricePerUnit: 45, discount: 5, discountedPrice: 42.75, total: 42.75*mq },
          { product: juice._id, productName: "Mango Juice", quantity: jq, pricePerUnit: 25, discount: 0, discountedPrice: 25, total: 25*jq },
        ], totalAmount: 50*sq + 42.75*mq + 25*jq, paidAmount: 50*sq + 42.75*mq + 25*jq, createdAt: d });
      }
    }
    // BOMs
    if (!(await BillOfMaterials.findOne({ finishedProduct: juice._id }))) {
      await BillOfMaterials.create({ finishedProduct: juice._id, materials: [{ product: sugar._id, quantityRequired: 2 }, { product: milk._id, quantityRequired: 3 }, { product: bottle._id, quantityRequired: 1 }] });
    }
    if (!(await BillOfMaterials.findOne({ finishedProduct: cake._id }))) {
      await BillOfMaterials.create({ finishedProduct: cake._id, materials: [{ product: flour._id, quantityRequired: 3 }, { product: sugar._id, quantityRequired: 1 }, { product: milk._id, quantityRequired: 2 }] });
    }
    // Requisitions
    if (!(await PurchaseRequisition.findOne({ status: "Pending", product: sugar._id }))) {
      await PurchaseRequisition.create({ requisitionNumber: `REQ-AUTO-${Date.now()}`, product: sugar._id, quantity: 50, requestedBy: "System", justification: "Critical low stock", status: "Pending" });
    }
    if (!(await PurchaseRequisition.findOne({ status: "Approved" }))) {
      await PurchaseRequisition.create({ requisitionNumber: `REQ-AUTO-${Date.now()+1}`, product: milk._id, quantity: 100, requestedBy: "Procurement Dept", justification: "Monthly restock", status: "Approved", approvedBy: "Manager", approvedAt: new Date() });
    }
    // Manufacturing orders
    if ((await ManufacturingOrder.countDocuments()) < 3) {
      await ManufacturingOrder.create({ product: juice._id, quantity: 20, status: "Completed" });
      await ManufacturingOrder.create({ product: juice._id, quantity: 15, status: "InProgress" });
      await ManufacturingOrder.create({ product: cake._id, quantity: 5, status: "Planned" });
      await ManufacturingOrder.create({ product: juice._id, quantity: 10, status: "Cancelled" });
    }
    // Returns (for supplier performance)
    const purchases2 = await Purchase.find({ supplier: sup2._id });
    if (purchases2.length > 0 && (await Return.countDocuments()) < 1) {
      await Return.create({ purchase: purchases2[0]._id, returnedQty: 20, expectedRefund: 200, actualRefund: 180 });
    }
    console.log("Auto-seed: demo data seeded successfully");
  } catch (e) { console.error("Auto-seed error:", e.message); }
};

module.exports = { getDemandSupply, getCosting, getHealthScore, getProductionPlan, getSupplierPerformance, getRequisitionPriority, autoSeedData };
