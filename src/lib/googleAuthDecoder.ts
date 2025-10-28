import { parse } from 'protobufjs'
import protoDefinition from './google_auth.proto?raw'
import { encodeBase32 } from './base32'

const root = parse(protoDefinition).root
const MigrationPayload = root.lookupType('googleauth.MigrationPayload')

export interface DecodedAccount {
  algorithm?: string
  digits?: string
  issuer?: string
  name?: string
  secret?: string
  type?: string
  counter?: string
  uniqueId?: string
  totpSecret: string | null
}

interface MigrationPayloadMessage {
  version?: number | string
  otpParameters: Array<Record<string, unknown>>
}

const toStringOptions = {
  longs: String,
  enums: String,
  bytes: String,
} as const

function base64ToBytes(base64: string): Uint8Array {
  const sanitized = base64.replace(/[\r\n\s]/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const output: number[] = []

  let buffer = 0
  let bits = 0

  for (const char of sanitized) {
    if (char === '=') {
      break
    }

    const value = alphabet.indexOf(char)
    if (value === -1) {
      continue
    }

    buffer = (buffer << 6) | value
    bits += 6

    if (bits >= 8) {
      bits -= 8
      const byte = (buffer >> bits) & 0xff
      output.push(byte)
    }
  }

  return Uint8Array.from(output)
}

function decodePayload(buffer: Uint8Array): MigrationPayloadMessage {
  const message = MigrationPayload.decode(buffer)
  const payload = MigrationPayload.toObject(message, toStringOptions) as MigrationPayloadMessage
  return {
    version: payload.version,
    otpParameters: payload.otpParameters ?? [],
  }
}

function toBase32(base64: string | undefined): string | null {
  if (!base64) {
    return null
  }
  const bytes = base64ToBytes(base64)
  return encodeBase32(bytes)
}

export function decodeDataParameter(dataParam: string): DecodedAccount[] {
  const decodedBuffer = base64ToBytes(decodeURIComponent(dataParam))
  const payload = decodePayload(decodedBuffer)

  const version = Number(payload.version)
  if (!Number.isNaN(version) && version !== 1) {
    console.warn(
      `Unexpected Google Authenticator payload version "${payload.version}". Results might be inaccurate.`,
    )
  }

  const accounts = payload.otpParameters.map((account) => {
    const typedAccount = account as Record<string, string | undefined>
    return {
      algorithm: typedAccount.algorithm,
      digits: typedAccount.digits,
      issuer: typedAccount.issuer,
      name: typedAccount.name,
      secret: typedAccount.secret,
      type: typedAccount.type,
      counter: typedAccount.counter,
      uniqueId: typedAccount.uniqueId,
      totpSecret: toBase32(typedAccount.secret),
    }
  })

  return accounts
}

export function decodeExportUri(uri: string): DecodedAccount[] {
  const url = new URL(uri)
  const dataParam = url.searchParams.get('data')

  if (!dataParam) {
    throw new Error('Invalid Google Authenticator export URI: missing data parameter.')
  }

  return decodeDataParameter(dataParam)
}
