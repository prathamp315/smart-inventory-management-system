const {
  Product,
  Purchase,
  Bill,
  Return,
  PurchaseRequisition,
  ManufacturingOrder,
  SyncLog,
} = require("../models/models");

const getKPIs = async (req, res) => {
  try {
    // 1. Inventory Turnover Ratio = Total Sales Value / Total Inventory Purchase Value
    const [salesAgg] = await Bill.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const [purchaseAgg] = await Purchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalSales = salesAgg?.total || 0;
    const totalPurchaseValue = purchaseAgg?.total || 0;
    const inventoryTurnover =
      totalPurchaseValue > 0
        ? parseFloat((totalSales / totalPurchaseValue).toFixed(2))
        : 0;

    // 2. Stockout Rate = (Products with totalStock = 0 / Total Products) * 100
    const totalProducts = await Product.countDocuments();
    // Get all products and check which have zero remaining stock across all purchase batches
    const productsWithStock = await Purchase.aggregate([
      { $unwind: "$items" },
      { $match: { "items.remainingQty": { $gt: 0 } } },
      { $group: { _id: "$items.product" } },
    ]);
    const productsInStockCount = productsWithStock.length;
    const outOfStockCount = Math.max(0, totalProducts - productsInStockCount);
    const stockoutRate =
      totalProducts > 0
        ? parseFloat(((outOfStockCount / totalProducts) * 100).toFixed(1))
        : 0;

    // 3. Requisition Approval Rate = Approved / Total * 100
    const totalRequisitions = await PurchaseRequisition.countDocuments();
    const approvedRequisitions = await PurchaseRequisition.countDocuments({
      status: "Approved",
    });
    const approvalRate =
      totalRequisitions > 0
        ? parseFloat(
            ((approvedRequisitions / totalRequisitions) * 100).toFixed(1)
          )
        : 0;

    // 4. Purchase Return Rate = Total Returns / Total Purchases * 100
    const totalReturns = await Return.countDocuments();
    const totalPurchases = await Purchase.countDocuments();
    const purchaseReturnRate =
      totalPurchases > 0
        ? parseFloat(((totalReturns / totalPurchases) * 100).toFixed(1))
        : 0;

    // 5. Manufacturing Completion Rate = Completed / Total * 100
    const totalManufacturing = await ManufacturingOrder.countDocuments();
    const completedManufacturing = await ManufacturingOrder.countDocuments({
      status: "Completed",
    });
    const manufacturingCompletionRate =
      totalManufacturing > 0
        ? parseFloat(
            ((completedManufacturing / totalManufacturing) * 100).toFixed(1)
          )
        : 0;

    // 6. Average Order Value = Sum(bill.totalAmount) / Total Bills
    const totalBills = await Bill.countDocuments();
    const averageOrderValue =
      totalBills > 0
        ? parseFloat((totalSales / totalBills).toFixed(2))
        : 0;

    // 7. Payment Collection Rate = Sum(paidAmount) / Sum(totalAmount) * 100
    const [paidAgg] = await Bill.aggregate([
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paidAmount" },
          totalBilled: { $sum: "$totalAmount" },
        },
      },
    ]);
    const collectionRate =
      paidAgg && paidAgg.totalBilled > 0
        ? parseFloat(
            ((paidAgg.totalPaid / paidAgg.totalBilled) * 100).toFixed(1)
          )
        : 0;

    // 8. Sync Success Rate = Successful SyncLogs / Total SyncLogs * 100
    const totalSyncLogs = await SyncLog.countDocuments();
    const successfulSyncLogs = await SyncLog.countDocuments({ success: true });
    const syncSuccessRate =
      totalSyncLogs > 0
        ? parseFloat(
            ((successfulSyncLogs / totalSyncLogs) * 100).toFixed(1)
          )
        : 0;

    res.json({
      inventoryTurnover,
      stockoutRate,
      approvalRate,
      purchaseReturnRate,
      manufacturingCompletionRate,
      averageOrderValue,
      collectionRate,
      syncSuccessRate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getKPIs };
