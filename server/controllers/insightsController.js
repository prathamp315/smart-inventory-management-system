const {
  Product,
  Purchase,
  Bill,
  PurchaseRequisition,
  ManufacturingOrder,
  BillOfMaterials,
} = require("../models/models");

/* ===============================
   FEATURE 1 — CONSUMPTION-BASED FORECASTING
   GET /api/insights/consumption
================================ */

const getConsumptionForecast = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");

    // Determine date range from bills
    let minDate = new Date();
    let maxDate = new Date(0);
    bills.forEach((b) => {
      const d = new Date(b.createdAt);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });

    const daysRange = Math.max(
      1,
      Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))
    );

    const forecast = [];

    for (const product of products) {
      // Calculate total sold quantity from bills
      let totalSold = 0;
      bills.forEach((bill) => {
        bill.items.forEach((item) => {
          const itemProductId =
            item.product?._id?.toString() || item.product?.toString();
          if (itemProductId === product._id.toString()) {
            totalSold += item.quantity || 0;
          }
        });
      });

      // Calculate current stock from purchases
      let currentStock = 0;
      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.product.toString() === product._id.toString()) {
            currentStock += item.remainingQty || 0;
          }
        });
      });

      const dailyConsumption =
        totalSold > 0 ? parseFloat((totalSold / daysRange).toFixed(2)) : 0;
      const daysLeft =
        dailyConsumption > 0
          ? Math.round(currentStock / dailyConsumption)
          : currentStock > 0
          ? 999
          : 0;

      let status = "Healthy";
      if (daysLeft <= 3) status = "Critical";
      else if (daysLeft <= 7) status = "Warning";
      else if (daysLeft <= 14) status = "Low";

      // Only include products that have stock or consumption
      if (currentStock > 0 || totalSold > 0) {
        forecast.push({
          productId: product._id,
          product: product.name,
          currentStock,
          totalSold,
          dailyConsumption,
          daysLeft,
          status,
        });
      }
    }

    // Sort by daysLeft ascending (most critical first)
    forecast.sort((a, b) => a.daysLeft - b.daysLeft);

    res.json(forecast);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   FEATURE 2 — EXCEPTION DASHBOARD
   GET /api/insights/exceptions
================================ */

