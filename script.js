/* ============================================================
   WEDDING INVITATION — script.js
   Triska & Joan | Supabase Integration
   ============================================================
   Project : wtesrckwbscvmdwecusd.supabase.co
   Tabel   : wishes
============================================================ */

/* ── KONFIGURASI SUPABASE ────────────────────────────────── */
const SUPABASE_URL      = 'https://rriearahyynxxbeoqkrj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C03Q5XD14bZSoJQocpp7lQ_tEU1tyTg';

/* ── CONFIG UMUM ─────────────────────────────────────────── */
const CONFIG = {
  weddingDate:   new Date('2026-10-31T09:00:00'),
  wishesPerPage: 10,
  tableName:     'wishes',
};

/* ── VARIABEL GLOBAL ─────────────────────────────────────── */
let supabaseClient = null;  // nama berbeda agar tidak bentrok dengan window.supabase
let musicPlaying   = false;
let countdownTimer = null;

/* ============================================================
   DOMContentLoaded — semua inisialisasi dimulai dari sini
============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* 1. Init Supabase — aman karena DOM sudah siap */
  initSupabase();

  /* 2. Guest name dari URL parameter */
  setGuestName();

  /* 3. Particles di cover */
  createParticles();

  /* 4. Tombol Buka Undangan */
  const openBtn = document.getElementById('open-btn');
  if (openBtn) {
    openBtn.addEventListener('click', handleOpenInvitation);
  }

  /* 5. Copy buttons (event delegation — aman untuk elemen hidden) */
  document.addEventListener('click', handleCopyBtn);

  /* 6. Submit ucapan (event delegation — aman untuk elemen di dalam hidden section) */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'wish-submit') {
      // Klik langsung pada tombol
      handleWishSubmit();
    } else if (e.target && e.target.closest && e.target.closest('#wish-submit')) {
      // Klik pada ikon/teks di dalam tombol
      handleWishSubmit();
    }
  });

});

/* ============================================================
   INIT SUPABASE
============================================================ */
function initSupabase() {
  try {
    // window.supabase adalah namespace dari CDN @supabase/supabase-js v2
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('[Supabase] Library CDN belum dimuat dengan benar.');
      return;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Client berhasil diinisialisasi.');
  } catch (err) {
    console.error('[Supabase] Gagal inisialisasi:', err);
  }
}

/* ============================================================
   GUEST NAME
============================================================ */
function setGuestName() {
  const params = new URLSearchParams(window.location.search);
  const name   = params.get('to') || params.get('nama');
  if (name) {
    const el = document.getElementById('guest-name');
    if (el) el.textContent = decodeURIComponent(name);
  }
}

/* ============================================================
   PARTICLES
============================================================ */
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const total = 30;
  for (let i = 0; i < total; i++) {
    const p     = document.createElement('div');
    p.className = 'particle';
    const size  = Math.random() * 6 + 2;
    const left  = Math.random() * 100;
    const dur   = Math.random() * 10 + 7;
    const delay = Math.random() * 10;
    p.style.cssText = `width:${size}px;height:${size}px;left:${left}%;--dur:${dur}s;--delay:${delay}s;`;
    container.appendChild(p);
  }
}

/* ============================================================
   BUKA UNDANGAN — FIX UTAMA
   Masalah: display:none tidak bisa langsung ditransisi.
   Solusi: hapus hidden → force reflow → baru tambah visible
============================================================ */
function handleOpenInvitation() {
  const cover      = document.getElementById('cover');
  const invitation = document.getElementById('invitation');
  if (!cover || !invitation) return;

  /* Langkah 1: Sembunyikan cover */
  cover.classList.add('hide');

  /* Langkah 2: Hapus display:none dari invitation.
     KUNCI: setelah classList.remove('hidden'), elemen masih opacity:0
     karena CSS #invitation { opacity: 0 }.
     Kita HARUS force reflow sebelum menambah class visible,
     agar browser "tahu" elemen sudah display:block dan mau
     menjalankan transisi opacity. */
  invitation.classList.remove('hidden');

  // Force reflow — WAJIB agar transisi berjalan
  void invitation.offsetHeight;

  // Sekarang baru tambahkan visible → transisi opacity berjalan
  invitation.classList.add('visible');

  /* Langkah 3: Hapus cover dari DOM setelah animasi selesai */
  setTimeout(function () {
    if (cover.parentNode) cover.parentNode.removeChild(cover);
    const musicBtn = document.getElementById('music-btn');
    if (musicBtn) musicBtn.classList.add('show');
  }, 900);

  /* Langkah 4: Init AOS setelah elemen visible */
  setTimeout(function () {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once:     true,
        offset:   60,
        easing:   'ease-out-cubic',
      });
    }
  }, 100);

  /* Langkah 5: Countdown */
  startCountdown();

  /* Langkah 6: Music */
  tryPlayMusic();

  /* Langkah 7: Load wishes dari Supabase */
  renderWishes();
}

