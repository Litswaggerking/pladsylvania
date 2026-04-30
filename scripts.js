document.querySelectorAll('input[name="map-select"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const kaiser = document.getElementById('map-kaiser');
        const leoquinn = document.getElementById('map-leoquinn');
        kaiser.classList.toggle('map-hidden', this.value === 'leoquinn');
        leoquinn.classList.toggle('map-hidden', this.value === 'kaiser');
    });
});

const lb      = document.getElementById('lb');
const lbImg   = document.getElementById('lb-img');
const lbCap   = document.getElementById('lb-caption');
const lbCount = document.getElementById('lb-counter');
const lbPrev  = document.getElementById('lb-prev');
const lbNext  = document.getElementById('lb-next');
const lbClose = document.getElementById('lb-close');

let items = [], current = 0;

function buildItems() {
  items = Array.from(document.querySelectorAll('main img:not(.inline)'))
    .map(img => {
      let caption = '';
      const figcaption = img.closest('figure')?.querySelector('figcaption');
      if (figcaption) {
        const clone = figcaption.cloneNode(true);
        clone.querySelectorAll('.tooltip-popup').forEach(el => el.remove());
        caption = clone.textContent.trim();
      } else {
        caption = img.alt || '';
      }
      return { src: img.src, caption };
    });
}

function openLightbox(index) {
    document.body.classList.add('lb-active');
    buildItems();
    current = index;
    lb.style.display = 'flex';
    requestAnimationFrame(() => lb.classList.add('lb-open'));
    showImage(current);
    document.addEventListener('keydown', onKey);
}

function closeLightbox() {
    document.body.classList.remove('lb-active');
    lb.classList.remove('lb-open');
    setTimeout(() => { lb.style.display = 'none'; }, 200);
    document.removeEventListener('keydown', onKey);
    closeMenu();
}

function showImage(index) {
  lbImg.classList.add('lb-loading');
  const item = items[index];
  const pre = new Image();
  pre.src = item.src;
  pre.onload = () => {
    lbImg.src = pre.src;
    lbImg.alt = item.caption;
    lbImg.classList.remove('lb-loading');
  };
  lbCap.textContent = item.caption;
  lbCount.textContent = `${index + 1} / ${items.length}`;
  document.getElementById('lb-filename').textContent = item.src.split('/').pop();
  lbPrev.disabled = index === 0;
  lbNext.disabled = index === items.length - 1;
  if (index + 1 < items.length) new Image().src = items[index + 1].src;
  closeMenu();
  buildThumbStrip(index);
}

function buildThumbStrip(index) {
  const strip = document.getElementById('lb-thumbstrip');
  strip.innerHTML = '';
  const start = Math.max(0, index - 2);
  const end   = Math.min(items.length - 1, index + 2);
  for (let i = start; i <= end; i++) {
    const thumb = document.createElement('img');
    thumb.src = items[i].src;
    thumb.className = 'lb-thumb' + (i === index ? ' lb-thumb-active' : '');
    thumb.alt = items[i].caption;
    const capture = i;
    thumb.addEventListener('click', e => { e.stopPropagation(); current = capture; showImage(capture); });
    strip.appendChild(thumb);
  }
}

function onKey(e) {
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft'  && current > 0)              { current--; showImage(current); }
  if (e.key === 'ArrowRight' && current < items.length-1) { current++; showImage(current); }
}

document.addEventListener('click', e => {
  const img = e.target.closest('main img:not(.inline)');
  if (!img) return;
  buildItems();
  const index = items.findIndex(item => item.src === img.src);
  if (index !== -1) openLightbox(index);
});

lbPrev.addEventListener('click', () => { if (current > 0) { current--; showImage(current); } });
lbNext.addEventListener('click', () => { if (current < items.length-1) { current++; showImage(current); } });
lbClose.addEventListener('click', closeLightbox);
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

// menu
const menuBtn = document.getElementById('lb-menu-btn');
const menuDropdown = document.getElementById('lb-menu-dropdown');

function closeMenu() {
  menuDropdown.classList.remove('lb-menu-open');
}

menuBtn.addEventListener('click', e => {
  e.stopPropagation();
  menuDropdown.classList.toggle('lb-menu-open');
});

document.getElementById('lb-action-download').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = items[current].src;
  a.download = items[current].src.split('/').pop();
  a.click();
  closeMenu();
});

document.getElementById('lb-action-copy').addEventListener('click', async () => {
  try {
    const res = await fetch(items[current].src);
    const blob = await res.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    document.getElementById('lb-action-copy').textContent = 'Copied!';
    setTimeout(() => { document.getElementById('lb-action-copy').textContent = 'Copy image'; }, 2000);
  } catch {
    document.getElementById('lb-action-copy').textContent = 'Copy failed';
    setTimeout(() => { document.getElementById('lb-action-copy').textContent = 'Copy image'; }, 2000);
  }
  closeMenu();
});

const tocToggle = document.getElementById('toc-toggle');
const toc = document.getElementById('toc');

tocToggle.addEventListener('click', () => {
    const isOpen = toc.classList.toggle('toc-open');
    tocToggle.textContent = isOpen ? '❮' : '❯';
});

toc.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        toc.classList.remove('toc-open');
        tocToggle.textContent = '❯';
    });
});

if ('ontouchstart' in window) {
    document.querySelectorAll('.tooltip, .tooltip-hover').forEach(el => {
        el.addEventListener('click', e => {
            e.stopPropagation();
            el.classList.toggle('tooltip-active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.tooltip-active').forEach(el => {
            el.classList.remove('tooltip-active');
        });
    });
}

// Touch swipe on lightbox image
let touchStartX = null;

document.getElementById('lb-img').addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
}, { passive: true });

document.getElementById('lb-img').addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(dx) < 40) return; // ignore taps / tiny drags
    if (dx < 0 && current < items.length - 1) { current++; showImage(current); }
    if (dx > 0 && current > 0)                 { current--; showImage(current); }
}, { passive: true });