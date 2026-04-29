# Frontend Documentation

## Electron Frontend (`one-smart-inc-frontend-electron`)

This document provides detailed information about the Electron frontend of the CareEco Inventory Management System.

### Routing

This application uses `react-router-dom` with `HashRouter` for routing. The routes are defined in `src/renderer/src/App.jsx`.

### Components

*   **`Billing.jsx`**: This component handles the creation of new bills. It includes a form for adding items to the bill, calculating the total amount, and submitting the bill to the backend.
*   **`Bills.jsx`**: This component displays a list of all past bills. It fetches the bill data from the backend and displays it in a table.
*   **`Dashboard.jsx`**: The main dashboard of the application. It provides an overview of the inventory, including a summary of products, purchases, and expiring items.
*   **`ExpiryNotification.jsx`**: This component displays a notification for items that are nearing their expiry date.
*   **`Products.jsx`**: This component is used to manage the products in the inventory. It allows users to add new products and view a list of all existing products.
*   **`Purchases.jsx`**: This component is used to record new purchases. It includes a form for entering purchase details such as the product, quantity, price, and expiry date.
*   **`Returns.jsx`**: This component handles product returns. It allows users to record the return of a product and update the inventory accordingly.
*   **`Versions.jsx`**: This component displays the versions of the application, Electron, Node.js, and other dependencies.

### Services

*   **`api.js`**: This file contains all the functions for making API calls to the backend server. It uses `axios` to send HTTP requests.
*   **`localdb.js`**: This file contains the logic for interacting with the local IndexedDB. It uses `dexie.js` to manage the local database, which is used for offline data storage and caching.