/* ============================================================
   MUSIK
============================================================ */
function tryPlayMusic() {
  const audio  = document.getElementById('bg-music');
  const btn    = document.getElementById('music-btn');
  if (!audio) return;

  audio.volume = 0.4;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(function () { musicPlaying = true; })
      .catch(function () { /* autoplay diblokir — user klik tombol */ });
  }

  if (btn) {
    btn.addEventListener('click', function () {
      if (musicPlaying) {
        audio.pause();
        musicPlaying = false;
        btn.classList.add('paused');
        btn.setAttribute('title', 'Putar Musik');
      } else {
        audio.play();
        musicPlaying = true;
        btn.classList.remove('paused');
        btn.setAttribute('title', 'Hentikan Musik');
      }
    });
  }
}

/* ============================================================
   COUNTDOWN
============================================================ */
function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);

  function update() {
    const now  = new Date();
    const diff = CONFIG.weddingDate - now;

    const elDays  = document.getElementById('cd-days');
    const elHours = document.getElementById('cd-hours');
    const elMins  = document.getElementById('cd-mins');
    const elSecs  = document.getElementById('cd-secs');

    if (!elDays) return;

    if (diff <= 0) {
      elDays.textContent  = '00';
      elHours.textContent = '00';
      elMins.textContent  = '00';
      elSecs.textContent  = '00';
      clearInterval(countdownTimer);
      return;
    }

    const pad   = function (n) { return String(n).padStart(2, '0'); };
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    elDays.textContent  = pad(days);
    elHours.textContent = pad(hours);
    elMins.textContent  = pad(mins);
    elSecs.textContent  = pad(secs);
  }

  update();
  countdownTimer = setInterval(update, 1000);
}

/* ============================================================
   COPY BUTTON
============================================================ */
function handleCopyBtn(e) {
  const btn = e.target.closest('.btn-copy');
  if (!btn) return;

  const text = btn.dataset.copy;
  if (!text) return;

  const originalHTML = btn.innerHTML;

  function onSuccess() {
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!';
    btn.classList.add('copied');
    setTimeout(function () {
      btn.innerHTML = originalHTML;
      btn.classList.remove('copied');
    }, 2000);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }

  function fallbackCopy() {
    const ta         = document.createElement('textarea');
    ta.value         = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:-9999px;left:-9999px;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); onSuccess(); } catch (err) { console.warn('Copy gagal:', err); }
    document.body.removeChild(ta);
  }
}

/* ============================================================
   SUPABASE — WISHES
============================================================ */

/* ── Notifikasi status ───────────────────────────────────── */
function showStatus(message, type) {
  type = type || 'info';
  const el = document.getElementById('wishes-status');
  if (!el) return;

  var styles = {
    success: 'background:rgba(46,95,138,0.1);color:var(--blue);border:1px solid rgba(46,95,138,0.25);',
    error:   'background:rgba(200,50,50,0.08);color:#c0392b;border:1px solid rgba(200,50,50,0.2);',
    info:    'background:rgba(201,168,76,0.1);color:var(--gold-dk);border:1px solid rgba(201,168,76,0.25);',
  };

  el.setAttribute('style', 'display:block;padding:0.75rem 1rem;border-radius:10px;font-size:0.85rem;margin-bottom:1rem;' + (styles[type] || styles.info));
  el.innerHTML = message;

  if (type !== 'error') {
    setTimeout(function () { el.style.display = 'none'; }, 4000);
  }
}

