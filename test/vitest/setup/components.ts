import { vi } from "vitest"
import "@testing-library/jest-dom"

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock hasPointerCapture/releasePointerCapture/setPointerCapture
Element.prototype.hasPointerCapture = vi.fn(() => false)
Element.prototype.releasePointerCapture = vi.fn()
Element.prototype.setPointerCapture = vi.fn()
