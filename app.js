/* ============================================================
   ART BLUE JAVA - Wedding Invitation JavaScript
   ============================================================ */

// ── State ────────────────────────────────────────────────────────────────────
let currentSection = 'sec-greeting';
let musicPlaying    = false;
let autoplayActive  = false;
let autoplayTimer   = null;

// ── URL Params (guest name) ──────────────────────────────────────────────────
function initGuestName() {
  const params     = new URLSearchParams(window.location.search);
  const guestParam = params.get('to') || params.get('nama') || params.get('guest');
  const el         = document.getElementById('guestNameDisplay');
  if (el && guestParam) {
    el.textContent = guestParam.replace(/\+/g, ' ');
  }
}

document.addEventListener('DOMContentLoaded', initGuestName);

// ── Cover ────────────────────────────────────────────────────────────────────
function openInvitation() {
  const cover = document.getElementById('coverPage');
  const main  = document.getElementById('mainInvitation');

  cover.classList.add('fade-out');

  // Try to play music on user gesture
  tryPlayMusic();

  setTimeout(() => {
    cover.style.display = 'none';
    main.classList.remove('hidden');
    main.style.display = 'flex';
    animateSection('sec-greeting');
    startAutoplay();
  }, 750);
}

// ── Section Navigation ───────────────────────────────────────────────────────
const SECTIONS = [
  'sec-greeting',
  'sec-quotes',
  'sec-mempelai',
  'sec-akad',
  'sec-resepsi',
  'sec-maps',
  'sec-rsvp',
  'sec-gift',
  'sec-thanks',
];

function navigateTo(sectionId, navBtn) {
  if (sectionId === currentSection) return;

  // Hide current
  const oldEl = document.getElementById(currentSection);
  if (oldEl) oldEl.classList.add('hidden-section');

  // Show new
  const newEl = document.getElementById(sectionId);
  if (newEl) {
    newEl.classList.remove('hidden-section');
    newEl.classList.add('page-slide-in');
    setTimeout(() => newEl.classList.remove('page-slide-in'), 450);
  }

  currentSection = sectionId;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active-nav'));
  if (navBtn) {
    navBtn.classList.add('active-nav');
  } else {
    // Find by data-target
    const btn = document.querySelector(`.nav-item[data-target="${sectionId}"]`);
    if (btn) btn.classList.add('active-nav');
  }

  // Scroll nav item into view
  const activeNavBtn = document.querySelector(`.nav-item[data-target="${sectionId}"]`);
  if (activeNavBtn) {
    activeNavBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  animateSection(sectionId);
}

function animateSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  // Trigger re-animation on animated children
  el.querySelectorAll('.animate__animated').forEach(child => {
    child.style.opacity = '0';
    void child.offsetWidth; // force reflow
    child.style.opacity = '';
  });
}

// ── Autoplay ─────────────────────────────────────────────────────────────────
function startAutoplay() {
  autoplayActive = true;
  updateAutoplayIcon();
  scheduleAutoplay();
}

function scheduleAutoplay() {
  clearTimeout(autoplayTimer);
  if (!autoplayActive) return;
  autoplayTimer = setTimeout(() => {
    const idx  = SECTIONS.indexOf(currentSection);
    const next = SECTIONS[idx + 1];
    if (next) {
      navigateTo(next, null);
      scheduleAutoplay();
    } else {
      autoplayActive = false;
      updateAutoplayIcon();
    }
  }, 6000);
}

function toggleAutoplay() {
  autoplayActive = !autoplayActive;
  updateAutoplayIcon();
  if (autoplayActive) {
    scheduleAutoplay();
  } else {
    clearTimeout(autoplayTimer);
  }
}

function updateAutoplayIcon() {
  const btn  = document.getElementById('btnAutoplay');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (autoplayActive) {
    icon.className = 'fas fa-pause';
    btn.title = 'Pause Autoplay';
  } else {
    icon.className = 'fas fa-play';
    btn.title = 'Resume Autoplay';
  }
}

// ── Music ─────────────────────────────────────────────────────────────────────
function tryPlayMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio || !audio.src || audio.src === window.location.href) return; // no src
  audio.volume = 0.5;
  audio.play().then(() => {
    musicPlaying = true;
    updateMusicIcon();
  }).catch(() => {
    // Autoplay blocked; user must interact first
    musicPlaying = false;
  });
}

function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;

  if (musicPlaying) {
    audio.pause();
    musicPlaying = false;
  } else {
    audio.volume = 0.5;
    audio.play().catch(() => {});
    musicPlaying = true;
  }
  updateMusicIcon();
}

function updateMusicIcon() {
  const btn  = document.getElementById('btnMusic');
  if (!btn) return;
  const icon = btn.querySelector('i');
  if (musicPlaying) {
    icon.className = 'fas fa-volume-up';
    btn.classList.remove('muted');
    btn.title = 'Mute Music';
  } else {
    icon.className = 'fas fa-volume-mute';
    btn.classList.add('muted');
    btn.title = 'Play Music';
  }
}

