import LottieInView from '@/components/features/LottieInView'

export default (root=document) => {
	const disposeLottie = LottieInView(root)
	const blocks = [...root.querySelectorAll('.speak-voice')]
	if (!blocks.length) return disposeLottie

	const disposers = []
	const fmt = (ms) => {
		const s = Math.floor((ms/1000)%60)
		const d = Math.floor((ms%1000)/100)
		return `00:${String(s).padStart(2,'0')},${d} сек`
	}

	blocks.forEach(host => {
		const value = host.querySelector('.speak-voice__value')
		const target = host.querySelector('[data-lottie-src]')
		const prog = host.querySelector('.speak-voice__progress')
		if (!value || !target) return

		let t = 0, timer = null, visible = false
		const render = () => {
			value.textContent = fmt(t)
			if (prog) prog.style.setProperty('--p', (t/60000).toFixed(3))
		}
		const start = () => {
			if (timer || !visible) return
			timer = setInterval(() => {
				t += 100
				if (t >= 60000) t = 0
				render()
			}, 100)
		}
		const stop = () => { if (timer) { clearInterval(timer); timer = null } }

		const io = new IntersectionObserver((entries) => {
			visible = entries[0].isIntersecting
			if (visible) start(); else stop()
		}, { threshold: [0,0.2], rootMargin: '0px 0px -10% 0px' })
		io.observe(target)

		const onVis = () => { if (document.hidden) stop(); else if (visible) start() }
		document.addEventListener('visibilitychange', onVis)

		render()
		disposers.push(() => { stop(); io.disconnect(); document.removeEventListener('visibilitychange', onVis) })
	})

	return () => { disposers.forEach(fn => fn && fn()); if (typeof disposeLottie === 'function') disposeLottie() }
}