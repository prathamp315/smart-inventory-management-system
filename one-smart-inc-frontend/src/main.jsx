import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { syncAPI } from './services/api';
import * as localdb from './services/localdb';

// Merge helper: keep local items with temp IDs not present in cloud
function mergeLocalWithCloud(localArr, cloudArr) {
  const cloudIds = new Set(cloudArr.map(item => item._id));
  // Keep local items with temp IDs (string IDs, not in cloud)
  const localOnly = localArr.filter(item => (
    (typeof item._id === 'string' && !cloudIds.has(item._id)) ||
    (item.offline === true)
  ));
  return [...cloudArr, ...localOnly];
}

async function syncToCloudAndRefresh() {
  // Gather all local data
  const [localProducts, localPurchases, localBills, localReturns] = await Promise.all([
    localdb.getAll('products'),
    localdb.getAll('purchases'),
    localdb.getAll('bills'),
    localdb.getAll('returns'),
  ]);
  // Upload to cloud
  await syncAPI.syncPendingData()({
    products: localProducts,
    purchases: localPurchases,
    bills: localBills,
    returns: localReturns,
  });
  // Download fresh from cloud
  const res = await syncAPI.downloadAll();
  // Merge: keep local-only (offline) items
  await localdb.putBulk('products', mergeLocalWithCloud(localProducts, res.data.products));
  await localdb.putBulk('purchases', mergeLocalWithCloud(localPurchases, res.data.purchases));
  await localdb.putBulk('bills', mergeLocalWithCloud(localBills, res.data.bills));
  await localdb.putBulk('returns', mergeLocalWithCloud(localReturns, res.data.returns));
}

// On startup: if online AND authenticated, sync localdb with cloud
if (navigator.onLine && localStorage.getItem("token")) {
  syncToCloudAndRefresh();
}

// Listen for coming online — only sync if authenticated
window.addEventListener('online', () => {
  if (localStorage.getItem("token")) {
    syncToCloudAndRefresh();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <NotificationProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </NotificationProvider>
        </ThemeProvider>
    </React.StrictMode>
);
