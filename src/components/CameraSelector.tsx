import type { ChangeEvent } from 'react'
import type { CameraDevice } from '../hooks/useCameras'

type CameraSelectorProps = {
  cameras: CameraDevice[]
  value: string | null
  onChange: (cameraId: string | null) => void
  disabled?: boolean
}

export function CameraSelector({ cameras, value, onChange, disabled }: CameraSelectorProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const cameraId = event.target.value || null
    onChange(cameraId)
  }

  if (cameras.length === 0) {
    return (
      <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-[#d2eff6]/80">
        No camera detected yet. Connect a camera or grant permission to your browser.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-[#97d7ea]">
        Camera Source
      </label>
      <div className="relative">
        <select
          className="w-full cursor-pointer rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_25px_rgba(13,73,91,0.18)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c95a1]"
          value={value ?? cameras[0]?.id ?? ''}
          onChange={handleChange}
          disabled={disabled}
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id} className='text-black'>
              {camera.label || 'Unnamed camera'}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
