export default (root) => {
	if (!root || root.__bound) return;
	root.__bound = true;

	const offset = parseInt(root.dataset.offset || '0', 10);
	const sel = root.dataset.spySelector || '[data-spy]';
	const titleText = root.dataset.title || 'Openlife';
	const sections = Array.from(document.querySelectorAll(sel));
	if (!sections.length) return;

	root.setAttribute('role','navigation');
	if (!root.hasAttribute('aria-label')) root.setAttribute('aria-label','Навигация по секциям');
	root.removeAttribute('hidden');

	const inner = document.createElement('div');
	inner.className = 'scroll-pager__inner';

	const title = document.createElement('span');
	title.className = 'scroll-pager__title';
	title.textContent = titleText;

	const ul = document.createElement('ul');
	ul.className = 'scroll-pager__list';

	const dots = sections.map((s, i) => {
		const li = document.createElement('li');
		li.className = 'scroll-pager__item';
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'scroll-pager__dot';
		btn.setAttribute('aria-label', s.dataset.title || `Section ${i + 1}`);
		btn.setAttribute('aria-current', 'false');
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			const top = Math.max(0, window.scrollY + s.getBoundingClientRect().top - offset);
			window.scrollTo({ top, behavior: 'smooth' });
		});
		li.appendChild(btn);
		ul.appendChild(li);
		return btn;
	});

	inner.appendChild(title);
	inner.appendChild(ul);
	root.appendChild(inner);

	let active = -1, ticking = false;

	const docH = () => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
	const vh = () => window.innerHeight;

	const setActive = (i) => {
		if (i === active) return;
		active = i;
		dots.forEach((d, idx) => {
			d.classList.toggle('is-active', idx === active);
			d.setAttribute('aria-current', idx === active ? 'true' : 'false');
		});
	};

	const measure = () => {
		const V = vh();
		let bestIdx = 0, best = -1;
		for (let i = 0; i < sections.length; i++) {
			const r = sections[i].getBoundingClientRect();
			const vis = Math.min(r.bottom, V) - Math.max(r.top - offset, 0);
			const score = Math.max(0, vis);
			if (score > best) { best = score; bestIdx = i; }
		}
		if (window.scrollY + V >= docH() - 2) bestIdx = sections.length - 1;
		setActive(bestIdx);
		ticking = false;
	};

	const onScroll = () => {
		if (!ticking) { ticking = true; requestAnimationFrame(measure); }
	};

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });
	window.addEventListener('load', onScroll);

	const ro = new ResizeObserver(onScroll);
	sections.forEach(s => ro.observe(s));

	onScroll();

	root.__dispose = () => {
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onScroll);
		window.removeEventListener('load', onScroll);
		ro.disconnect();
	};
};