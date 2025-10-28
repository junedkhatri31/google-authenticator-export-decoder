import type { RefObject } from 'react'
import { InfoTooltip } from './InfoTooltip'
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
      <div className="mb-5 flex items-center gap-2 text-sm text-[#043a4e]">
        <InfoTooltip
          label="How to export accounts from Google Authenticator"
          content={(
            <div className="space-y-2">
              <p className="font-semibold text-[#043a4e]">Google Authenticator steps</p>
              <ol className="list-decimal space-y-1 pl-4 text-[#064257]">
                <li>Open the app → <strong>Transfer codes</strong>.</li>
                <li>Select <strong>Export accounts</strong> and choose what to move.</li>
                <li>When the migration QR appears, hold it up to this camera preview.</li>
              </ol>
            </div>
          )}
        />
        <span className="rounded-full bg-white/80 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#0a6078]">Export steps</span>
      </div>
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
