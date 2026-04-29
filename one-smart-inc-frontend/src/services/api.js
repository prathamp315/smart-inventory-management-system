import axios from "axios";
import * as localdb from "./localdb";

const API_BASE_URL = "https://smart-erp-backend.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios interceptor to attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor to handle 401 responses (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login page to avoid infinite reload loop
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Helper: check online status
function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Products API
export const productsAPI = {
  getAll: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/products");
        // Cache in local DB - but preserve any pending sync items
        const localData = await localdb.getAll("products");
        const pendingItems = localData.filter(item => item._pendingSync);

        await localdb.clear("products");
        await localdb.putBulk("products", response.data);

        // Re-add pending items
        for (const pendingItem of pendingItems) {
          await localdb.put("products", pendingItem);
        }

        return response;
      } else {
        // Fallback to local DB
        const localData = await localdb.getAll("products");
        return { data: localData };
      }
    } catch (error) {
      console.error("Error fetching products, falling back to local:", error);
      const localData = await localdb.getAll("products");
      return { data: localData };
    }
  },

  create: async (productData) => {
    try {
      if (isOnline()) {
        const response = await api.post("/products", productData);
        // Add to local DB - use the server response which has the proper _id
        await localdb.put("products", response.data.product);
        return response;
      } else {
        // Store locally for sync later
        const localProduct = {
          ...productData,
          _id: `local_${Date.now()}`,
          _pendingSync: true,
          createdAt: new Date().toISOString(),
        };
        await localdb.put("products", localProduct);
        return { data: { product: localProduct } };
      }
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  update: async (id, productData) => {
    try {
      if (isOnline()) {
        const response = await api.put(`/products/${id}`, productData);
        await localdb.put("products", response.data);
        return response;
      } else {
        const localProducts = await localdb.getAll("products");
        const existing = localProducts.find(p => p._id === id);
        if (existing) {
          const updated = { ...existing, ...productData, _pendingSync: true };
          await localdb.put("products", updated);
          return { data: updated };
        }
        throw new Error("Product not found locally");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },
};

// Purchases API
export const purchasesAPI = {
  getAll: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/purchases");
        // Cache in local DB - but preserve any pending sync items
        const localData = await localdb.getAll("purchases");
        const pendingItems = localData.filter(item => item._pendingSync);

        await localdb.clear("purchases");
        await localdb.putBulk("purchases", response.data);

        // Re-add pending items
        for (const pendingItem of pendingItems) {
          await localdb.put("purchases", pendingItem);
        }

        return response;
      } else {
        // Fallback to local DB
        const localData = await localdb.getAll("purchases");
        return { data: localData };
      }
    } catch (error) {
      console.error("Error fetching purchases, falling back to local:", error);
      const localData = await localdb.getAll("purchases");
      return { data: localData };
    }
  },

  create: async (purchaseData) => {
    try {
      if (isOnline()) {
        const response = await api.post("/purchases", purchaseData);
        // Add to local DB
        await localdb.put("purchases", response.data);
        return response;
      } else {
        // Store locally for sync later
        const localPurchase = {
          ...purchaseData,
          _id: `local_${Date.now()}`,
          _pendingSync: true,
          createdAt: new Date().toISOString(),
        };
        await localdb.put("purchases", localPurchase);
        return { data: localPurchase };
      }
    } catch (error) {
      console.error("Error creating purchase:", error);
      throw error;
    }
  },

  getExpiring: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/purchases/expiring");
        return response;
      } else {
        // Calculate expiring items locally
        const localData = await localdb.getAll("purchases");
        const now = new Date();
        const next30 = new Date();
        next30.setDate(now.getDate() + 30);

        const expiring = localData.filter(purchase => {
          if (!purchase.expiryDate) return false;
          const expiryDate = new Date(purchase.expiryDate);
          return expiryDate >= now && expiryDate <= next30;
        });

        return { data: expiring };
      }
    } catch (error) {
      console.error("Error fetching expiring purchases:", error);
      const localData = await localdb.getAll("purchases");
      return { data: localData };
    }
  },
};

