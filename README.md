# Device Hub Backend

A TypeScript-based Express backend API for managing internal test/office devices — replacing the "notebook sign-out sheet" with QR-based scanning, live availability status, and reservations. Built with Prisma and MongoDB, with JWT authentication.

> **Status**: Auth and core Device registration are implemented. Checkout/Reservation and Waitlist are the next build phase — see [Roadmap](#-roadmap).

---

## 🚀 Features

- **Authentication & Authorization**: Secure signup, login, and profile retrieval using JWT and password hashing with `bcryptjs`.
- **Database ORM**: Strongly typed database access using **Prisma** with MongoDB integration.
- **Device Registry**: Device registration with automatic UUID-based QR code generation and live status tracking. _(implemented)_
- **Checkout & Reservation** _(planned)_: Scan-to-checkout, future-slot reservations, and auto-release for forgotten returns — all backed by a single active-checkout constraint per device.
- **Waitlist / Notify-me** _(planned)_: Queue for devices currently in use, with notification on return.
- **Middleware**: Authentication check middleware (`verifyToken`) to guard protected endpoints.
- **TypeScript**: Written entirely in TypeScript for compile-time safety.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript (using `tsx` for execution and watch mode)
- **Framework**: Express.js
- **Database**: MongoDB
- **ORM**: Prisma Client (v6.19)
- **Security**: `bcryptjs` for password hashing, `jsonwebtoken` for JWT
- **QR Generation**: `qrcode` (UUID → SVG)
- **Image Storage**: Cloudinary (device photos + generated QR SVGs)

---

## 📁 Project Directory Structure

> Renamed `product` → `device` throughout, since these are internal assets being tracked, not products being sold.

```text
device-hub-backend/
├── prisma/
│   └── schema.prisma        # Prisma schema: User, Device, Checkout, Waitlist models & enums
├── src/
│   ├── app.ts               # Express application configuration and route registration
│   ├── index.ts             # Starts the HTTP server on specified PORT
│   ├── config/
│   │   └── prisma.ts        # Prisma client singleton configuration
│   ├── controller/
│   │   ├── auth.controller.ts       # Request handlers for signup, login, profile
│   │   ├── device.controller.ts     # Request handlers for device registration & lookup
│   │   └── checkout.controller.ts   # Request handlers for checkout/reserve/return (planned)
│   ├── middlewares/
│   │   └── auth.middleware.ts       # Express middleware for JWT verification
│   ├── repositories/
│   │   ├── auth.repositories.ts     # Database access layer for User model
│   │   ├── device.repositories.ts   # Database access layer for Device model
│   │   └── checkout.repositories.ts # Database access layer for Checkout model (planned)
│   ├── routes/
│   │   ├── auth.route.ts            # Authentication routes (/auth/*)
│   │   ├── device.route.ts          # Device routes (/device/*)
│   │   └── checkout.route.ts        # Checkout/reservation routes (/checkout/*) (planned)
│   ├── services/
│   │   ├── auth.service.ts          # Business logic for authentication and hashing
│   │   ├── device.service.ts        # Business logic for device creation, QR generation
│   │   └── checkout.service.ts      # Business logic for checkout/return/reserve (planned)
│   ├── types/
│   │   ├── auth.type.ts             # Type definitions for Auth DTOs
│   │   ├── device.type.ts           # Type definitions for Device DTOs & entities
│   │   └── checkout.type.ts         # Type definitions for Checkout DTOs (planned)
│   └── utils/
│       └── response.ts              # Utility functions for standardized API responses
├── prisma.config.ts          # Prisma config file for schema & datasource url loading
├── package.json               # Scripts and npm package configuration
└── tsconfig.json              # TypeScript configuration
```

---

## ⚙️ Configuration & Setup

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (A running local or remote instance with replica sets enabled, required for Prisma transactions)

### Environment Variables

```ini
# MongoDB Connection String (with replica set parameter if needed)
DATABASE_URL="mongodb://localhost:27017/device-hub?replicaSet=rs0"

# Port number for the Express server to listen on
PORT=8088

# Secret key used for signing and verifying JWT tokens
SECRET_KEY="your-jwt-secret-key-here"

# Cloudinary (for device photos + QR SVGs)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Quick Start

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Synchronize Database & Generate Prisma Client**:

   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Start Server (Development Mode)**:
   ```bash
   npm run dev
   ```
   The API server will run at `http://localhost:8088`.

---

## 🗄️ Database Schema & Models

### Enums

- **`DeviceStatus`**: Live state of a device (cached for fast lookups on scan).
  - `AVAILABLE` (Default)
  - `IN_USE`
  - `MAINTENANCE`
  - `RETIRED`

- **`CheckoutType`** _(planned)_:
  - `CHECKOUT` — active, in-hand-now usage
  - `RESERVATION` — booked for a future time slot

- **`CheckoutStatus`** _(planned)_:
  - `ACTIVE`
  - `COMPLETED`
  - `CANCELLED`
  - `AUTO_RELEASED` — system-expired because it wasn't manually returned

### Models

- **`User`**: Registered system users.
  - `id` (`String`): Primary Key, mapping to `_id`.
  - `name`, `email` (unique), `password` (hashed)
  - `role` _(planned)_: `EMPLOYEE` | `ADMIN`
  - `createdAt`, `updatedAt`

- **`Device`** _(renamed from `Product`)_: Hardware devices/assets being tracked.
  - `id` (`String`): Primary Key, mapping to `_id`.
  - `name` (`String`): e.g. "ThinkPad X1 Carbon"
  - `category` (`String`): e.g. "Laptop", "Tablet"
  - `serial_no` (`String`, unique): manufacturer/asset tag — a physical, human-readable identifier
  - `qr_code` (`String`, unique): system-generated UUID — a separate identifier from `serial_no`, so a damaged sticker can be reissued without touching the device's real-world identity or history
  - `image_url` (`String`): Cloudinary URL for the device photo
  - `status` (`DeviceStatus`): defaults to `AVAILABLE`
  - `location` _(planned)_: e.g. "Accessories lab"
  - `createdAt`, `updatedAt`

- **`Checkout`** _(planned)_: A single table covering both immediate checkouts and future reservations.
  - `id`, `deviceId` (FK), `userId` (FK)
  - `type` (`CheckoutType`)
  - `status` (`CheckoutStatus`)
  - `startTime`, `expectedReturnTime`, `returnedAt`
  - `createdAt`
  - **Constraint**: only one `ACTIVE` checkout allowed per device at a time (enforced via a partial unique index on `deviceId` where `status = ACTIVE`) — this is what prevents two employees from checking out the same physical device at once.

- **`Waitlist`** _(planned)_: Notify-me queue for devices currently in use.
  - `id`, `deviceId` (FK), `userId` (FK)
  - `status`, `notifiedAt`, `createdAt`

---

## 🔌 API Endpoints Documentation

All requests and responses use `application/json`.

### Summary

| Method   | Endpoint               | Description                                                         | Auth Required  |   Status   |
| :------- | :--------------------- | :------------------------------------------------------------------ | :------------: | :--------: |
| **GET**  | `/`                    | API health check                                                    |     ❌ No      |  ✅ Live   |
| **POST** | `/auth/signup`         | Register a new user                                                 |     ❌ No      |  ✅ Live   |
| **POST** | `/auth/login`          | Authenticate & get token                                            |     ❌ No      |  ✅ Live   |
| **GET**  | `/auth/me`             | Fetch current user profile                                          |     ✔️ Yes     |  ✅ Live   |
| **POST** | `/device/create`       | Register a new device                                               | ✔️ Yes (admin) |  ✅ Live   |
| **GET**  | `/device`              | List / search devices                                               |     ❌ No      | 🔜 Planned |
| **GET**  | `/device/:id`          | Get single device detail                                            |     ❌ No      | 🔜 Planned |
| **GET**  | `/device/qr/:qrCode`   | **Core scan endpoint** — resolve a scanned QR to live device status |     ❌ No      | 🔜 Planned |
| **POST** | `/checkout`            | Check out an available device now                                   |     ✔️ Yes     | 🔜 Planned |
| **POST** | `/checkout/reserve`    | Reserve a device for a future slot                                  |     ✔️ Yes     | 🔜 Planned |
| **POST** | `/checkout/:id/return` | Return a device (scan QR again)                                     |     ✔️ Yes     | 🔜 Planned |
| **GET**  | `/checkout/me`         | List my active checkouts/reservations                               |     ✔️ Yes     | 🔜 Planned |
| **GET**  | `/device/:id/history`  | Usage/checkout history for a device                                 | ✔️ Yes (admin) | 🔜 Planned |
| **POST** | `/waitlist`            | Join notify-me queue for an in-use device                           |     ✔️ Yes     | 🔜 Planned |

---

### 1. Root / Health Check

- **Endpoint**: `GET /`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Device Hub API is running"
  }
  ```

---

### 2. Authentication Endpoints

#### Signup

- **Endpoint**: `POST /auth/signup`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "mySecurePassword123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "id": "64bc0f4f039121a8cd39e4a1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-07-21T04:49:22.000Z"
    }
  }
  ```
