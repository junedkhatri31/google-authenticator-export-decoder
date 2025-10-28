import type { RefObject } from 'react'
import type { ScanStatus } from '../types/scanner'

type CameraPreviewProps = {
  status: ScanStatus
  videoRef: RefObject<HTMLVideoElement | null>
  visible: boolean
}

export function CameraPreview({ status, videoRef, visible }: CameraPreviewProps) {
  if (!visible) {
    return null
  }

  return (
    <section className="rounded-[24px] bg-white/65 p-7 shadow-[0_20px_45px_rgba(11,69,96,0.18)] backdrop-blur-sm">
      <div
        className={`relative mx-auto h-[320px] max-h-[60vh] w-full max-w-[520px] overflow-hidden rounded-[20px] bg-gradient-to-br from-[rgba(31,106,141,0.25)] to-[rgba(12,64,86,0.5)] ${
          status === 'active' ? 'ring-4 ring-[#0ea5b9]/35' : ''
        } sm:h-[360px] md:h-[400px] lg:h-[430px]`}
      >
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        {status !== 'active' && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[rgba(8,61,82,0.35)] to-[rgba(28,100,128,0.5)] text-xs font-semibold uppercase tracking-[0.35em] text-white/85">
            Camera preview
          </div>
        )}
      </div>
    </section>
  )
}
