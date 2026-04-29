const {
  Product,
  Purchase,
  Bill,
  PurchaseRequisition,
  ManufacturingOrder,
  BillOfMaterials,
  Supplier,
  Return,
} = require("../models/models");

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function getStock(purchases, productId) {
  let s = 0;
  purchases.forEach((p) =>
    p.items.forEach((i) => {
      if (i.product.toString() === productId.toString()) s += i.remainingQty || 0;
    })
  );
  return s;
}

function get7DaySales(bills, productId) {
  const sevenAgo = new Date(Date.now() - 7 * 86400000);
  let qty = 0;
  bills.forEach((b) => {
    if (new Date(b.createdAt) >= sevenAgo) {
      b.items.forEach((i) => {
        const id = i.product?._id?.toString() || i.product?.toString();
        if (id === productId.toString()) qty += i.quantity || 0;
      });
    }
  });
  return qty;
}

// ──────────────────────────────────────────────
// 1️⃣  RECOMMENDED ACTIONS
//     GET /api/insights/recommendations
// ──────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const requisitions = await PurchaseRequisition.find({ status: "Pending" }).populate("product");

    const recommendations = [];

    for (const product of products) {
      const stock = getStock(purchases, product._id);
      const sold7d = get7DaySales(bills, product._id);
      const demandPerDay = sold7d / 7;

      // Rule 1 — Low Stock
      if (stock < (product.reorderLevel || 10)) {
        recommendations.push({
          type: "critical",
          icon: "⚠️",
          message: `Approve requisition for ${product.name}`,
          reason: `Stock (${stock}) is below reorder level (${product.reorderLevel || 10})`,
          product: product.name,
          productId: product._id,
          action: "approve_requisition",
        });
      }

      // Rule 2 — Demand > Supply  (3-day demand exceeds current stock)
      if (demandPerDay > 0 && demandPerDay * 3 > stock) {
        recommendations.push({
          type: "critical",
          icon: "🏭",
          message: `Start production for ${product.name}`,
          reason: `3-day demand (${Math.ceil(demandPerDay * 3)}) exceeds current stock (${stock})`,
          product: product.name,
          productId: product._id,
          action: "start_production",
        });
      }

      // Rule 3 — Overstock
      if (demandPerDay > 0 && stock > 3 * demandPerDay * 30) {
        recommendations.push({
          type: "info",
          icon: "✅",
          message: `Avoid purchasing ${product.name}`,
          reason: `Stock (${stock}) is over 3× the 30-day demand (~${Math.round(demandPerDay * 30)})`,
          product: product.name,
          productId: product._id,
          action: "hold_purchase",
        });
      }
    }

    // Pending requisition reminders
    for (const req2 of requisitions) {
      if (!req2.product) continue;
      recommendations.push({
        type: "suggestion",
        icon: "📋",
        message: `Review pending requisition for ${req2.product.name} (${req2.quantity} units)`,
        reason: `Requisition ${req2.requisitionNumber} is awaiting approval`,
        product: req2.product.name,
        productId: req2.product._id,
        action: "review_requisition",
      });
    }

    // Sort: critical → suggestion → info
    const order = { critical: 0, suggestion: 1, info: 2 };
    recommendations.sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));

    res.json(recommendations);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 2️⃣  DEMAND vs SUPPLY
//     GET /api/insights/demand-supply-v2
// ──────────────────────────────────────────────
const getDemandSupplyV2 = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");

    const result = [];
    for (const p of products) {
      const currentStock = getStock(purchases, p._id);
      const sold7d = get7DaySales(bills, p._id);
      const demandPerDay = parseFloat((sold7d / 7).toFixed(2));
      const daysLeft =
        demandPerDay > 0
          ? parseFloat((currentStock / demandPerDay).toFixed(1))
          : currentStock > 0
          ? 999
          : 0;
      let status = "Balanced";
      if (daysLeft <= 3) status = "Shortage";
      else if (daysLeft <= 7) status = "At Risk";

      if (currentStock > 0 || sold7d > 0) {
        result.push({
          product: p.name,
          productId: p._id,
          demandPerDay,
          currentStock,
          daysLeft,
          sold7Days: sold7d,
          status,
        });
      }
    }
    result.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 3️⃣  PRODUCTION SUGGESTION ENGINE
