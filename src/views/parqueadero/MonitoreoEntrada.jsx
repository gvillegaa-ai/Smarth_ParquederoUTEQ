import React, { useState, useRef, useEffect } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CButton,
  CAlert,
  CSpinner,
  CBadge,
  CFormInput,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCamera,
  cilCheckCircle,
  cilWarning,
  cilBan,
  cilReload,
  cilDescription,
  cilSpeedometer,
  cilCarAlt,
  cilUser,
  cilBadge,
} from '@coreui/icons'

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4 MiB

export default function MonitoreoEntrada() {
  const [cameraActive, setCameraActive] = useState(false)
  const [selectedBlob, setSelectedBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [result, setResult] = useState(null)

  const videoRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Control de la cámara con soporte para cámara posterior en móviles
  const startCamera = async () => {
    setErrorMessage(null)
    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
        })
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      mediaStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      setErrorMessage('No se pudo acceder a la cámara. Verifique los permisos o el protocolo HTTPS.')
    }
  }

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Liberar cámara al desmontar el componente
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // Imprime en consola la respuesta exacta del backend para depuración
  useEffect(() => {
    if (result) {
      console.log('=== RESPUESTA COMPLETA DE SUPABASE / API OCR ===')
      console.log(JSON.stringify(result, null, 2))
    }
  }, [result])

  // Captura de imagen desde la cámara
  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setSelectedBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
        stopCamera()
      }
    }, 'image/jpeg', 0.95)
  }

  // Selección de archivo local (JPG / PNG)
  const handleFileSelect = (e) => {
    setErrorMessage(null)
    const file = e.target.files[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrorMessage('Formato no permitido. Solo se admiten archivos JPG y PNG.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('El tamaño de la imagen supera el límite máximo permitido de 4 MiB.')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedBlob(file)
    setPreviewUrl(URL.createObjectURL(file))
    if (cameraActive) stopCamera()
  }

  // Envío al endpoint REST de Azure
  const processImage = async () => {
    if (!selectedBlob) return

    setLoading(true)
    setErrorMessage(null)
    setResult(null)

    const endpoint = import.meta.env.VITE_OCR_ENDPOINT

    if (!endpoint) {
      setErrorMessage('Error: VITE_OCR_ENDPOINT no está configurado en las variables de entorno.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': selectedBlob.type || 'application/octet-stream',
        },
        body: selectedBlob,
      })

      if (!response.ok) {
        if (response.status === 400) throw new Error('400: Imagen vacía, inválida o dimensiones no permitidas.')
        if (response.status === 413) throw new Error('413: La imagen enviada supera los 4 MiB.')
        if (response.status === 415) throw new Error('415: Formato de imagen no admitido.')
        if (response.status === 502) throw new Error('502: Fallo del servicio OCR o de Supabase.')
        if (response.status === 504) throw new Error('504: Tiempo de espera agotado.')
        throw new Error(`Error HTTP ${response.status}: Error al procesar la imagen.`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setErrorMessage(err.message || 'Error de conexión con la API.')
    } finally {
      setLoading(false)
    }
  }

  const resetAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setResult(null)
    setSelectedBlob(null)
    setPreviewUrl(null)
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Formateador seguro de cédula (admite enmascaramiento o números enteros)
  const formatCedula = (cedulaRaw) => {
    if (cedulaRaw === null || cedulaRaw === undefined) return '-'
    const str = String(cedulaRaw).trim()
    if (!str) return '-'
    // Si contiene asteriscos (enmascarada), la devuelve tal cual
    if (str.includes('*')) return str
    // Si es numérica pura, asegura formato estándar de 10 dígitos
    const digits = str.replace(/\D/g, '')
    if (!digits) return str
    return digits.padStart(10, '0')
  }

  // Búsqueda recursiva de la cédula en el JSON de respuesta
  const findCedulaInObject = (obj) => {
    if (!obj || typeof obj !== 'object') return null
    const targetKeys = ['cedula', 'identificacion', 'ci', 'num_cedula', 'cedula_propietario', 'numero_cedula', 'dni']

    for (const key of Object.keys(obj)) {
      if (targetKeys.includes(key.toLowerCase()) && obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        return obj[key]
      }
    }

    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const found = findCedulaInObject(obj[key])
        if (found) return found
      }
    }
    return null
  }

  // Extracción de datos del vehículo y propietario
  const vehiculoData = result?.vehiculo || result?.vehiculo_encontrado || result?.data || {}
  const propietarioData = vehiculoData.propietario || result?.propietario || {}

  const nombrePropietario =
    (typeof propietarioData === 'string' ? propietarioData : null) ||
    propietarioData.nombre_completo ||
    propietarioData.nombre ||
    propietarioData.nombres ||
    vehiculoData.propietario_nombre ||
    vehiculoData.propietario ||
    '-'

  const rawCedula = findCedulaInObject(result)
  const cedulaPropietarioDisplay = formatCedula(rawCedula)

  const fotoPropietarioUrl =
    propietarioData.foto_propietario_url ||
    propietarioData.foto_url ||
    propietarioData.foto ||
    vehiculoData.foto_propietario_url ||
    vehiculoData.foto_propietario ||
    result?.foto_propietario_url ||
    null

  const fotoVehiculoUrl =
    vehiculoData.foto_vehiculo_url ||
    vehiculoData.foto_vehiculo ||
    vehiculoData.foto_url ||
    result?.foto_vehiculo_url ||
    null

  const isAutorizado = result?.estado === 'encontrado' || !!result?.vehiculo_encontrado

  return (
    <CRow>
      {/* PARTE IZQUIERDA: Captura o Selección de Vehículo */}
      <CCol md={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Captura / Selección de Vehículo</strong>
          </CCardHeader>
          <CCardBody>
            {cameraActive && (
              <div className="mb-3 bg-dark rounded text-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '320px', objectFit: 'contain' }}
                />
              </div>
            )}

            {!cameraActive && previewUrl && (
              <div className="mb-3 text-center bg-light p-2 rounded border">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }}
                />
              </div>
            )}

            <div className="d-grid gap-2 mb-3">
              {!cameraActive ? (
                <CButton color="primary" onClick={startCamera} disabled={loading}>
                  <CIcon icon={cilCamera} className="me-2" /> Activar Cámara
                </CButton>
              ) : (
                <>
                  <CButton color="success" onClick={capturePhoto} disabled={loading}>
                    Capturar Fotografía
                  </CButton>
                  <CButton color="secondary" onClick={stopCamera} disabled={loading}>
                    Detener Cámara
                  </CButton>
                </>
              )}

              <CFormInput
                type="file"
                accept="image/jpeg, image/png"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={loading}
              />

              <CButton
                color="warning"
                size="lg"
                onClick={processImage}
                disabled={!selectedBlob || loading}
                className="text-white mt-2"
              >
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" /> Procesando imagen...
                  </>
                ) : (
                  'Detectar placa'
                )}
              </CButton>
            </div>

            {errorMessage && <CAlert color="danger">{errorMessage}</CAlert>}
          </CCardBody>
        </CCard>
      </CCol>

      {/* PARTE DERECHA: Resultados */}
      <CCol md={6}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Resultados del Monitoreo</strong>
          </CCardHeader>
          <CCardBody>
            {!result && !loading && (
              <div className="text-center text-muted py-5">
                Suba o capture una fotografía y presione <strong>Detectar placa</strong> para ver el resultado.
              </div>
            )}

            {loading && (
              <div className="text-center py-5">
                <CSpinner color="primary" />
                <p className="mt-2 text-muted">Consultando OCR y Supabase...</p>
              </div>
            )}

            {result && (
              <div>
                {result.imagen_marcada?.base64 && (
                  <div className="text-center mb-3 bg-light p-2 rounded border">
                    <img
                      src={`data:${result.imagen_marcada.mime_type || 'image/jpeg'};base64,${result.imagen_marcada.base64}`}
                      alt="Vehículo con placa detectada"
                      className="img-fluid rounded"
                      style={{ maxHeight: '240px', objectFit: 'contain' }}
                    />
                  </div>
                )}

                {result.estado === 'sin_placa' && (
                  <CAlert color="warning" className="mb-3">
                    <CIcon icon={cilWarning} className="me-2" />
                    <strong>No se detectó ninguna placa en la imagen.</strong>
                  </CAlert>
                )}

                {result.estado === 'baja_confianza' && (
                  <CAlert color="warning" className="mb-3">
                    <CIcon icon={cilWarning} className="me-2" />
                    <strong>Lectura con baja confianza.</strong> Capture la imagen de nuevo.
                  </CAlert>
                )}

                {result.estado === 'multiples_placas' && (
                  <CAlert color="info" className="mb-3">
                    <CIcon icon={cilWarning} className="me-2" />
                    <strong>Se detectaron múltiples placas.</strong> Intente enfocar solo un vehículo.
                  </CAlert>
                )}

                {result.estado !== 'sin_placa' && (
                  <div
                    className={`p-3 rounded text-white fw-bold d-flex align-items-center mb-3 ${
                      isAutorizado ? 'bg-success' : 'bg-danger'
                    }`}
                  >
                    <CIcon
                      icon={isAutorizado ? cilCheckCircle : cilBan}
                      size="xl"
                      className="me-2"
                    />
                    <span className="fs-6">
                      {isAutorizado ? 'VEHÍCULO AUTORIZADO' : 'VEHÍCULO NO REGISTRADO / NO AUTORIZADO'}
                    </span>
                  </div>
                )}

                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-3">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '45%' }}>
                          <CIcon icon={cilDescription} className="me-2" /> Placa reconocida
                        </td>
                        <td className="fw-bold text-end fs-5">
                          <CBadge color="dark" className="px-3 py-2">
                            {result.placa || vehiculoData.placa || 'N/A'}
                          </CBadge>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilSpeedometer} className="me-2" /> Confianza OCR
                        </td>
                        <td className="fw-bold text-end">
                          {result.confianza ? `${result.confianza}%` : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilCarAlt} className="me-2" /> Marca
                        </td>
                        <td className="fw-bold text-end">
                          {vehiculoData.marca || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilCarAlt} className="me-2" /> Modelo
                        </td>
                        <td className="fw-bold text-end">
                          {vehiculoData.modelo || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilCarAlt} className="me-2" /> Año
                        </td>
                        <td className="fw-bold text-end">
                          {vehiculoData.anio || vehiculoData.year || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilCarAlt} className="me-2" /> Color
                        </td>
                        <td className="fw-bold text-end">
                          {vehiculoData.color || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilCarAlt} className="me-2" /> Tipo de vehículo
                        </td>
                        <td className="fw-bold text-end">
                          {vehiculoData.tipo_vehiculo || vehiculoData.tipo || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilUser} className="me-2" /> Propietario
                        </td>
                        <td className="fw-bold text-end">
                          {nombrePropietario}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilBadge} className="me-2" /> Cédula
                        </td>
                        <td className="fw-bold text-end">
                          {cedulaPropietarioDisplay}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <CIcon icon={cilCheckCircle} className="me-2" /> Autorización
                        </td>
                        <td className="text-end">
                          <CBadge color={isAutorizado ? 'success' : 'danger'}>
                            {isAutorizado
                              ? vehiculoData.estado_autorizacion || 'Autorizado'
                              : 'No Autorizado'}
                          </CBadge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <CRow className="mt-3 g-3">
                  <CCol xs={6} className="text-center">
                    <small className="d-block text-muted mb-1 fw-bold">Foto del Vehículo</small>
                    <div
                      className="bg-light border rounded overflow-hidden d-flex align-items-center justify-content-center p-1"
                      style={{ height: '170px' }}
                    >
                      {fotoVehiculoUrl ? (
                        <img
                          src={fotoVehiculoUrl}
                          alt="Foto del Vehículo"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '4px',
                          }}
                        />
                      ) : (
                        <span className="text-muted small">Sin foto de vehículo</span>
                      )}
                    </div>
                  </CCol>

                  <CCol xs={6} className="text-center">
                    <small className="d-block text-muted mb-1 fw-bold">Foto del Propietario</small>
                    <div
                      className="bg-light border rounded overflow-hidden d-flex align-items-center justify-content-center p-1"
                      style={{ height: '170px' }}
                    >
                      {fotoPropietarioUrl ? (
                        <img
                          src={fotoPropietarioUrl}
                          alt="Foto del Propietario"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '4px',
                          }}
                        />
                      ) : (
                        <span className="text-muted small">Sin foto de propietario</span>
                      )}
                    </div>
                  </CCol>
                </CRow>

                <div className="d-grid gap-2 mt-4">
                  <CButton color="dark" variant="outline" onClick={resetAll}>
                    <CIcon icon={cilReload} className="me-2" /> Procesar otra imagen
                  </CButton>
                </div>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}