import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export default (root=document) => {
	if (!root || root.__appsFloat) return
	root.__appsFloat = true

	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
	const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))

	const intro = () => {
	if (root.__introDone || reduce) return
		root.__introDone = true
		const ov = document.createElement('div')
		ov.className = 'main-intro'
		document.body.appendChild(ov)
		const sec = root
		sec.classList.add('is-intro')
		const v = root.querySelector('.main__bg')
		const others = [...sec.querySelectorAll('.main__info,.main__btn,.main-media,.main__logo')]
		gsap.set(v, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%', scale: 1 })
		others.forEach(el => {
			el.style.opacity = '0'
			el.style.transform = el.classList.contains('main__logo') ? 'translate(-50%,-50%) translateY(16px)' : 'translateY(16px)'
		})
		const fire = () => {
			gsap.to(ov, { opacity: 0, duration: .6, ease: 'power1.out', onComplete: () => { ov.remove(); sec.classList.remove('is-intro') } })
			gsap.fromTo(v, { scale: 1.08 }, { scale: 1, duration: 1.0, ease: 'power2.out' })
			gsap.to(others, {
				opacity: 1,
				y: 0,
				duration: .7,
				ease: 'power2.out',
				delay: 1.0,
				stagger: .25,
				onUpdate: () => {
					others.forEach(el => {
						if (el.classList.contains('main__logo')) el.style.transform = 'translate(-50%,-50%)'
						else el.style.transform = 'none'
					})
				}
			})
		}
		if (v) v.addEventListener('loadeddata', fire, { once: true })
		setTimeout(fire, 1400)
	}

	const sel = root.dataset.floatTarget || '.main__apps'
	const top = parseInt(root.dataset.floatTop || '24', 10)
	const rightAttr = root.dataset.floatRight
	const leftAttr = root.dataset.floatLeft
	const stopSel = root.dataset.floatStop || null

	const target = root.querySelector(sel)
	if (!target) return

	const clone = target.cloneNode(true)
	clone.classList.add('main__apps--floating')
	clone.style.position = 'fixed'
	clone.style.top = `${top}px`
	if (leftAttr != null) { clone.style.left = `${parseInt(leftAttr,10)}px`; clone.style.right = '' }
	else { clone.style.right = `${parseInt(rightAttr || '20', 10)}px`; clone.style.left = '' }
	clone.style.zIndex = '60'
	clone.style.display = 'none'
	document.body.appendChild(clone)

	let startY = 0
	let endY = Number.POSITIVE_INFINITY
	let ticking = false

	const absTop = n => { let y = 0; while (n) { y += n.offsetTop; n = n.offsetParent } return y }

	const measureFloat = () => {
		const prev = clone.style.display
		clone.style.visibility = 'hidden'
		clone.style.display = 'flex'
		const h = clone.offsetHeight || target.offsetHeight
		clone.style.display = prev || 'none'
		clone.style.visibility = ''
		startY = absTop(target) - top
		if (stopSel) {
			const stopEl = document.querySelector(stopSel)
			endY = stopEl ? (absTop(stopEl) + stopEl.offsetHeight - h - top) : Number.POSITIVE_INFINITY
		} else {
			endY = Number.POSITIVE_INFINITY
		}
	}

	const showFloat = () => {
		if (clone.style.display !== 'flex') clone.style.display = 'flex'
		if (target.style.visibility !== 'hidden') {
			target.style.visibility = 'hidden'
			target.setAttribute('aria-hidden', 'true')
		}
	}

	const hideFloat = () => {
		if (clone.style.display !== 'none') clone.style.display = 'none'
		if (target.style.visibility) {
			target.style.visibility = ''
			target.removeAttribute('aria-hidden')
		}
	}

	const tick = () => {
		const y = window.scrollY
		if (y < startY || y > endY) hideFloat()
		else showFloat()
		ticking = false
	}

	const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick) } }

	let stMedia = null
	let tweenMedia = null
	let bgTL = null

	const buildScaleMedia = () => {
		const sec = root
		const mediaBox = sec.querySelector('.main-media')
		const media = sec.querySelector('.main-media__bg')
		if (!media || !mediaBox) return () => {}
		if (tweenMedia) { tweenMedia.scrollTrigger?.kill(); tweenMedia.kill(); tweenMedia = null }
		if (stMedia) { stMedia.kill(); stMedia = null }
		const vw = window.innerWidth
		const isMobile = vw < 744
		const growTo = Number(root.dataset.mediaGrowTo || 488)
		const guard = Number(isMobile ? (root.dataset.mediaStopGuardSm || 200) : (root.dataset.mediaStopGuard || 140))
		const w = media.getBoundingClientRect().width || 1
		const sCap = Number(isMobile ? (root.dataset.mediaScaleCapSm || 1.06) : (root.dataset.mediaScaleCap || 1.12))
		const sMax = clamp(Math.min(growTo / w, sCap), 1, 3)
		gsap.set(media, { transformOrigin: '100% 50%', scale: 1 })
		tweenMedia = gsap.to(media, {
			scale: sMax,
			ease: 'none',
			scrollTrigger: {
				trigger: sec,
				start: 'top top',
				end: () => `top+=${guard} top`,
				scrub: true,
				invalidateOnRefresh: true,
				onLeave: () => gsap.set(media, { scale: sMax }),
				onLeaveBack: () => gsap.set(media, { scale: 1 })
			}
		})
		stMedia = tweenMedia.scrollTrigger
		return () => { tweenMedia?.scrollTrigger?.kill(); tweenMedia?.kill() }
	}

	function buildBgNoPin() {
		const sec = root
		const bg = sec.querySelector('.main__bg')
		if (!bg) return

		if (bgTL) { bgTL.scrollTrigger?.kill(); bgTL.kill(); bgTL = null }

		gsap.set(bg, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%', scale: 1, rotation: 0 })

		const rect = bg.getBoundingClientRect()
		const w0 = rect.width || 1
		const secW = sec.clientWidth || sec.getBoundingClientRect().width || 1

		const keepVisible = Math.max(0, Number(root.dataset.bgKeepVisible ?? 100))
		const outExtra = Math.max(0, Number(root.dataset.bgOutExtra ?? 800))

		const xMid = -(secW/2 + w0/2 - keepVisible)
		const xOut = -(secW/2 + w0/2 + outExtra)

		const isMobile = window.innerWidth < 744
		const scaleMid = Math.max(1, Number(isMobile ? (root.dataset.bgScaleMidSm || 4) : (root.dataset.bgScaleMid || 6)))
		const scaleMax = Math.max(scaleMid, Number(isMobile ? (root.dataset.bgScaleMaxSm || 4) : (root.dataset.bgScaleMax || 6)))

		const enterRatio = 0.52
		const hangRatio  = clamp(Number(root.dataset.bgHoldRatio || 0.28), 0.05, 0.6)
		const leaveRatio = Math.max(0.08, 1 - enterRatio - hangRatio)

		const distTotal = Number(isMobile ? (root.dataset.bgScrollDistSm || 3500) : (root.dataset.bgScrollDist || 2500))

		bgTL = gsap.timeline({
			defaults: { ease: 'none' },
			scrollTrigger: {
				trigger: sec,
				start: 'top top',
				end: `+=${distTotal}`,
				scrub: true,
				invalidateOnRefresh: true
			}
		})

		bgTL.to(bg, { x: xMid, scale: scaleMid, rotation: 15, duration: enterRatio })
		bgTL.to(bg, { x: xMid, scale: scaleMid, rotation: 15, duration: hangRatio })
		bgTL.to(bg, { x: xOut, scale: scaleMax, rotation: 15, duration: leaveRatio })
	}
	
	let disposeMedia = () => {}
	let disposeBg = () => {}
	let isRebuilding = false

	const rebuild = (doRefresh = false) => {
		if (isRebuilding) return
		isRebuilding = true
		disposeMedia()
		disposeBg()
		const bg = root.querySelector('.main__bg')
		const media = root.querySelector('.main-media__bg')
		if (bg) gsap.set(bg, { clearProps: 'transform' })
		if (media) gsap.set(media, { clearProps: 'transform' })
		disposeMedia = buildScaleMedia() || (() => {})
		disposeBg = buildBgNoPin() || (() => {})
		if (doRefresh) ScrollTrigger.refresh()
		isRebuilding = false
	}

	const onResize = () => {
		measureFloat()
		onScroll()
		cancelAnimationFrame(onResize._raf || 0)
		onResize._raf = requestAnimationFrame(() => rebuild(false))
	}

	const roTarget = new ResizeObserver(onResize)
	const roRoot = new ResizeObserver(onResize)
	roTarget.observe(target)
	roRoot.observe(root)

	window.addEventListener('scroll', onScroll, { passive: true })
	window.addEventListener('resize', onResize, { passive: true })
	window.addEventListener('orientationchange', onResize, { passive: true })

	intro()
	measureFloat()
	onScroll()
	rebuild(false)
	ScrollTrigger.refresh()

	const onRefreshSafe = () => { requestAnimationFrame(() => rebuild(false)) }
	ScrollTrigger.addEventListener('refresh', onRefreshSafe)

	root.__dispose = () => {
		window.removeEventListener('scroll', onScroll)
		window.removeEventListener('resize', onResize)
		window.removeEventListener('orientationchange', onResize)
		roTarget.disconnect()
		roRoot.disconnect()
		hideFloat()
		clone.remove()
		disposeMedia()
		disposeBg()
		ScrollTrigger.removeEventListener('refresh', onRefreshSafe)
	}
}