// Bills API
export const billsAPI = {
  getAll: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/bills");
        // Cache in local DB - but preserve any pending sync items
        const localData = await localdb.getAll("bills");
        const pendingItems = localData.filter(item => item._pendingSync);

        await localdb.clear("bills");
        await localdb.putBulk("bills", response.data);

        // Re-add pending items
        for (const pendingItem of pendingItems) {
          await localdb.put("bills", pendingItem);
        }

        // Sort all bills by date descending (newest first) and return combined data
        const allBills = await localdb.getAll("bills");
        const sortedBills = allBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { data: sortedBills };
      } else {
        // Fallback to local DB - sort by date descending
        const localData = await localdb.getAll("bills");
        const sortedBills = localData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { data: sortedBills };
      }
    } catch (error) {
      console.error("Error fetching bills, falling back to local:", error);
      const localData = await localdb.getAll("bills");
      const sortedBills = localData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { data: sortedBills };
    }
  },

  create: async (billData) => {
    try {
      if (isOnline()) {
        const response = await api.post("/bills", billData);
        // Add to local DB
        await localdb.put("bills", response.data);
        return response;
      } else {
        // Store locally for sync later AND update inventory offline
        const localBill = {
          ...billData,
          _id: `local_${Date.now()}`,
          _pendingSync: true,
          createdAt: new Date().toISOString(),
        };

        // Update local inventory using FIFO logic (same as server)
        await updateLocalInventory(billData.items, localBill._id);

        await localdb.put("bills", localBill);
        return { data: localBill };
      }
    } catch (error) {
      console.error("Error creating bill:", error);
      throw error;
    }
  },
};

// Helper function to update local inventory using FIFO logic (mirroring server logic)
async function updateLocalInventory(items, billId = null) {
  try {
    // Check if this bill has already been processed for inventory updates
    if (billId) {
      const processedBills = JSON.parse(localStorage.getItem('processedBills') || '[]');
      if (processedBills.includes(billId)) {
        console.log(`Inventory already updated for bill ${billId}, skipping`);
        return;
      }
      // Mark this bill as processed
      processedBills.push(billId);
      localStorage.setItem('processedBills', JSON.stringify(processedBills));
    }

    for (let item of items) {
      let qtyToDeduct = item.quantity;

      // Get all purchase batches for this product with remaining quantity
      const allPurchases = await localdb.getAll("purchases");
      const batches = allPurchases
        .filter(purchase =>
          purchase.productName === item.productName &&
          purchase.remainingQty > 0
        )
        .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)); // FIFO - oldest first

      for (let batch of batches) {
        if (qtyToDeduct <= 0) break; // All quantity deducted

        const deductQty = Math.min(batch.remainingQty, qtyToDeduct);
        qtyToDeduct -= deductQty;
        batch.remainingQty -= deductQty;

        // Update the batch in local DB
        await localdb.put("purchases", batch);
      }

      // If not enough stock, log warning but don't block (offline mode)
      if (qtyToDeduct > 0) {
        console.warn(`Warning: Not enough stock for ${item.productName}. Short by ${qtyToDeduct} units.`);
      }
    }
  } catch (error) {
    console.error("Error updating local inventory:", error);
  }
}

