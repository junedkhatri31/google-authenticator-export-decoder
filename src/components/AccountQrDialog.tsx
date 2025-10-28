import { useEffect, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import QRCode from 'qrcode-generator'
import type { DecodedAccount } from '../lib/googleAuthDecoder'

type AccountQrDialogProps = {
  account: DecodedAccount | null
  onClose: () => void
}

function mapDigits(digits?: string) {
  switch (digits) {
    case 'EIGHT':
      return 8
    case 'SEVEN':
      return 7
    default:
      return 6
  }
}

function mapType(type?: string) {
  if (!type) {
    return 'totp'
  }
  return type.toLowerCase()
}

function buildOtpAuthUri(account: DecodedAccount | null): string | null {
  if (!account || !account.totpSecret) {
    return null
  }

  const type = mapType(account.type)
  const issuer = account.issuer?.trim() ?? ''
  const name = account.name?.trim() ?? ''
  const label = encodeURIComponent(
    issuer && name ? `${issuer}:${name}` : issuer || name || 'Account',
  )

  const params = new URLSearchParams()
  params.set('secret', account.totpSecret)

  if (issuer) {
    params.set('issuer', issuer)
  }

  const digits = mapDigits(account.digits)
  if (digits !== 6) {
    params.set('digits', String(digits))
  }

  if (account.algorithm && account.algorithm !== 'SHA1') {
    params.set('algorithm', account.algorithm)
  }

  if (type === 'hotp') {
    if (account.counter) {
      params.set('counter', account.counter)
    }
  } else {
    params.set('period', '30')
  }

  return `otpauth://${type}/${label}?${params.toString()}`
}

export function AccountQrDialog({ account, onClose }: AccountQrDialogProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [account])

  const otpAuthUri = useMemo(() => buildOtpAuthUri(account), [account])

  const qrDataUrl = useMemo(() => {
    if (!otpAuthUri) {
      return null
    }
    const qr = QRCode(0, 'M')
    qr.addData(otpAuthUri)
    qr.make()
    return qr.createDataURL(8)
  }, [otpAuthUri])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (account) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [account, onClose])

  if (!account || !otpAuthUri) {
    return null
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(otpAuthUri)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (copyError) {
      console.error('Unable to copy URI to clipboard', copyError)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02121a]/70 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-br from-white/95 via-[#f0fbff] to-white/90 p-8 text-[#062a38] shadow-[0_28px_80px_rgba(4,33,44,0.35)]">
        <button
          type="button"
          className="absolute right-4 top-4 cursor-pointer rounded-full bg-[#0c4a5f]/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#0c4a5f] transition-colors hover:bg-[#0c4a5f]/20"
          onClick={onClose}
        >
          Close
        </button>
        <header className="mb-6 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#0c5d77]/70">
            Authenticator QR
          </p>
          <h3 className="text-2xl font-semibold text-[#043245]">
            {account.name || 'Unnamed account'}
          </h3>
          {account.issuer && (
            <span className="text-sm font-medium uppercase tracking-[0.25em] text-[#0a6d8b]/80">
              {account.issuer}
            </span>
          )}
        </header>

        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Authenticator QR code"
              className="h-52 w-52 rounded-2xl border border-[#0f728f]/15 bg-white p-3 shadow-[0_16px_35px_rgba(9,86,108,0.18)]"
            />
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-dashed border-[#0f728f]/30 text-center text-sm text-[#0f728f]/70">
              Unable to render QR code.
            </div>
          )}

          <div className="w-full rounded-2xl bg-[#e5f9ff] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0d546d]/70">
              otpauth URI
            </p>
            <p className="mt-2 break-words font-mono text-sm text-[#033043]">{otpAuthUri}</p>
            <button
              type="button"
              className="mt-3 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#0ea5b9] to-[#0f7a9c] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(7,96,122,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(7,96,122,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0c95a1]"
              onClick={() => void handleCopy()}
            >
              {copied ? 'Copied!' : 'Copy URI'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
