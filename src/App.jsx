import React, { Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/authentication/login/Login'))
const Register = React.lazy(() => import('./views/authentication/register/Register'))
const CheckEmail = React.lazy(() => import('./views/authentication/check-email/CheckEmail'))
const ResetPassword = React.lazy(() => import('./views/authentication/reset-password/ResetPassword'))
const ChangePassword = React.lazy(() => import('./views/authentication/change-password/ChangePassword'))
const PasswordChanged = React.lazy(() => import('./views/authentication/password-changed/PasswordChanged'))
const Page404 = React.lazy(() => import('./views/error-pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/error-pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [])

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* Redirección automática de la raíz a la vista del parqueadero */}
          <Route exact path="/" element={<Navigate to="/parqueadero/vehiculos" replace />} />

          {/* Rutas Públicas */}
          <Route exact path="/authentication/login" name="Login Page" element={<Login />} />
          <Route exact path="/authentication/register" name="Register Page" element={<Register />} />
          <Route exact path="/authentication/check-email" name="Check Email Page" element={<CheckEmail />} />
          <Route exact path="/authentication/reset-password" name="Reset Password Page" element={<ResetPassword />} />
          <Route exact path="/authentication/change-password" name="Change Password Page" element={<ChangePassword />} />
          <Route exact path="/authentication/password-changed" name="Password Changed Page" element={<PasswordChanged />} />
          <Route exact path="/error-pages/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/error-pages/500" name="Page 500" element={<Page500 />} />

          {/* Layout Principal (Carga el resto de rutas desde routes.js) */}
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
