const mongoose = require("mongoose");
const { Schema } = mongoose;

/*product schema*/

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    itemType: {
      type: String,
      enum: ["Raw", "Finished"],
      default: "Raw",
    },

    reorderLevel: {
      type: Number,
      default: 10,
    },

    specific: {
      flavor: String,
      color: String,
      weight: String,
      volume: String,
    },
  },
  { timestamps: true }
);

/* updated supplier schema*/

const supplierSchema = new Schema(
  {
    supplierName: {
      type: String,
      required: true,
    },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
    gstNumber: String,
  },
  { timestamps: true }
);

/* purchse order schema*/

const purchaseSchema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },

    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expectedDelivery: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["Pending Procurement", "Pending", "Partially Received", "Completed", "Cancelled"],
      default: "Completed",
    },

    source: {
      type: String,
      enum: ["Manual", "Requisition"],
      default: "Manual",
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        purchasePrice: {
          type: Number,
          required: true,
        },

        discount: {
          type: Number,
          default: 0,
        },

        mrp: {
          type: Number,
          required: true,
        },

        expiryDate: {
          type: Date,
        },

        remainingQty: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

/* return schema*/

const returnSchema = new Schema(
  {
    purchase: {
      type: Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
    },

    returnedQty: {
      type: Number,
      required: true,
    },

    expectedRefund: {
      type: Number,
      required: true,
    },

    actualRefund: {
      type: Number,
      required: true,
    },

    returnDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/*bill(sales) schema*/

const billSchema = new Schema(
  {
    billNo: {
      type: String,
      required: true,
      unique: true,
    },

    customerName: String,

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Other"],
      default: "Cash",
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Products",
        },

        quantity: Number,
        pricePerUnit: Number,
        discount: { type: Number, default: 0 },
        discountedPrice: Number,
        total: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

/* sync log schema */

const syncLogSchema = new Schema(
  {
    syncType: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },

    syncedAt: {
      type: Date,
      default: Date.now,
    },

    success: {
      type: Boolean,
      default: true,
    },

    errorMsg: String,
  },
  { timestamps: true }
);
const PurchaseRequisitionSchema = new mongoose.Schema({
  requisitionNumber: {
    type: String,
    required: true,
    unique: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  requestedBy: {
    type: String,
    required: true,
  },
  justification: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  approvedBy: {
    type: String,
  },
  approvedAt: {
    type: Date,
  },
}, { timestamps: true });

const PurchaseRequisition = mongoose.model(
  "PurchaseRequisition",
  PurchaseRequisitionSchema
);

/* bill of materials schema */

const bomSchema = new mongoose.Schema({
  finishedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  materials: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Products",
        required: true,
      },
      quantityRequired: {
        type: Number,
        required: true,
      },
    },
  ],
}, { timestamps: true });

const BillOfMaterials = mongoose.model("BillOfMaterials", bomSchema);

/* manufacturing order schema */

const manufacturingOrderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Planned", "InProgress", "Completed", "Cancelled"],
    default: "Planned",
  },
}, { timestamps: true });

const ManufacturingOrder = mongoose.model("ManufacturingOrder", manufacturingOrderSchema);

/* user schema */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [
      "Admin",
      "InventoryManager",
      "ProcurementManager",
      "ProductionManager",
      "SalesExecutive",
    ],
    required: true,
  },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

/* model exports*/

const Product = mongoose.model("Products", productSchema);
const Supplier = mongoose.model("Supplier", supplierSchema);
const Purchase = mongoose.model("Purchase", purchaseSchema);
const Return = mongoose.model("Return", returnSchema);
const Bill = mongoose.model("Bill", billSchema);
const SyncLog = mongoose.model("SyncLog", syncLogSchema);

module.exports = {
  Product,
  Supplier,
  Purchase,
  Return,
  Bill,
  SyncLog,
  PurchaseRequisition,
  BillOfMaterials,
  ManufacturingOrder,
  User,
};
