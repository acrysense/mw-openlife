import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export default function initReveal(root = document){
	const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
	const groups  = [...root.querySelectorAll('[data-reveal-stagger]')]
	const singles = [...root.querySelectorAll('[data-reveal]')].filter(el => !el.closest('[data-reveal-stagger]'))

	// одиночные
	singles.forEach(el => {
		const enterY = parseFloat(el.dataset.revealY || 24)
		const dur    = parseFloat(el.dataset.revealDur || 0.7)
		const delay  = parseFloat(el.dataset.revealDelay || 0)
		const ease   = el.dataset.revealEase || 'power3.out'
		const shift  = parseFloat(el.dataset.revealShift || 80)
		const scrub  = parseFloat(el.dataset.revealScrub || 0.35)
		const doParallax = el.dataset.revealParallax !== '0'

		if (reduce){
			gsap.set(el, { opacity: 1, '--ry':'0px', '--py':'0px' })
		} else {
			gsap.set(el, { opacity: 0, '--ry': `${enterY}px`, '--py':'0px' })
			gsap.to(el, {
				opacity: 1,
				'--ry': '0px',
				duration: dur,
				delay,
				ease,
				scrollTrigger: {
					trigger: el,
					start: 'top 85%',
					toggleActions: 'play none none none' // one-shot
				}
			})
			if (doParallax){
				ScrollTrigger.create({
					trigger: el,
					start: 'top bottom',
					end: 'bottom top',
					scrub: scrub,
					onUpdate: self => gsap.set(el, { '--py': `${-shift * self.progress}px` })
				})
			}
		}
	})

	// группы со стаггером
	groups.forEach(group => {
		const items = [...group.querySelectorAll(':scope [data-reveal]')]
		if (!items.length) return

		const stagger = parseFloat(group.dataset.revealStagger || 0.1)
		const shift   = parseFloat(group.dataset.revealShift || 80)
		const scrub   = parseFloat(group.dataset.revealScrub || 0.35)
		const doParallax = group.dataset.revealParallax !== '0'

		if (reduce){
			gsap.set(items, { opacity: 1, '--ry':'0px', '--py':'0px' })
			return
		}

		items.forEach(el => {
			const y = parseFloat(el.dataset.revealY || group.dataset.revealY || 24)
			gsap.set(el, { opacity: 0, '--ry': `${y}px`, '--py':'0px' })
		})

		gsap.to(items, {
			opacity: 1,
			'--ry': '0px',
			duration: i => parseFloat(items[i].dataset.revealDur || group.dataset.revealDur || 0.7),
			ease:     i => items[i].dataset.revealEase || group.dataset.revealEase || 'power3.out',
			stagger,
			delay: parseFloat(group.dataset.revealDelay || 0),
			scrollTrigger: {
				trigger: group,
				start: 'top 85%',
				toggleActions: 'play none none none'
			}
		})

		if (doParallax){
			ScrollTrigger.create({
				trigger: group,
				start: 'top bottom',
				end: 'bottom top',
				scrub: scrub,
				onUpdate: self => gsap.set(items, { '--py': `${-shift * self.progress}px` })
			})
		}
	})
}