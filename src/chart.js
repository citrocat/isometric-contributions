const SIZE = 16
const MAX_HEIGHT = 100
const BASE_HEIGHT = 3
// Leave room for a maximum-height bar even in the first week.
const ORIGIN = { x: 130, y: 110 }

export const getCubeHeight = (count, maxCount) => {
  if (!Number.isFinite(count) || count <= 0 || maxCount <= 0) {
    return BASE_HEIGHT
  }
  return BASE_HEIGHT + Math.floor((MAX_HEIGHT * count) / maxCount)
}

// Read the same opaque sprite pixels that are drawn, from front to back.
// Bounding boxes alone would also hit transparent corners and hidden bars.
export const pickCube = (cubes, x, y) => {
  for (let i = cubes.length - 1; i >= 0; i--) {
    const cube = cubes[i]
    const localX = Math.floor(x - cube.x)
    const localY = Math.floor(y - cube.y)
    if (
      localX >= 0 &&
      localY >= 0 &&
      localX < cube.width &&
      localY < cube.height &&
      cube.pixels[(localY * cube.width + localX) * 4 + 3] > 0
    ) {
      return cube
    }
  }
  return null
}

export const getCanvasPoint = (canvas, clientX, clientY) => {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) * canvas.width) / rect.width,
    y: ((clientY - rect.top) * canvas.height) / rect.height
  }
}

const tooltipDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC'
})

export const getDayTooltip = (day) => {
  if (day.tooltip) return day.tooltip
  const date = tooltipDateFormat.format(day.date)
  if (!Number.isFinite(day.count)) {
    return `Contribution count unavailable on ${date}.`
  }
  const count = `${day.count.toLocaleString('en-US')}${day.countIsLowerBound ? '+' : ''}`
  return `${count} contribution${day.count === 1 ? '' : 's'} on ${date}.`
}

export const createIsometricChart = (canvas) => {
  const context = canvas.getContext('2d')
  const tooltip = document.createElement('div')
  tooltip.id = 'ic-contribution-tooltip'
  tooltip.className = 'ic-contribution-tooltip'
  tooltip.setAttribute('role', 'tooltip')
  tooltip.hidden = true
  canvas.after(tooltip)

  let cubes = []
  let hovered = null

  const draw = () => {
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = false
    for (const cube of cubes) {
      context.save()
      if (cube === hovered) {
        context.shadowColor = '#7ee78799'
        context.shadowBlur = 8
        context.filter = 'brightness(1.25)'
      }
      context.drawImage(cube.sprite, cube.x, cube.y)
      context.restore()
    }
  }

  const clearHover = () => {
    const needsRedraw = hovered !== null
    hovered = null
    tooltip.hidden = true
    canvas.removeAttribute('aria-describedby')
    if (needsRedraw) draw()
  }

  const onPointerMove = (event) => {
    const point = getCanvasPoint(canvas, event.clientX, event.clientY)
    const next = pickCube(cubes, point.x, point.y)
    if (next !== hovered) {
      hovered = next
      draw()
    }
    if (!hovered) {
      clearHover()
      return
    }

    tooltip.textContent = getDayTooltip(hovered.day)
    tooltip.hidden = false
    canvas.setAttribute('aria-describedby', tooltip.id)
    const bounds = canvas.parentElement.getBoundingClientRect()
    const gap = 12
    const left = event.clientX - bounds.left - tooltip.offsetWidth / 2
    tooltip.style.left = `${Math.max(0, Math.min(left, bounds.width - tooltip.offsetWidth))}px`
    const above = event.clientY - bounds.top - tooltip.offsetHeight - gap
    tooltip.style.top = `${above >= 0 ? above : event.clientY - bounds.top + gap}px`
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') clearHover()
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerleave', clearHover)
  canvas.addEventListener('pointercancel', clearHover)
  // A fixed pointer no longer identifies the same bar after scrolling/resizing.
  window.addEventListener('scroll', clearHover, true)
  window.addEventListener('resize', clearHover)
  window.addEventListener('blur', clearHover)
  document.addEventListener('keydown', onKeyDown)

  return {
    clearHover,
    render(weeks, maxCount) {
      clearHover()
      cubes = []
      for (const [weekIndex, week] of weeks.entries()) {
        for (const day of week) {
          const dimension = new obelisk.CubeDimension(
            SIZE,
            SIZE,
            getCubeHeight(day.count, maxCount)
          )
          const color = new obelisk.CubeColor().getByHorizontalColor(
            Number.parseInt(day.color, 16)
          )
          const cube = new obelisk.Cube(dimension, color, false)
          const position = new obelisk.Point3D(
            (SIZE * 14 * (weekIndex + 1)) / 15,
            // The first displayed week can start midweek.
            (SIZE * 13 * day.date.getUTCDay()) / 14,
            0
          )
          const pixel = new obelisk.PixelObject(cube, position)
          const sprite = pixel.canvas
          cubes.push({
            day,
            sprite,
            x: Math.round(ORIGIN.x + pixel.x),
            y: Math.round(ORIGIN.y + pixel.y),
            width: sprite.width,
            height: sprite.height,
            pixels: sprite
              .getContext('2d')
              .getImageData(0, 0, sprite.width, sprite.height).data
          })
        }
      }
      draw()
    },
    destroy() {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', clearHover)
      canvas.removeEventListener('pointercancel', clearHover)
      window.removeEventListener('scroll', clearHover, true)
      window.removeEventListener('resize', clearHover)
      window.removeEventListener('blur', clearHover)
      document.removeEventListener('keydown', onKeyDown)
      canvas.removeAttribute('aria-describedby')
      tooltip.remove()
      cubes = []
      hovered = null
    }
  }
}