// Returns API
export const returnsAPI = {
  create: async (returnData) => {
    try {
      if (isOnline()) {
        const response = await api.post("/returns", returnData);
        // Add to local DB
        await localdb.put("returns", response.data.return);

        // Update the local purchase record's remainingQty to match server logic
        const allPurchases = await localdb.getAll("purchases");
        const purchaseToUpdate = allPurchases.find(p => p._id === returnData.purchaseId);
        if (purchaseToUpdate) {
          purchaseToUpdate.remainingQty -= returnData.returnedQty; // Subtract - matching server logic
          await localdb.put("purchases", purchaseToUpdate);
        }

        return response;
      } else {
        // Store locally for sync later AND update the purchase record
        const localReturn = {
          ...returnData,
          _id: `local_${Date.now()}`,
          _pendingSync: true,
          createdAt: new Date().toISOString(),
        };

        // Update the local purchase record's remainingQty to match server logic
        const allPurchases = await localdb.getAll("purchases");
        const purchaseToUpdate = allPurchases.find(p => p._id === returnData.purchaseId);
        if (purchaseToUpdate) {
          purchaseToUpdate.remainingQty -= returnData.returnedQty; // Subtract - matching server logic
          await localdb.put("purchases", purchaseToUpdate);
        }

        await localdb.put("returns", localReturn);
        return { data: localReturn };
      }
    } catch (error) {
      console.error("Error processing return:", error);
      throw error;
    }
  },

  getAll: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/returns");
        await localdb.clear("returns");
        await localdb.putBulk("returns", response.data);
        return response;
      } else {
        const localData = await localdb.getAll("returns");
        return { data: localData };
      }
    } catch (error) {
      console.error("Error fetching returns:", error);
      const localData = await localdb.getAll("returns");
      return { data: localData };
    }
  },
};

// Sync functionality
export const syncAPI = {
  syncPendingData: async () => {
    if (!isOnline()) {
      console.log("Offline, skipping sync");
      return { synced: false, reason: "offline" };
    }

    try {
      let syncResults = {
        products: 0,
        purchases: 0,
        bills: 0,
        returns: 0,
        errors: []
      };

      // Sync products
      const pendingProducts = (await localdb.getAll("products")).filter(
        (p) => p._pendingSync
      );
      for (const product of pendingProducts) {
        try {
          const { _id, _pendingSync, createdAt, ...productData } = product;
          const response = await api.post("/products", productData);

          // Remove the local pending item
          await localdb.delete("products", _id);

          syncResults.products++;
          console.log(`Product synced successfully: ${response.data.product.name}`);
        } catch (error) {
          console.error("Failed to sync product:", error);
          syncResults.errors.push(`Product sync failed: ${error.message}`);
        }
      }

      // Sync purchases
      const pendingPurchases = (await localdb.getAll("purchases")).filter(
        (p) => p._pendingSync
      );
      for (const purchase of pendingPurchases) {
        try {
          const { _id, _pendingSync, ...purchaseData } = purchase;
          const response = await api.post("/purchases", purchaseData);

          // Remove the local pending item
          await localdb.delete("purchases", _id);

          syncResults.purchases++;
        } catch (error) {
          console.error("Failed to sync purchase:", error);
          syncResults.errors.push(`Purchase sync failed: ${error.message}`);
        }
      }

      // Sync bills
      const pendingBills = (await localdb.getAll("bills")).filter(
        (b) => b._pendingSync
      );
      for (const bill of pendingBills) {
        try {
          const { _id, _pendingSync, ...billData } = bill;
          const response = await api.post("/bills", billData);

          // Remove the local pending item
          await localdb.delete("bills", _id);

          syncResults.bills++;
          console.log(`Bill synced successfully: ${response.data.billNo}`);
        } catch (error) {
          console.error("Failed to sync bill:", error);
          syncResults.errors.push(`Bill sync failed: ${error.message}`);
        }
      }

      // Sync returns
      const pendingReturns = (await localdb.getAll("returns")).filter(
        (r) => r._pendingSync
      );
      for (const returnItem of pendingReturns) {
        try {
          const { _id, _pendingSync, ...returnData } = returnItem;
          const response = await api.post("/returns", returnData);

          // Remove the local pending item
          await localdb.delete("returns", _id);

          syncResults.returns++;
        } catch (error) {
          console.error("Failed to sync return:", error);
          syncResults.errors.push(`Return sync failed: ${error.message}`);
        }
      }

      console.log("Sync completed:", syncResults);

      // CLEAR LOCALDB AND RELOAD FROM SERVER AFTER SUCCESSFUL SYNC
      await clearAndReloadFromServer();

      // Clear processed bills queue
      localStorage.removeItem('processedBills');
      console.log("Processed bills queue cleared");

      return { synced: true, results: syncResults };
    } catch (error) {
      console.error("Sync failed:", error);
      return { synced: false, reason: error.message };
    }
  },
};

