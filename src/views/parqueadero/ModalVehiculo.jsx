// src/views/parqueadero/ModalVehiculo.jsx
import React, { useEffect, useState } from 'react'
import {
  CButton,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'

const estadoInicial = {
  placa: '',
  marca: '',
  modelo: '',
  anio: new Date().getFullYear(),
  color: '',
  tipo: 'Automóvil',
  foto_url: '',
  foto_propietario_url: '',
  propietario_nombre: '',
  correo_institucional: '',
  autorizado: true,
}

const ModalVehiculo = ({ visible, onClose, onSave, vehiculoEditar, procesando }) => {
  const [formData, setFormData] = useState(estadoInicial)
  const [errores, setErrores] = useState({})

  // Cargar datos actuales cuando se selecciona editar
  useEffect(() => {
    if (vehiculoEditar) {
      // Nos aseguramos de copiar solo los campos requeridos y evitar enviar cedula_enmascarada
      const { cedula_enmascarada, ...datosLimpios } = vehiculoEditar
      setFormData({
        ...estadoInicial,
        ...datosLimpios,
        foto_url: datosLimpios.foto_url || '',
        foto_propietario_url: datosLimpios.foto_propietario_url || '',
      })
    } else {
      setFormData(estadoInicial)
    }
    setErrores({})
  }, [vehiculoEditar, visible])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const validar = () => {
    const nuevosErrores = {}
    const regexPlaca = /^[A-Z]{3}-\d{3,4}$/i
    const regexCorreo = /^[a-zA-Z0-9._%+-]+@uteq\.edu\.ec$/i

    if (!formData.placa.trim() || !regexPlaca.test(formData.placa)) {
      nuevosErrores.placa = 'Placa inválida (Ejemplo: ABC-1234)'
    }
    if (!formData.marca.trim()) nuevosErrores.marca = 'La marca es requerida'
    if (!formData.modelo.trim()) nuevosErrores.modelo = 'El modelo es requerido'
    if (!formData.propietario_nombre.trim()) nuevosErrores.propietario_nombre = 'El nombre es requerido'
    if (!formData.correo_institucional.trim() || !regexCorreo.test(formData.correo_institucional)) {
      nuevosErrores.correo_institucional = 'Debe ser correo institucional (@uteq.edu.ec)'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validar()) {
      // Clonamos formData y eliminamos cedula_enmascarada para evitar el error de Supabase
      const payload = { ...formData }
      delete payload.cedula_enmascarada

      // Si los campos de foto vienen vacíos, asignamos null
      payload.foto_url = payload.foto_url.trim() ? payload.foto_url.trim() : null
      payload.foto_propietario_url = payload.foto_propietario_url?.trim() ? payload.foto_propietario_url.trim() : null

      onSave(payload)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static" size="lg">
      <CModalHeader closeButton>
        <CModalTitle>
          {vehiculoEditar ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        </CModalTitle>
      </CModalHeader>

      <CForm onSubmit={handleSubmit}>
        <CModalBody className="row g-3">
          <div className="col-md-4">
            <CFormLabel>Placa *</CFormLabel>
            <CFormInput
              name="placa"
              placeholder="ABC-1234"
              value={formData.placa}
              onChange={handleChange}
              invalid={!!errores.placa}
              disabled={procesando}
            />
            {errores.placa && <div className="invalid-feedback">{errores.placa}</div>}
          </div>

          <div className="col-md-4">
            <CFormLabel>Marca *</CFormLabel>
            <CFormInput
              name="marca"
              placeholder="Toyota"
              value={formData.marca}
              onChange={handleChange}
              invalid={!!errores.marca}
              disabled={procesando}
            />
            {errores.marca && <div className="invalid-feedback">{errores.marca}</div>}
          </div>

          <div className="col-md-4">
            <CFormLabel>Modelo *</CFormLabel>
            <CFormInput
              name="modelo"
              placeholder="Corolla"
              value={formData.modelo}
              onChange={handleChange}
              invalid={!!errores.modelo}
              disabled={procesando}
            />
            {errores.modelo && <div className="invalid-feedback">{errores.modelo}</div>}
          </div>

          <div className="col-md-4">
            <CFormLabel>Año</CFormLabel>
            <CFormInput
              type="number"
              name="anio"
              value={formData.anio}
              onChange={handleChange}
              disabled={procesando}
            />
          </div>

          <div className="col-md-4">
            <CFormLabel>Color</CFormLabel>
            <CFormInput
              name="color"
              placeholder="Blanco"
              value={formData.color}
              onChange={handleChange}
              disabled={procesando}
            />
          </div>

          <div className="col-md-4">
            <CFormLabel>Tipo de Vehículo</CFormLabel>
            <CFormSelect name="tipo" value={formData.tipo} onChange={handleChange} disabled={procesando}>
              <option value="Automóvil">Automóvil</option>
              <option value="Motocicleta">Motocicleta</option>
              <option value="Camioneta">Camioneta</option>
              <option value="SUV">SUV</option>
            </CFormSelect>
          </div>

          <div className="col-md-6">
            <CFormLabel>Propietario *</CFormLabel>
            <CFormInput
              name="propietario_nombre"
              placeholder="Nombres Apellidos"
              value={formData.propietario_nombre}
              onChange={handleChange}
              invalid={!!errores.propietario_nombre}
              disabled={procesando}
            />
            {errores.propietario_nombre && (
              <div className="invalid-feedback">{errores.propietario_nombre}</div>
            )}
          </div>

          <div className="col-md-6">
            <CFormLabel>Correo Institucional *</CFormLabel>
            <CFormInput
              type="email"
              name="correo_institucional"
              placeholder="usuario@uteq.edu.ec"
              value={formData.correo_institucional}
              onChange={handleChange}
              invalid={!!errores.correo_institucional}
              disabled={procesando}
            />
            {errores.correo_institucional && (
              <div className="invalid-feedback">{errores.correo_institucional}</div>
            )}
          </div>

          <div className="col-md-12">
            <CFormLabel>URL Foto Vehículo (Opcional)</CFormLabel>
            <CFormInput
              name="foto_url"
              placeholder="https://... (Opcional)"
              value={formData.foto_url}
              onChange={handleChange}
              disabled={procesando}
            />
          </div>

          <div className="col-md-12 d-flex align-items-center mt-3">
            <CFormCheck
              id="autorizadoCheck"
              name="autorizado"
              label="Vehículo Autorizado"
              checked={formData.autorizado}
              onChange={handleChange}
              disabled={procesando}
            />
          </div>
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={procesando}>
            Cancelar
          </CButton>
          <CButton color="success" type="submit" disabled={procesando}>
            {procesando ? <CSpinner size="sm" /> : 'Guardar Cambios'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default ModalVehiculo