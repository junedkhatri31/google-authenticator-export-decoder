import { useState } from 'react'
import type { DecodedAccount } from '../lib/googleAuthDecoder'
import { AccountQrDialog } from './AccountQrDialog'

type DecodedAccountsProps = {
  accounts: DecodedAccount[]
}

export function DecodedAccounts({ accounts }: DecodedAccountsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (accounts.length === 0) {
    return null
  }

  const selectedAccount =
    selectedIndex !== null && accounts[selectedIndex] ? accounts[selectedIndex] : null

  return (
    <>
      <section className="flex flex-col gap-6 text-[#e0f7ff]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold uppercase tracking-[0.4em] text-white drop-shadow-[0_8px_20px_rgba(7,34,46,0.45)]">
            Decoded Accounts
          </h2>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            {accounts.length} found
          </span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
          {accounts.map((account, index) => {
            const hasSecret = Boolean(account.totpSecret)

            return (
              <article
                className="flex flex-col gap-4 rounded-[20px] bg-linear-to-br from-white/90 via-[#e0faff]/95 to-[#d9f6ff]/95 p-6 text-[#0d2a36] shadow-[0_16px_30px_rgba(15,80,102,0.16)]"
                key={`${account.name}-${index}`}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-[#0d3746]">
                    {account.name || 'Unnamed account'}
                  </h3>
                  {account.issuer && (
                    <span className="w-fit rounded-full bg-[rgba(8,120,145,0.12)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[#086079]">
                      {account.issuer}
                    </span>
                  )}
                </div>
                <dl className="grid gap-2">
                  {account.totpSecret && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f5066]">
                        Secret (Base32)
                      </dt>
                      <dd className="font-mono text-sm text-[#0d2a36] break-all leading-relaxed bg-white/90 rounded px-3 py-1 shadow-inner">{account.totpSecret}</dd>
                    </>
                  )}
                  {account.algorithm && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f5066]">
                        Algorithm
                      </dt>
                      <dd className="font-mono text-sm text-[#0d2a36]">{account.algorithm}</dd>
                    </>
                  )}
                  {account.type && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f5066]">
                        Type
                      </dt>
                      <dd className="font-mono text-sm text-[#0d2a36]">{account.type}</dd>
                    </>
                  )}
                  {account.digits && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f5066]">
                        Digits
                      </dt>
                      <dd className="font-mono text-sm text-[#0d2a36]">{account.digits}</dd>
                    </>
                  )}
                  {account.counter && (
                    <>
                      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0f5066]">
                        Counter
                      </dt>
                      <dd className="font-mono text-sm text-[#0d2a36]">{account.counter}</dd>
                    </>
                  )}
                </dl>

                <button
                  type="button"
                  className="mt-2 w-full cursor-pointer rounded-full bg-linear-to-r from-[#0ea5b9] to-[#0f7a9c] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(7,96,122,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(7,96,122,0.32)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0c95a1] disabled:cursor-not-allowed disabled:bg-[#0b5f78]/40 disabled:text-white/60 disabled:shadow-none"
                  onClick={() => setSelectedIndex(index)}
                  disabled={!hasSecret}
                >
                  {hasSecret ? 'Show QR Code' : 'Secret unavailable'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <AccountQrDialog account={selectedAccount} onClose={() => setSelectedIndex(null)} />
    </>
  )
}
