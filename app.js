const ACCENT_BLUE = '#1f7ae0'; // sinkron manual dgn var(--accent-blue) di CSS

let lots    = [];
let map;
let markers = [];
let userMarker = null, userAccuracy = null, watchId = null, locating = false;
let activeLot = null, photoIdx = 0;

const DOM = {
  content:  document.getElementById('detailContent'),
  name:     document.getElementById('detailName'),
  notes:    document.getElementById('detailNotes'),
  dist:     document.getElementById('detailDist'),
  distText: document.getElementById('detailDistText'),
  slider:   document.getElementById('photoSlider'),
  fallback: document.getElementById('photoFallback'),
  prevBtn:  document.getElementById('photoPrev'),
  nextBtn:  document.getElementById('photoNext'),
  dots:     document.getElementById('photoDots')
};

const detailPopup = L.popup({ maxWidth: 280, minWidth: 250, className: 'park-popup' });

// ─── QR Generator ─────────────────────────────────────────────────────────────
const qr = new QRGenerator({
  containerId:      'qrcode',
  logoUrl:          'logo/qr.png',
  colorDark:        '#114084',
  downloadFilename: 'qr-lahan-parkir-unud.png'
});

// ─── Math Helpers ─────────────────────────────────────────────────────────────
function toRad(d) { return d * Math.PI / 180; }
function haversine(lat1, lon1, lat2, lon2) {
  const R    = 6371000;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a    = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function fmtDist(m) { return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km'; }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const meIcon = L.divIcon({ html: '<div class="me-pin"></div>', className: '', iconSize: [18, 18], iconAnchor: [9, 9] });
function parkIcon(n) {
  return L.divIcon({ html: `<div class="park-pin">${n}</div>`, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
}

// ─── Map Initialization ───────────────────────────────────────────────────────
function initMap() {
  map = L.map('map', { zoomControl: false, attributionControl: true, tap: false }).setView([lots[0].lat, lots[0].lng], 17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.control.zoom({ position: 'topleft' }).addTo(map);

  const bounds = [];
  lots.forEach((lot, i) => {
    const marker = L.marker([lot.lat, lot.lng], { icon: parkIcon(i + 1) }).addTo(map);
    marker.on('click', () => openDetail(lot));
    markers.push(marker);
    bounds.push([lot.lat, lot.lng]);
  });
  if (bounds.length) map.fitBounds(bounds, { padding: [50, 70] });

  renderList();
}

// ─── List Rendering ───────────────────────────────────────────────────────────
function renderList() {
  const el = document.getElementById('parkingList');
  el.innerHTML = '';
  lots.forEach((lot, i) => {
    const li   = document.createElement('li');
    const num  = document.createElement('span');
    num.className   = 'num';
    num.textContent = i + 1;
    const name = document.createElement('span');
    name.textContent = lot.name;
    li.appendChild(num);
    li.appendChild(name);
    li.addEventListener('click', () => {
      document.getElementById('listModal').classList.remove('show');
      map.flyTo([lot.lat, lot.lng], 18);
      openDetail(lot);
    });
    el.appendChild(li);
  });
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function openDetail(lot) {
  activeLot = lot;
  photoIdx  = 0;
  DOM.name.textContent = lot.name;

  if (lot.notes) { DOM.notes.textContent = lot.notes; DOM.notes.style.display = 'block'; }
  else           { DOM.notes.style.display = 'none'; }

  updatePhoto();
  updateDistance();

  DOM.content.style.display = 'block';
  detailPopup.setLatLng([lot.lat, lot.lng]).setContent(DOM.content).openOn(map);
}

function updatePhoto() {
  const { slider, fallback, prevBtn, nextBtn, dots } = DOM;
  const loading = document.getElementById('photoLoading');
  const photos  = (activeLot && activeLot.photos && activeLot.photos.length) ? activeLot.photos : [];

  if (slider._currentLot !== activeLot) {
    slider.innerHTML = '';
    slider.style.transition = 'none';
    slider.style.transform  = 'translateX(0%)';
    void slider.offsetWidth;
    slider.style.transition  = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
    slider._currentLot = activeLot;
    photoIdx = 0;

    if (photos.length) {
      fallback.style.display = 'none';
      loading.style.display  = 'flex';
      let loaded = 0;
      photos.forEach(src => {
        const img    = document.createElement('img');
        img.onload   = () => { loaded++; if (loaded === 1) loading.style.display = 'none'; };
        img.onerror  = function () {
          this.style.opacity = '0';
          loaded++;
          if (loaded === photos.length) { loading.style.display = 'none'; fallback.style.display = 'flex'; }
        };
        img.src = src;
        slider.appendChild(img);
      });
    } else {
      loading.style.display  = 'none';
      fallback.style.display = 'flex';
    }
  } else {
    slider.style.transform = `translateX(-${photoIdx * 100}%)`;
  }

  const showNav = photos.length > 1;
  prevBtn.style.display = showNav ? 'flex' : 'none';
  nextBtn.style.display = showNav ? 'flex' : 'none';
  dots.innerHTML = '';
  if (showNav) {
    photos.forEach((_, i) => {
      const d = document.createElement('span');
      if (i === photoIdx) d.classList.add('active');
      dots.appendChild(d);
    });
  }
}

function updateDistance() {
  const { dist, distText } = DOM;
  if (activeLot && userMarker) {
    const pos = userMarker.getLatLng();
    distText.textContent  = fmtDist(haversine(pos.lat, pos.lng, activeLot.lat, activeLot.lng)) + ' dari lokasi Anda (garis lurus)';
    dist.style.display = 'flex';
  } else {
    dist.style.display = 'none';
  }
}

// ─── Photo Navigation ─────────────────────────────────────────────────────────
document.getElementById('photoPrev').addEventListener('click', () => {
  const photos = (activeLot && activeLot.photos) || [];
  if (photos.length < 2) return;
  photoIdx = (photoIdx - 1 + photos.length) % photos.length;
  updatePhoto();
});
document.getElementById('photoNext').addEventListener('click', () => {
  const photos = (activeLot && activeLot.photos) || [];
  if (photos.length < 2) return;
  photoIdx = (photoIdx + 1) % photos.length;
  updatePhoto();
});

let touchStartX = 0, touchEndX = 0;
const photoWrap = document.getElementById('photoWrap');
photoWrap.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
photoWrap.addEventListener('touchend',   e => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });
function handleSwipe() {
  const photos    = (activeLot && activeLot.photos) || [];
  if (photos.length <= 1) return;
  const threshold = 30;
  if (touchStartX - touchEndX > threshold)      { photoIdx = (photoIdx + 1) % photos.length; updatePhoto(); }
  else if (touchEndX - touchStartX > threshold) { photoIdx = (photoIdx - 1 + photos.length) % photos.length; updatePhoto(); }
}

// ─── GPS ─────────────────────────────────────────────────────────────────────
function startLocating() {
  if (!navigator.geolocation) { showToast('Perangkat tidak mendukung GPS'); return; }
  watchId = navigator.geolocation.watchPosition(pos => {
    const { latitude, longitude, accuracy } = pos.coords;
    if (!userMarker) {
      userMarker   = L.marker([latitude, longitude], { icon: meIcon, zIndexOffset: 1000 }).addTo(map);
      userAccuracy = L.circle([latitude, longitude], { radius: accuracy, color: ACCENT_BLUE, fillColor: ACCENT_BLUE, fillOpacity: .12, weight: 1 }).addTo(map);
      map.panTo([latitude, longitude]);
    } else {
      userMarker.setLatLng([latitude, longitude]);
      userAccuracy.setLatLng([latitude, longitude]);
      userAccuracy.setRadius(accuracy);
    }
    updateDistance();
  }, err => {
    showToast(err.code === 1 ? 'Izin lokasi ditolak' : 'Gagal mengambil lokasi');
    stopLocating();
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });
  locating = true;
}

function stopLocating() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  locating = false;
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
document.getElementById('directionsBtn').addEventListener('click', () => {
  if (!activeLot) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeLot.lat},${activeLot.lng}`, '_blank');
});

document.getElementById('closeList').addEventListener('click', () => document.getElementById('listModal').classList.remove('show'));
document.getElementById('listBtn').addEventListener('click',  () => document.getElementById('listModal').classList.add('show'));

document.getElementById('recenterBtn').addEventListener('click', () => {
  if (!locating) startLocating();
  else if (userMarker) map.panTo(userMarker.getLatLng());
});

const shareModal = document.getElementById('shareModal');
document.getElementById('shareBtn').addEventListener('click', () => {
  shareModal.classList.add('show');
  document.getElementById('urlBox').textContent = window.location.href;
  qr.text = window.location.href;
  qr.render();
});
document.getElementById('closeShare').addEventListener('click', () => shareModal.classList.remove('show'));

document.getElementById('downloadBtn').addEventListener('click', () => {
  const ok = qr.download();
  if (!ok) { showToast('QR belum siap, coba lagi.'); return; }
  const btn  = document.getElementById('downloadBtn');
  const orig = btn.textContent;
  btn.textContent = 'Terunduh!';
  btn.classList.add('done');
  setTimeout(() => { btn.textContent = orig; btn.classList.remove('done'); }, 1600);
});

document.getElementById('copyBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Tersalin!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Salin Link'; btn.classList.remove('copied'); }, 1600);
  });
});

document.querySelectorAll('.modal-back').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
});

// ─── Data Loading ─────────────────────────────────────────────────────────────
async function loadData() {
  try {
    // Removed cache:'no-store' - allow browser to cache parkir.json for faster repeat loads
    const res  = await fetch('parkir.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    lots = data.parkingLots || [];
  } catch (err) {
    console.error('Gagal memuat parkir.json', err);
    showToast('Gagal memuat data lahan parkir');
    return;
  }
  if (!lots.length) { showToast('Belum ada data lahan parkir'); return; }
  initMap();
}

loadData();