//     GET /api/insights/production-plan-v2
// ──────────────────────────────────────────────
const getProductionPlanV2 = async (req, res) => {
  try {
    const finishedProducts = await Product.find({ itemType: "Finished" });
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const boms = await BillOfMaterials.find().populate("materials.product");

    const plans = [];
    for (const fp of finishedProducts) {
      const stock = getStock(purchases, fp._id);
      const sold7d = get7DaySales(bills, fp._id);
      const demandPerDay = sold7d / 7;
      const requiredFor5Days = Math.ceil(demandPerDay * 5);
      const suggestedProduction = Math.max(0, requiredFor5Days - stock);

      const bom = boms.find(
        (b) => b.finishedProduct.toString() === fp._id.toString()
      );

      let feasible = true;
      const materials = [];
      if (bom && suggestedProduction > 0) {
        for (const mat of bom.materials) {
          const needed = mat.quantityRequired * suggestedProduction;
          const available = getStock(purchases, mat.product._id);
          if (available < needed) feasible = false;
          materials.push({
            material: mat.product.name,
            needed,
            available,
            sufficient: available >= needed,
          });
        }
      }

      plans.push({
        product: fp.name,
        productId: fp._id,
        currentStock: stock,
        demandPerDay: parseFloat(demandPerDay.toFixed(1)),
        suggestedProduction,
        feasible,
        materials,
      });
    }
    plans.sort((a, b) => b.suggestedProduction - a.suggestedProduction);
    res.json(plans);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 4️⃣  EXCEPTION DASHBOARD
//     GET /api/insights/exceptions-v2
// ──────────────────────────────────────────────
const getExceptionsV2 = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find().populate("items.product");
    const requisitions = await PurchaseRequisition.find({
      status: "Pending",
    }).populate("product");

    // Low Stock
    const lowStock = [];
    for (const product of products) {
      let totalStock = 0;
      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          const itemId =
            item.product?._id?.toString() || item.product?.toString();
          if (itemId === product._id.toString())
            totalStock += item.remainingQty || 0;
        });
      });
      if (totalStock <= (product.reorderLevel || 10)) {
        lowStock.push({
          product: product.name,
          productId: product._id,
          stock: totalStock,
          reorderLevel: product.reorderLevel || 10,
          severity: "critical",
        });
      }
    }

    // Expiring Products (within 7 days)
    const now = new Date();
    const sevenDays = new Date();
    sevenDays.setDate(now.getDate() + 7);

    const expiring = [];
    purchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        if (
          item.expiryDate &&
          item.remainingQty > 0 &&
          new Date(item.expiryDate) >= now &&
          new Date(item.expiryDate) <= sevenDays
        ) {
          const daysLeft = Math.ceil(
            (new Date(item.expiryDate) - now) / 86400000
          );
          expiring.push({
            product: item.product?.name || "Unknown",
            productId: item.product?._id || item.product,
            daysLeft,
            remainingQty: item.remainingQty,
            expiryDate: item.expiryDate,
            severity: daysLeft <= 3 ? "critical" : "warning",
          });
        }
      });
    });

    // Pending Requisitions
    const pendingRequisitions = requisitions.map((r) => ({
      requisitionNumber: r.requisitionNumber,
      product: r.product?.name || "Unknown",
      quantity: r.quantity,
      requestedBy: r.requestedBy,
      severity: "warning",
    }));

    const totalExceptions =
      lowStock.length + expiring.length + pendingRequisitions.length;

    res.json({
      lowStock,
      expiring,
      pendingRequisitions,
      totalExceptions,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 5️⃣  COST + PROFIT PANEL
//     GET /api/insights/costing-all
// ──────────────────────────────────────────────
const getCostingAll = async (req, res) => {
  try {
    const finishedProducts = await Product.find({ itemType: "Finished" });
    const purchases = await Purchase.find();
    const boms = await BillOfMaterials.find().populate("materials.product");

    const result = [];
    for (const fp of finishedProducts) {
      const bom = boms.find(
        (b) => b.finishedProduct.toString() === fp._id.toString()
      );
      if (!bom) continue;

      let totalCost = 0;
      const breakdown = [];
      for (const mat of bom.materials) {
        let unitPrice = 0;
        for (const pur of purchases) {
          for (const item of pur.items) {
            if (
              item.product.toString() === mat.product._id.toString() &&
              item.purchasePrice > 0
            )
              unitPrice = item.purchasePrice;
          }
        }
        const cost = mat.quantityRequired * unitPrice;
        totalCost += cost;
        breakdown.push({
          material: mat.product.name,
          qtyRequired: mat.quantityRequired,
          unitPrice,
          cost,
        });
      }

      // Get MRP from latest purchase of finished product
      let mrp = 0;
      for (const pur of purchases) {
        for (const item of pur.items) {
          if (item.product.toString() === fp._id.toString() && item.mrp > 0)
            mrp = item.mrp;
        }
      }

      // Fallback: check if the finished product was sold — use selling price
      if (mrp === 0) {
        const bills = await Bill.find({ "items.product": fp._id });
        for (const bill of bills) {
          for (const item of bill.items) {
            const itemId =
              item.product?._id?.toString() || item.product?.toString();
            if (itemId === fp._id.toString() && item.pricePerUnit > 0)
              mrp = item.pricePerUnit;
          }
        }
      }

      const profit = parseFloat((mrp - totalCost).toFixed(2));
      const margin =
        mrp > 0
          ? parseFloat((((mrp - totalCost) / mrp) * 100).toFixed(1))
          : 0;

      result.push({
        product: fp.name,
        productId: fp._id,
        cost: parseFloat(totalCost.toFixed(2)),
        mrp,
        profit,
        margin,
        breakdown,
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 📊  DEMO DATA SEED
//     POST /api/demo/seed
// ──────────────────────────────────────────────
const seedDemoData = async (req, res) => {
  try {
    const log = await runDemoSeed();
    res.json({ message: "Demo data seeded successfully", ...log });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

async function runDemoSeed() {
  const log = { created: [], skipped: [] };

  // Helper
  const findOrCreate = async (name, data) => {
    let p = await Product.findOne({ name });
    if (!p) {
      p = await Product.create(data);
      log.created.push(`Product: ${name}`);
    } else {
      log.skipped.push(`Product: ${name} (exists)`);
    }
    return p;
  };

  // ── 1. Products ──
  const sugar = await findOrCreate("Sugar", {
    name: "Sugar",
    itemType: "Raw",
    reorderLevel: 15,
    specific: { weight: "1kg" },
  });
  const bottle = await findOrCreate("Bottle", {
    name: "Bottle",
    itemType: "Raw",
    reorderLevel: 50,
    specific: { volume: "500ml" },
  });
  const mangoExtract = await findOrCreate("Mango Extract", {
    name: "Mango Extract",
    itemType: "Raw",
    reorderLevel: 20,
    specific: { flavor: "Mango", volume: "500ml" },
  });
  const mangoJuice = await findOrCreate("Mango Juice", {
    name: "Mango Juice",
    itemType: "Finished",
    reorderLevel: 10,
    specific: { flavor: "Mango", volume: "500ml" },
  });

  // Keep existing products (Milk, Flour, Vanilla Cake) if present — don't touch them

  // ── 2. Supplier ──
  let sup = await Supplier.findOne({ supplierName: "FreshMart Suppliers" });
  if (!sup) {
    sup = await Supplier.create({
      supplierName: "FreshMart Suppliers",
      contactPerson: "Rahul Sharma",
      phone: "9876543210",
      email: "rahul@freshmart.com",
      address: "Mumbai",
      gstNumber: "GST-FM-001",
    });
    log.created.push("Supplier: FreshMart Suppliers");
  }

  // ── 3. Purchases ──
  const now = Date.now();

  // Check if we already have demo purchases for these products
  const existingSugarPurchase = await Purchase.findOne({
    "items.product": sugar._id,
    source: "Manual",
  });

  if (!existingSugarPurchase) {
    // Sugar → LOW stock (triggers low-stock alert)
    await Purchase.create({
      supplier: sup._id,
      purchaseDate: new Date(now - 10 * 86400000),
      status: "Completed",
      source: "Manual",
      items: [
        {
          product: sugar._id,
          quantity: 100,
          purchasePrice: 40,
          discount: 0,
          mrp: 50,
          remainingQty: 8,
          expiryDate: new Date(now + 4 * 86400000),
        },
      ],
      totalAmount: 4000,
    });
    log.created.push("Purchase: Sugar (LOW stock, expiring in 4 days)");

    // Bottle → HIGH stock (triggers overstock)
    await Purchase.create({
      supplier: sup._id,
      purchaseDate: new Date(now - 35 * 86400000), // 35 days ago for aging 30+
      status: "Completed",
      source: "Manual",
      items: [
        {
          product: bottle._id,
          quantity: 300,
          purchasePrice: 10,
          discount: 0,
          mrp: 15,
          remainingQty: 290,
        },
      ],
      totalAmount: 3000,
    });
    // Bottle → recent purchase (for aging 0-7d + unnecessary purchase anomaly)
    await Purchase.create({
      supplier: sup._id,
      purchaseDate: new Date(now - 3 * 86400000),
      status: "Completed",
      source: "Manual",
      items: [
        {
          product: bottle._id,
          quantity: 200,
          purchasePrice: 10,
          discount: 0,
          mrp: 15,
          remainingQty: 200,
        },
      ],
      totalAmount: 2000,
    });
    log.created.push("Purchase: Bottle (HIGH stock, split old + recent for aging)");

    // Mango Extract → MEDIUM stock
    await Purchase.create({
      supplier: sup._id,
      purchaseDate: new Date(now - 8 * 86400000),
      status: "Completed",
      source: "Manual",
      items: [
        {
          product: mangoExtract._id,
          quantity: 150,
          purchasePrice: 25,
          discount: 0,
          mrp: 40,
          remainingQty: 80,
          expiryDate: new Date(now + 20 * 86400000),
        },
      ],
      totalAmount: 3750,
    });
    log.created.push("Purchase: Mango Extract (MEDIUM stock)");

    // Mango Juice finished goods purchase (for MRP reference)
    await Purchase.create({
      supplier: sup._id,
      purchaseDate: new Date(now - 5 * 86400000),
      status: "Completed",
      source: "Manual",
      items: [
        {
          product: mangoJuice._id,
          quantity: 50,
          purchasePrice: 0,
          discount: 0,
          mrp: 25,
          remainingQty: 15,
        },
      ],
      totalAmount: 0,
    });
    log.created.push("Purchase: Mango Juice (finished goods, low remaining)");
  } else {
    log.skipped.push("Purchases: already exist");
  }

  // ── 4. Bills (Sales) — high sales for Mango Juice ──
  const existingDemoBills = await Bill.find({
    billNo: { $regex: /^DEMO-SEED/ },
  });
  if (existingDemoBills.length < 7) {
    // Regular sales last 7 days
    for (let i = 0; i < 10; i++) {
      const d = new Date(now - i * 86400000);
      const juiceQty = Math.floor(Math.random() * 6) + 5; // 5-10 per bill
      const sugarQty = Math.floor(Math.random() * 5) + 3;

      await Bill.create({
        billNo: `DEMO-SEED-${Date.now()}-${i}`,
        customerName: `Customer ${i + 1}`,
        paymentMethod: ["Cash", "UPI", "Card"][i % 3],
        items: [
          {
            product: mangoJuice._id,
            quantity: juiceQty,
            pricePerUnit: 25,
            discount: 0,
            discountedPrice: 25,
            total: 25 * juiceQty,
          },
          {
            product: sugar._id,
            quantity: sugarQty,
            pricePerUnit: 50,
            discount: 0,
            discountedPrice: 50,
            total: 50 * sugarQty,
          },
        ],
        totalAmount: 25 * juiceQty + 50 * sugarQty,
        paidAmount: 25 * juiceQty + 50 * sugarQty,
        createdAt: d,
      });
    }

    // Spike day (today) — extra-high sales to trigger anomaly
    await Bill.create({
      billNo: `DEMO-SEED-SPIKE-${Date.now()}`,
      customerName: "Bulk Buyer",
      paymentMethod: "UPI",
      items: [
        {
          product: mangoJuice._id,
          quantity: 25, // 3x normal → triggers spike
          pricePerUnit: 25,
          discount: 0,
          discountedPrice: 25,
          total: 625,
        },
      ],
      totalAmount: 625,
      paidAmount: 625,
      createdAt: new Date(),
    });

    // Previous week sales (lower, for demand comparison)
    for (let i = 8; i < 12; i++) {
      const d = new Date(now - i * 86400000);
      await Bill.create({
        billNo: `DEMO-SEED-OLD-${Date.now()}-${i}`,
        customerName: `Old Customer ${i}`,
        paymentMethod: "Cash",
        items: [
          {
            product: mangoJuice._id,
            quantity: 3, // lower than recent → shows demand increase
            pricePerUnit: 25,
            discount: 0,
            discountedPrice: 25,
            total: 75,
          },
        ],
        totalAmount: 75,
        paidAmount: 75,
        createdAt: d,
      });
    }

    log.created.push("Bills: 10 regular + 1 spike + 4 old-week sales");
  } else {
    log.skipped.push("Bills: already exist");
  }

  // ── 5. BOM: Mango Juice ──
  let bom = await BillOfMaterials.findOne({
    finishedProduct: mangoJuice._id,
  });
  if (!bom) {
    bom = await BillOfMaterials.create({
      finishedProduct: mangoJuice._id,
      materials: [
        { product: mangoExtract._id, quantityRequired: 2 },
        { product: sugar._id, quantityRequired: 1 },
        { product: bottle._id, quantityRequired: 1 },
      ],
    });
    log.created.push("BOM: Mango Juice (2× Mango Extract, 1× Sugar, 1× Bottle)");
  } else {
    log.skipped.push("BOM: Mango Juice (exists)");
  }

  // ── 6. Requisitions ──
  const pendingReq = await PurchaseRequisition.findOne({
    status: "Pending",
    product: sugar._id,
  });
  if (!pendingReq) {
    await PurchaseRequisition.create({
      requisitionNumber: `REQ-DEMO-${Date.now()}`,
      product: sugar._id,
      quantity: 50,
      requestedBy: "System Auto-Detect",
      justification: "Critical low stock — Sugar below reorder level",
      status: "Pending",
    });
    log.created.push("Requisition: Pending for Sugar (50 units)");
  }

  const approvedReq = await PurchaseRequisition.findOne({
    status: "Approved",
    product: mangoExtract._id,
  });
  if (!approvedReq) {
    await PurchaseRequisition.create({
      requisitionNumber: `REQ-DEMO-${Date.now() + 1}`,
      product: mangoExtract._id,
      quantity: 100,
      requestedBy: "Procurement Dept",
      justification: "Monthly restock for Mango Extract",
      status: "Approved",
      approvedBy: "Manager",
      approvedAt: new Date(),
    });
    log.created.push("Requisition: Approved for Mango Extract (100 units)");
  }

  // Mango Juice requisition (for traceability timeline completeness)
  const juiceReq = await PurchaseRequisition.findOne({
    product: mangoJuice._id,
  });
  if (!juiceReq) {
    await PurchaseRequisition.create({
      requisitionNumber: `REQ-101`,
      product: mangoJuice._id,
      quantity: 50,
      requestedBy: "Production Dept",
      justification: "High demand forecast — need to restock Mango Juice",
      status: "Approved",
      approvedBy: "Admin",
      approvedAt: new Date(now - 12 * 86400000), // Day 1 — approved early
      createdAt: new Date(now - 14 * 86400000),  // Day 0 — created
    });
    log.created.push("Requisition: REQ-101 for Mango Juice (traceability)");
  }

  // ── 7. Manufacturing Orders ──
  if ((await ManufacturingOrder.countDocuments()) < 3) {
    await ManufacturingOrder.create({
      product: mangoJuice._id,
      quantity: 20,
      status: "Completed",
    });
    await ManufacturingOrder.create({
      product: mangoJuice._id,
      quantity: 15,
      status: "InProgress",
    });
    await ManufacturingOrder.create({
      product: mangoJuice._id,
      quantity: 10,
      status: "Planned",
    });
    log.created.push("Manufacturing: 3 orders for Mango Juice");
  }

  console.log("Demo seed completed:", log);
  return log;
}

// Auto-seed on startup (called from index.js)
const autoSeedDecision = async () => {
  try {
    // Check if decision demo data already exists
    const bills = await Bill.find({ billNo: { $regex: /^DEMO-SEED/ } });
    if (bills.length >= 7) {
      console.log("Decision auto-seed: data already exists, skipping");
      return;
    }
    console.log("Decision auto-seed: seeding demo data...");
    await runDemoSeed();
    console.log("Decision auto-seed: complete");
  } catch (e) {
    console.error("Decision auto-seed error:", e.message);
  }
};

module.exports = {
  getRecommendations,
  getDemandSupplyV2,
  getProductionPlanV2,
  getExceptionsV2,
  getCostingAll,
  seedDemoData,
  autoSeedDecision,
};
