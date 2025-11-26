import lottie from 'lottie-web'

const LottieInView = (root=document) => {
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
	const disposers = []

	;[...root.querySelectorAll('[data-lottie],[data-lottie-src]')].forEach(el => {
        const src = el.dataset.lottieSrc || el.getAttribute('data-lottie')
        if (!src) return
        const loop = el.dataset.loop !== 'false'
        const speed = Number(el.dataset.speed || 1)
        const restart = el.dataset.restart === 'true'
        const inst = lottie.loadAnimation({ container: el, renderer: 'svg', loop, autoplay: !reduce, path: src })
        inst.setSpeed(speed)

        if (reduce) {
            disposers.push(() => inst.destroy())
            return
        }

        const io = new IntersectionObserver(e => {
            if (e[0].isIntersecting) {
                if (restart) inst.goToAndPlay(0, true)
                else inst.play()
            } else {
                inst.pause()
            }
        },{ threshold: 0.3 })

        io.observe(el)
        disposers.push(() => { io.disconnect(); inst.destroy() })
    })

	return () => disposers.forEach(f => f && f())
}

export default (root=document) => {
	const disposeLottie = LottieInView(root)
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
	const disposers = []
	const ease = t => 1 - Math.pow(1 - t, 3)

	;[...root.querySelectorAll('.possibilities-stats__values')].forEach(block => {
		const dur = Number(block.dataset.dur || 900)
		const stagger = Number(block.dataset.stagger || 80)
		const items = [...block.querySelectorAll('.possibilities-stats__values-item')]
		if (!reduce) items.forEach(it => { it.style.opacity='0'; it.style.transform='translateY(10px)' })

		items.forEach((it, idx) => {
			const am = it.querySelector('.possibilities-stats__values-amount')
			const numEl = am?.querySelector('span')
			if (!numEl) return
			const raw = (numEl.textContent || '').trim()
			const hasPercent = raw.includes('%')
			const sep = raw.includes(',') ? ',' : '.'
			const target = parseFloat(raw.replace('%','').replace(',','.')) || 0
			const decimals = (raw.replace('%','').match(/[.,](\d+)/)?.[1]?.length) || 0
			const fmt = v => {
				let s = v.toFixed(decimals)
				if (sep === ',') s = s.replace('.',',')
				return hasPercent ? s + '%' : s
			}

			if (reduce) { numEl.textContent = fmt(target); it.style.opacity=''; it.style.transform=''; return }

			let raf = 0, t0 = 0, started = false
			const step = ts => {
				if (!t0) t0 = ts
				const p = Math.min(1,(ts - t0)/dur)
				const k = ease(p)
				if (p >= 1) numEl.textContent = fmt(target)
				else numEl.textContent = fmt(target*k)
				if (p<1) raf = requestAnimationFrame(step)
			}
			const io = new IntersectionObserver(e => {
				if (!e[0].isIntersecting || started) return
				started = true
				const delay = idx * stagger
				it.style.transition = `opacity .5s ease ${delay}ms, transform .5s ease ${delay}ms`
				it.style.opacity = '1'
				it.style.transform = 'none'
				setTimeout(() => { t0 = 0; raf = requestAnimationFrame(step) }, delay)
				io.disconnect()
			},{ threshold: 0.3 })
			io.observe(it)
			disposers.push(() => cancelAnimationFrame(raf))
		})
	})

	;[...root.querySelectorAll('.possibilities-stats__data')].forEach(block => {
		const svg = block.querySelector('svg')
		if (!svg) return
		const arc = svg.querySelector('path[stroke="#FFFD80"]')
		const bars = [...svg.querySelectorAll('path[stroke]:not([stroke="white"]):not([stroke="#2B2B33"])')].filter(p => {
			const d = p.getAttribute('d') || ''
			return /^M\s*([0-9.]+)\s+95L\1\s+([0-9.]+)/.test(d)
		})
		const target = Number(block.dataset.kk || 2000)
		const dur = Number(block.dataset.dur || 1200)
		const cx = Number(block.dataset.kkx || 58)
		const cy = Number(block.dataset.kky || 82)

		let val = svg.querySelector('[data-gauge-value]')
		if (!val) {
			val = document.createElementNS('http://www.w3.org/2000/svg','text')
			val.setAttribute('data-gauge-value','')
			val.setAttribute('x', String(cx))
			val.setAttribute('y', String(cy))
			val.setAttribute('text-anchor','middle')
			val.setAttribute('font-size','22')
			val.setAttribute('fill','#fff')
			val.textContent = '0'
			svg.appendChild(val)
		}

		const prep = el => {
			if (!el) return { L: 0 }
			const L = el.getTotalLength()
			el.style.strokeDasharray = String(L)
			el.style.strokeDashoffset = String(L)
			return { L }
		}
		const arcMeta = prep(arc)
		const barsMeta = bars.map(prep)

		if (!reduce) { block.style.opacity='0'; block.style.transform='translateY(12px)' }
		else {
			if (arc) arc.style.strokeDashoffset='0'
			bars.forEach(b=>b.style.strokeDashoffset='0')
			val.textContent=String(target)
		}

		let raf = 0, t0 = 0, started = false
		const animate = ts => {
			if (!t0) t0 = ts
			const p = Math.min(1,(ts - t0)/dur)
			const k = ease(p)
			if (arc) arc.style.strokeDashoffset = String(arcMeta.L*(1-k))
			bars.forEach((b, i) => { b.style.strokeDashoffset = String(barsMeta[i].L*(1-k)) })
			val.textContent = String(p>=1 ? target : Math.round(target*k))
			if (p<1) raf = requestAnimationFrame(animate)
		}

		const io = new IntersectionObserver(e => {
			if (!e[0].isIntersecting || started) return
			started = true
			if (!reduce) {
				block.style.transition = 'opacity .5s ease, transform .5s ease'
				block.style.opacity = '1'
				block.style.transform = 'none'
				setTimeout(() => { t0 = 0; raf = requestAnimationFrame(animate) }, 40)
			}
			io.disconnect()
		},{ threshold: 0.35 })
		io.observe(block)
		disposers.push(() => cancelAnimationFrame(raf))
	})

	;[...root.querySelectorAll('.possibilities-stats__weight, .stats__weight')].forEach(block => {
		const svg = block.querySelector('svg')
		if (!svg) return
		const lines = Array.from(svg.querySelectorAll('line[stroke="#B7FF00"]'))
		const dots = Array.from(svg.querySelectorAll('circle[fill="#B7FF00"]'))
		const animations = []

		const lenOfLine = ln => {
			const x1 = parseFloat(ln.getAttribute('x1') || '0')
			const y1 = parseFloat(ln.getAttribute('y1') || '0')
			const x2 = parseFloat(ln.getAttribute('x2') || '0')
			const y2 = parseFloat(ln.getAttribute('y2') || '0')
			return Math.hypot(x2 - x1, y2 - y1) || 0
		}

		if (reduce) {
			lines.forEach(ln => {
				const L = lenOfLine(ln)
				ln.style.strokeDasharray = `${L}`
				ln.style.strokeDashoffset = '0'
			})
			return
		}

		lines.forEach(ln => {
			const L = lenOfLine(ln) || 200
			ln.style.strokeDasharray = `${L}`
			ln.style.strokeDashoffset = `${L}`
			const a = ln.animate(
				[{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
				{ duration: Number(block.dataset.linesDur || 1600), iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
			)
			a.pause()
			animations.push(a)
		})

		dots.forEach(c => {
			c.style.transformBox = 'fill-box'
			c.style.transformOrigin = '50% 50%'
			const a = c.animate(
				[{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
				{ duration: Number(block.dataset.dotsDur || 1200), iterations: Infinity, easing: 'ease-in-out' }
			)
			a.pause()
			animations.push(a)
		})

		const io = new IntersectionObserver(e => {
			if (e[0].isIntersecting) animations.forEach(a => a.play())
			else animations.forEach(a => a.pause())
		},{ threshold: 0.35 })

		io.observe(block)
		disposers.push(() => { io.disconnect(); animations.forEach(a => a.cancel()) })
	})

	;[...root.querySelectorAll('.possibilities-timer')].forEach(block => {
		const el = block.querySelector('.possibilities-timer__value')
		if (!el) return

		const toSec = s => {
			const m = String(s || '').trim().match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
			if (!m) return 0
			return (+m[1])*3600 + (+m[2])*60 + (+m[3])
		}
		const pad = v => (v<10 ? '0'+v : String(v))
		const fmt = n => {
			n = Math.max(0, Math.floor(n))
			const h = Math.floor(n/3600)%24
			const m = Math.floor((n%3600)/60)
			const s = n%60
			return `${pad(h)}:${pad(m)}:${pad(s)}`
		}

		const startStr = block.dataset.start || el.dataset.start || '04:00:00'
		let endStr = block.dataset.end || el.dataset.end || '06:00:00'
		let stepSec = Number(block.dataset.step || 1)
		let intervalMs = Number(block.dataset.interval || 1000)

		const introFromStr = block.dataset.introFrom || '00:00:00'
		const introDurMs = Number(block.dataset.introDur || 1800)
		const introIntervalMs = Number(block.dataset.introInterval || 50)

		const introFrom = toSec(introFromStr)
		const start = toSec(startStr)
		let end = toSec(endStr)
		if (!(end > start)) end = start + 7200
		if (stepSec < 1) stepSec = 5
		if (intervalMs < 50) intervalMs = 200

		const ticks = Math.max(1, Math.round(introDurMs / Math.max(20, introIntervalMs)))
		const introStep = Math.max(1, Math.ceil((start - introFrom) / ticks))

		if (reduce) { el.textContent = fmt(start); return }

		let cur = introFrom
		let id = 0
		let introId = 0
		let introDone = false

		const stopAll = () => {
			if (id) { clearInterval(id); id = 0 }
			if (introId) { clearInterval(introId); introId = 0 }
		}

		const playMain = () => {
			if (id) return
			cur = Math.max(start, cur)
			el.textContent = fmt(cur)
			id = setInterval(() => {
				cur += stepSec
				if (cur > end) cur = start
				el.textContent = fmt(cur)
			}, intervalMs)
		}

		const playIntro = () => {
			if (introDone || introId) return
			if (cur < introFrom || cur > start) cur = introFrom
			el.textContent = fmt(cur)
			introId = setInterval(() => {
				cur += introStep
				if (cur >= start) {
					cur = start
					el.textContent = fmt(cur)
					clearInterval(introId)
					introId = 0
					introDone = true
					playMain()
					return
				}
				el.textContent = fmt(cur)
			}, Math.max(20, introIntervalMs))
		}

		const io = new IntersectionObserver(e => {
			if (e[0].isIntersecting) {
				if (introDone) playMain()
				else playIntro()
			} else {
				stopAll()
			}
		},{ threshold: 0.25 })

		io.observe(block)
		disposers.push(() => { stopAll(); io.disconnect() })
	})

	return () => {
		disposers.forEach(f => f && f())
		if (typeof disposeLottie === 'function') disposeLottie()
	}
}