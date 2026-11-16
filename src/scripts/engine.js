const canvas = document.querySelector('#drawing');
const status = document.querySelector('#status');
const context = canvas.getContext('2d', { alpha: false });

if (context) {
  startCharacter();
} else {
  status.textContent = 'この表示には Canvas 2D に対応したブラウザが必要です。';
}

function startCharacter() {
  const frameCount = 64;
  const fullTurn = Math.PI * 2;
  const followFactor = 0.26;
  const deadZoneRatio = 0.06;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const framesPath = canvas.dataset.framesPath;

  let centerImage = null;
  let frames = [];
  let pointer = null;
  let angle = 0;
  let pendingFrame = 0;
  let lastImage;
  let drawX, drawY, drawWidth, drawHeight, faceX, faceY, deadZoneRadius;

  function loadImage(filename) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = framesPath + filename;
    });
  }

  function scheduleRender() {
    if (!pendingFrame) {
      pendingFrame = requestAnimationFrame(render);
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * dpr));
    canvas.height = Math.max(1, Math.round(bounds.height * dpr));

    // 元のフレームを中央に置き、縦横比を保ったまま画面全体を覆う。
    const scale = Math.max(canvas.width / 1280, canvas.height / 720);
    drawWidth = 1280 * scale;
    drawHeight = 720 * scale;
    drawX = (canvas.width - drawWidth) / 2;
    drawY = (canvas.height - drawHeight) / 2;
    faceX = bounds.left + (drawX + 636 * scale) * bounds.width / canvas.width;
    faceY = bounds.top + (drawY + 310 * scale) * bounds.height / canvas.height;
    deadZoneRadius = Math.min(bounds.width, bounds.height) * 0.5 * deadZoneRatio;

    context.imageSmoothingQuality = 'high';
    lastImage = undefined;
    scheduleRender();
  }

  function render() {
    pendingFrame = 0;
    let image = centerImage;

    if (pointer && !reducedMotion.matches && frames.length) {
      const dx = pointer.clientX - faceX;
      const dy = pointer.clientY - faceY;

      if (Math.hypot(dx, dy) > deadZoneRadius) {
        // ±π の境界をまたいでも最短方向に追従する。
        let difference = (Math.atan2(dy, dx) - angle) % fullTurn;
        if (difference > Math.PI) difference -= fullTurn;
        if (difference < -Math.PI) difference += fullTurn;

        if (Math.abs(difference) > 0.001) {
          angle += difference * followFactor;
          scheduleRender();
        } else {
          angle += difference;
        }

        const normalized = (angle % fullTurn + fullTurn) % fullTurn;
        const index = Math.round(normalized / fullTurn * frameCount) % frameCount;
        image = frames[index] ?? centerImage;
      }
    }

    if (image === lastImage) return;
    lastImage = image;

    context.fillStyle = '#e0dfd7';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (image) context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function trackPointer(event) {
    if (!event.isPrimary) return;
    pointer = { clientX: event.clientX, clientY: event.clientY };
    scheduleRender();
  }

  function resetPointer() {
    pointer = null;
    scheduleRender();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointerdown', trackPointer, { passive: true });
  window.addEventListener('pointermove', trackPointer, { passive: true });
  window.addEventListener('pointerup', (event) => {
    if (event.isPrimary && event.pointerType === 'touch') resetPointer();
  });
  window.addEventListener('pointercancel', (event) => {
    if (event.isPrimary) resetPointer();
  });
  window.addEventListener('pointerout', (event) => {
    if (event.isPrimary && !event.relatedTarget) resetPointer();
  });
  window.addEventListener('blur', resetPointer);
  reducedMotion.addEventListener('change', scheduleRender);
  resize();

  loadImage('center.webp').then((image) => {
    centerImage = image;
    if (!image) status.textContent = 'キャラクターの正面画像を読み込めませんでした。';
    scheduleRender();
  });

  Promise.all(Array.from({ length: frameCount }, (_, index) => loadImage(`${index}.webp`)))
    .then((images) => {
      frames = images;
      if (images.includes(null)) {
        status.textContent = 'キャラクターの画像の一部を読み込めませんでした。';
      }
      scheduleRender();
    });
}
