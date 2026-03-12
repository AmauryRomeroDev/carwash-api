@echo off

echo Creando entorno virtual...
python -m venv ApiEnv 
echo Entorno Virtual creado
cd ..
echo Crear la estructura de carpetas y archivos
cd app
mkdir api
cd api
mkdir v1
cd v1
echo .> __init__.py
echo .> services.py
echo .> vehicle.py
echo .> vehicle_service.py
echo .> client.py
echo .> users.py
echo .> products.py
echo .> inventory.py
echo .> auth.py
echo .> dependency.py
echo .> main.py
echo Rutas creadas
cd ..
mkdir core
cd core
echo .> __init__.py
echo .> config.py
echo .> security.py
echo .> exceptions.py
echo Core creado
cd ..
mkdir crud
cd crud
echo .> __init__.py
echo .> auth.py
echo .> client.py
echo .> services.py
echo .> vehicle.py
echo .> vehicle_service.py
echo .> users.py
echo .> products.py
echo .> inventory.py
echo .> ticket.py
echo CRUD creado
cd ..
mkdir database
cd database
echo .> __init__.py
echo .> connection.py
echo Database creado
cd ..
mkdir middleware
cd middleware
echo .> __init__.py
echo .> auth_middleware.py
echo Middleware creado
cd ..
mkdir models
cd models
echo .> __init__.py
echo .> client.py
echo .> services.py
echo .> vehicle.py
echo .> vehicle_service.py
echo .> user.py
echo .> products.py
echo .> inventory.py
echo .> ticket.py
echo Models creado
cd ..
mkdir schemas
cd schemas
echo .> __init__.py
echo .> client.py
echo .> services.py
echo .> vehicle.py
echo .> vehicle_service.py
echo .> user.py
echo .> products.py
echo .> inventory.py
echo .> ticket.py
echo Schemas creado
cd ..
echo .> __init__.py
echo Estructura de carpetas y archivos creada
echo .> main.py
echo Archivo main.py creado

cd ..
echo .> requirements.txt
echo Archivo requirements.txt creado

cd ..
echo Estructura creada con exito.
pause