// ── Modals ────────────────────────────────────────────────────────────────────
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Reset animation
  const content = modal.querySelector('.modal-content');
  if (content) {
    content.classList.remove('animate__fadeInUp');
    void content.offsetWidth;
    content.classList.add('animate__fadeInUp');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function closeModalOutside(event, id) {
  if (event.target.id === id) closeModal(id);
}

// Close modals with Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['qrModal', 'rsvpModal', 'giftModal'].forEach(closeModal);
  }
});

// ── RSVP Form ────────────────────────────────────────────────────────────────
function submitRSVP(e) {
  e.preventDefault();
  const name   = document.getElementById('rsvpName').value.trim();
  const attend = document.getElementById('rsvpAttend').value;
  const msg    = document.getElementById('rsvpMsg').value.trim();
  const wa     = document.getElementById('rsvpWa').value.trim();

  if (!name || !attend) return;

  // Build WhatsApp message
  const phone   = '6281234567890'; // replace with actual phone
  const status  = attend === 'hadir' ? '✅ Hadir' : attend === 'tidak' ? '❌ Tidak Hadir' : '🤔 Mungkin Hadir';
  const waMsg   = encodeURIComponent(
    `*Konfirmasi Kehadiran*\n\n` +
    `Nama: ${name}\n` +
    `Status: ${status}\n` +
    (wa ? `No. WA: ${wa}\n` : '') +
    (msg ? `\nUcapan: ${msg}` : '')
  );

  closeModal('rsvpModal');
  showToast('Terima kasih! Mengarahkan ke WhatsApp...');

  setTimeout(() => {
    window.open(`https://wa.me/${phone}?text=${waMsg}`, '_blank');
  }, 1200);

  // Reset form
  document.getElementById('rsvpForm').reset();
}

// ── Copy to Clipboard ────────────────────────────────────────────────────────
function copyText(elementId, btn) {
  const el   = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => flashCopied(btn));
  } else {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    flashCopied(btn);
  }
}

function flashCopied(btn) {
  if (!btn) return;
  const original = btn.innerHTML;
  btn.innerHTML   = '<i class="fas fa-check"></i> Tersalin!';
  btn.classList.add('copied');
  showToast('Nomor rekening disalin!');
  setTimeout(() => {
    btn.innerHTML = original;
    btn.classList.remove('copied');
  }, 2000);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toastMsg');
  const text  = document.getElementById('toastText');
  if (!toast || !text) return;

  text.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ── Swipe Navigation (mobile) ────────────────────────────────────────────────
(function initSwipe() {
  let startX = 0;
  let startY = 0;

  const wrapper = document.getElementById('mainInvitation');
  if (!wrapper) return;

  wrapper.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  wrapper.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    // Only horizontal swipes (more horizontal than vertical)
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

    const idx = SECTIONS.indexOf(currentSection);
    if (dx < 0 && idx < SECTIONS.length - 1) {
      // Swipe left → next
      navigateTo(SECTIONS[idx + 1], null);
      resetAutoplay();
    } else if (dx > 0 && idx > 0) {
      // Swipe right → previous
      navigateTo(SECTIONS[idx - 1], null);
      resetAutoplay();
    }
  }, { passive: true });

  function resetAutoplay() {
    if (autoplayActive) {
      clearTimeout(autoplayTimer);
      scheduleAutoplay();
    }
  }
})();

// ── Countdown Timer (show on Akad/Resepsi pages) ─────────────────────────────
(function initCountdown() {
  const TARGET_DATE = new Date('2024-06-23T08:00:00+07:00');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const diff = TARGET_DATE - now;

    if (diff <= 0) return; // event has passed

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    const countdownEls = document.querySelectorAll('.countdown-display');
    countdownEls.forEach(el => {
      el.innerHTML = `
        <div class="cd-unit"><span>${days}</span><small>Hari</small></div>
        <div class="cd-sep">:</div>
        <div class="cd-unit"><span>${pad(hours)}</span><small>Jam</small></div>
        <div class="cd-sep">:</div>
        <div class="cd-unit"><span>${pad(mins)}</span><small>Menit</small></div>
        <div class="cd-sep">:</div>
        <div class="cd-unit"><span>${pad(secs)}</span><small>Detik</small></div>
      `;
    });
  }

  tick();
  setInterval(tick, 1000);
})();

// ── Ripple Effect on buttons ───────────────────────────────────────────────────
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-gold, .btn-open-invitation');
  if (!btn) return;

  const ripple = document.createElement('span');
  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  ripple.style.cssText = `
    position:absolute; border-radius:50%;
    width:${size}px; height:${size}px;
    left:${x}px; top:${y}px;
    background:rgba(255,255,255,0.35);
    animation: rippleAnim 0.55s linear;
    pointer-events:none;
  `;

  if (getComputedStyle(btn).position === 'static') {
    btn.style.position = 'relative';
  }
  btn.style.overflow = 'hidden';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// Inject ripple keyframes once
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleAnim {
    from { transform: scale(0); opacity: 1; }
    to   { transform: scale(2); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ── Init ──────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Pre-hide all sections except the first
  SECTIONS.slice(1).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden-section');
  });
});
