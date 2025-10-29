import { afterAll, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { act } from 'react'
import { render } from 'vitest-browser-react'
import QrScanner from 'qr-scanner'
import App from './App.tsx'
import './index.css'

const {
  enumerateDevicesMock,
  getUserMediaMock,
} = vi.hoisted(() => {
  const qrImageUrl = new URL('./test-fixtures/qr-code.jpg', import.meta.url).href

  let qrImagePromise: Promise<HTMLImageElement> | null = null

  function loadQrImage() {
    if (!qrImagePromise) {
      qrImagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.src = qrImageUrl
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Failed to load mock QR image'))
      })
    }
    return qrImagePromise
  }

  async function createMockCameraStream() {
    const image = await loadQrImage()

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width || 512
    canvas.height = image.naturalHeight || image.height || 512

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Unable to acquire 2D context for mock camera stream')
    }

    const drawFrame = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
    }

    drawFrame()
    const frameInterval = window.setInterval(drawFrame, 1000 / 24)

    const stream = canvas.captureStream()
    const [track] = stream.getVideoTracks()
    if (track) {
      const originalStop = track.stop.bind(track)
      track.stop = () => {
        window.clearInterval(frameInterval)
        originalStop()
      }
    }

    return stream
  }

  const mockCameraDevice = {
    deviceId: 'mock-camera-id',
    kind: 'videoinput',
    label: 'Mock Camera',
    groupId: 'mock-group',
    toJSON() {
      return this
    },
  } as MediaDeviceInfo

  const enumerateDevicesMock = vi.fn(async () => [mockCameraDevice])
  const getUserMediaMock = vi.fn(async () => createMockCameraStream())

  return {
    createMockCameraStream,
    mockCameraDevice,
    enumerateDevicesMock,
    getUserMediaMock,
  }
})

type TextQueryRoot = Document | Element

type WaitOptions = {
  timeout?: number
  interval?: number
}

type WaitForTextOptions = WaitOptions & {
  exact?: boolean
}

function normalize(text: string | null | undefined) {
  return text ? text.replace(/\s+/g, ' ').trim() : ''
}

function collectElements(root: TextQueryRoot) {
  if (root instanceof Document) {
    const elements: Element[] = []
    if (root.body) {
      elements.push(root.body)
      elements.push(...Array.from(root.body.querySelectorAll('*')))
    } else if (root.documentElement) {
      elements.push(root.documentElement)
      elements.push(...Array.from(root.documentElement.querySelectorAll('*')))
    }
    return elements
  }

  return [root, ...Array.from(root.querySelectorAll('*'))]
}

function getByText(root: TextQueryRoot, text: string, options: { exact?: boolean } = {}) {
  const { exact = true } = options
  const expected = exact ? normalize(text) : text

  for (const element of collectElements(root)) {
    const actual = normalize(element.textContent)
    if (exact ? actual === expected : actual.includes(expected)) {
      return element
    }
  }

  return null
}

function queryButtonByText(root: TextQueryRoot, text: string) {
  const normalizedText = normalize(text)
  const searchRoot =
    root instanceof Document
      ? root.body ?? root.documentElement
      : root

  if (!searchRoot) {
    return null
  }

  return Array.from(searchRoot.querySelectorAll('button')).find(
    (button) => normalize(button.textContent) === normalizedText,
  ) ?? null
}

async function waitFor<T>(
  predicate: () => T | null | undefined,
  { timeout = 8000, interval = 20 }: WaitOptions = {},
) {
  const start = performance.now()

  return new Promise<T>((resolve, reject) => {
    const check = () => {
      let result: T | null | undefined
      try {
        act(() => {
          result = predicate()
        })
      } catch {
        result = null
      }

      if (result) {
        resolve(result)
        return
      }

      if (performance.now() - start >= timeout) {
        reject(new Error('Timed out waiting for condition'))
        return
      }

      setTimeout(check, interval)
    }

    check()
  })
}

function waitForText(root: TextQueryRoot, text: string, options: WaitForTextOptions = {}) {
  const { exact, timeout, interval } = options
  return waitFor(
    () => getByText(root, text, { exact }),
    {
      timeout,
      interval,
    },
  )
}

let originalMediaDevices: MediaDevices | undefined
let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame | undefined

beforeAll(() => {
  originalMediaDevices = navigator.mediaDevices
  originalRequestAnimationFrame = globalThis.requestAnimationFrame

  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
      globalThis.setTimeout(() => callback(performance.now()), 16)
  }

  const mediaDevices = {
    getUserMedia: getUserMediaMock,
    enumerateDevices: enumerateDevicesMock,
    getSupportedConstraints: vi.fn(() => ({ facingMode: true })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
    ondevicechange: null,
  } satisfies Partial<MediaDevices>

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: mediaDevices as unknown as MediaDevices,
  })
})

beforeEach(() => {
  enumerateDevicesMock.mockClear()
  getUserMediaMock.mockClear()
})

afterAll(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: originalMediaDevices,
  })

  if (originalRequestAnimationFrame) {
    globalThis.requestAnimationFrame = originalRequestAnimationFrame
  }
})

