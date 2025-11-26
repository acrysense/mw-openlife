let _lottie, _importing
const getLottie = async () => _lottie || (_lottie = (await (_importing ||= import('lottie-web'))).default)

const cache = new Map()
const getAnimData = async (src) => {
	if (!cache.has(src)) cache.set(src, fetch(src).then(r => r.json()))
	return cache.get(src)
}

const readBool = (el, name, fb=false) => {
	const v = el.getAttribute(name)
	if (v == null) return fb
	if (v === '' || v === '1' || v === 'true') return true
	if (v === '0' || v === 'false') return false
	return fb
}

export default function LottieInView(root=document){
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
	const els = [...root.querySelectorAll('[data-lottie-src]')].filter(el => !el.__lottieBound)
	if (!els.length) return
	els.forEach(el => el.__lottieBound = true)

	const instances = new Map()

	const ensure = async (el) => {
		if (instances.has(el)) return instances.get(el)
		const src = el.dataset.lottieSrc
		if (!src) return null
		const renderer = el.dataset.lottieRenderer || 'svg'
		const loop = readBool(el, 'data-lottie-loop', true)
		const name = el.dataset.lottieName || ''
		const speed = parseFloat(el.dataset.lottieSpeed || '1') || 1
		const container = el.querySelector('[data-lottie-target]') || el

		const [lottie, data] = await Promise.all([getLottie(), getAnimData(src)])
		const anim = lottie.loadAnimation({ container, renderer, loop, autoplay: false, animationData: data, name })
		anim.setSpeed(speed)
		instances.set(el, anim)
		return anim
	}

	const play = async (el) => {
		const once = readBool(el, 'data-lottie-once', false)
		const anim = await ensure(el)
		if (!anim) return
		if (reduce){
			if (!el.__playedOnce){ anim.goToAndStop(0, true); el.__playedOnce = true }
			return
		}
		if (once && el.__playedOnce) return
		anim.play()
		if (once){
			el.__playedOnce = true
			anim.addEventListener('complete', () => { io.unobserve(el) })
		}
	}

	const pause = (el) => {
		const keepRunningOffscreen = readBool(el, 'data-lottie-keep', false)
		if (keepRunningOffscreen) return
		const anim = instances.get(el)
		if (anim) anim.pause()
	}

	const thresholds = [0, 0.2, 0.5]
	const rootMargin = root.dataset.lottieRootMargin || '0px 0px -10% 0px'

	const io = new IntersectionObserver((entries) => {
		for (const e of entries){
			if (e.isIntersecting && e.intersectionRatio >= 0.2) play(e.target)
			else pause(e.target)
		}
	}, { threshold: thresholds, rootMargin })

	els.forEach(el => io.observe(el))

	const onHover = (e) => {
		const el = e.currentTarget
		const hover = readBool(el, 'data-lottie-hover', false)
		if (!hover) return
		if (e.type === 'mouseenter') play(el)
		else pause(el)
	}
	els.forEach(el => { el.addEventListener('mouseenter', onHover); el.addEventListener('mouseleave', onHover) })

	return () => {
		io.disconnect()
		els.forEach(el => {
			el.removeEventListener('mouseenter', onHover)
			el.removeEventListener('mouseleave', onHover)
		})
		instances.forEach(anim => anim.destroy())
		instances.clear()
	}
}