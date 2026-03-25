# Car Wash API - Backend 

RESTful API developed with **FastAPI** (Python) for the comprehensive management of a car wash and detailing business.

**Project Status:** Active Development – Advanced business logic and persistent security implemented.

## Key Features

- **Client & Vehicle Management:** Full customer registration and multi-vehicle linking per profile.
- **Service & Product Catalog:** Detailing services management and product inventory tracking.
- **Inventory Control:** Real-time stock tracking (Stock-In from suppliers / Stock-Out via service usage or direct sales).
- **Specialized Ticketing System:**
  - **Service Ticket**: Records detailed vehicle washes, including applied services, washers (staff), and cashiers.
  - **Quick Sale Ticket**: Handles direct product sales with immediate inventory impact.
- **Persistent Authentication**: Database-backed session management (`user_sessions`), optimized for Mobile App integration.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Clients, Washers, Cashiers, and Administrators.

## Core Tech Stack

- **Python 3.10+** & **FastAPI**
- **SQLAlchemy**: ORM for robust database interaction.
- **MySQL / PostgreSQL**: Supported database engines.
- **Pydantic v2**: Strict data validation and IN/OUT schemas.
- **JWT (Python-Jose)**: Secure token-based authentication.
- **Custom Middlewares**: Active session validation and global access control.

## Project Structure

```text
├── ApiEnv/                     # Virtual environment
├── app/
│   ├── api/v1/                 # Versioned endpoints
│   │   ├── auth.py             # Login, Registration & Logout
│   │   ├── client.py           # Customer management
│   │   ├── staff_*.py          # Staff orders, products, and services
│   │   ├── vehicle.py          # Vehicle registration & lookup
│   │   ├── products.py         # Inventory catalog
│   │   ├── services.py         # Wash/Detailing catalog
│   │   └── main.py             # Main router (v1)
│   ├── core/                   # Config, Security, and Dependencies
│   ├── database/               # Connection & SQLAlchemy session
│   ├── middleware/             # AuthMiddleware (Persistent sessions)
│   ├── models/                 # SQLAlchemy models (Database tables)
│   └── schemas/                # Pydantic schemas (Data Validation)
│       ├── session.py          # User session schemas
│       ├── order_product.py    # Product sale tickets
│       ├── order_service.py    # Wash service tickets
│       └── ...                 # Base schemas (user, client, etc.)
├── .env                        # Environment variables (Secret Key, DB_URL)
├── main.py                     # Application entry point
└── README.md
```

## Key Business Workflows

To ensure a smooth operation, the API handles complex interactions between modules:

### 1. Vehicle-to-Client Linking
Vehicles are never "anonymous." When a vehicle is registered:
- **For Clients:** The system automatically assigns the `client_id` from the authenticated session, ensuring they can only manage their own cars.
- **For Admins:** They can register vehicles for any `client_id`, allowing manual onboarding of new customers at the physical location.

### 2. Service Ticket Lifecycle
The core of the car wash operation follows this flow:
- **Intake:** A vehicle is identified, and a service (e.g., "Full Detail") is selected.
- **Assignment:** The system links a **Washer** (Staff) to the vehicle.
- **Checkout:** A **Cashier** finalizes the ticket. The `OrderService` model then performs a `joinedload` query to consolidate:
    - Vehicle & Client details.
    - Applied Services and their subtotal.
    - Staff members involved.
- **Persistence:** A unique Ticket is generated, accessible for the client via the Mobile App history.

### 3. Persistent Mobile Sessions
Optimized for the mobile experience:
- **Long-lived Access:** Clients receive tokens with extended expiration (e.g., 365 days).
- **Single Session Control:** If a user logs in from a new device, the previous token is overwritten in the `user_sessions` table, automatically invalidating the old session.
- **Real-time Invalidation:** Administrators can instantly revoke access by toggling the `is_active` flag in the database without waiting for the JWT to expire.

### 4. Smart Inventory Impact
Every time a **Quick Sale** or a **Service** (that consumes supplies) is completed:
- The system triggers an internal "OUT" movement in the `inventory_movements` table.
- Stock levels are updated automatically, preventing sales of out-of-stock items.

## API Endpoints Summary

All endpoints are prefixed with `/api/v1`.

### Authentication & Session

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/auth/login` | `POST` | Public | Authenticate user & start persistent session |
| `/auth/register/client` | `POST` | Public | Register a new customer |
| `/auth/register/employee` | `POST` | Admin | Register new staff (Washers/Cashiers) |
| `/auth/logout` | `POST` | Auth | Invalidate current session in DB |

### Vehicles

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/vehicles/me` | `GET` | Client | List all vehicles owned by current client |
| `/vehicles/` | `POST` | Auth | Register a new vehicle (Auto-links to Client) |
| `/vehicles/{id}` | `GET` | Auth | Get detailed info with Client & User joins |
| `/vehicles/{id}` | `PATCH` | Owner/Admin | Update vehicle specifications |

### Services & Products (Catalog)

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/services/` | `GET` | Public | List all available wash & detailing services |
| `/services/` | `POST` | Admin | Create new service in catalog |
| `/products/` | `GET` | Public | List all saleable products & current stock |
| `/products/` | `POST` | Admin | Add new product to inventory |

### Tickets & Orders

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/services/tickets/{id}` | `GET` | Owner/Admin | Get full service ticket (Joins: Vehicle, Staff, User) |
| `/staff/orders/` | `POST` | Cashier | Process a new wash service order |
| `/staff/products/` | `POST` | Cashier | Process a quick product sale |

### Community

| Endpoint | Method | Access | Description |
| :--- | :---: | :---: | :--- |
| `/comments/` | `GET` | Public | View all root comments and their replies |
| `/comments/` | `POST` | Auth | Post a new comment or reply to a service |
| `/comments/{id}` | `DELETE` | Owner/Admin | Remove a comment (Recursive logic) |
