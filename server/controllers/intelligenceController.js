const {
  Product, Purchase, Bill, PurchaseRequisition,
  ManufacturingOrder, BillOfMaterials,
} = require("../models/models");

// ── Helpers ──
function getStock(purchases, pid) {
  let s = 0;
  purchases.forEach((p) => p.items.forEach((i) => {
    if (i.product.toString() === pid.toString()) s += i.remainingQty || 0;
  }));
  return s;
}

function getSalesInRange(bills, pid, startDate, endDate) {
  let qty = 0;
  bills.forEach((b) => {
    const d = new Date(b.createdAt);
    if (d >= startDate && d <= endDate) {
      b.items.forEach((i) => {
        const id = i.product?._id?.toString() || i.product?.toString();
        if (id === pid.toString()) qty += i.quantity || 0;
      });
    }
  });
  return qty;
}

function getDailySales(bills, pid, daysBack) {
  const result = {};
  const now = Date.now();
  for (let d = 0; d < daysBack; d++) {
    const dayStart = new Date(now - (d + 1) * 86400000);
    const dayEnd = new Date(now - d * 86400000);
    result[d] = getSalesInRange(bills, pid, dayStart, dayEnd);
  }
  return result;
}

// ──────────────────────────────────────────────
// 1️⃣  ROOT CAUSE ANALYSIS
//     GET /api/insights/root-cause
// ──────────────────────────────────────────────
const getRootCause = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const mfgOrders = await ManufacturingOrder.find();
    const requisitions = await PurchaseRequisition.find().populate("product");

    const now = new Date();
    const results = [];

    for (const product of products) {
      const stock = getStock(purchases, product._id);
      const reorder = product.reorderLevel || 10;
      if (stock > reorder) continue; // Only analyze low-stock products

      const causes = [];

      // 1. Demand spike — last 7d vs previous 7d
      const recent7d = getSalesInRange(bills, product._id, new Date(now - 7 * 86400000), now);
      const prev7d = getSalesInRange(bills, product._id, new Date(now - 14 * 86400000), new Date(now - 7 * 86400000));
      const demandChange = prev7d > 0 ? Math.round(((recent7d - prev7d) / prev7d) * 100) : (recent7d > 0 ? 100 : 0);
      if (demandChange > 15) {
        causes.push(`Demand increased by ${demandChange}% (${prev7d} → ${recent7d} units in 7 days)`);
      }

      // 2. Production gap — manufacturing < demand
      let produced = 0;
      mfgOrders.forEach((o) => {
        if (o.product.toString() === product._id.toString() && o.status === "Completed")
          produced += o.quantity;
      });
      const demandPerDay = recent7d / 7;
      if (demandPerDay > 0 && produced < recent7d) {
        causes.push(`Production (${produced} units) is below 7-day demand (${recent7d} units)`);
      }

      // 3. Requisition delay
      const productReqs = requisitions.filter(
        (r) => r.product?._id?.toString() === product._id.toString()
      );
      for (const r of productReqs) {
        if (r.status === "Approved" && r.approvedAt && r.createdAt) {
          const delayDays = Math.round((new Date(r.approvedAt) - new Date(r.createdAt)) / 86400000);
          if (delayDays >= 1) {
            causes.push(`Requisition ${r.requisitionNumber} was delayed by ${delayDays} day(s)`);
          }
        }
        if (r.status === "Pending") {
          causes.push(`Requisition ${r.requisitionNumber} is still pending approval`);
        }
      }

      if (causes.length === 0) causes.push("Naturally low stock — no specific anomaly detected");

      results.push({
        product: product.name,
        productId: product._id,
        issue: stock === 0 ? "Stockout" : "Stockout risk",
        stock,
        reorderLevel: reorder,
        causes,
      });
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 2️⃣  SYSTEM STORY MODE
//     GET /api/insights/story
// ──────────────────────────────────────────────
const getStory = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const requisitions = await PurchaseRequisition.find({ status: "Pending" });
    const mfgOrders = await ManufacturingOrder.find();

    const now = new Date();
    const summary = [];

    // 1. Sales trend
    let totalRecent = 0, totalPrev = 0;
    for (const p of products) {
      totalRecent += getSalesInRange(bills, p._id, new Date(now - 7 * 86400000), now);
      totalPrev += getSalesInRange(bills, p._id, new Date(now - 14 * 86400000), new Date(now - 7 * 86400000));
    }
    if (totalPrev > 0) {
      const change = Math.round(((totalRecent - totalPrev) / totalPrev) * 100);
      summary.push(change >= 0
        ? `📈 Sales increased by ${change}% this week (${totalRecent} units vs ${totalPrev} last week)`
        : `📉 Sales decreased by ${Math.abs(change)}% this week (${totalRecent} units vs ${totalPrev} last week)`
      );
    } else if (totalRecent > 0) {
      summary.push(`📈 ${totalRecent} units sold this week — first week of activity`);
    }

    // 2. Top seller
    let topProduct = null, topQty = 0;
    for (const p of products) {
      const q = getSalesInRange(bills, p._id, new Date(now - 7 * 86400000), now);
      if (q > topQty) { topQty = q; topProduct = p.name; }
    }
    if (topProduct) summary.push(`🏆 ${topProduct} is the top seller with ${topQty} units this week`);

    // 3. Stock alerts
    for (const p of products) {
      const stock = getStock(purchases, p._id);
      const demandPerDay = getSalesInRange(bills, p._id, new Date(now - 7 * 86400000), now) / 7;
      if (demandPerDay > 0) {
        const daysLeft = Math.round(stock / demandPerDay);
        if (daysLeft <= 5) summary.push(`⚠️ ${p.name} stock will run out in ~${daysLeft} day(s)`);
      }
    }

    // 4. Requisitions
    if (requisitions.length > 0)
      summary.push(`📋 ${requisitions.length} requisition(s) pending approval`);

    // 5. Production
    const active = mfgOrders.filter((o) => o.status === "InProgress").length;
    const planned = mfgOrders.filter((o) => o.status === "Planned").length;
    if (active > 0 || planned > 0)
      summary.push(`🏭 ${active} production order(s) in progress, ${planned} planned`);

    // 6. Completed manufacturing this week
    const completedThisWeek = mfgOrders.filter(
      (o) => o.status === "Completed" && new Date(o.updatedAt) >= new Date(now - 7 * 86400000)
    ).length;
    if (completedThisWeek > 0)
      summary.push(`✅ ${completedThisWeek} manufacturing order(s) completed this week`);

    res.json({ summary, generatedAt: now });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 3️⃣  ANOMALY DETECTOR
//     GET /api/insights/anomalies
// ──────────────────────────────────────────────
const getAnomalies = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");

    const now = new Date();
    const anomalies = [];

    for (const product of products) {
      const stock = getStock(purchases, product._id);
      const dailySales = getDailySales(bills, product._id, 14);
      const last7Avg = Object.values(dailySales).slice(0, 7).reduce((a, b) => a + b, 0) / 7;
      const todaySales = dailySales[0] || 0;
      const recent7d = Object.values(dailySales).slice(0, 7).reduce((a, b) => a + b, 0);
      const demandPerDay = recent7d / 7;

      // Rule 1: Sales spike — today > 2× average
      if (todaySales > 0 && last7Avg > 0 && todaySales > 2 * last7Avg) {
        anomalies.push({
          type: "Sales Spike",
          severity: "warning",
          product: product.name,
          message: `${product.name} sales unusually high today (${todaySales} vs avg ${last7Avg.toFixed(1)}/day)`,
        });
      }

      // Rule 2: Overstock — stock > 3× 30-day demand
      if (demandPerDay > 0 && stock > 3 * demandPerDay * 30) {
        anomalies.push({
          type: "Overstock",
          severity: "info",
          product: product.name,
          message: `${product.name} has excess stock (${stock} units vs ~${Math.round(demandPerDay * 30)} monthly demand)`,
        });
      }

      // Rule 3: No sales for 7 days despite stock
      if (recent7d === 0 && stock > 0) {
        anomalies.push({
          type: "No Sales",
          severity: "warning",
          product: product.name,
          message: `${product.name} has ${stock} units in stock but zero sales in 7 days`,
        });
      }

      // Rule 4: High purchase despite high stock
      let recentPurchaseQty = 0;
      purchases.forEach((p) => {
        if (new Date(p.purchaseDate) >= new Date(now - 7 * 86400000)) {
          p.items.forEach((i) => {
            if (i.product.toString() === product._id.toString()) recentPurchaseQty += i.quantity;
          });
        }
      });
      if (recentPurchaseQty > 0 && stock > (product.reorderLevel || 10) * 3) {
        anomalies.push({
          type: "Unnecessary Purchase",
          severity: "info",
          product: product.name,
          message: `${product.name}: Purchased ${recentPurchaseQty} recently despite high stock (${stock} units)`,
        });
      }
    }

    res.json(anomalies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 4️⃣  INVENTORY AGING
//     GET /api/insights/aging
// ──────────────────────────────────────────────
const getAging = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();

    const now = Date.now();
    const results = [];

    for (const product of products) {
      const aging = { "0-7": 0, "7-30": 0, "30+": 0 };
      let total = 0;

      purchases.forEach((p) => {
        p.items.forEach((i) => {
          if (i.product.toString() === product._id.toString() && i.remainingQty > 0) {
            const daysOld = Math.floor((now - new Date(p.purchaseDate).getTime()) / 86400000);
            if (daysOld <= 7) aging["0-7"] += i.remainingQty;
            else if (daysOld <= 30) aging["7-30"] += i.remainingQty;
            else aging["30+"] += i.remainingQty;
            total += i.remainingQty;
          }
        });
      });

      if (total > 0) {
        results.push({
          product: product.name,
          productId: product._id,
          aging,
          total,
        });
      }
    }

    results.sort((a, b) => b.aging["30+"] - a.aging["30+"]); // Oldest first
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 5️⃣  ACTION IMPACT PREVIEW
//     POST /api/insights/impact-preview
// ──────────────────────────────────────────────
const getImpactPreview = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) return res.status(400).json({ error: "productId and quantity required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const bom = await BillOfMaterials.findOne({ finishedProduct: productId }).populate("materials.product");
    if (!bom) return res.json({ materials: [], profitEstimate: 0, warnings: ["No BOM found for this product"] });

    const purchases = await Purchase.find();
    const materials = [];
    const warnings = [];
    let totalCost = 0;

    for (const mat of bom.materials) {
      const required = mat.quantityRequired * quantity;
      let available = 0;
      let unitPrice = 0;
      purchases.forEach((p) => p.items.forEach((i) => {
        if (i.product.toString() === mat.product._id.toString()) {
          available += i.remainingQty || 0;
          if (i.purchasePrice > 0) unitPrice = i.purchasePrice;
        }
      }));

      const status = available >= required ? "Sufficient" : "Shortage";
      if (status === "Shortage") warnings.push(`${mat.product.name} shortage: need ${required}, have ${available}`);

      totalCost += unitPrice * required;
      materials.push({
        product: mat.product.name,
        required,
        available,
        status,
        unitPrice,
        cost: unitPrice * required,
      });
    }

    // Get MRP for profit estimate
    let mrp = 0;
    purchases.forEach((p) => p.items.forEach((i) => {
      if (i.product.toString() === productId && i.mrp > 0) mrp = i.mrp;
    }));
    // Fallback to bills
    if (mrp === 0) {
      const bills = await Bill.find({ "items.product": productId });
      for (const b of bills) {
        for (const item of b.items) {
          const id = item.product?._id?.toString() || item.product?.toString();
          if (id === productId && item.pricePerUnit > 0) mrp = item.pricePerUnit;
        }
      }
    }

    const revenue = mrp * quantity;
    const profitEstimate = parseFloat((revenue - totalCost).toFixed(2));

    res.json({
      product: product.name,
      quantity,
      materials,
      totalCost: parseFloat(totalCost.toFixed(2)),
      revenue,
      profitEstimate,
      margin: revenue > 0 ? parseFloat((((revenue - totalCost) / revenue) * 100).toFixed(1)) : 0,
      warnings,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ──────────────────────────────────────────────
// 6️⃣  TOP RISK PRODUCTS
//     GET /api/insights/risk
// ──────────────────────────────────────────────
const getRiskProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");

    const now = new Date();
    const results = [];

    for (const product of products) {
      const stock = getStock(purchases, product._id);
      const recent7d = getSalesInRange(bills, product._id, new Date(now - 7 * 86400000), now);
      const demandPerDay = recent7d / 7;
      const reorder = product.reorderLevel || 10;

      // Risk formula
      const stockDeficit = Math.max(0, reorder - stock);
      const riskScore = Math.min(100, Math.round(
        (stockDeficit / Math.max(reorder, 1)) * 50 +
        (demandPerDay * 5)
      ));

      if (riskScore > 10) {
        let level = "Low";
        if (riskScore >= 70) level = "High";
        else if (riskScore >= 40) level = "Medium";

        results.push({
          product: product.name,
          productId: product._id,
          riskScore,
          level,
          stock,
          demandPerDay: parseFloat(demandPerDay.toFixed(1)),
          reorderLevel: reorder,
        });
      }
    }

    results.sort((a, b) => b.riskScore - a.riskScore);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getRootCause,
  getStory,
  getAnomalies,
  getAging,
  getImpactPreview,
  getRiskProducts,
};
