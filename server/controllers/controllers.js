const {
  Product,
  Purchase,
  Supplier,
  Return,
  Bill,
  SyncLog,
  PurchaseRequisition,
  BillOfMaterials,
  ManufacturingOrder,
} = require("../models/models");

/* ===============================
   PRODUCT CONTROLLERS
================================ */

async function handleAddNewProduct(req, res) {
  try {
    const body = req.body;
    if (!body.name) throw new Error("Product name is compulsory");

    const result = await Product.create({
      name: body.name,
      itemType: body.itemType || "Raw",
      reorderLevel: body.reorderLevel || 10,
      specific: {
        flavor: body.specific?.flavor || null,
        color: body.specific?.color || null,
        weight: body.specific?.weight || null,
        volume: body.specific?.volume || null,
      },
    });

    res.status(201).json({
      msg: "Product created successfully",
      product: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function handleGetAllProducts(req, res) {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===============================
   SUPPLIER CONTROLLERS
================================ */

async function handleAddSupplier(req, res) {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function handleGetAllSuppliers(req, res) {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===============================
   PURCHASE CONTROLLERS
================================ */

async function handleAddNewPurchase(req, res) {
  try {
    const { supplier, items } = req.body;

    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists)
      return res.status(404).json({ error: "Supplier not found" });

    // validate products
    for (let item of items) {
      const productExists = await Product.findById(item.product);
      if (!productExists)
        return res.status(404).json({ error: "Product not found" });
    }

    // calculate total
    let totalAmount = 0;
    items.forEach((item) => {
      totalAmount += item.quantity * item.purchasePrice;
    });

    const purchase = await Purchase.create({
      ...req.body,
      totalAmount,
    });

    res.status(201).json(purchase);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function handleGetAllPurchases(req, res) {
  try {
    const purchases = await Purchase.find()
      .populate("supplier")
      .populate("items.product")
      .sort({ purchaseDate: -1 });

    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function handleGetAllExpiringPurchases(req, res) {
  try {
    const now = new Date();
    const next30 = new Date();
    next30.setDate(now.getDate() + 30);

    const expiring = await Purchase.find({
      "items.expiryDate": { $gte: now, $lte: next30 },
    }).populate("supplier").populate("items.product");

    res.json(expiring);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ===============================
   BILL PROCESSING (UPDATED FIFO)
================================ */

async function handleBillProcessing(req, res) {
  try {
    const {
      billNo,
      customerName,
      totalAmount,
      paidAmount,
      paymentMethod,
      items,
    } = req.body;

    for (let item of items) {
      let qtyToDeduct = item.quantity;

      // Find purchases that contain this product
      const purchases = await Purchase.find({
        "items.product": item.product,
      }).sort({ purchaseDate: 1 });

      for (let purchase of purchases) {
        for (let batchItem of purchase.items) {
          if (
            batchItem.product.toString() === item.product &&
            batchItem.remainingQty > 0 &&
            qtyToDeduct > 0
          ) {
            const deductQty = Math.min(
              batchItem.remainingQty,
              qtyToDeduct
            );

            batchItem.remainingQty -= deductQty;
            qtyToDeduct -= deductQty;
          }
        }

        await purchase.save();

        if (qtyToDeduct <= 0) break;
      }

      if (qtyToDeduct > 0) {
        return res.status(400).json({
          error: "Not enough stock available",
        });
      }
    }

    const bill = await Bill.create({
      billNo,
      customerName,
      totalAmount,
      paidAmount,
      paymentMethod,
      items,
    });

    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function handleGetAllBills(req, res) {
  try {
    const bills = await Bill.find()
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function handleProcessReturn(req, res) {
  try {
    const { purchaseId, returnedQty, expectedRefund, actualRefund } = req.body;

    if (!purchaseId || !returnedQty || !expectedRefund || !actualRefund) {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    let updated = false;

    for (let item of purchase.items) {
      if (item.remainingQty >= returnedQty) {
        item.remainingQty -= returnedQty;
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(400).json({
        error: "Remaining quantity is less than return quantity",
      });
    }

    await purchase.save();

    const returnRecord = await Return.create({
      purchase: purchaseId,
      returnedQty,
      expectedRefund,
      actualRefund,
    });

    res.status(201).json({
      msg: "Return processed successfully",
      return: returnRecord,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleGetAllReturns(req, res) {
  try {
    const returns = await Return.find().populate("purchase").sort({ createdAt: -1 });
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function handleInventorySummary(req, res) {
  try {
    const products = await Product.find();
    const purchases = await Purchase.find();

    const summary = [];
    const autoRequisitionsCreated = [];

    for (const product of products) {
      let totalStock = 0;

      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.product.toString() === product._id.toString()) {
            totalStock += item.remainingQty;
          }
        });
      });

      const reorderLevel = product.reorderLevel || 10;
      const lowStock = totalStock <= reorderLevel;

      // Auto-generate purchase requisition for low stock products
      if (lowStock) {
        // Check if a pending requisition already exists for this product
        const existingRequisition = await PurchaseRequisition.findOne({
          product: product._id,
          status: "Pending",
        });

        // Create new requisition only if no pending one exists
        if (!existingRequisition) {
          const newRequisition = await PurchaseRequisition.create({
            requisitionNumber: `REQ-${Date.now()}-${product._id}`,
            product: product._id,
            quantity: reorderLevel,
            requestedBy: "System Auto",
            justification: "Stock below reorder level",
            status: "Pending",
          });
          autoRequisitionsCreated.push({
            productName: product.name,
            requisitionNumber: newRequisition.requisitionNumber,
          });
        }
      }

      summary.push({
        productId: product._id,
        productName: product.name,
        totalStock,
        reorderLevel,
        lowStock,
      });
    }

    res.json({
      summary,
      autoRequisitionsCreated,
      message: autoRequisitionsCreated.length > 0
        ? `Auto-generated ${autoRequisitionsCreated.length} purchase requisition(s) for low stock products`
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function handleUpdateProduct(req, res) {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
const createPurchaseRequisition = async (req, res) => {
  try {
    const { product, quantity, requestedBy, justification } = req.body;

    const requisitionNumber = `REQ-${Date.now()}`;

    const newRequisition = await PurchaseRequisition.create({
      requisitionNumber,
      product,
      quantity,
      requestedBy,
      justification,
    });

    res.status(201).json(newRequisition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getAllPurchaseRequisitions = async (req, res) => {
  try {
    const requisitions = await PurchaseRequisition.find()
      .populate("product")
      .sort({ createdAt: -1 });

    res.json(requisitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const approvePurchaseRequisition = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1 — Fetch the requisition
    const requisition = await PurchaseRequisition.findById(id);
    if (!requisition) {
      return res.status(404).json({ error: "Requisition not found" });
    }

    if (requisition.status !== "Pending") {
      return res.status(400).json({ error: "Requisition has already been processed" });
    }

    // Step 2 — Update requisition status
    requisition.status = "Approved";
    requisition.approvedBy = "Manager";
    requisition.approvedAt = new Date();
    await requisition.save();

    // Step 3 — Prevent duplicate purchase orders
    const existingPurchase = await Purchase.findOne({
      "items.product": requisition.product,
      status: "Pending Procurement",
    });

    if (existingPurchase) {
      return res.json({
        message: "Requisition approved. A pending purchase order already exists for this product.",
        requisition,
        purchaseOrder: existingPurchase,
      });
    }

    // Step 4 — Create purchase order
    const purchase = await Purchase.create({
      supplier: null,
      purchaseDate: new Date(),
      status: "Pending Procurement",
      source: "Requisition",
      items: [
        {
          product: requisition.product,
          quantity: requisition.quantity,
          purchasePrice: 0,
          mrp: 0,
          remainingQty: requisition.quantity,
        },
      ],
      totalAmount: 0,
    });

    // Step 5 — Send response
    res.json({
      message: "Requisition approved and purchase order generated",
      requisition,
      purchaseOrder: purchase,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const rejectPurchaseRequisition = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await PurchaseRequisition.findByIdAndUpdate(
      id,
      {
        status: "Rejected",
        approvedBy: "Manager",
        approvedAt: new Date(),
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/* ===============================
   BOM CONTROLLERS
================================ */

const createBOM = async (req, res) => {
  try {
    const { finishedProduct, materials } = req.body;

    const product = await Product.findById(finishedProduct);
    if (!product) {
      return res.status(404).json({ error: "Finished product not found" });
    }
    if (product.itemType !== "Finished") {
      return res.status(400).json({ error: "Product must be of type Finished" });
    }

    for (const mat of materials) {
      if (!mat.quantityRequired || mat.quantityRequired <= 0) {
        return res.status(400).json({ error: "quantityRequired must be greater than 0" });
      }
      const rawProduct = await Product.findById(mat.product);
      if (!rawProduct) {
        return res.status(404).json({ error: `Material product not found: ${mat.product}` });
      }
      if (rawProduct.itemType !== "Raw") {
        return res.status(400).json({ error: `${rawProduct.name} must be a Raw material` });
      }
    }

    const bom = await BillOfMaterials.create({ finishedProduct, materials });
    res.status(201).json(bom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllBOMs = async (req, res) => {
  try {
    const boms = await BillOfMaterials.find()
      .populate("finishedProduct")
      .populate("materials.product");
    res.json(boms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBOMByProduct = async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({ finishedProduct: req.params.productId })
      .populate("finishedProduct")
      .populate("materials.product");
    if (!bom) {
      return res.status(404).json({ error: "BOM not found for this product" });
    }
    res.json(bom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   MANUFACTURING CONTROLLERS
================================ */

const createManufacturingOrder = async (req, res) => {
  try {
    const { product: productId, quantity: manufacturingQty } = req.body;

    // Validate BOM exists for this product
    const bom = await BillOfMaterials.findOne({ finishedProduct: productId });
    if (!bom) {
      return res.status(400).json({ error: "BOM not defined for this product" });
    }

    // Create the manufacturing order in Planned status (no inventory deduction)
    const order = await ManufacturingOrder.create({
      product: productId,
      quantity: manufacturingQty,
      status: "Planned",
    });

    const populated = await ManufacturingOrder.findById(order._id).populate("product");

    res.status(201).json({
      message: "Manufacturing order created successfully",
      manufacturingOrder: populated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const startManufacturingOrder = async (req, res) => {
  try {
    const order = await ManufacturingOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Manufacturing order not found" });
    }
    if (order.status !== "Planned") {
      return res.status(400).json({ error: "Only Planned orders can be started" });
    }

    order.status = "InProgress";
    await order.save();

    const populated = await ManufacturingOrder.findById(order._id).populate("product");

    res.json({
      message: "Manufacturing order started",
      manufacturingOrder: populated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const completeManufacturingOrder = async (req, res) => {
  try {
    // Step 1 — Fetch order
    const order = await ManufacturingOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Manufacturing order not found" });
    }
    if (order.status !== "InProgress") {
      return res.status(400).json({ error: "Only InProgress orders can be completed" });
    }

    // Step 2 — Fetch BOM
    const bom = await BillOfMaterials.findOne({ finishedProduct: order.product });
    if (!bom) {
      return res.status(400).json({ error: "BOM not defined for this product" });
    }

    // Step 3 — Calculate raw materials required
    const materialsRequired = bom.materials.map((mat) => ({
      product: mat.product.toString(),
      requiredQty: mat.quantityRequired * order.quantity,
    }));

    // Step 4 — Validate inventory availability
    for (const mat of materialsRequired) {
      const purchases = await Purchase.find({ "items.product": mat.product });
      let available = 0;
      for (const purchase of purchases) {
        for (const item of purchase.items) {
          if (item.product.toString() === mat.product) {
            available += item.remainingQty;
          }
        }
      }
      if (available < mat.requiredQty) {
        const prod = await Product.findById(mat.product);
        return res.status(400).json({
          error: `Not enough raw materials for ${prod ? prod.name : mat.product}. Required: ${mat.requiredQty}, Available: ${available}`,
        });
      }
    }

    // Step 5 — Deduct raw materials using FIFO
    for (const mat of materialsRequired) {
      let qtyToDeduct = mat.requiredQty;

      const purchases = await Purchase.find({
        "items.product": mat.product,
      }).sort({ purchaseDate: 1 });

      for (const purchase of purchases) {
        for (const batchItem of purchase.items) {
          if (
            batchItem.product.toString() === mat.product &&
            batchItem.remainingQty > 0 &&
            qtyToDeduct > 0
          ) {
            const deductQty = Math.min(batchItem.remainingQty, qtyToDeduct);
            batchItem.remainingQty -= deductQty;
            qtyToDeduct -= deductQty;
          }
        }
        await purchase.save();
        if (qtyToDeduct <= 0) break;
      }
    }

    // Step 6 — Add finished goods as a purchase batch
    await Purchase.create({
      supplier: null,
      purchaseDate: new Date(),
      status: "Completed",
      items: [
        {
          product: order.product,
          quantity: order.quantity,
          purchasePrice: 0,
          mrp: 0,
          remainingQty: order.quantity,
        },
      ],
      totalAmount: 0,
    });

    // Step 7 — Update manufacturing order status
    order.status = "Completed";
    await order.save();

    const populated = await ManufacturingOrder.findById(order._id).populate("product");

    res.json({
      message: "Manufacturing order completed successfully",
      manufacturingOrder: populated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelManufacturingOrder = async (req, res) => {
  try {
    const order = await ManufacturingOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Manufacturing order not found" });
    }
    if (order.status !== "Planned") {
      return res.status(400).json({ error: "Only Planned orders can be cancelled" });
    }

    order.status = "Cancelled";
    await order.save();

    const populated = await ManufacturingOrder.findById(order._id).populate("product");

    res.json({
      message: "Manufacturing order cancelled",
      manufacturingOrder: populated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllManufacturingOrders = async (req, res) => {
  try {
    const orders = await ManufacturingOrder.find()
      .populate("product")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ===============================
   EXPORTS
================================ */

module.exports = {
  handleAddNewProduct,
  handleGetAllProducts,
  handleAddSupplier,
  handleGetAllSuppliers,
  handleAddNewPurchase,
  handleGetAllPurchases,
  handleBillProcessing,
  handleGetAllExpiringPurchases,
  handleGetAllBills,
  handleProcessReturn,
  handleGetAllReturns,
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
};