import { useCallback, useEffect, useState } from 'react'
import QrScanner from 'qr-scanner'

export type CameraDevice = {
  id: string
  label: string
}

type UseCamerasResult = {
  cameras: CameraDevice[]
  selectedCameraId: string | null
  setSelectedCameraId: (cameraId: string | null) => void
  refreshCameras: () => Promise<string | null>
}

export function useCameras(): UseCamerasResult {
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)

  const refreshCameras = useCallback(async () => {
    try {
      const devices = await QrScanner.listCameras(true)
      setCameras(devices)

      let nextSelectedId: string | null = null

      setSelectedCameraId((current) => {
        if (current && devices.some((device) => device.id === current)) {
          nextSelectedId = current
          return current
        }

        nextSelectedId = devices[0]?.id ?? null
        return nextSelectedId
      })

      return nextSelectedId
    } catch (error) {
      console.error('Unable to list cameras', error)
      setCameras([])
      setSelectedCameraId(null)
      return null
    }
  }, [])

  useEffect(() => {
    void refreshCameras()
  }, [refreshCameras])

  return {
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    refreshCameras,
  }
}
