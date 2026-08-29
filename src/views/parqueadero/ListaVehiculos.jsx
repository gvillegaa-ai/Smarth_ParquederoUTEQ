import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilReload, cilPlus } from '@coreui/icons'

import { useVehiculos } from '../../hooks/useVehiculos'
import ModalVehiculo from './ModalVehiculo'

const ListaVehiculos = () => {
  const location = useLocation()

  // Determinar la vista según la URL
  const vistaActual = useMemo(() => {
    if (location.pathname.includes('/puestos')) return 'puestos'
    if (location.pathname.includes('/propietarios')) return 'propietarios'
    if (location.pathname.includes('/historial') || location.pathname.includes('/registros')) return 'historial'
    return 'vehiculos'
  }, [location.pathname])

  const {
    vehiculos,
    cargando,
    procesando,
    error,
    recargar,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
  } = useVehiculos()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const registrosPorPagina = 10

  // Modales
  const [modalFormVisible, setModalFormVisible] = useState(false)
  const [modalDeleteVisible, setModalDeleteVisible] = useState(false)
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)

  // Alertas
  const [mensajeExito, setMensajeExito] = useState('')
  const [mensajeError, setMensajeError] = useState('')

  useEffect(() => {
    setPagina(1)
  }, [busqueda, vistaActual])

  // Obtiene directamente el campo 'cedula_enmascarada' generado por Supabase
  const obtenerCedulaEnmascarada = (item) => {
    return item?.cedula_enmascarada || item?.cedula_propietario || item?.cedula || 'N/A'
  }

  // Generar datos simulados de historial si no vienen directamente del hook principal
  const historialRegistros = useMemo(() => {
    if (vehiculos.length === 0) return []
    return vehiculos.map((v, index) => ({
      id: v.id || index,
      placa: v.placa,
      propietario_nombre: v.propietario_nombre,
      puesto_codigo: v.puesto_codigo || `A-0${(index % 5) + 1}`,
      fecha_entrada: v.fecha_registro || '2026-08-28 08:30',
      fecha_salida: index % 2 === 0 ? '2026-08-28 12:45' : null,
    }))
  }, [vehiculos])

  // Adaptación de datos según la pestaña activa
  const datosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    if (vistaActual === 'propietarios') {
      const mapaPropietarios = new Map()
      vehiculos.forEach((v) => {
        if (v.correo_institucional && !mapaPropietarios.has(v.correo_institucional)) {
          mapaPropietarios.set(v.correo_institucional, v)
        }
      })
      const listaPropietarios = Array.from(mapaPropietarios.values())

      if (!texto) return listaPropietarios
      return listaPropietarios.filter((p) =>
        [p.propietario_nombre, p.correo_institucional, obtenerCedulaEnmascarada(p)].some((val) =>
          String(val || '').toLowerCase().includes(texto),
        ),
      )
    }

    if (vistaActual === 'puestos') {
      if (!texto) return vehiculos
      return vehiculos.filter((v) =>
        [v.placa, v.marca, v.modelo, v.puesto_codigo].some((val) =>
          String(val || '').toLowerCase().includes(texto),
        ),
      )
    }

    if (vistaActual === 'historial') {
      if (!texto) return historialRegistros
      return historialRegistros.filter((h) =>
        [
          h.placa,
          h.propietario_nombre,
          h.puesto_codigo,
          h.fecha_entrada,
          h.fecha_salida,
        ].some((val) => String(val || '').toLowerCase().includes(texto)),
      )
    }

    // Por defecto: Vehículos
    if (!texto) return vehiculos
    return vehiculos.filter((v) =>
      [
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        v.propietario_nombre,
        obtenerCedulaEnmascarada(v),
        v.correo_institucional,
      ].some((val) => String(val || '').toLowerCase().includes(texto)),
    )
  }, [vehiculos, historialRegistros, busqueda, vistaActual])

  const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / registrosPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)

  const datosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return datosFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [datosFiltrados, paginaActual])

  const handleNuevo = () => {
    setVehiculoSeleccionado(null)
    setModalFormVisible(true)
  }

  const handleEditar = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo)
    setModalFormVisible(true)
  }

  const handleGuardar = async (formData) => {
    try {
      setMensajeExito('')
      setMensajeError('')
      if (vehiculoSeleccionado) {
        await actualizarVehiculo(vehiculoSeleccionado.id, formData)
        setMensajeExito('Registro actualizado con éxito.')
      } else {
        await crearVehiculo(formData)
        setMensajeExito('Nuevo vehículo agregado con éxito.')
      }
      setModalFormVisible(false)
    } catch (err) {
      setMensajeError('Error al guardar: ' + err.message)
    }
  }

  const handleConfirmarEliminar = (vehiculo) => {
    setVehiculoSeleccionado(vehiculo)
    setModalDeleteVisible(true)
  }

  const handleEliminar = async () => {
    try {
      setMensajeExito('')
      setMensajeError('')
      await eliminarVehiculo(vehiculoSeleccionado.id)
      setMensajeExito('Registro eliminado correctamente.')
      setModalDeleteVisible(false)
    } catch (err) {
      setMensajeError('Error al eliminar: ' + err.message)
    }
  }

  const titulosVista = {
    vehiculos: {
      titulo: 'Vehículos y propietarios',
      subtitulo: 'Vehículos autorizados en UTEQ Smart Parking',
    },
    puestos: {
      titulo: 'Puestos de Parqueadero',
      subtitulo: 'Estado de ocupación de espacios',
    },
    propietarios: {
      titulo: 'Propietarios',
      subtitulo: 'Directorio de usuarios y conductores institucionales',
    },
    historial: {
      titulo: 'Historial de Registros',
      subtitulo: 'Bitácora de entradas, salidas y tiempos de estancia en el parqueadero',
    },
  }

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <strong className="fs-5">{titulosVista[vistaActual].titulo}</strong>
          <div className="small text-body-secondary">
            {titulosVista[vistaActual].subtitulo}
          </div>
        </div>

        <div className="d-flex gap-2">
          {vistaActual === 'vehiculos' && (
            <CButton color="primary" onClick={handleNuevo} disabled={cargando || procesando}>
              <CIcon icon={cilPlus} className="me-1" /> Nuevo Vehículo
            </CButton>
          )}
          <CButton color="success" onClick={recargar} disabled={cargando || procesando}>
            <CIcon icon={cilReload} className="me-1" /> Actualizar
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        {mensajeExito && (
          <CAlert color="success" dismissible onClose={() => setMensajeExito('')}>
            {mensajeExito}
          </CAlert>
        )}
        {mensajeError && (
          <CAlert color="danger" dismissible onClose={() => setMensajeError('')}>
            {mensajeError}
          </CAlert>
        )}
        {!cargando && error && <CAlert color="danger">Error: {error}</CAlert>}

        <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
          <CFormInput
            type="search"
            placeholder="Buscar placa, vehículo o propietario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ maxWidth: '420px' }}
            disabled={cargando}
          />
          <span className="text-body-secondary fw-semibold">
            {datosFiltrados.length} vehículos
          </span>
        </div>

        {cargando ? (
          <div className="text-center py-5">
            <CSpinner color="success" />
            <p className="mt-3">Cargando datos...</p>
          </div>
        ) : (
          <>
            <CTable align="middle" bordered hover responsive striped>
              <CTableHead style={{ backgroundColor: '#1b2232', color: '#ffffff' }}>
                {vistaActual === 'vehiculos' && (
                  <CTableRow>
                    <CTableHeaderCell className="text-white">Foto del vehículo</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Placa</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Vehículo</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Año / color</CTableHeaderCell>
                    <CTableHeaderCell className="text-white text-center">Foto del propietario</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Propietario</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Cédula</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Correo</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Estado</CTableHeaderCell>
                    <CTableHeaderCell className="text-white text-center">Acciones</CTableHeaderCell>
                  </CTableRow>
                )}

                {vistaActual === 'puestos' && (
                  <CTableRow>
                    <CTableHeaderCell className="text-white">Placa</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Vehículo Asignado</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Propietario</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Estado Espacio</CTableHeaderCell>
                  </CTableRow>
                )}

                {vistaActual === 'propietarios' && (
                  <CTableRow>
                    <CTableHeaderCell className="text-white">Nombre del Propietario</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Correo Institucional</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Vehículo Registrado</CTableHeaderCell>
                    <CTableHeaderCell className="text-white text-center">Acciones</CTableHeaderCell>
                  </CTableRow>
                )}

                {vistaActual === 'historial' && (
                  <CTableRow>
                    <CTableHeaderCell className="text-white">Placa</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Propietario</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Puesto</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Fecha / Hora Entrada</CTableHeaderCell>
                    <CTableHeaderCell className="text-white">Fecha / Hora Salida</CTableHeaderCell>
                    <CTableHeaderCell className="text-white text-center">Estado Estancia</CTableHeaderCell>
                  </CTableRow>
                )}
              </CTableHead>

              <CTableBody>
                {datosPaginados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      No se encontraron registros.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  datosPaginados.map((item) => {
                    if (vistaActual === 'vehiculos') {
                      return (
                        <CTableRow key={item.id}>
                          {/* Foto vehículo */}
                          <CTableDataCell>
                            <img
                              src={item.foto_url || item.imagen_url || 'https://via.placeholder.com/100x65'}
                              alt={item.marca}
                              width="80"
                              height="50"
                              style={{ objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </CTableDataCell>

                          {/* Placa */}
                          <CTableDataCell>
                            <CBadge color="dark" className="px-2 py-1 fs-6">
                              {item.placa}
                            </CBadge>
                          </CTableDataCell>

                          {/* Vehículo */}
                          <CTableDataCell>
                            <strong>{item.marca}</strong>
                            <div className="small text-body-secondary">{item.modelo}</div>
                          </CTableDataCell>

                          {/* Año / color */}
                          <CTableDataCell>
                            {item.anio || item.year}
                            <div className="small text-body-secondary">{item.color}</div>
                          </CTableDataCell>

                          {/* Foto del propietario con dimensiones fijas y ajustadas */}
                          <CTableDataCell className="text-center">
                            <img
                              src={item.foto_propietario_url || item.avatar_url || 'https://via.placeholder.com/150'}
                              alt={item.propietario_nombre || 'Propietario'}
                              width="45"
                              height="45"
                              style={{
                                objectFit: 'cover',
                                borderRadius: '50%',
                                display: 'inline-block',
                              }}
                            />
                          </CTableDataCell>

                          {/* Propietario */}
                          <CTableDataCell className="fw-semibold text-uppercase">
                            {item.propietario_nombre || item.propietario || 'S/N'}
                          </CTableDataCell>

                          {/* Cédula directamente desde cedula_enmascarada */}
                          <CTableDataCell className="text-body-secondary">
                            {obtenerCedulaEnmascarada(item)}
                          </CTableDataCell>

                          {/* Correo */}
                          <CTableDataCell>
                            <a
                              href={`mailto:${item.correo_institucional || item.email}`}
                              className="text-decoration-underline"
                            >
                              {item.correo_institucional || item.email || 'N/A'}
                            </a>
                          </CTableDataCell>

                          {/* Estado */}
                          <CTableDataCell>
                            <CBadge color={item.autorizado !== false ? 'success' : 'danger'} className="px-2 py-1">
                              {item.autorizado !== false ? 'Autorizado' : 'No autorizado'}
                            </CBadge>
                          </CTableDataCell>

                          {/* Acciones */}
                          <CTableDataCell className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <CButton
                                color="warning"
                                size="sm"
                                title="Editar"
                                onClick={() => handleEditar(item)}
                                disabled={procesando}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                title="Eliminar"
                                onClick={() => handleConfirmarEliminar(item)}
                                disabled={procesando}
                              >
                                <CIcon icon={cilTrash} style={{ color: '#fff' }} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    }

                    if (vistaActual === 'puestos') {
                      return (
                        <CTableRow key={item.id}>
                          <CTableDataCell><CBadge color="dark">{item.placa}</CBadge></CTableDataCell>
                          <CTableDataCell><strong>{item.marca}</strong> {item.modelo}</CTableDataCell>
                          <CTableDataCell>{item.propietario_nombre}</CTableDataCell>
                          <CTableDataCell><CBadge color="success">Ocupado / Asignado</CBadge></CTableDataCell>
                        </CTableRow>
                      )
                    }

                    if (vistaActual === 'propietarios') {
                      return (
                        <CTableRow key={item.id}>
                          <CTableDataCell><strong>{item.propietario_nombre}</strong></CTableDataCell>
                          <CTableDataCell>{item.correo_institucional}</CTableDataCell>
                          <CTableDataCell>{item.marca} {item.modelo} ({item.placa})</CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CButton color="warning" size="sm" onClick={() => handleEditar(item)} disabled={procesando}><CIcon icon={cilPencil} /></CButton>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    }

                    if (vistaActual === 'historial') {
                      return (
                        <CTableRow key={item.id}>
                          <CTableDataCell><CBadge color="dark">{item.placa}</CBadge></CTableDataCell>
                          <CTableDataCell>{item.propietario_nombre || 'N/A'}</CTableDataCell>
                          <CTableDataCell>{item.puesto_codigo || 'A-01'}</CTableDataCell>
                          <CTableDataCell>{item.fecha_entrada}</CTableDataCell>
                          <CTableDataCell>{item.fecha_salida || '---'}</CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color={item.fecha_salida ? 'secondary' : 'success'}>
                              {item.fecha_salida ? 'Finalizado' : 'Dentro del parqueadero'}
                            </CBadge>
                          </CTableDataCell>
                        </CTableRow>
                      )
                    }

                    return null
                  })
                )}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center">
              <small className="text-body-secondary">Página {paginaActual} de {totalPaginas}</small>
              <div className="d-flex gap-2">
                <CButton color="secondary" variant="outline" disabled={paginaActual === 1 || procesando} onClick={() => setPagina((p) => Math.max(1, p - 1))}>Anterior</CButton>
                <CButton color="success" variant="outline" disabled={paginaActual === totalPaginas || procesando} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}>Siguiente</CButton>
              </div>
            </div>
          </>
        )}

        <ModalVehiculo
          visible={modalFormVisible}
          onClose={() => setModalFormVisible(false)}
          onSave={handleGuardar}
          vehiculoEditar={vehiculoSeleccionado}
          procesando={procesando}
        />

        <CModal visible={modalDeleteVisible} onClose={() => setModalDeleteVisible(false)}>
          <CModalHeader closeButton><CModalTitle>Confirmar Eliminación</CModalTitle></CModalHeader>
          <CModalBody>¿Está seguro de que desea eliminar el vehículo con placa <strong>{vehiculoSeleccionado?.placa}</strong>?</CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setModalDeleteVisible(false)} disabled={procesando}>Cancelar</CButton>
            <CButton color="danger" onClick={handleEliminar} disabled={procesando}>{procesando ? <CSpinner size="sm" /> : 'Confirmar'}</CButton>
          </CModalFooter>
        </CModal>
      </CCardBody>
    </CCard>
  )
}

export default ListaVehiculos