// Helper function to clear localdb and reload fresh data from server
async function clearAndReloadFromServer() {
  try {
    console.log("Clearing localdb and reloading from server...");

    // Clear all local data
    await localdb.clear("products");
    await localdb.clear("purchases");
    await localdb.clear("bills");
    await localdb.clear("returns");

    // Reload fresh data from server
    const [productsResponse, purchasesResponse, billsResponse] = await Promise.all([
      api.get("/products"),
      api.get("/purchases"),
      api.get("/bills")
    ]);

    // Store fresh server data in localdb
    await localdb.putBulk("products", productsResponse.data);
    await localdb.putBulk("purchases", purchasesResponse.data);
    await localdb.putBulk("bills", billsResponse.data);

    // Try to get returns (might not exist)
    try {
      const returnsResponse = await api.get("/returns");
      await localdb.putBulk("returns", returnsResponse.data);
    } catch (error) {
      console.log("Returns endpoint not available, skipping");
    }

    console.log("LocalDB cleared and reloaded with fresh server data");
  } catch (error) {
    console.error("Failed to clear and reload from server:", error);
  }
}

// Helper function to refresh all data from server
async function refreshAllData() {
  try {
    if (!isOnline()) return;

    // Refresh products - preserve pending items
    const productsResponse = await api.get("/products");
    const localProducts = await localdb.getAll("products");
    const pendingProducts = localProducts.filter(item => item._pendingSync);

    await localdb.clear("products");
    await localdb.putBulk("products", productsResponse.data);

    // Re-add pending products
    for (const pendingItem of pendingProducts) {
      await localdb.put("products", pendingItem);
    }

    // Refresh purchases - preserve pending items
    const purchasesResponse = await api.get("/purchases");
    const localPurchases = await localdb.getAll("purchases");
    const pendingPurchases = localPurchases.filter(item => item._pendingSync);

    await localdb.clear("purchases");
    await localdb.putBulk("purchases", purchasesResponse.data);

    // Re-add pending purchases
    for (const pendingItem of pendingPurchases) {
      await localdb.put("purchases", pendingItem);
    }

    // Refresh bills - preserve pending items
    const billsResponse = await api.get("/bills");
    const localBills = await localdb.getAll("bills");
    const pendingBills = localBills.filter(item => item._pendingSync);

    await localdb.clear("bills");
    await localdb.putBulk("bills", billsResponse.data);

    // Re-add pending bills
    for (const pendingItem of pendingBills) {
      await localdb.put("bills", pendingItem);
    }

    // Refresh returns - preserve pending items
    try {
      const returnsResponse = await api.get("/returns");
      const localReturns = await localdb.getAll("returns");
      const pendingReturns = localReturns.filter(item => item._pendingSync);

      await localdb.clear("returns");
      await localdb.putBulk("returns", returnsResponse.data);

      // Re-add pending returns
      for (const pendingItem of pendingReturns) {
        await localdb.put("returns", pendingItem);
      }
    } catch (error) {
      // Returns endpoint might not exist, that's okay
      console.log("Returns endpoint not available");
    }

    console.log("All data refreshed from server while preserving pending items");
  } catch (error) {
    console.error("Failed to refresh data:", error);
  }
}

