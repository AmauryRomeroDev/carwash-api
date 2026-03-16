# Car Wash API - Backend

RESTful API developed with *FastAPI* (Python) for the comprehensive management of a car wash / detailing business.

**Project Status :** In initial development – Base structure + main schemas.

## Business Description and Key Features

- **Client Management:** Registration and history tracking of customers, including support for future membership programs.
- **Vehicle Registration:** Management of vehicles linked to specific clients for personalized tracking.
- **Services:** Catalog of wash and detailing options (e.g., basic wash, premium, waxing, vacuuming).
- **Products:** Inventory of saleable items such as chemicals, air fresheners, and car accessories.
- **Inventory Control:** Tracking of stock-ins (suppliers) and stock-outs (service usage or direct sales).
- **Tickets & Payments:** Managed through two specialized modules:
  - ***Service Ticket***: Records a vehicle wash. Includes services applied, vehicle info, washer, cashier, and discounts.
  - ***Quick Sale Ticket***: Handles direct product sales to registered or anonymous clients, triggering an inventory "OUT" movement.
- **User Role:** Access control for Clients and Employees (Washers, Cashiers, and Administrators).

## Core Tech Stack

- Python 3.10+
- FastAPI
- SQLAlchemy (ORM)
- Pydantic v2 (IN/OUT schemas)
- PostgreSQL (base de datos recomendada)
- JWT para autenticación
- python-dotenv

## Actual Project Structure

```
├── app/
│   ├── api/                    # Routers & endpoints
│   ├── core/                   # Config, security, exceptions
│   ├── crud/                   # CRUD logic
│   ├── database/               # DB connection & session
│   ├── middlewares/            # Custom middlewares
│   ├── models/                 # SQLAlchemy models
│   └── schemas/                # Pydantic schemas (Data Validation)
│       ├── __init__.py
│       ├── user.py             # Base users
│       ├── client.py           # Clients
│       ├── employee.py         # Employees (Admin, Cashier & Washer)
│       ├── inventory_movements.py  # Inventory tracking (IN & OUT)
│       ├── product.py          # Products (soaps, etc.)
│       ├── service.py          # Services offered 
│       ├── order_product.py    # Product sales / Cashier
│       ├── vehicle.py          # Vehicles
│       └── order_service.py    # Service x Vehicle relationship
├── tests/                      # Unit and integration tests
├── db.py                       # DB connection helper
├── main.py                     # Entry point 
└── README.md
```
