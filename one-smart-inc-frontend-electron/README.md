# One Smart Inc. - Electron Frontend

This is the Electron-based desktop frontend for the CareEco Inventory Management System. It provides a native application experience for Windows, macOS, and Linux.

## Technologies Used

*   **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
*   **[Electron](https://www.electronjs.org/)**: A framework for creating native applications with web technologies like JavaScript, HTML, and CSS.
*   **[Vite](https://vitejs.dev/)**: A fast build tool and development server for modern web projects.
*   **[Material-UI](https://mui.com/)**: A popular React UI framework for faster and easier web development.
*   **[Axios](https://axios-http.com/)**: A promise-based HTTP client for the browser and Node.js.
*   **[Dexie.js](https://dexie.org/)**: A wrapper library for IndexedDB to manage local data.
*   **[React Router](https://reactrouter.com/)**: Used for routing within the application, specifically `HashRouter` for compatibility with Electron.

## Project Structure

The project is organized into the standard Electron Vite structure:

```
src/
├── main/
│   └── index.js        # Main process entry point
├── preload/
│   └── index.js        # Preload script to expose Node.js APIs to the renderer
└── renderer/
    └── src/
        ├── App.jsx     # Main React application component
        ├── main.jsx    # Renderer process entry point
        ├── assets/     # Static assets like images and CSS
        ├── components/ # Reusable React components
        └── services/   # Modules for API calls and local database
```

## Components

*   `Billing.jsx`: Handles the creation and processing of new customer bills.
*   `Bills.jsx`: Displays a history of all processed bills.
*   `Dashboard.jsx`: The main landing page, providing an overview and navigation.
*   `ExpiryNotification.jsx`: Shows alerts for products that are nearing their expiration date.
*   `Products.jsx`: For adding new products and viewing the list of all products.
*   `Purchases.jsx`: For recording new stock purchases.
*   `Returns.jsx`: Manages the process of handling returned items.
*   `Versions.jsx`: A utility component that displays the versions of Electron, Chrome, and Node.js being used.

## Services

*   `api.js`: Contains all the functions for making API calls to the backend server.
*   `localdb.js`: Manages the local IndexedDB database using Dexie.js for offline data storage and caching.

## Routing

This application uses `react-router-dom` with `HashRouter`. The hash-based routing is essential for Electron applications to ensure that routing works correctly within the `file://` protocol, as opposed to the `BrowserRouter` which is designed for standard web server environments.

## Documentation

For more detailed documentation on the components and services, please see the [Electron Frontend Documentation](./docs.md).

## Getting Started

### Prerequisites

*   Node.js and npm

### Installation

Navigate to the project directory and install the required dependencies:

```bash
npm install
```

### Running the Application

To start the application in development mode, run the following command. This will launch the Electron app with hot-reloading enabled.

```bash
npm run dev
```

### Building the Application

To build the application for production, you can use the following commands:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