- **Error Response (400 Bad Request)** — email already registered:
  ```json
  { "success": false, "message": "Email already exists" }
  ```

#### Login

- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  { "email": "jane@example.com", "password": "mySecurePassword123" }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successfully",
    "data": {
      "name": "Jane Doe",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response (400 Bad Request)**:
  ```json
  { "success": false, "message": "Invalid Credentials" }
  ```

#### User Detail

- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <JWT_TOKEN_HERE>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User details fetched successfully",
    "data": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "createdAt": "2026-07-21T04:49:22.000Z"
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  { "success": false, "message": "Access denied. No token provided." }
  ```
  or
  ```json
  { "success": false, "message": "Invalid or expired token." }
  ```

---

### 3. Device Endpoints

#### Create Device

Registers a new device. Generates a UUID for `qr_code`, encodes it into an SVG via the `qrcode` package, uploads it to Cloudinary, and stores the resulting URL.

- **Endpoint**: `POST /device/create`
- **Request Body**:
  ```json
  {
    "name": "ThinkPad X1 Carbon",
    "category": "Laptop",
    "serial_no": "TP-X1-987654"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Device added successfully",
    "data": {
      "id": "64bc109f039121a8cd39e4a5",
      "name": "ThinkPad X1 Carbon",
      "category": "Laptop",
      "serial_no": "TP-X1-987654",
      "qr_code": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "status": "AVAILABLE"
    }
  }
  ```
- **Error Response (500 Internal Server Error)**:
  ```json
  { "success": false, "message": "Internal Server Error", "errors": {} }
  ```

#### Get Device by QR Code _(planned — the core scan endpoint)_

This is what the camera-scan flow calls the instant a QR is decoded on the client. It resolves the scanned UUID back to the device's full, live status.

- **Endpoint**: `GET /device/qr/:qrCode`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "64bc109f039121a8cd39e4a5",
      "name": "ThinkPad X1 Carbon",
      "status": "AVAILABLE",
      "heldBy": null,
      "expectedFreeAt": null
    }
  }
  ```
- **Error Response (404 Not Found)** — invalid/unrecognized QR:
  ```json
  { "success": false, "message": "No device found for this QR code" }
  ```

---

### 4. Checkout & Reservation Endpoints _(planned)_

#### Check Out a Device

- **Endpoint**: `POST /checkout`
- **Request Body**: `{ "deviceId": "64bc109f039121a8cd39e4a5" }`
- Fails with `409 Conflict` if the device already has an `ACTIVE` checkout — this is enforced at the database level via the partial unique index, not just app logic, so it holds even under concurrent requests.

#### Reserve a Future Slot

- **Endpoint**: `POST /checkout/reserve`
- **Request Body**: `{ "deviceId": "...", "startTime": "...", "expectedReturnTime": "..." }`

#### Return a Device

- **Endpoint**: `POST /checkout/:id/return`
- Marks the checkout `COMPLETED`, flips the device back to `AVAILABLE`, and notifies the next person in the waitlist (if any).

---

## 🛡️ Middlewares

### `verifyToken` Middleware

1. Inspects request header for `Authorization: Bearer <TOKEN>`.
2. Verifies the token against the `SECRET_KEY` env variable.
3. Appends decoded user metadata (`email`) to `req.user`.
4. Calls `next()` on success, or returns `401 Unauthorized` on failure.

---
