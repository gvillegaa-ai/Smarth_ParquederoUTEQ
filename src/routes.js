/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application using React lazy loading
 * for code splitting and performance optimization.
 *
 * Each route object contains:
 * - path: URL path for the route
 * - name: Human-readable name for breadcrumbs
 * - element: Lazy-loaded React component
 * - exact: (optional) Requires exact path match
 *
 * @module routes
 */

import React from 'react'

// Dashboard
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))

// Parqueadero / Vehículos / Historial
const ListaVehiculos = React.lazy(
  () => import('./views/parqueadero/ListaVehiculos'),
)

/**
 * Array of route configuration objects
 *
 * @type {Array<Object>}
 */
export const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/parqueadero', exact: true, name: 'Parqueadero', element: ListaVehiculos },
  { path: '/parqueadero/vehiculos', name: 'Vehículos', element: ListaVehiculos },
  { path: '/parqueadero/puestos', name: 'Puestos de Parqueadero', element: ListaVehiculos },
  { path: '/parqueadero/propietarios', name: 'Propietarios', element: ListaVehiculos },
  { path: '/parqueadero/historial', name: 'Historial de Registros', element: ListaVehiculos },
]

export default routes