function hideStatus() {
  var el = document.getElementById('wishes-status');
  if (el) el.style.display = 'none';
}

/* ── Fetch wishes ────────────────────────────────────────── */
async function fetchWishes() {
  if (!supabaseClient) {
    throw new Error('Supabase belum siap. Cek URL dan Anon Key.');
  }

  const { data, error } = await supabaseClient
    .from(CONFIG.tableName)
    .select('id, name, message, attendance, created_at')
    .order('created_at', { ascending: false })
    .limit(CONFIG.wishesPerPage);

  if (error) throw error;
  return data || [];
}

/* ── Insert wish ─────────────────────────────────────────── */
async function insertWish(payload) {
  if (!supabaseClient) {
    throw new Error('Supabase belum siap. Cek URL dan Anon Key.');
  }

  const { data, error } = await supabaseClient
    .from(CONFIG.tableName)
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/* ── Format tanggal ──────────────────────────────────────── */
function formatDate(isoString) {
  var d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}

/* ── Escape HTML (XSS prevention) ───────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

/* ── Render daftar ucapan ────────────────────────────────── */
async function renderWishes() {
  const list = document.getElementById('wishes-list');
  if (!list) return;

  list.innerHTML = '<p style="text-align:center;font-style:italic;color:var(--muted);font-size:0.85rem;padding:1rem 0;"><i class="fa-solid fa-circle-notch fa-spin"></i>&nbsp;Memuat ucapan...</p>';

  try {
    const wishes = await fetchWishes();

    if (!wishes.length) {
      list.innerHTML = '<p style="text-align:center;font-style:italic;color:var(--muted);font-size:0.85rem;padding:1.5rem 0;">Belum ada ucapan. Jadilah yang pertama! 🌸</p>';
      return;
    }

    list.innerHTML = wishes.map(function (w) {
      return '<div class="wish-item">'
        + '<div class="wish-header">'
        + '<span class="wish-name">' + escapeHtml(w.name) + '</span>'
        + '<span class="wish-badge ' + (w.attendance === 'Hadir' ? 'hadir' : 'tidak') + '">'
        + escapeHtml(w.attendance)
        + '</span>'
        + '</div>'
        + '<p class="wish-text">' + escapeHtml(w.message) + '</p>'
        + '<p style="font-size:0.72rem;color:var(--muted);margin-top:0.5rem;opacity:0.7;">'
        + '<i class="fa-regular fa-calendar"></i>&nbsp;' + formatDate(w.created_at)
        + '</p>'
        + '</div>';
    }).join('');

  } catch (err) {
    console.error('[Wishes] Gagal memuat:', err);
    list.innerHTML = '<p style="text-align:center;color:#c0392b;font-size:0.85rem;padding:1rem 0;"><i class="fa-solid fa-triangle-exclamation"></i>&nbsp;Gagal memuat ucapan. Periksa koneksi.</p>';
  }
}

/* ── Submit ucapan ───────────────────────────────────────── */
async function handleWishSubmit() {
  const nameEl   = document.getElementById('wish-name');
  const textEl   = document.getElementById('wish-text');
  const attendEl = document.querySelector('input[name="attend"]:checked');
  const btn      = document.getElementById('wish-submit');

  if (!nameEl || !textEl || !btn) return;

  const name       = nameEl.value.trim();
  const message    = textEl.value.trim();
  const attendance = attendEl ? attendEl.value : 'Hadir';

  /* Validasi */
  if (!name || name.length < 2) {
    shake(nameEl);
    nameEl.focus();
    showStatus('<i class="fa-solid fa-circle-exclamation"></i>&nbsp; Nama harus diisi minimal 2 karakter.', 'error');
    return;
  }
  if (!message) {
    shake(textEl);
    textEl.focus();
    showStatus('<i class="fa-solid fa-circle-exclamation"></i>&nbsp; Ucapan tidak boleh kosong.', 'error');
    return;
  }

  /* Loading */
  btn.disabled  = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>&nbsp;Mengirim...';
  hideStatus();

  try {
    await insertWish({ name, message, attendance });

    nameEl.value = '';
    textEl.value = '';

    btn.innerHTML = '<i class="fa-solid fa-check"></i>&nbsp;Terkirim!';
    showStatus(
      '<i class="fa-solid fa-heart"></i>&nbsp;Ucapan dari <strong>' + escapeHtml(name) + '</strong> berhasil dikirim. Terima kasih! 🌸',
      'success'
    );

    await renderWishes();

    var wishList = document.getElementById('wishes-list');
    if (wishList) wishList.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('[Wishes] Gagal kirim:', err);
    showStatus('<i class="fa-solid fa-triangle-exclamation"></i>&nbsp;Gagal mengirim. Silakan coba lagi.', 'error');
    btn.innerHTML = '<i class="fa-regular fa-paper-plane"></i>&nbsp;Kirim Ucapan';
  } finally {
    setTimeout(function () {
      btn.disabled  = false;
      btn.innerHTML = '<i class="fa-regular fa-paper-plane"></i>&nbsp;Kirim Ucapan';
    }, 2500);
  }
}

/* ============================================================
   SHAKE ANIMATION
============================================================ */
function shake(el) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', function () {
    el.style.animation = '';
  }, { once: true });
}



