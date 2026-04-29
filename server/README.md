# CareEco Inventory Management System - Server

This is the backend server for the CareEco Inventory Management System. It is a Node.js application built with Express and Mongoose, providing a RESTful API for the frontend applications.

## Technologies Used

*   **[Node.js](https://nodejs.org/)**: A JavaScript runtime built on Chrome's V8 JavaScript engine.
*   **[Express](https://expressjs.com/)**: A fast, unopinionated, minimalist web framework for Node.js.
*   **[MongoDB](https://www.mongodb.com/)**: A general-purpose, document-based, distributed database.
*   **[Mongoose](https://mongoosejs.com/)**: An Object Data Modeling (ODM) library for MongoDB and Node.js.
*   **[CORS](https://expressjs.com/en/resources/middleware/cors.html)**: A Node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
*   **[Dotenv](https://www.npmjs.com/package/dotenv)**: A zero-dependency module that loads environment variables from a `.env` file into `process.env`.

## Project Structure

The server follows a simple and organized structure:

```
.
├── controllers/        # Route handlers and business logic
│   └── controllers.js
├── models/             # Mongoose schemas and models
│   └── models.js
├── connectToDb.js      # MongoDB connection logic
├── index.js            # Main server entry point
└── ...
```

## API Endpoints

The server exposes the following RESTful API endpoints:

*   `POST /api/products`: Add a new product.
*   `GET /api/products`: Get all products.
*   `POST /api/purchases`: Add a new purchase.
*   `GET /api/purchases`: Get all purchases.
*   `GET /api/bills`: Get all bills.
*   `POST /api/billing`: Process a new bill.
*   `POST /api/returns`: Process a product return.

## Documentation

For more detailed documentation on the API endpoints and database models, please see the [Server Documentation](./docs.md).

## Getting Started

### Prerequisites

*   Node.js and npm
*   A running MongoDB instance

### Installation

1.  Navigate to the `server` directory and install the required dependencies:
    ```bash
    cd server
    npm install
    ```
2.  Create a `.env` file in the `server` directory and add your MongoDB connection string:
    ```
    MONGODB_URI=your_mongodb_connection_string
    ```

### Running the Application

To start the server, run the following command. This will start the server on the configured port (default is 3000) and connect to the MongoDB database.

```bash
npm run dev
```

