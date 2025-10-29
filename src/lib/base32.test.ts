import { describe, expect, it } from "vitest"
import { encodeBase32 } from "./base32"

const textEncoder = new TextEncoder()

describe('encodeBase32', () => {
  it('encodes ascii payload', () => {
    const input = textEncoder.encode('Hello World')
    expect(encodeBase32(input)).toBe('JBSWY3DPEBLW64TMMQ======')
  })

  it('encodes minimal payload without padding', () => {
    const hello = textEncoder.encode('Hello')
    expect(encodeBase32(hello)).toBe('JBSWY3DP')
  })

  it('returns null for nullish input', () => {
    expect(encodeBase32(null)).toBeNull()
    expect(encodeBase32(undefined)).toBeNull()
  })

  it('returns empty string for empty array', () => {
    expect(encodeBase32(new Uint8Array())).toBe('')
  })
})
