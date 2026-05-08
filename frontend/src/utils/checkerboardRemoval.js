const DEFAULT_SETTINGS = {
  strength: 78,
  sensitivity: 58,
  edgeSmoothing: 42,
}

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value))
}

function colorDistance(a, b) {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function pixelAt(data, width, x, y) {
  const index = (y * width + x) * 4
  return {
    r: data[index],
    g: data[index + 1],
    b: data[index + 2],
    a: data[index + 3],
  }
}

function averageColor(colors) {
  if (!colors.length) return { r: 255, g: 255, b: 255 }
  const total = colors.reduce(
    (sum, color) => ({
      r: sum.r + color.r,
      g: sum.g + color.g,
      b: sum.b + color.b,
    }),
    { r: 0, g: 0, b: 0 },
  )
  return {
    r: total.r / colors.length,
    g: total.g / colors.length,
    b: total.b / colors.length,
  }
}

function collectBorderSamples(imageData, step) {
  const { data, width, height } = imageData
  const samples = []

  for (let x = 0; x < width; x += step) {
    samples.push(pixelAt(data, width, x, 0), pixelAt(data, width, x, height - 1))
  }

  for (let y = 0; y < height; y += step) {
    samples.push(pixelAt(data, width, 0, y), pixelAt(data, width, width - 1, y))
  }

  return samples
}

function splitBackgroundColors(samples) {
  const sorted = [...samples].sort((a, b) => {
    const aa = a.r + a.g + a.b
    const bb = b.r + b.g + b.b
    return aa - bb
  })

  const third = Math.max(1, Math.floor(sorted.length / 3))
  const dark = averageColor(sorted.slice(0, third))
  const light = averageColor(sorted.slice(-third))
  return { dark, light }
}

function estimateGridSignal(samples, colors) {
  if (!samples.length) return 0

  const backgroundContrast = colorDistance(colors.dark, colors.light)
  if (backgroundContrast < 24) return 0

  let darkMatches = 0
  let lightMatches = 0
  const matches = samples.filter((sample) => {
    const darkDistance = colorDistance(sample, colors.dark)
    const lightDistance = colorDistance(sample, colors.light)
    const nearest = Math.min(darkDistance, lightDistance)

    if (nearest >= 36) return false
    if (darkDistance <= lightDistance) darkMatches += 1
    else lightMatches += 1
    return true
  }).length

  const matchedRatio = matches / samples.length
  const balance = Math.min(darkMatches, lightMatches) / Math.max(1, matches)
  if (balance < 0.22) return 0

  return matchedRatio * balance
}

function colorBrightness(color) {
  return (color.r + color.g + color.b) / 3
}

function estimateSolidLightBackground(samples) {
  if (!samples.length) return null

  const color = averageColor(samples)
  const distances = samples.map((sample) => colorDistance(sample, color))
  const averageDistance = distances.reduce((total, distance) => total + distance, 0) / distances.length
  const maxDistance = Math.max(...distances)
  const brightness = colorBrightness(color)

  if (brightness < 230 || averageDistance > 18 || maxDistance > 54) {
    return null
  }

  return {
    color,
    confidence: clamp((brightness - 230) / 25, 0, 1) * clamp((18 - averageDistance) / 18, 0, 1),
  }
}

function fadeBackgroundPixels(data, backgroundColors, settings) {
  const sensitivityThreshold = 18 + settings.sensitivity * 0.9
  const strengthFactor = settings.strength / 100
  const featherBand = 8 + settings.edgeSmoothing * 0.45
  let transparentPixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const color = { r: data[i], g: data[i + 1], b: data[i + 2] }
    const nearest = Math.min(...backgroundColors.map((backgroundColor) => colorDistance(color, backgroundColor)))

    if (nearest <= sensitivityThreshold) {
      const fade = clamp((nearest - (sensitivityThreshold - featherBand)) / featherBand, 0, 1)
      const alpha = Math.round(255 * fade * (1 - strengthFactor * 0.08))
      data[i + 3] = clamp(alpha)
      if (alpha < 24) transparentPixels += 1
    }
  }

  return transparentPixels
}

function smoothAlpha(data, width, height, passes) {
  if (passes <= 0) return

  let source = new Uint8ClampedArray(data)
  const target = new Uint8ClampedArray(data)

  for (let pass = 0; pass < passes; pass += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = (y * width + x) * 4
        const alpha = source[index + 3]

        if (alpha === 0 || alpha === 255) {
          target[index + 3] = alpha
          continue
        }

        let total = 0
        let count = 0
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            total += source[((y + oy) * width + (x + ox)) * 4 + 3]
            count += 1
          }
        }
        target[index + 3] = clamp(total / count)
      }
    }
    source = new Uint8ClampedArray(target)
  }

  data.set(source)
}

export function removeCheckerboardBackground(imageData, options = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...options }
  const { width, height } = imageData
  const output = new ImageData(new Uint8ClampedArray(imageData.data), width, height)
  const { data } = output
  const sampleStep = Math.max(2, Math.floor(Math.min(width, height) / 28))
  const samples = collectBorderSamples(imageData, sampleStep)
  const colors = splitBackgroundColors(samples)
  const signal = estimateGridSignal(samples, colors)
  const solidLightBackground = signal < 0.18 ? estimateSolidLightBackground(samples) : null

  if (signal < 0.18) {
    if (solidLightBackground) {
      const transparentPixels = fadeBackgroundPixels(data, [solidLightBackground.color], settings)
      smoothAlpha(data, width, height, Math.round(settings.edgeSmoothing / 30))

      return {
        imageData: output,
        detected: transparentPixels > width * height * 0.01,
        confidence: solidLightBackground.confidence,
        backgroundColors: {
          dark: solidLightBackground.color,
          light: solidLightBackground.color,
        },
      }
    }

    return {
      imageData: output,
      detected: false,
      confidence: signal,
      backgroundColors: colors,
    }
  }

  const transparentPixels = fadeBackgroundPixels(data, [colors.dark, colors.light], settings)

  smoothAlpha(data, width, height, Math.round(settings.edgeSmoothing / 30))

  return {
    imageData: output,
    detected: transparentPixels > width * height * 0.01,
    confidence: signal,
    backgroundColors: colors,
  }
}

export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG Blob 생성에 실패했습니다.'))
    }, 'image/png')
  })
}

export { DEFAULT_SETTINGS }
