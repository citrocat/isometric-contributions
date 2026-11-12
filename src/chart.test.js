/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createIsometricChart,
  getCanvasPoint,
  getCubeHeight,
  getDayTooltip,
  pickCube
} from './chart.js'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('height scaling', () => {
  it('keeps capped counts higher than smaller exact counts', () => {
    expect(getCubeHeight(100, 100)).toBe(103)
    expect(getCubeHeight(98, 100)).toBe(101)
    expect(getCubeHeight(86, 100)).toBe(89)
    expect(getCubeHeight(100, 1000)).toBe(13)
  })

  it('renders empty or missing counts as a base without NaN', () => {
    expect(getCubeHeight(0, 0)).toBe(3)
    expect(getCubeHeight(0, 100)).toBe(3)
    expect(getCubeHeight(undefined, 100)).toBe(3)
  })
})

describe('pixel picking', () => {
  const cube = (alpha) => ({
    x: 10,
    y: 20,
    width: 2,
    height: 2,
    pixels: new Uint8ClampedArray(alpha.flatMap((a) => [0, 128, 0, a]))
  })

  it('selects the frontmost opaque face, letting transparent corners through', () => {
    const back = cube([255, 255, 255, 255])
    const front = cube([0, 255, 255, 0])
    expect(pickCube([back, front], 11.5, 20.5)).toBe(front)
    expect(pickCube([back, front], 10.5, 20.5)).toBe(back)
    expect(pickCube([back, front], 11.5, 21.5)).toBe(back)
    expect(pickCube([front], 10.5, 20.5)).toBeNull()
  })

  it('ignores empty space and points outside sprite bounds', () => {
    const cubes = [cube([255, 255, 255, 255])]
    expect(pickCube(cubes, 9.9, 20)).toBeNull()
    expect(pickCube(cubes, 12, 20)).toBeNull()
    expect(pickCube(cubes, 10, 22)).toBeNull()
  })

  it('maps responsive CSS coordinates into the canvas backing store', () => {
    const canvas = {
      width: 1000,
      height: 600,
      getBoundingClientRect: () => ({
        left: 200,
        top: 100,
        width: 500,
        height: 300
      })
    }
    expect(getCanvasPoint(canvas, 650, 350)).toEqual({ x: 900, y: 500 })
  })
})

it('preserves GitHub tooltip wording, including zero and capped counts', () => {
  for (const tooltip of [
    '100+ contributions on November 12th.',
    'No contributions on November 1st.'
  ]) {
    expect(getDayTooltip({ tooltip })).toBe(tooltip)
  }
  expect(getDayTooltip({ date: new Date('2026-11-12'), count: 1 })).toBe(
    '1 contribution on November 12, 2026.'
  )
})

it('clears hover on leave, Escape, rerender and destroy without leaking listeners', () => {
  const context = {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray([0, 128, 0, 255]) })
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
  vi.stubGlobal('obelisk', {
    CubeDimension: class {},
    CubeColor: class {
      getByHorizontalColor() {
        return 0
      }
    },
    Cube: class {},
    Point3D: class {},
    PixelObject: class {
      constructor() {
        this.x = 0
        this.y = 0
        this.canvas = document.createElement('canvas')
        this.canvas.width = 1
        this.canvas.height = 1
      }
    }
  })
  document.body.innerHTML =
    '<div><canvas width="1000" height="600"></canvas></div>'
  const canvas = document.querySelector('canvas')
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 1000,
    height: 600
  })
  const chart = createIsometricChart(canvas)
  const weeks = [
    [
      {
        date: new Date('2026-11-12'),
        count: 100,
        color: '008000',
        tooltip: '100+ contributions on November 12th.'
      }
    ]
  ]
  chart.render(weeks, 100)
  const tooltip = document.querySelector('[role="tooltip"]')
  const hover = () =>
    canvas.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 130, clientY: 110 })
    )
  hover()
  expect(tooltip.hidden).toBe(false)
  expect(tooltip.textContent).toBe(weeks[0][0].tooltip)
  canvas.dispatchEvent(new Event('pointerleave'))
  expect(tooltip.hidden).toBe(true)
  hover()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(tooltip.hidden).toBe(true)
  hover()
  chart.render(weeks, 100)
  expect(tooltip.hidden).toBe(true)
  hover()
  window.dispatchEvent(new Event('resize'))
  expect(tooltip.hidden).toBe(true)
  chart.destroy()
  context.drawImage.mockClear()
  hover()
  window.dispatchEvent(new Event('scroll'))
  expect(context.drawImage).not.toHaveBeenCalled()
  expect(document.querySelector('[role="tooltip"]')).toBeNull()
})
