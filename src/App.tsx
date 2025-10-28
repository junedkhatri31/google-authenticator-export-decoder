import { useEffect, useMemo, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import workerUrl from 'qr-scanner/qr-scanner-worker.min?url'
import { decodeExportUri, type DecodedAccount } from './lib/googleAuthDecoder'
import { CameraSelector } from './components/CameraSelector'
import { CameraPreview } from './components/CameraPreview'
import { DecodedAccounts } from './components/DecodedAccounts'
import { useCameras } from './hooks/useCameras'
import type { ScanStatus } from './types/scanner'

QrScanner.WORKER_PATH = workerUrl

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const scannerRef = useRef<QrScanner | null>(null)

  const [status, setStatus] = useState<ScanStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<DecodedAccount[]>([])
  const { cameras, selectedCameraId, setSelectedCameraId, refreshCameras } = useCameras()

  const statusHint = useMemo(() => {
    switch (status) {
      case 'idle':
        return 'Ready when you are. Start scanning to grant camera access.'
      case 'requesting':
        return 'Requesting camera access...'
      case 'active':
        return error ?? 'Hold the Google Authenticator export QR inside the frame.'
      case 'decoded':
        return 'Secrets decoded. Review and copy them carefully.'
      case 'denied':
        return 'Camera permission denied. Please enable it in your browser settings.'
      case 'no-camera':
        return 'No camera detected. Connect one and try again.'
      case 'error':
        return error
      default:
        return null
    }
  }, [status, error])

  useEffect(() => {
    return () => {
      scannerRef.current?.destroy()
      scannerRef.current = null
    }
  }, [])

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop()
    } catch {
      // ignore stop errors
    }
  }

  const handleDecode = async (text: string) => {
    try {
      const decoded = decodeExportUri(text)
      setAccounts(decoded)
      setStatus('decoded')
      setError(null)
      await stopScanner()
    } catch (decodeError) {
      console.error('Unable to decode QR payload', decodeError)
      setError('Scanned code was not a Google Authenticator export.')
    }
  }

  const startScanner = async () => {
    setStatus('requesting')
    setError(null)

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })

    const videoElement = videoRef.current
    if (!videoElement) {
      setStatus('error')
      setError('Camera preview is not ready. Please try again.')
      return
    }

    try {
      const preferredCameraId = await refreshCameras()

      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        setStatus('no-camera')
        return
      }

      const preferredCameraFromState = preferredCameraId ?? selectedCameraId
      const cameraPreference = preferredCameraFromState ?? 'environment'

      scannerRef.current?.destroy()

      const scanner = new QrScanner(
        videoElement,
        (result) => {
          const text = typeof result === 'string' ? result : result?.data
          if (text) {
            void handleDecode(text)
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
          preferredCamera: cameraPreference,
        },
      )

      scannerRef.current = scanner

      await scanner.start()

      if (preferredCameraFromState) {
        try {
          await scanner.setCamera(preferredCameraFromState)
        } catch (cameraError) {
          console.error('Unable to use preferred camera', cameraError)
        }
      }

      setStatus('active')
      setError(null)

      void refreshCameras()
    } catch (startError) {
      const err = startError as Error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus('denied')
        setError('Camera permission denied.')
      } else {
        setStatus('error')
        setError(err.message || 'Unable to start camera.')
      }
    }
  }

  const handleReset = async () => {
    setAccounts([])
    setStatus('idle')
    setError(null)
    await stopScanner()
  }

  const handleCameraSelect = async (cameraId: string | null) => {
    setSelectedCameraId(cameraId)

    if (!cameraId) {
      return
    }

    if (scannerRef.current && status === 'active') {
      try {
        await scannerRef.current.setCamera(cameraId)
        setError(null)
      } catch (cameraError) {
        console.error('Unable to switch camera', cameraError)
        setError('Unable to switch camera. Please try again.')
      }
    }
  }

  const handleStartClick = async () => {
    if (status === 'decoded') {
      setAccounts([])
    }
    await startScanner()
  }

  const statusColor =
    status === 'denied' || status === 'error' || status === 'no-camera'
      ? 'text-[#ffd6ce]'
      : 'text-[#c9e6f0]'

  const shouldShowScanner = status !== 'decoded'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-10 px-6 py-12 xl:px-12">
      <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex w-full flex-col gap-6 text-[#f3fcff] lg:sticky lg:top-12 lg:max-w-sm">
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[#97d7ea]/80">
              Google Authenticator
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight drop-shadow-[0_6px_18px_rgba(7,34,46,0.4)] lg:text-5xl">
              Authenticator Export Decoder
            </h1>
          </div>
          <p className="text-base text-[#d2eff6]/90 lg:text-lg">
            Scan the QR export from Google Authenticator to reveal the underlying secret keys and
            metadata. Keep this page private while you decode.
          </p>
        </header>

        <CameraSelector
          cameras={cameras}
          value={selectedCameraId}
          onChange={(cameraId) => void handleCameraSelect(cameraId)}
          disabled={status === 'requesting'}
        />

        <div className="flex flex-wrap items-center gap-3">
          {status !== 'active' && status !== 'requesting' ? (
            <button
              className="cursor-pointer rounded-full bg-linear-to-r from-[#0ea5b9] to-[#0f7a9c] px-7 py-3 font-semibold text-white shadow-[0_12px_24px_rgba(7,96,122,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(7,96,122,0.32)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0c95a1]"
              type="button"
              onClick={() => void handleStartClick()}
            >
              {status === 'decoded' ? 'Scan Another Code' : 'Start Scanning'}
            </button>
          ) : (
            <button
              className="cursor-pointer rounded-full bg-linear-to-r from-[#ff715b] to-[#ef4444] px-7 py-3 font-semibold text-white shadow-[0_12px_24px_rgba(191,46,46,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(191,46,46,0.32)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fb9484]"
              type="button"
              onClick={() => void handleReset()}
            >
              Stop Scanner
            </button>
          )}
          {status === 'decoded' && (
            <button
              className="cursor-pointer rounded-full border border-[rgba(12,100,130,0.2)] bg-white/45 px-6 py-3 font-semibold text-[#0f5066] transition-colors duration-200 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0c95a1]"
              type="button"
              onClick={() => void handleReset()}
            >
              Reset
            </button>
          )}
        </div>

        {statusHint && (
          <p className={`text-sm font-medium ${statusColor}`}>{statusHint}</p>
        )}

        <a
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(7,70,92,0.25)] transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0c95a1]"
          href="https://github.com/junedkhatri31/google-authenticator-export-decoder"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src="/github-mark-white.svg"
            alt=""
            className="h-4 w-4"
          />
          View on GitHub
        </a>

      </div>

        <main className="flex w-full flex-col gap-8 lg:flex-1">
          <CameraPreview status={status} videoRef={videoRef} visible={shouldShowScanner} />
          <DecodedAccounts accounts={accounts} />
        </main>
      </div>

      <section className="grid gap-4 rounded-2xl bg-white/85 p-5 text-left text-[#0b2a36] shadow-[0_18px_40px_rgba(10,56,70,0.18)]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0a5f79]">
          Why Trust This Tool?
        </h2>
        <div className="grid gap-3 text-sm">
          <p className="rounded-xl bg-[#f0fbff] px-4 py-3 font-medium leading-snug text-[#053546]">
            <span className="mr-2 inline-flex items-center rounded-full bg-[#0ea5b9]/18 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#05647c]">
              Privacy Focused
            </span>
            All decoding happens locally in your browser. No data ever leaves this window.
          </p>
          <p className="rounded-xl bg-[#f0fbff] px-4 py-3 font-medium leading-snug text-[#053546]">
            <span className="mr-2 inline-flex items-center rounded-full bg-[#0ea5b9]/18 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#05647c]">
              Completely Offline
            </span>
            Works even without internet once loaded. Perfect for sensitive migrations.
          </p>
          <p className="rounded-xl bg-[#f0fbff] px-4 py-3 font-medium leading-snug text-[#053546]">
            <span className="mr-2 inline-flex items-center rounded-full bg-[#0ea5b9]/18 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#05647c]">
              Transparent Process
            </span>
            Built with open libraries and protobuf decoding aligned with Google’s export format.
          </p>
          <p className="rounded-xl bg-[#f0fbff] px-4 py-3 font-medium leading-snug text-[#053546]">
            <span className="mr-2 inline-flex items-center rounded-full bg-[#0ea5b9]/18 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#05647c]">
              Open Source
            </span>
            Review or contribute on GitHub — every line of code is available for inspection and reuse.
          </p>
        </div>
        <p className="rounded-xl border border-[#0ea5b9]/20 bg-white px-4 py-3 text-xs font-medium leading-relaxed text-[#0b2a36]/80">
          This project is an independent community effort and is not affiliated with Google or the
          Google Authenticator team.
        </p>
      </section>
    </div>
  )
}

export default App