test('renders idle state with camera selector ready', async () => {
  const { baseElement } = await render(<App />)

  const statusHint = await waitForText(
    baseElement,
    'Ready when you are. Start scanning to grant camera access.',
  )
  expect(statusHint).toBeInstanceOf(HTMLElement)

  const startButton = await waitFor<HTMLButtonElement | null>(() =>
    queryButtonByText(baseElement, 'Start Scanning'),
  )
  expect(startButton).toBeInstanceOf(HTMLButtonElement)

  const cameraLabel = await waitForText(baseElement, 'Camera Source')
  expect(cameraLabel).toBeInstanceOf(HTMLElement)

  const cameraSelect = baseElement.querySelector('select')
  expect(cameraSelect).toBeInstanceOf(HTMLSelectElement)
  const optionTexts = Array.from((cameraSelect as HTMLSelectElement).options).map((option) =>
    normalize(option.textContent),
  )
  expect(optionTexts).toContain('Mock Camera')
})

test('starts scanning and renders decoded accounts after a successful scan', async () => {
  const stopSpy = vi.spyOn(QrScanner.prototype, 'stop')

  try {
    const { baseElement } = await render(<App />)

    const startButton = await waitFor<HTMLButtonElement | null>(() =>
      queryButtonByText(baseElement, 'Start Scanning'),
    )
    expect(startButton).toBeInstanceOf(HTMLButtonElement)

    await act(async () => {
      startButton?.click()
    })

    const stopButton = await waitFor<HTMLButtonElement | null>(() =>
      queryButtonByText(baseElement, 'Stop Scanner'),
    )
    expect(stopButton).toBeInstanceOf(HTMLButtonElement)

    const requestingHint = await waitForText(baseElement, 'Requesting camera access...', {
      timeout: 5000,
    })
    expect(requestingHint).toBeInstanceOf(HTMLElement)

    const activeHint = await waitForText(
      baseElement,
      'Hold the Google Authenticator export QR inside the frame.',
      { timeout: 5000 },
    )
    expect(activeHint).toBeInstanceOf(HTMLElement)

    const decodedHint = await waitForText(
      baseElement,
      'Secrets decoded. Review and copy them carefully.',
      { timeout: 12000 },
    )
    expect(decodedHint).toBeInstanceOf(HTMLElement)

    const scanAgainButton = await waitFor<HTMLButtonElement | null>(
      () => queryButtonByText(baseElement, 'Scan Another Code'),
      { timeout: 5000 },
    )
    expect(scanAgainButton).toBeInstanceOf(HTMLButtonElement)

    expect(stopSpy).toHaveBeenCalled()

    const decodedHeader = await waitForText(baseElement, 'Decoded Accounts')
    expect(decodedHeader).toBeInstanceOf(HTMLElement)

    const decodedSection = decodedHeader?.closest('section')
    expect(decodedSection).toBeInstanceOf(HTMLElement)

    const accountCards = await waitFor<HTMLElement[]>(() => {
      if (!decodedSection) {
        return null
      }
      const cards = decodedSection.querySelectorAll('article')
      return cards.length > 0 ? (Array.from(cards) as HTMLElement[]) : null
    })
    expect(accountCards.length).toBe(3)

    const accountCountBadge = decodedSection?.querySelector('span.rounded-full')
    expect(accountCountBadge).toBeInstanceOf(HTMLElement)
    expect(normalize(accountCountBadge?.textContent ?? '')).toBe('3 found')

    const firstCard = accountCards[0]
    const firstCardTitle = normalize(firstCard.querySelector('h3')?.textContent ?? '')
    expect(firstCardTitle).toBe('Test account 1')

    const monoValues = Array.from(firstCard.querySelectorAll('.font-mono')).map((el) =>
      normalize(el.textContent ?? ''),
    )
    const base32Secret = monoValues.find((value) => /^[A-Z2-7]+=*$/.test(value))
    expect(base32Secret).toBe('JBSWY3APEHPK3PXI')

    const showButtons = accountCards.map((card) =>
      normalize(card.querySelector('button')?.textContent ?? ''),
    )
    expect(showButtons).toEqual(['Show QR Code', 'Show QR Code', 'Show QR Code'])

    const showQrButton = await waitFor<HTMLButtonElement | null>(
      () => queryButtonByText(baseElement, 'Show QR Code'),
      { timeout: 5000 },
    )
    expect(showQrButton).toBeInstanceOf(HTMLButtonElement)

    await act(async () => {
      showQrButton?.click()
    })

    const qrImage = await waitFor<Element | null>(
      () => baseElement.querySelector('img[alt="Authenticator QR code"]'),
      { timeout: 5000 },
    )
    expect(qrImage).toBeInstanceOf(HTMLImageElement)
    expect((qrImage as HTMLImageElement)?.src).toMatch(/^data:image\//)
    expect(qrImage?.closest('[role="dialog"]')).not.toBeNull()
  } finally {
    stopSpy.mockRestore()
  }
})
