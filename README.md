# API Autolavado - Backend

API RESTful desarrollada en **FastAPI** (Python) para la gestión integral de un negocio de autolavado / lavado de autos.

**Estado del proyecto:** En desarrollo inicial – Estructura base + esquemas principales

## Descripción del negocio y funcionalidades clave

- Registro y gestión de **clientes** registrados (para historial y posibles membresías)
- Registro de **vehículos** asociados a clientes
- **Servicios** de lavado y detailing (lavado básico, premium, encerado, aspirado, etc.)
- **Productos** vendibles (químicos, aromatizantes, accesorios para auto, etc.)
- Control de **inventario** (entradas de proveedor + salidas por uso en servicios o ventas directas)
- **Tickets / Cobros** con dos modalidades principales:
  - **Ticket de servicio**: lavado realizado en un vehículo → incluye servicios aplicados, vehículo, cliente (opcional), empleado que lavó, empleado que cobró, descuentos, etc.
  - **Ticket de venta rápida**: venta de productos → puede ser a cliente registrado o anónimo, solo registra OUT de inventario + empleado cobrador
- Roles de usuarios: clientes, empleados (lavadores, cajeros), administradores

## Tecnologías principales

- Python 3.10+
- FastAPI
- SQLAlchemy (ORM)
- Pydantic v2 (esquemas de entrada/salida)
- PostgreSQL (base de datos recomendada)
- JWT para autenticación
- python-dotenv

## Estructura actual del proyecto

```
├── app/
│   ├── api/                    # routers y endpoints
│   ├── core/                   # configuraciones, seguridad, excepciones
│   ├── crud/                   # operaciones CRUD básicas
│   ├── database/               # conexión a BD, sesiones
│   ├── middlewares/            # middlewares personalizados
│   ├── models/                 # modelos SQLAlchemy 
│   └── schemas/                # esquemas Pydantic (entrada/salida API)
│       ├── init.py
│       ├── ticket.py          # cajero / movimientos de caja
│       ├── client.py           # clientes
│       ├── inventory_movements.py  # movimientos de inventario
│       ├── products.py         # productos y servicios
│       ├── services.py         # servicios de lavado 
│       ├── user.py             # usuarios generales
│       ├── vehicle.py          # vehículos
│       └── vehicle_service.py  # relación servicio por vehiculo
├── test/                       # pruebas 
├── db.py                       # helper de conexión a BD
├── main.py                     # punto de entrada FastAPI
└── README.md
```
