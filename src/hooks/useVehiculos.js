// src/hooks/useVehiculos.js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLUMNAS_PUBLICAS = `
  id,
  placa,
  marca,
  modelo,
  anio,
  color,
  tipo,
  foto_url,
  foto_fuente_url,
  foto_propietario_url,
  cedula_enmascarada,
  propietario_nombre,
  correo_institucional,
  autorizado
`

export const useVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  // Cargar lista de vehículos
  const cargarVehiculos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error: errorSupabase } = await supabase
      .from('vehiculos')
      .select(COLUMNAS_PUBLICAS)
      .order('propietario_nombre', { ascending: true })

    if (errorSupabase) {
      setVehiculos([])
      setError(errorSupabase.message)
    } else {
      setVehiculos(data ?? [])
    }

    setCargando(false)
  }, [])

  useEffect(() => {
    cargarVehiculos()
  }, [cargarVehiculos])

  // Crear un nuevo vehículo y propietario
  const crearVehiculo = async (nuevoVehiculo) => {
    setProcesando(true)
    const { data, error: errorSupabase } = await supabase
      .from('vehiculos')
      .insert([nuevoVehiculo])
      .select(COLUMNAS_PUBLICAS)

    setProcesando(false)
    if (errorSupabase) throw new Error(errorSupabase.message)
    await cargarVehiculos()
    return data
  }

  // Actualizar vehículo existente
  const actualizarVehiculo = async (id, datosActualizados) => {
    setProcesando(true)
    const { data, error: errorSupabase } = await supabase
      .from('vehiculos')
      .update(datosActualizados)
      .eq('id', id)
      .select(COLUMNAS_PUBLICAS)

    setProcesando(false)
    if (errorSupabase) throw new Error(errorSupabase.message)
    await cargarVehiculos()
    return data
  }

  // Eliminar vehículo
  const eliminarVehiculo = async (id) => {
    setProcesando(true)
    const { error: errorSupabase } = await supabase
      .from('vehiculos')
      .delete()
      .eq('id', id)

    setProcesando(false)
    if (errorSupabase) throw new Error(errorSupabase.message)
    await cargarVehiculos()
  }

  return {
    vehiculos,
    cargando,
    procesando,
    error,
    recargar: cargarVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
  }
}