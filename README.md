# ✨ Smart Inventory Management System ✨

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/) [![Electron.js](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)](https://electronjs.org) [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/) [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)

**An inventory management solution for a proposed company One Smart Inc., crafted with the MERN stack and Electron to deliver a seamless, robust, and user-friendly experience.**

---

### 🌐 **Live Demo**

Check out the live version of the application here:
[https://careeco-inventory-management-system-x0ri.onrender.com/](https://careeco-inventory-management-system-x0ri.onrender.com/)

---

### 🚀 **Key Feature: Uninterrupted Workflow with Hybrid Online/Offline Sync**

SmartInc is engineered for reliability. Work offline without a hitch, and watch as your data automatically syncs to the central server the moment you're back online. **Your business never stops, and neither does your inventory system.**

---

### 🌟 **Core Features**

- 📦 **Product Management:** Effortlessly add, edit, and track your entire inventory.
- 🛒 **Purchase Tracking:** Keep a close eye on incoming stock and manage purchases with ease.
- 🧾 **Billing & Invoicing:** Generate and manage customer invoices seamlessly.
- ↩️ **Returns Management:** Handle product returns with an efficient and clear process.
- 🗓️ **Expiry Date Notifications:** Stay ahead with timely alerts for expiring products.

---

### 💻 **Tech Stack**

| Category     | Technology                         |
| ------------ | ---------------------------------- |
| **Frontend** | React, Electron, Material-UI, Vite |
| **Backend**  | Node.js, Express                   |
| **Database** | MongoDB, Mongoose                  |

---

### 📸 **Screenshots**

**Dashboard**
![Dashboard](./assets/screenshots/Dashboard.png)

**Purchase Orders**
![Purchase Orders](./assets/screenshots/Purchase%20Orders.png)

**Billing**
![Billing](./assets/screenshots/Billing.png)

---

### 🛠️ **Getting Started**

**Prerequisites:**

- Node.js
- MongoDB

**Installation:**

1.  **Backend:**

    ```bash
    cd server
    npm install
    ```

2.  **Web Frontend:**

    ```bash
    cd one-smart-inc-frontend
    npm install
    ```

3.  **Electron Frontend:**
    ```bash
    cd one-smart-inc-frontend-electron
    npm install
    ```

**Running the Application:**

1.  **Start the backend server:**

    ```bash
    cd server
    npm run dev
    ```

2.  **Start the Web application:**

    ```bash
    cd one-smart-inc-frontend
    npm run dev
    ```

3.  **Start the Electron application:**
    ```bash
    cd one-smart-inc-frontend-electron
    npm run dev
    ```

---

### 📂 **Project Structure**

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

---

### ↔️ **API Endpoints**

- `POST /api/products` - Add a new product
- `GET /api/products` - Get all products
- `POST /api/purchases` - Add a new purchase
- `GET /api/purchases` - Get all purchases
- `GET /api/bills` - Get all bills

---

### 📚 **Documentation**

For more detailed information, please refer to the documentation for each part of the project:

- [Server Documentation](./server/README.md)
- [Web Frontend Documentation](./one-smart-inc-frontend/README.md)
- [Electron Frontend Documentation](./one-smart-inc-frontend-electron/README.md)

---

### ✍️ **Authors**

This project was brought to life by:

- **Mustafa Ajnawala** - [GitHub Profile](https://github.com/MustafaAjnawala)
- **Neel Khatri** - [GitHub Profile](https://github.com/o-Erebus)

---

⭐ **Star this repository if you find it helpful!** ⭐
