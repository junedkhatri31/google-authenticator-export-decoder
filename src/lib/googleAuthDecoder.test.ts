import { describe, expect, it } from "vitest"
import fixtures from "../test-fixtures/test-qr-codes.json"
import { decodeExportUri } from "./googleAuthDecoder"

describe('googleAuthDecoder', () => {
  it('decodes single export payload', () => {
    const uri = fixtures['Google-auth-test-qr.png']
    const accounts = decodeExportUri(uri)

    expect(accounts).toHaveLength(3)
    expect(accounts[0]).toMatchObject({
      name: 'Test account 1',
      algorithm: 'SHA1',
      digits: 'SIX',
      totpSecret: 'JBSWY3APEHPK3PXI',
    })
    expect(accounts[2]).toMatchObject({
      name: 'Counter key 1',
      type: 'HOTP',
      counter: '1',
    })
  })

  it('handles multi-part exports', () => {
    const part1 = fixtures['Google-auth-test2-qr1.png']
    const part2 = fixtures['Google-auth-test2-qr2.png']

    expect(decodeExportUri(part1)).toHaveLength(10)
    expect(decodeExportUri(part2)).toHaveLength(2)
  })

  it('supports SHA512 accounts with 8 digits', () => {
    const uri = fixtures['Google-auth-test-sha512-8digit.png']
    const accounts = decodeExportUri(uri)

    expect(accounts).toEqual([
      expect.objectContaining({
        issuer: 'TOTPgenerator',
        algorithm: 'SHA512',
        digits: 'EIGHT',
        totpSecret: 'HVR4CFHAFOWFGGFAGSA5JVTIMMPG6GMT',
      }),
    ])
  })
})
