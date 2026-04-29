# CareEco Inventory Management System Documentation

## 1. Introduction

This document provides a comprehensive overview of the CareEco Inventory Management System, a desktop application built for One Smart Inc. using the MERN stack and Electron. It covers the project structure, API endpoints, frontend components, and database models in detail.

## 2. Technologies Used

*   **Frontend:**
    *   React
    *   Electron
    *   Material-UI
    *   Vite
    *   Axios
    *   Dexie.js (for IndexedDB)
*   **Backend:**
    *   Node.js
    *   Express
    *   MongoDB
    *   Mongoose
*   **Database:**
    *   MongoDB

## 3. Project Structure

```
.
├── one-smart-inc-frontend-electron/  # Electron frontend application
│   ├── src/
│   │   ├── main/                       # Electron main process
│   │   ├── preload/                    # Electron preload script
│   │   └── renderer/                   # React frontend
│   │       ├── src/
│   │       │   ├── components/         # React components
│   │       │   ├── services/           # API and local DB services
│   │       │   └── theme/              # Material-UI theme
├── server/                             # Node.js backend
│   ├── controllers/                    # Route handlers
│   ├── models/                         # Mongoose models
│   └── ...
└── ...
```

## 4. API Endpoints

### Product Endpoints

*   **`POST /api/products`**: Add a new product.
    *   **Request Body**:
        ```json
        {
          "name": "Product Name",
          "specific": {
            "flavor": "Flavor",
            "color": "Color",
            "weight": "Weight",
            "volume": "Volume"
          }
        }
        ```
    *   **Response**:
        ```json
        {
          "msg": "Product created successfully",
          "product": { ... } // Product object
        }
        ```

*   **`GET /api/products`**: Get all products.
    *   **Response**:
        ```json
        [
          { ... } // Array of product objects
        ]
        ```

### Purchase Endpoints

*   **`POST /api/purchases`**: Add a new purchase.
    *   **Request Body**:
        ```json
        {
          "productName": "Product Name",
          "purchaseDate": "2025-06-30T00:00:00.000Z",
          "quantity": 100,
          "purchasePrice": 10,
          "discount": 5,
          "mrp": 15,
          "expiryDate": "2026-06-30T00:00:00.000Z",
          "remainingQty": 100
        }
        ```
    *   **Response**:
        ```json
        { ... } // Purchase object
        ```

*   **`GET /api/purchases`**: Get all purchases.
    *   **Response**:
        ```json
        [
          { ... } // Array of purchase objects
        ]
        ```

*   **`GET /api/purchases/expiring`**: Get all purchases expiring in the next 30 days.
    *   **Response**:
        ```json
        [
          { ... } // Array of purchase objects
        ]
        ```

### Bill Endpoints

*   **`GET /api/bills`**: Get all bills.
    *   **Response**:
        ```json
        [
          { ... } // Array of bill objects
        ]
        ```

*   **`POST /api/bills`**: Process a new bill.
    *   **Request Body**:
        ```json
        {
          "billNo": "BILL-001",
          "customerName": "John Doe",
          "totalAmount": 150,
          "paidAmount": 150,
          "paymentMethod": "Cash",
          "items": [
            {
              "productName": "Product Name",
              "quantity": 10,
              "pricePerUnit": 15,
              "total": 150
            }
          ]
        }
        ```
    *   **Response**:
        ```json
        { ... } // Bill object
        ```

### Return Endpoints

*   **`POST /api/returns`**: Process a product return.
    *   **Request Body**:
        ```json
        {
          "purchaseId": "60d5f1b3e6b3f3b4a8f3b3a8",
          "returnedQty": 10,
          "expectedRefund": 100,
          "actualRefund": 100
        }
        ```
    *   **Response**:
        ```json
        {
          "msg": "Return processed succesfully",
          "return": { ... }, // Return object
          "currentnINventory": 90
        }
        ```

### Sync Endpoints

*   **`GET /api/sync`**: Download all data for offline cache.
    *   **Response**:
        ```json
        {
          "products": [ ... ],
          "purchases": [ ... ],
          "bills": [ ... ],
          "returns": [ ... ]
        }
        ```

*   **`POST /api/sync`**: Upload local changes to the cloud.
    *   **Request Body**:
        ```json
        {
          "products": [ ... ],
          "purchases": [ ... ],
          "bills": [ ... ],
          "returns": [ ... ]
        }
        ```
    *   **Response**:
        ```json
        {
          "msg": "Sync successful"
        }
        ```

## 5. Frontend

### Components

*   **`Billing.jsx`**: Component for creating and managing bills.
*   **`Bills.jsx`**: Component for displaying a list of all bills.
*   **`Dashboard.jsx`**: The main dashboard component.
*   **`ExpiryNotification.jsx`**: Component for displaying products nearing their expiry date.
*   **`Products.jsx`**: Component for managing products.
*   **`Purchases.jsx`**: Component for managing purchases.
*   **`Returns.jsx`**: Component for managing product returns.
*   **`Versions.jsx`**: Component for displaying application version information.

### Services

*   **`api.js`**: Contains functions for making API calls to the backend.
*   **`localdb.js`**: Contains functions for interacting with the local IndexedDB database using Dexie.js.

## 6. Database Models

### Product Model

```javascript
{
  name: { type: String, required: true, unique: true },
  specific: {
    flavor: { type: String },
    color: { type: String },
    weight: { type: String },
    volume: { type: String },
  },
}
```

### Purchase Model

```javascript
{
  productName: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  discount: { type: Number, default: 0 }, //in percent
  mrp: { type: Number, required: true },
  expiryDate: { type: Date },
  remainingQty: { type: Number, required: true },
}
```

### Return Model

```javascript
{
  purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', required: true },
  returnedQty: { type: Number, required: true },
  expectedRefund: { type: Number, required: true },
  actualRefund: { type: Number, required: true },
  returnDate: { type: Date, default: Date.now },
}
```

### Bill Model

```javascript
{
  billNo: { type: String, required: true, unique: true },
  customerName: { type: String },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Other'], default: 'Cash' },
  items: [
    {
      productName: { type: String },
      quantity: { type: Number },
      pricePerUnit: { type: Number },
      discount: { type: Number, default: 0 }, // Discount percentage
      discountedPrice: { type: Number }, // Price after discount
      total: { type: Number },
    },
  ],
}
```

### SyncLog Model

```javascript
{
  syncType: { type: String, enum: ['auto', 'manual'], default: 'auto' },
  syncedAt: { type: Date, default: Date.now },
  success: { type: Boolean, default: true },
  errorMsg: { type: String },
}
```

## 7. Getting Started

### Prerequisites

*   Node.js
*   MongoDB

### Installation

1.  **Backend:**
    ```bash
    cd server
    npm install
    ```

2.  **Frontend:**
    ```bash
    cd one-smart-inc-frontend-electron
    npm install
    ```

### Running the Application

1.  **Start the backend server:**
    ```bash
    cd server
    npm run dev
    ```

2.  **Start the frontend application:**
    ```bash
    cd one-smart-inc-frontend-electron
    npm run dev
    ```

