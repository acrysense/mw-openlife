export default (root) => {
	if (!root || root.__appsFloat) return;
	root.__appsFloat = true;

	const sel = root.dataset.floatTarget || '.main__apps';
	const top = parseInt(root.dataset.floatTop || '24', 10);
	const rightAttr = root.dataset.floatRight;
	const leftAttr = root.dataset.floatLeft;
	const stopSel = root.dataset.floatStop || null;

	const target = root.querySelector(sel);
	if (!target) return;

	const clone = target.cloneNode(true);
	clone.classList.add('main__apps--floating');
	clone.style.position = 'fixed';
	clone.style.top = `${top}px`;
	if (leftAttr != null) { clone.style.left = `${parseInt(leftAttr,10)}px`; clone.style.right = ''; }
	else { clone.style.right = `${parseInt(rightAttr || '20', 10)}px`; clone.style.left = ''; }
	clone.style.zIndex = '60';
	clone.style.display = 'none';
	document.body.appendChild(clone);

	let startY = 0;
	let endY = Number.POSITIVE_INFINITY;
	let ticking = false;

	const absTop = (n) => { let y = 0; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };

	const measure = () => {
		const prev = clone.style.display;
		clone.style.visibility = 'hidden';
		clone.style.display = 'flex';
		const h = clone.offsetHeight || target.offsetHeight;
		clone.style.display = prev || 'none';
		clone.style.visibility = '';

		startY = absTop(target) - top;

		if (stopSel) {
			const stopEl = document.querySelector(stopSel);
			endY = stopEl ? (absTop(stopEl) + stopEl.offsetHeight - h - top) : Number.POSITIVE_INFINITY;
		} else {
			endY = Number.POSITIVE_INFINITY;
		}
	};

	const showFloat = () => {
		if (clone.style.display !== 'flex') clone.style.display = 'flex';
		if (target.style.visibility !== 'hidden') {
			target.style.visibility = 'hidden';
			target.setAttribute('aria-hidden', 'true');
		}
	};

	const hideFloat = () => {
		if (clone.style.display !== 'none') clone.style.display = 'none';
		if (target.style.visibility) {
			target.style.visibility = '';
			target.removeAttribute('aria-hidden');
		}
	};

	const tick = () => {
		const y = window.scrollY;
		if (y < startY || y > endY) hideFloat();
		else showFloat();
		ticking = false;
	};

	const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
	const onResize = () => { measure(); onScroll(); };

	const roTarget = new ResizeObserver(onResize);
	const roRoot = new ResizeObserver(onResize);
	roTarget.observe(target);
	roRoot.observe(root);

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onResize, { passive: true });
	if (document.readyState === 'complete') onResize();
	else window.addEventListener('load', onResize, { once: true });

	root.__dispose = () => {
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('resize', onResize);
		roTarget.disconnect();
		roRoot.disconnect();
		hideFloat();
		clone.remove();
	};

	measure();
	onScroll();
};