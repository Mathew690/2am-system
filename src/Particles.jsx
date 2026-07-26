import { useEffect, useRef } from 'react'

/**
 * Drifting green light particles — the "this thing is alive" background.
 * Deliberately restrained: it should read as ambience, never as a screensaver.
 *
 * - respects prefers-reduced-motion (renders one static frame instead)
 * - pauses entirely when the tab is hidden (no battery burn in a background tab)
 * - count scales with viewport so phones don't render desktop density
 */
export default function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let w = 0
    let h = 0
    let dots = []
    let raf = 0
    let running = true

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function seed() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      // a hidden/not-yet-composited tab can report 0 — bail and let the observer re-run us
      if (w < 1 || h < 1) return false
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // ~1 dot per 26k px², clamped — dense enough to feel alive, sparse enough to stay classy
      const count = Math.round(Math.min(70, Math.max(22, (w * h) / 26000)))

      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.6,
        // mostly upward drift, like embers
        vx: (Math.random() - 0.5) * 0.14,
        vy: -(Math.random() * 0.22 + 0.05),
        base: Math.random() * 0.35 + 0.15,
        // each dot breathes at its own pace
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.012 + 0.004,
      }))

      return true
    }

    function frame() {
      if (!w || !h) return

      ctx.clearRect(0, 0, w, h)

      for (const d of dots) {
        if (!reduced) {
          d.x += d.vx
          d.y += d.vy
          d.phase += d.speed

          // wrap around the edges so the field never empties out
          if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w }
          if (d.x < -10) d.x = w + 10
          if (d.x > w + 10) d.x = -10
        }

        const alpha = d.base * (0.55 + 0.45 * Math.sin(d.phase))

        // soft halo
        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 7)
        glow.addColorStop(0, `rgba(34, 197, 94, ${alpha * 0.5})`)
        glow.addColorStop(1, 'rgba(34, 197, 94, 0)')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r * 7, 0, Math.PI * 2)
        ctx.fill()

        // the light itself
        ctx.fillStyle = `rgba(134, 239, 172, ${alpha})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reduced && running) raf = requestAnimationFrame(frame)
    }

    function onVisibility() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
        raf = 0
      } else {
        running = true
        remeasure() // the viewport may have changed while we were hidden
        if (!reduced && !raf) raf = requestAnimationFrame(frame)
      }
    }

    let resizeTimer = 0
    function remeasure() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        // nothing to do if the viewport is the same size we already drew for
        if (window.innerWidth === w && window.innerHeight === h) return
        if (!seed()) return
        // a static frame is enough when motion is reduced; otherwise resume the loop
        if (reduced) frame()
        else if (running && !raf) raf = requestAnimationFrame(frame)
      }, 120)
    }

    if (seed()) frame()

    // window resize covers ordinary resizes/rotations; the observer additionally catches
    // the 0×0 → real-size transition when the page lays out while hidden
    const ro = new ResizeObserver(remeasure)
    ro.observe(document.documentElement)
    window.addEventListener('resize', remeasure)
    window.addEventListener('orientationchange', remeasure)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      ro.disconnect()
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('orientationchange', remeasure)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />
}
