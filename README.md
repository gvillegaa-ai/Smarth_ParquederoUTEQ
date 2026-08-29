# 🚗 UTEQ Smart Parking - Dashboard Administrativo

Sistema de gestión y monitoreo en tiempo real para el parqueadero de la **Universidad Técnica Estatal de Quevedo (UTEQ)**. Esta aplicación web permite la administración de vehículos autorizados, control de ocupación de puestos, directorio de propietarios e historial de accesos.

---

## 🚀 Características Principales

* **🏢 Gestión de Vehículos:** Registro, edición y control de autorización de acceso vehicular con soporte para fotografía, placa, marca y modelo.
* **🅿️ Estado de Puestos:** Visualización en tiempo real de la ocupación y disponibilidad de los espacios del parqueadero.
* **👤 Directorio de Propietarios:** Vinculación de conductores y usuarios institucionales a sus respectivos vehículos.
* **📜 Historial de Registros:** Bitácora detallada de entradas, salidas y estado de estancia de los vehículos en las instalaciones.
* **🔍 Búsqueda y Paginación:** Filtrado dinámico multicriterio y paginación reactiva en todas las vistas del sistema.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React.js, Vite
* **UI Framework:** CoreUI for React v5
* **Iconos:** CoreUI Icons (`@coreui/icons-react`)
* **Enrutamiento:** React Router DOM v6
* **Estilos:** Bootstrap 5 / Sass

---

## 📂 Estructura del Proyecto

```text
src/
├── components/
│   └── vehiculos/
│       ├── ListaVehiculos.jsx   # Vista principal unificada (Vehículos, Puestos, Propietarios, Historial)
│       └── ModalVehiculo.jsx    # Modal para creación y edición de registros
├── hooks/
│   └── useVehiculos.js          # Custom hook para manejo de estado y API/Base de Datos
├── routes.js                    # Configuración de rutas del dashboard
├── _nav.js                      # Configuración de la barra de navegación lateral
└── App.js                       # Punto de entrada principal con React Router