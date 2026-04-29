# One Smart Inc. - Web Frontend

This is the web-based frontend for the CareEco Inventory Management System. It is a single-page application (SPA) built with React and Vite, designed to run in any modern web browser.

## Technologies Used

*   **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
*   **[Vite](https://vitejs.dev/)**: A fast build tool and development server for modern web projects.
*   **[Material-UI](https://mui.com/)**: A popular React UI framework for faster and easier web development.
*   **[Axios](https://axios-http.com/)**: A promise-based HTTP client for the browser.
*   **[Dexie.js](https://dexie.org/)**: A wrapper library for IndexedDB to manage local data for caching and offline capabilities.
*   **[React Router](https://reactrouter.com/)**: Used for routing within the application, specifically `BrowserRouter` for standard web routing.

## Project Structure

The project follows a standard Vite + React structure:

```
src/
├── App.jsx         # Main React application component
├── main.jsx        # Renderer process entry point
├── assets/         # Static assets like images and CSS
├── components/     # Reusable React components
├── services/       # Modules for API calls and local database
└── theme/          # Custom Material-UI theme configuration
```

## Components

*   `Billing.jsx`: Handles the creation and processing of new customer bills.
*   `Bills.jsx`: Displays a history of all processed bills.
*   `Dashboard.jsx`: The main landing page, providing an overview and navigation.
*   `ExpiryNotification.jsx`: Shows alerts for products that are nearing their expiration date.
*   `Products.jsx`: For adding new products and viewing the list of all products.
*   `Purchases.jsx`: For recording new stock purchases.
*   `Returns.jsx`: Manages the process of handling returned items.

## Services

*   `api.js`: Contains all the functions for making API calls to the backend server.
*   `localdb.js`: Manages the local IndexedDB database using Dexie.js for offline data storage and caching.

## Routing

This application uses `react-router-dom` with `BrowserRouter`, which leverages the HTML5 History API to keep the UI in sync with the URL. This is the standard approach for routing in single-page applications.

## Documentation

For more detailed documentation on the components and services, please see the [Web Frontend Documentation](./docs.md).

## Getting Started

### Prerequisites

*   Node.js and npm

### Installation

Navigate to the project directory and install the required dependencies:

```bash
npm install
```

### Running the Application

To start the development server, run the following command. This will launch the web application in your default browser with hot-reloading enabled.

```bash
npm run dev
```

