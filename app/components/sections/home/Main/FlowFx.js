// FlowFx.js
export function mountFlow(container, {
	maskUrl,
	width = 820,              // итоговая ширина (ограничим вьюпортом)
	aspectW = 696, aspectH = 151, // пропорции лого (подставь свои)
	r = '12vmin',
	feather = '4vmin',
	speed = 0.006
} = {}) {
	if (!container || !maskUrl) return () => {};

	// размеры контейнера
	container.style.setProperty('--w', `min(56vw, ${width}px)`);
	container.style.aspectRatio = `${aspectW} / ${aspectH}`;

	// применим маску svg к белому слою
	const logo = container.querySelector('.flow__logo');
	const applyMask = (el) => {
		const url = `url("${maskUrl}")`;
		el.style.webkitMaskImage = url;
		el.style.maskImage = url;
	};
	applyMask(logo);

	// .flow__spot использует ДВЕ маски (круг + лого).
	// Для него прокинем URL через CSS-переменную, чтоб не собирать длинную строку заново.
	const spot = container.querySelector('.flow__spot');
	const maskVar = `url("${maskUrl}")`;
	spot.style.setProperty('--flow-mask-url', maskVar);

	// параметры линзы
	spot.style.setProperty('--r', r);
	spot.style.setProperty('--feather', feather);

	// авто-движение линзы (мышь НЕ влияет)
	let t = 0, raf = 0;
	const loop = () => {
		t += speed;
		const rect = container.getBoundingClientRect();
		const x = rect.width  * 0.5 + Math.cos(t)    * rect.width  * 0.25;
		const y = rect.height * 0.5 + Math.sin(t*1.1)* rect.height * 0.25;
		container.style.setProperty('--mx', x + 'px');
		container.style.setProperty('--my', y + 'px');
		raf = requestAnimationFrame(loop);
	};
	raf = requestAnimationFrame(loop);

	return () => cancelAnimationFrame(raf);
}