// Enhanced auto-sync when coming back online
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    console.log("Back online, syncing pending data...");
    const result = await syncAPI.syncPendingData();

    // Dispatch custom event to notify components to refresh
    window.dispatchEvent(new CustomEvent('dataRefresh', {
      detail: { source: 'sync', result }
    }));
  });
}
// Suppliers API
export const suppliersAPI = {
  getAll: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/suppliers");
        return response;
      } else {
        const localData = await localdb.getAll("suppliers");
        return { data: localData };
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      const localData = await localdb.getAll("suppliers");
      return { data: localData };
    }
  },

  create: async (supplierData) => {
    try {
      if (isOnline()) {
        const response = await api.post("/suppliers", supplierData);
        await localdb.put("suppliers", response.data);
        return response;
      } else {
        const localSupplier = {
          ...supplierData,
          _id: `local_${Date.now()}`,
          _pendingSync: true,
          createdAt: new Date().toISOString(),
        };
        await localdb.put("suppliers", localSupplier);
        return { data: localSupplier };
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      throw error;
    }
  },
};
export const inventoryAPI = {
  getSummary: async () => {
    try {
      if (isOnline()) {
        const response = await api.get("/inventory/summary");
        return response;
      } else {
        return { data: [] };
      }
    } catch (error) {
      console.error("Error fetching inventory summary:", error);
      throw error;
    }
  },
};
export const requisitionAPI = {
  getAll: () => api.get("/requisitions"),
  create: (data) => api.post("/requisitions", data),
  approve: (id) => api.put(`/requisitions/${id}/approve`),
  reject: (id) => api.put(`/requisitions/${id}/reject`),
}

export const bomAPI = {
  create: (data) => api.post("/bom", data),
  getAll: () => api.get("/bom"),
  getByProduct: (productId) => api.get(`/bom/${productId}`),
};

export const manufacturingAPI = {
  create: (data) => api.post("/manufacturing", data),
  getAll: () => api.get("/manufacturing"),
  start: (id) => api.put(`/manufacturing/${id}/start`),
  complete: (id) => api.put(`/manufacturing/${id}/complete`),
  cancel: (id) => api.put(`/manufacturing/${id}/cancel`),
};

export const authAPI = {
  login: (data) => axios.post(`${API_BASE_URL}/auth/login`, data),
  register: (data) => axios.post(`${API_BASE_URL}/auth/register`, data),
};

export const kpiAPI = {
  getAll: () => api.get("/kpis"),
};

// Smart Features APIs
export const insightsAPI = {
  getConsumption: () => api.get("/insights/consumption"),
  getExceptions: () => api.get("/insights/exceptions"),
  getSmartInsights: () => api.get("/insights/smart"),
  simulate: (data) => api.post("/insights/simulate", data),
  seedDummy: () => api.post("/insights/seed-dummy"),
  // Advanced Intelligence
  getDemandSupply: () => api.get("/insights/demand-supply"),
  getCosting: (productId) => api.get(`/insights/costing/${productId}`),
  getHealth: () => api.get("/insights/health"),
  getProductionPlan: (days) => api.get(`/insights/production-plan${days ? `?days=${days}` : ''}`),
  getSupplierPerformance: () => api.get("/insights/suppliers"),
  getRequisitionPriority: () => api.get("/insights/requisition-priority"),
  // Decision Support Layer
  getRecommendations: () => api.get("/insights/recommendations"),
  getDemandSupplyV2: () => api.get("/insights/demand-supply-v2"),
  getProductionPlanV2: () => api.get("/insights/production-plan-v2"),
  getExceptionsV2: () => api.get("/insights/exceptions-v2"),
  getCostingAll: () => api.get("/insights/costing-all"),
  // Intelligence & Insight Layer
  getRootCause: () => api.get("/insights/root-cause"),
  getStory: () => api.get("/insights/story"),
  getAnomalies: () => api.get("/insights/anomalies"),
  getAging: () => api.get("/insights/aging"),
  getImpactPreview: (data) => api.post("/insights/impact-preview", data),
  getRisk: () => api.get("/insights/risk"),
};

export const demoAPI = {
  seed: () => api.post("/demo/seed"),
};

export const traceabilityAPI = {
  getByProduct: (productId) => api.get(`/traceability/${productId}`),
  getTimeline: (productId) => api.get(`/traceability/${productId}/timeline`),
};

export default api;