const getExceptions = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find().populate("items.product");
    const requisitions = await PurchaseRequisition.find({ status: "Pending" }).populate("product");
    const failedMfg = await ManufacturingOrder.find({ status: "Cancelled" }).populate("product");

    // 1. Low Stock
    const lowStock = [];
    for (const product of products) {
      let totalStock = 0;
      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.product?._id?.toString() === product._id.toString() ||
              item.product?.toString() === product._id.toString()) {
            totalStock += item.remainingQty || 0;
          }
        });
      });
      const reorderLevel = product.reorderLevel || 10;
      if (totalStock <= reorderLevel) {
        lowStock.push({
          productId: product._id,
          productName: product.name,
          totalStock,
          reorderLevel,
        });
      }
    }

    // 2. Near Expiry (within 7 days)
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
            (new Date(item.expiryDate) - now) / (1000 * 60 * 60 * 24)
          );
          expiring.push({
            productName: item.product?.name || "Unknown",
            productId: item.product?._id || item.product,
            expiryDate: item.expiryDate,
            daysLeft,
            remainingQty: item.remainingQty,
          });
        }
      });
    });

    // 3. Pending Requisitions
    const pendingRequisitions = requisitions.map((r) => ({
      requisitionNumber: r.requisitionNumber,
      productName: r.product?.name || "Unknown",
      quantity: r.quantity,
      requestedBy: r.requestedBy,
      createdAt: r.createdAt,
    }));

    // 4. Failed Manufacturing
    const failedManufacturing = failedMfg.map((o) => ({
      orderId: o._id,
      productName: o.product?.name || "Unknown",
      quantity: o.quantity,
      cancelledAt: o.updatedAt,
    }));

    res.json({
      lowStock,
      expiring,
      pendingRequisitions,
      failedManufacturing,
      summary: {
        lowStockCount: lowStock.length,
        expiringCount: expiring.length,
        pendingRequisitionsCount: pendingRequisitions.length,
        failedManufacturingCount: failedManufacturing.length,
        totalExceptions:
          lowStock.length +
          expiring.length +
          pendingRequisitions.length +
          failedManufacturing.length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   FEATURE 3 — BATCH TRACEABILITY
   GET /api/traceability/:productId
================================ */

const getTraceability = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find all purchase batches
    const purchases = await Purchase.find({
      "items.product": productId,
    })
      .populate("supplier")
      .sort({ purchaseDate: 1 });

    // Find manufacturing orders that used this product
    const boms = await BillOfMaterials.find({ "materials.product": productId });
    const finishedProductIds = boms.map((b) => b.finishedProduct.toString());
    const mfgOrders = await ManufacturingOrder.find({
      product: { $in: finishedProductIds },
      status: { $in: ["Completed", "InProgress"] },
    }).populate("product");

    // Find bills that sold this product
    const bills = await Bill.find({ "items.product": productId })
      .populate("items.product")
      .sort({ createdAt: 1 });

    // Build batch info
    const batches = [];
    purchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        if (item.product.toString() === productId) {
          const sold = item.quantity - item.remainingQty;
          // Estimate manufacturing usage
          let usedInManufacturing = 0;
          boms.forEach((bom) => {
            const mat = bom.materials.find(
              (m) => m.product.toString() === productId
            );
            if (mat) {
              mfgOrders.forEach((o) => {
                if (o.product._id.toString() === bom.finishedProduct.toString()) {
                  usedInManufacturing += mat.quantityRequired * o.quantity;
                }
              });
            }
          });

          batches.push({
            batchId: purchase._id.toString().slice(-8).toUpperCase(),
            purchaseId: purchase._id,
            purchaseDate: purchase.purchaseDate,
            supplier: purchase.supplier?.supplierName || "Unknown",
            purchasedQty: item.quantity,
            remainingQty: item.remainingQty,
            usedInManufacturing: Math.min(usedInManufacturing, item.quantity - item.remainingQty),
            sold: Math.max(0, sold - usedInManufacturing),
            expiryDate: item.expiryDate,
            purchasePrice: item.purchasePrice,
            mrp: item.mrp,
          });
        }
      });
    });

    // Sales history
    const salesHistory = [];
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        const itemProductId =
          item.product?._id?.toString() || item.product?.toString();
        if (itemProductId === productId) {
          salesHistory.push({
            billNo: bill.billNo,
            date: bill.createdAt,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            total: item.total,
          });
        }
      });
    });

    res.json({
      product: {
        _id: product._id,
        name: product.name,
        itemType: product.itemType,
      },
      batches,
      salesHistory,
      manufacturingOrders: mfgOrders.map((o) => ({
        orderId: o._id,
        finishedProduct: o.product?.name,
        quantity: o.quantity,
        status: o.status,
        date: o.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   FEATURE 4 — WHAT-IF SIMULATION
   POST /api/insights/simulate
================================ */

const simulateManufacturing = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Product and quantity are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const bom = await BillOfMaterials.findOne({ finishedProduct: productId })
      .populate("materials.product");

    if (!bom) {
      return res.status(404).json({ error: "BOM not defined for this product" });
    }

    const purchases = await Purchase.find();

    const materialsRequired = [];
    let canProduce = true;

    for (const mat of bom.materials) {
      const required = mat.quantityRequired * quantity;

      // Calculate available stock
      let available = 0;
      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.product.toString() === mat.product._id.toString()) {
            available += item.remainingQty || 0;
          }
        });
      });

      const sufficient = available >= required;
      const shortage = sufficient ? 0 : required - available;
      if (!sufficient) canProduce = false;

      materialsRequired.push({
        productId: mat.product._id,
        productName: mat.product.name,
        required,
        available,
        sufficient,
        shortage,
      });
    }

    res.json({
      product: product.name,
      quantity,
      materialsRequired,
      canProduce,
      message: canProduce
        ? "All materials are available. Production can proceed."
        : "Insufficient materials. Some raw materials need to be procured.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   FEATURE 5 — SMART INSIGHTS
   GET /api/insights/smart
================================ */

const getSmartInsights = async (req, res) => {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();
    const bills = await Bill.find().populate("items.product");
    const boms = await BillOfMaterials.find().populate("materials.product");
    const mfgOrders = await ManufacturingOrder.find({ status: { $in: ["Planned", "InProgress"] } }).populate("product");

    // Calculate date range
    let minDate = new Date();
    let maxDate = new Date(0);
    bills.forEach((b) => {
      const d = new Date(b.createdAt);
      if (d < minDate) minDate = d;
      if (d > maxDate) maxDate = d;
    });
    const daysRange = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));

    const insights = [];

    for (const product of products) {
      // Calculate stock
      let currentStock = 0;
      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.product.toString() === product._id.toString()) {
            currentStock += item.remainingQty || 0;
          }
        });
      });

      // Calculate consumption
      let totalSold = 0;
      bills.forEach((bill) => {
        bill.items.forEach((item) => {
          const itemProductId = item.product?._id?.toString() || item.product?.toString();
          if (itemProductId === product._id.toString()) {
            totalSold += item.quantity || 0;
          }
        });
      });

      const dailyConsumption = totalSold > 0 ? totalSold / daysRange : 0;
      const daysLeft = dailyConsumption > 0 ? Math.round(currentStock / dailyConsumption) : (currentStock > 0 ? 999 : 0);

      // Rule 1 — Reorder Suggestion
      if (daysLeft > 0 && daysLeft < 5) {
        insights.push({
          type: "reorder",
          severity: "critical",
          icon: "🔴",
          product: product.name,
          productId: product._id,
          message: `Reorder ${product.name} immediately — stock ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          detail: `Current stock: ${currentStock}, Daily usage: ${dailyConsumption.toFixed(1)}`,
        });
      } else if (daysLeft >= 5 && daysLeft <= 10) {
        insights.push({
          type: "reorder",
          severity: "warning",
          icon: "🟡",
          product: product.name,
          productId: product._id,
          message: `${product.name} stock is getting low — ${daysLeft} days remaining`,
          detail: `Current stock: ${currentStock}, Daily usage: ${dailyConsumption.toFixed(1)}`,
        });
      }

      // Rule 2 — Overstock Warning
      if (dailyConsumption > 0 && currentStock > 3 * dailyConsumption * 30) {
        insights.push({
          type: "overstock",
          severity: "info",
          icon: "📦",
          product: product.name,
          productId: product._id,
          message: `Overstock risk for ${product.name} — high stock, slow movement`,
          detail: `Current stock: ${currentStock}, Monthly usage: ~${Math.round(dailyConsumption * 30)}`,
        });
      }
    }

    // Rule 3 — Manufacturing Risk
    for (const order of mfgOrders) {
      const bom = boms.find((b) => b.finishedProduct.toString() === order.product._id.toString());
      if (!bom) continue;

      for (const mat of bom.materials) {
        const required = mat.quantityRequired * order.quantity;
        let available = 0;
        purchases.forEach((purchase) => {
          purchase.items.forEach((item) => {
            if (item.product.toString() === mat.product._id.toString()) {
              available += item.remainingQty || 0;
            }
          });
        });

        if (available < required) {
          insights.push({
            type: "manufacturing",
            severity: "warning",
            icon: "🏭",
            product: order.product.name,
            productId: order.product._id,
            message: `Production of ${order.product.name} may be delayed — insufficient ${mat.product.name}`,
            detail: `Required: ${required}, Available: ${available}`,
          });
        }
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    insights.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   SEED DUMMY DATA
   POST /api/insights/seed-dummy
================================ */

const seedDummyData = async (req, res) => {
  try {
    const results = { products: [], purchases: [], bills: [], boms: [], manufacturing: [], requisitions: [] };

    // Check if we already have enough data
    const existingProducts = await Product.find();
    const existingBills = await Bill.find();
    const existingPurchases = await Purchase.find();

    if (existingProducts.length >= 3 && existingBills.length >= 5 && existingPurchases.length >= 3) {
      return res.json({ message: "Sufficient data already exists. No seeding needed.", seeded: false });
    }

    // Create products if needed
    let sugar, milk, bottle, juice;

    sugar = await Product.findOne({ name: "Sugar" });
    if (!sugar) {
      sugar = await Product.create({ name: "Sugar", itemType: "Raw", reorderLevel: 15, specific: { weight: "1kg" } });
      results.products.push("Sugar");
    }

    milk = await Product.findOne({ name: "Milk" });
    if (!milk) {
      milk = await Product.create({ name: "Milk", itemType: "Raw", reorderLevel: 20, specific: { volume: "1L" } });
      results.products.push("Milk");
    }

    bottle = await Product.findOne({ name: "Bottle" });
    if (!bottle) {
      bottle = await Product.create({ name: "Bottle", itemType: "Raw", reorderLevel: 50, specific: { volume: "500ml" } });
      results.products.push("Bottle");
    }

    juice = await Product.findOne({ name: "Mango Juice" });
    if (!juice) {
      juice = await Product.create({ name: "Mango Juice", itemType: "Finished", reorderLevel: 10, specific: { flavor: "Mango", volume: "500ml" } });
      results.products.push("Mango Juice");
    }

    // Create supplier if none exists
    const { Supplier } = require("../models/models");
    let supplier = await Supplier.findOne();
    if (!supplier) {
      supplier = await Supplier.create({ supplierName: "Demo Supplier Co.", contactPerson: "John Doe", phone: "9876543210", email: "supplier@demo.com", address: "Demo Address", gstNumber: "GST123456" });
    }

    // Create purchase batches
    if (existingPurchases.length < 3) {
      const now = new Date();

      // Sugar purchase — low stock (will trigger alerts)
      await Purchase.create({
        supplier: supplier._id,
        purchaseDate: new Date(now - 10 * 24 * 60 * 60 * 1000),
        status: "Completed",
        source: "Manual",
        items: [{ product: sugar._id, quantity: 100, purchasePrice: 40, discount: 0, mrp: 50, remainingQty: 8, expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) }],
        totalAmount: 4000,
      });
      results.purchases.push("Sugar (low stock, near expiry)");

      // Milk purchase — normal stock
      await Purchase.create({
        supplier: supplier._id,
        purchaseDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
        status: "Completed",
        source: "Manual",
        items: [{ product: milk._id, quantity: 200, purchasePrice: 30, discount: 5, mrp: 45, remainingQty: 150, expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }],
        totalAmount: 6000,
      });
      results.purchases.push("Milk (normal stock, near expiry)");

      // Bottle purchase — excess stock
      await Purchase.create({
        supplier: supplier._id,
        purchaseDate: new Date(now - 14 * 24 * 60 * 60 * 1000),
        status: "Completed",
        source: "Manual",
        items: [{ product: bottle._id, quantity: 500, purchasePrice: 10, discount: 0, mrp: 15, remainingQty: 490 }],
        totalAmount: 5000,
      });
      results.purchases.push("Bottle (excess stock)");
    }

    // Create dummy bills for consumption data
    if (existingBills.length < 5) {
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const billDate = new Date(now - i * 24 * 60 * 60 * 1000);
        const billNo = `DEMO-${Date.now()}-${i}`;
        await Bill.create({
          billNo,
          customerName: `Demo Customer ${i + 1}`,
          paymentMethod: ["Cash", "UPI", "Card"][i % 3],
          items: [
            { product: sugar._id, productName: "Sugar", quantity: Math.floor(Math.random() * 8) + 5, pricePerUnit: 50, discount: 0, discountedPrice: 50, total: 50 * (Math.floor(Math.random() * 8) + 5) },
            { product: milk._id, productName: "Milk", quantity: Math.floor(Math.random() * 5) + 2, pricePerUnit: 45, discount: 5, discountedPrice: 42.75, total: 42.75 * (Math.floor(Math.random() * 5) + 2) },
          ],
          totalAmount: 500 + Math.floor(Math.random() * 300),
          paidAmount: 500 + Math.floor(Math.random() * 300),
          createdAt: billDate,
        });
      }
      results.bills.push("7 demo bills created over 7 days");
    }

    // Create BOM
    const existingBOM = await BillOfMaterials.findOne({ finishedProduct: juice._id });
    if (!existingBOM) {
      await BillOfMaterials.create({
        finishedProduct: juice._id,
        materials: [
          { product: sugar._id, quantityRequired: 2 },
          { product: milk._id, quantityRequired: 3 },
          { product: bottle._id, quantityRequired: 1 },
        ],
      });
      results.boms.push("Mango Juice BOM");
    }

    // Create a pending requisition
    const existingReq = await PurchaseRequisition.findOne({ status: "Pending", product: sugar._id });
    if (!existingReq) {
      await PurchaseRequisition.create({
        requisitionNumber: `REQ-DEMO-${Date.now()}`,
        product: sugar._id,
        quantity: 50,
        requestedBy: "System Demo",
        justification: "Urgent restock needed",
        status: "Pending",
      });
      results.requisitions.push("Pending requisition for Sugar");
    }

    // Create a cancelled manufacturing order
    const existingCancelled = await ManufacturingOrder.findOne({ status: "Cancelled", product: juice._id });
    if (!existingCancelled) {
      await ManufacturingOrder.create({
        product: juice._id,
        quantity: 10,
        status: "Cancelled",
      });
      results.manufacturing.push("Cancelled manufacturing order for Mango Juice");
    }

    res.json({
      message: "Dummy data seeded successfully",
      seeded: true,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   FEATURE 6 — TIMELINE EVENTS
   GET /api/traceability/:productId/timeline
================================ */

const getTimelineEvents = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const events = [];

    // 1. Requisitions for this product
    const requisitions = await PurchaseRequisition.find({ product: productId })
      .populate("product")
      .sort({ createdAt: 1 });

    for (const req2 of requisitions) {
      events.push({
        type: "Requisition",
        date: req2.createdAt,
        title: `Requisition ${req2.requisitionNumber} Created`,
        description: `Requested ${req2.quantity} units of ${product.name} — Status: ${req2.status}`,
        status: req2.status,
        meta: {
          requisitionNumber: req2.requisitionNumber,
          quantity: req2.quantity,
          requestedBy: req2.requestedBy,
          justification: req2.justification,
        },
      });

      if (req2.status === "Approved" && req2.approvedAt) {
        events.push({
          type: "Requisition",
          date: req2.approvedAt,
          title: `Requisition ${req2.requisitionNumber} Approved`,
          description: `Approved by ${req2.approvedBy || "Manager"} — ${req2.quantity} units of ${product.name}`,
          status: "Approved",
          meta: { requisitionNumber: req2.requisitionNumber, approvedBy: req2.approvedBy },
        });
      }
    }

    // 2. Purchases containing this product
    const purchases = await Purchase.find({ "items.product": productId })
      .populate("supplier")
      .sort({ purchaseDate: 1 });

    for (const purchase of purchases) {
      for (const item of purchase.items) {
        if (item.product.toString() === productId) {
          events.push({
            type: "Purchase",
            date: purchase.purchaseDate,
            title: "Stock Added — Purchase Completed",
            description: `Purchased ${item.quantity} units of ${product.name} at ₹${item.purchasePrice}/unit from ${purchase.supplier?.supplierName || "Unknown"}`,
            status: purchase.status,
            meta: {
              supplier: purchase.supplier?.supplierName,
              quantity: item.quantity,
              remainingQty: item.remainingQty,
              purchasePrice: item.purchasePrice,
              mrp: item.mrp,
              expiryDate: item.expiryDate,
            },
          });
        }
      }
    }

    // 3. Manufacturing orders for this product (as finished) or using it (as raw)
    // Check if product is a finished product in manufacturing
    const mfgAsFinished = await ManufacturingOrder.find({ product: productId })
      .populate("product")
      .sort({ createdAt: 1 });

    for (const order of mfgAsFinished) {
      const statusLabel = {
        Planned: "Production Planned",
        InProgress: "Production Started",
        Completed: "Production Completed",
        Cancelled: "Production Cancelled",
      };
      events.push({
        type: "Manufacturing",
        date: order.updatedAt || order.createdAt,
        title: statusLabel[order.status] || "Manufacturing Order",
        description: `${order.status === "Completed" ? "Produced" : order.status === "InProgress" ? "Producing" : order.status === "Planned" ? "Planning to produce" : "Cancelled production of"} ${order.quantity} units of ${product.name}`,
        status: order.status,
        meta: { orderId: order._id, quantity: order.quantity },
      });
    }

    // Also check if used as raw material
    const boms = await BillOfMaterials.find({ "materials.product": productId });
    if (boms.length > 0) {
      const finishedIds = boms.map((b) => b.finishedProduct.toString());
      const mfgAsRaw = await ManufacturingOrder.find({
        product: { $in: finishedIds },
        status: { $in: ["Completed", "InProgress"] },
      }).populate("product");

      for (const order of mfgAsRaw) {
        const bom = boms.find((b) => b.finishedProduct.toString() === order.product._id.toString());
        const mat = bom?.materials.find((m) => m.product.toString() === productId);
        const used = mat ? mat.quantityRequired * order.quantity : 0;
        events.push({
          type: "Manufacturing",
          date: order.updatedAt || order.createdAt,
          title: `Used in Production of ${order.product.name}`,
          description: `${used} units of ${product.name} consumed to produce ${order.quantity} units of ${order.product.name}`,
          status: order.status,
          meta: { orderId: order._id, quantity: used, finishedProduct: order.product.name },
        });
      }
    }

    // 4. Sales (Bills)
    const bills = await Bill.find({ "items.product": productId })
      .populate("items.product")
      .sort({ createdAt: 1 });

    for (const bill of bills) {
      for (const item of bill.items) {
        const itemId = item.product?._id?.toString() || item.product?.toString();
        if (itemId === productId) {
          events.push({
            type: "Sale",
            date: bill.createdAt,
            title: `Sales Recorded — ${bill.billNo}`,
            description: `Sold ${item.quantity} units of ${product.name} at ₹${item.pricePerUnit}/unit to ${bill.customerName || "Customer"}`,
            status: "Completed",
            meta: {
              billNo: bill.billNo,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              total: item.total,
              customer: bill.customerName,
            },
          });
        }
      }
    }

    // Sort by date ascending
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Flow summary (which stages have been completed)
    const flow = {
      requisition: events.some((e) => e.type === "Requisition"),
      purchase: events.some((e) => e.type === "Purchase"),
      manufacturing: events.some((e) => e.type === "Manufacturing"),
      sale: events.some((e) => e.type === "Sale"),
    };

    res.json({
      product: { _id: product._id, name: product.name, itemType: product.itemType },
      events,
      flow,
      totalEvents: events.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getConsumptionForecast,
  getExceptions,
  getTraceability,
  getTimelineEvents,
  simulateManufacturing,
  getSmartInsights,
  seedDummyData,
};