/* ============================================================
   GALLERY — VIEWER LANGSUNG (klik blur → fullscreen viewer)
   13 foto total : assets/1.jpg, 2.jpg, 7.jpg, 5.jpg, 6.jpg, 03.jpg, 8.jpg–14.jpg
   Grid utama   : 7 foto tampil, foto ke-8 = blur overlay +6
   Klik blur    : langsung buka viewer mulai foto ke-8
   Klik foto 1–7: langsung buka viewer mulai foto tersebut
   Viewer       : fullscreen, tombol Kembali + prev/next + swipe
============================================================ */

(function initGallery() {

  /* Bangun ALL_SRCS dari semua gallery-item (termasuk yang hidden)
     berurutan sesuai data-index */
  var ALL_SRCS = [];
  function buildSrcs() {
    var items = document.querySelectorAll('#gallery-grid .gallery-item[data-src]');
    var arr   = [];
    items.forEach(function (el) {
      var idx = parseInt(el.getAttribute('data-index'), 10);
      var src = el.getAttribute('data-src');
      if (!isNaN(idx) && src) arr.push({ idx: idx, src: src });
    });
    arr.sort(function (a, b) { return a.idx - b.idx; });
    ALL_SRCS = arr.map(function (o) { return o.src; });
  }

  var TOTAL_PHOTOS = 13; // diperbarui sesuai jumlah foto

  /* ── State ─────────────────────────────────────────────── */
  var currentIndex = 0;
  var viewerFromBlur = false; // true jika dibuka dari tombol blur

  /* ── Elemen ─────────────────────────────────────────────── */
  var viewer        = null;
  var viewerImg     = null;
  var viewerClose   = null;
  var viewerBack    = null;
  var viewerPrev    = null;
  var viewerNext    = null;
  var viewerCounter = null;

  /* ── INIT ─────────────────────────────────────────────── */
  function init() {
    /* Bangun array sumber foto dari DOM */
    buildSrcs();
    TOTAL_PHOTOS = ALL_SRCS.length;

    viewer        = document.getElementById('lightbox-viewer');
    viewerImg     = document.getElementById('viewer-img');
    viewerClose   = document.getElementById('viewer-close');
    viewerBack    = document.getElementById('viewer-back');
    viewerPrev    = document.getElementById('viewer-prev');
    viewerNext    = document.getElementById('viewer-next');
    viewerCounter = document.getElementById('viewer-counter');

    if (!viewer) return;

    /* ── Event delegation untuk seluruh gallery grid ──────────
       Pakai document-level listener agar tidak terpengaruh AOS
       yang bisa set pointer-events:none sebelum animasi selesai */
    document.addEventListener('click', function (e) {
      /* Klik pada foto blur / overlay-nya — cek id atau class */
      var moreItem = e.target.closest('#gallery-more-trigger') ||
                     e.target.closest('.gallery-item--more');
      if (moreItem) {
        e.preventDefault();
        e.stopPropagation();
        viewerFromBlur = true;
        openViewer(6); // mulai dari foto ke-7 (index 6 = foto 8.jpg)
        return;
      }

      /* Klik pada foto normal di grid (tidak pada item--more) */
      var gridItem = e.target.closest('#gallery-grid .gallery-item:not(.gallery-item--more):not(.gallery-item--hidden)');
      if (gridItem) {
        var idx = parseInt(gridItem.getAttribute('data-index'), 10);
        viewerFromBlur = false;
        openViewer(isNaN(idx) ? 0 : idx);
        return;
      }
    });

    /* Tombol Kembali → tutup viewer */
    if (viewerBack)  viewerBack.addEventListener('click',  closeViewer);
    /* Tombol X → tutup viewer */
    if (viewerClose) viewerClose.addEventListener('click',  closeViewer);
    /* Navigasi prev / next */
    if (viewerPrev)  viewerPrev.addEventListener('click',   function () { navigate(-1); });
    if (viewerNext)  viewerNext.addEventListener('click',   function () { navigate(+1); });

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
      if (!viewer || !viewer.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft')  navigate(-1);
      if (e.key === 'ArrowRight') navigate(+1);
      if (e.key === 'Escape')     closeViewer();
    });

    /* Touch swipe */
    initSwipe();
  }

  /* ── OPEN VIEWER ────────────────────────────────────────── */
  function openViewer(idx) {
    if (!viewer) return;
    /* Jika ALL_SRCS belum terisi (race condition), bangun ulang */
    if (ALL_SRCS.length === 0) {
      buildSrcs();
      TOTAL_PHOTOS = ALL_SRCS.length;
    }
    if (TOTAL_PHOTOS === 0) return; // tidak ada foto sama sekali
    currentIndex = Math.max(0, Math.min(idx, TOTAL_PHOTOS - 1));
    loadImage(currentIndex);
    viewer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  /* ── CLOSE VIEWER ───────────────────────────────────────── */
  function closeViewer() {
    if (!viewer) return;
    viewer.classList.remove('is-open');
    document.body.style.overflow = '';
    if (viewerImg) viewerImg.src = '';
  }

  /* ── LOAD IMAGE ─────────────────────────────────────────── */
  function loadImage(idx) {
    if (!viewerImg || !viewerCounter) return;

    viewerImg.style.opacity = '0.3';
    viewerImg.style.transition = 'opacity 0.2s ease';

    var tmp   = new Image();
    var src   = ALL_SRCS[idx];

    tmp.onload = function () {
      viewerImg.src = src;
      viewerImg.style.opacity = '1';
    };
    tmp.onerror = function () {
      viewerImg.src = src;
      viewerImg.style.opacity = '1';
    };
    tmp.src = src;

    viewerCounter.textContent = (idx + 1) + ' / ' + TOTAL_PHOTOS;

    /* Redup tombol di ujung */
    if (viewerPrev) {
      viewerPrev.style.opacity        = idx === 0 ? '0.3' : '1';
      viewerPrev.style.pointerEvents  = idx === 0 ? 'none' : 'auto';
    }
    if (viewerNext) {
      viewerNext.style.opacity        = idx === TOTAL_PHOTOS - 1 ? '0.3' : '1';
      viewerNext.style.pointerEvents  = idx === TOTAL_PHOTOS - 1 ? 'none' : 'auto';
    }
  }

  /* ── NAVIGATE ───────────────────────────────────────────── */
  function navigate(dir) {
    var next = currentIndex + dir;
    if (next < 0 || next >= TOTAL_PHOTOS) return;
    currentIndex = next;
    loadImage(currentIndex);
  }

  /* ── SWIPE ──────────────────────────────────────────────── */
  function initSwipe() {
    var startX = 0;
    var startY = 0;
    var THRESHOLD = 45;

    viewer.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    }, { passive: true });

    viewer.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESHOLD) {
        navigate(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  /* ── RUN ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();