/* ============================================================
   GAIA Residence booking prototype (vanilla JS, hash router)
   ============================================================ */

const app = document.getElementById("app");

// ---- shared search state (defaults to a demo window) ----
const store = {
  location: "All residences",
  checkin: "2026-06-12",
  checkout: "2026-06-15",
  guests: 2,
};

// ---- utils ----
const EUR = (n) => "$" + Math.round(n).toLocaleString("en-US");

// Local image tag. `src` is a relative path like "img/living1.webp".
function imgTag(src, alt, cls = "") {
  const fb = `https://picsum.photos/seed/${encodeURIComponent(src)}/900/700`;
  return `<img class="${cls}" loading="lazy" src="${src}" alt="${alt}"
    onerror="this.onerror=null;this.src='${fb}'" />`;
}

// Shared resident amenities (sauna + yoga shala), shown at the end of every listing's photos.
const AMENITY_PHOTOS = ["img/sauna-ext.jpg", "img/sauna-int.jpg", "img/yoga-ext.jpg", "img/yoga-int.jpg"];

function nights(ci, co) {
  const a = new Date(ci), b = new Date(co);
  return Math.max(0, Math.round((b - a) / 86400000));
}

// availability: free if requested [ci,co) doesn't overlap any booked range
function isAvailable(p, ci, co) {
  if (!ci || !co) return true;
  const a = new Date(ci), b = new Date(co);
  return !p.booked.some(([s, e]) => {
    const bs = new Date(s), be = new Date(e);
    return a < be && b > bs; // overlap test
  });
}

function stars(r) {
  return `<span class="star">★</span> ${r.toFixed(2)}`;
}

// ---- card markup (shared) ----
// gallery=true adds hover arrows (used on the homepage, where there is no side preview).
function cardHTML(p, booked = false, gallery = false) {
  return `
    <article class="card ${gallery ? "card-gal" : ""} ${booked ? "is-booked" : ""}" data-id="${p.id}">
      <div class="card-media">
        <div class="gtrack">${p.images.map(im => imgTag(im, p.name)).join("")}</div>
        ${gallery && p.images.length > 1 ? `<button class="gnav gprev" type="button" aria-label="Previous photo">‹</button><button class="gnav gnext" type="button" aria-label="Next photo">›</button>` : ""}
        ${p.images.length > 1 ? `<div class="gdots">${p.images.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>` : ""}
        <span class="card-tag">${p.neighborhood}</span>
        <span class="card-fav">♡</span>
      </div>
      <div class="card-body">
        <div class="card-row">
          <span class="card-name">${p.name}</span>
          <span class="card-rate">${stars(p.rating)}</span>
        </div>
        <div class="card-hood">${p.type} · sleeps ${p.guests}</div>
        <div class="card-meta">
          <span>${p.beds} bed</span><span>${p.baths} bath</span><span>${p.sqm} m²</span>
        </div>
        <div class="card-price">
          <b>${EUR(p.price)}</b><span>/ night · no fees</span>
        </div>
      </div>
    </article>`;
}

// Reusable image gallery: swaps a single .g-photo. Wires optional ‹/› arrows,
// dots, and finger swipe. Arrow clicks don't bubble (so a card isn't opened).
function initGallery(root, images) {
  const photo = root.querySelector(".g-photo");
  if (!photo || !images || images.length < 2) return;
  const dots = [...root.querySelectorAll(".gdots span")];
  const count = root.querySelector(".gcount");
  let i = 0;
  const go = (d, e) => {
    if (e) e.stopPropagation();
    i = (i + d + images.length) % images.length;
    photo.src = images[i];
    dots.forEach((dt, j) => dt.classList.toggle("on", j === i));
    if (count) count.textContent = (i + 1) + " / " + images.length;
  };
  root.querySelector(".gprev") && root.querySelector(".gprev").addEventListener("click", e => go(-1, e));
  root.querySelector(".gnext") && root.querySelector(".gnext").addEventListener("click", e => go(1, e));
  // finger swipe (mobile)
  let x0 = null, y0 = null;
  photo.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  photo.addEventListener("touchend", e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
}

// Real scroll-track gallery: finger-swipe scrolls it on mobile; ‹/› arrows scroll it
// on desktop (where present). Dots + counter follow the scroll position. Images load
// just-in-time. Used by the cards and the mobile residence carousel.
function initTrackGallery(root) {
  const track = root.querySelector(".gtrack");
  if (!track) return;
  const imgs = [...track.querySelectorAll("img")];
  if (imgs.length < 2) return;
  const dots = [...root.querySelectorAll(".gdots span")];
  const count = root.querySelector(".gcount");
  const load = (k) => [k, k + 1].forEach(j => { if (imgs[j] && imgs[j].loading === "lazy") imgs[j].loading = "eager"; });
  load(0);
  const update = () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    dots.forEach((d, j) => d.classList.toggle("on", j === i));
    if (count) count.textContent = (i + 1) + " / " + imgs.length;
    load(i);
  };
  track.addEventListener("scroll", update, { passive: true });
  const arrow = (dir, e) => {
    if (e) e.stopPropagation();
    const i = Math.round(track.scrollLeft / track.clientWidth);
    const ni = (i + dir + imgs.length) % imgs.length;
    load(ni);
    track.scrollLeft = ni * track.clientWidth;
    update();
  };
  const prev = root.querySelector(".gprev"), next = root.querySelector(".gnext");
  prev && prev.addEventListener("click", e => arrow(-1, e));
  next && next.addEventListener("click", e => arrow(1, e));
}

// Wire every card's photo gallery.
function wireCardGalleries(scope) {
  (scope || document).querySelectorAll(".card[data-id]").forEach(card => {
    if (card.dataset.gwired) return;
    card.dataset.gwired = "1";
    initTrackGallery(card);
  });
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  const featured = PROPERTIES.slice(0, 6);
  const gallery = ["img/demo-sofa.jpg", "img/cafe-2.jpg", "img/demo-bed.jpg", "img/sauna-ext.jpg", "img/yoga-ext.jpg", "img/duplex-living.jpg"];
  const tens = [
    ["Sofia M.", "Stayed 5 nights", "The view at sunset is unreal, and the residence was spotless. Booking direct saved us a real chunk versus the app."],
    ["James & Ava", "Stayed 7 nights", "Two minutes to the beach, then café and yoga on-site. The team handled everything. Faultless."],
    ["Marco R.", "Stayed 4 nights", "The penthouse terrace alone is worth the trip. We are already planning our next stay."],
  ];

  app.innerHTML = `
  <section class="hero">
    <div class="hero-bg">${imgTag("img/ext-main.jpg", "Gaia Residence over Chaloklum Bay", "")}</div>
    <div class="hero-content wrap">
      <div class="hero-eyebrow">Sea-view residences · Koh Phangan</div>
      <h1>Wake up over Chaloklum Bay. <em>Book direct, save more.</em></h1>
      <div class="hero-proof"><span class="stars">★★★★★</span> <b>4.9</b> · 200+ happy guests <span class="scarce">· only a few residences left this season</span></div>

      <form class="searchbar" id="search-form">
        <div class="sb-field">
          <label>Where</label>
          <select name="location" id="f-loc">
            <option>All residences</option>
            ${[...new Set(PROPERTIES.map(p => p.neighborhood))].map(n => `<option>${n}</option>`).join("")}
          </select>
        </div>
        <div class="sb-field">
          <label>Check in</label>
          <input type="date" name="checkin" id="f-ci" value="${store.checkin}" min="2026-06-06" />
        </div>
        <div class="sb-field">
          <label>Check out</label>
          <input type="date" name="checkout" id="f-co" value="${store.checkout}" min="2026-06-07" />
        </div>
        <div class="sb-field">
          <label>Guests</label>
          <select name="guests" id="f-g">
            ${[1,2,3,4,5,6,8].map(g => `<option value="${g}" ${g===store.guests?"selected":""}>${g} guest${g>1?"s":""}</option>`).join("")}
          </select>
        </div>
        <div class="sb-submit">
          <button class="btn btn-primary" type="submit">Check availability</button>
        </div>
      </form>
      <p class="hero-reassure">Best price guaranteed · No booking fees · On-island team for you</p>
    </div>
  </section>

  <div class="trust">
    <div class="trust-inner">
      <span><b>✦</b> No booking fees, ever</span>
      <span><b>✦</b> Best-price guarantee vs Airbnb</span>
      <span><b>✦</b> Live availability, never double-booked</span>
      <span><b>✦</b> On-site team on Koh Phangan</span>
    </div>
  </div>

  <section class="home-residences">
    <div class="wrap">
      <div class="grid-head">
        <div class="section-head" style="margin-bottom:0">
          <div class="section-eyebrow">The residences</div>
          <h2>Find your sea-view home</h2>
        </div>
        <a class="btn btn-ghost" href="#/search">View all residences →</a>
      </div>
      <div class="cards">
        ${featured.map(p => cardHTML(p, false, true)).join("")}
      </div>
    </div>
  </section>

  <section class="why gallery-sec">
    <div class="wrap">
      <div class="section-head center">
        <div class="section-eyebrow">Pure Koh Phangan</div>
        <h2>This is what mornings look like</h2>
      </div>
      <div class="mosaic">
        ${gallery.map((g, i) => `<div class="mo mo${i}">${imgTag(g, "Gaia Residence")}</div>`).join("")}
      </div>
      <div style="text-align:center;margin-top:34px"><a class="btn btn-ghost" href="#/amenities">See life at Gaia →</a></div>
    </div>
  </section>

  <section id="why">
    <div class="wrap">
      <div class="section-head center">
        <div class="section-eyebrow">Why book direct</div>
        <h2>Same residences. Better price. Zero fees.</h2>
      </div>
      <div class="why-grid why-grid-3">
        <div class="why-card"><div class="why-ico">％</div><h3>No booking fees</h3><p>Marketplaces add 12-16% at checkout. We never do. The price you see is the price you pay.</p></div>
        <div class="why-card"><div class="why-ico">✓</div><h3>Best-price guarantee</h3><p>Find it cheaper for the same dates? We match it and take off another 5%.</p></div>
        <div class="why-card"><div class="why-ico">✦</div><h3>Cared for on-site</h3><p>A real team on Koh Phangan handles check-in, cleaning and any request, before and during your stay.</p></div>
      </div>

      <div class="why-savings">
        <div>
          <h3>Booking direct keeps real money in your pocket.</h3>
          <p>On a 3-night stay at $320/night, a marketplace adds roughly $134 in service fees. With Gaia, that is yours to spend on the island.</p>
        </div>
        <div class="savings-figure">
          <div class="big">~14%</div>
          <div class="lbl">average saved vs Airbnb</div>
        </div>
      </div>
    </div>
  </section>

  <section class="why">
    <div class="wrap">
      <div class="section-head center">
        <div class="section-eyebrow">Loved by guests</div>
        <h2>4.9 out of 5, and climbing</h2>
      </div>
      <div class="cards tcards">
        ${tens.map(([nm, meta, txt]) => `<div class="tcard"><div class="tstars">★★★★★</div><p>"${txt}"</p><div class="tby"><b>${nm}</b><span>${meta}</span></div></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="cta-band">
    <div class="cta-bg">${imgTag("img/ext-site.jpg", "Gaia Residence over Chaloklum Bay")}</div>
    <div class="wrap cta-in">
      <div class="section-eyebrow">Book direct</div>
      <h2>Your hilltop is waiting.</h2>
      <p>The best price, zero fees and a real team on the island. Straight with Gaia.</p>
      <a class="btn btn-primary btn-lg" href="#/search">Check availability</a>
      <div class="cta-reassure">★ 4.9 · 200+ guests · 2 minutes to the beach</div>
    </div>
  </section>
  `;

  // wire up search
  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    store.location = document.getElementById("f-loc").value;
    store.checkin = document.getElementById("f-ci").value;
    store.checkout = document.getElementById("f-co").value;
    store.guests = +document.getElementById("f-g").value;
    location.hash = "#/search";
  });
  app.querySelectorAll(".card[data-id]").forEach(c =>
    c.addEventListener("click", () => (location.hash = `#/property/${c.dataset.id}`)));
  wireCardGalleries(app);
}

/* ============================================================
   SEARCH RESULTS  (list + live map)
   ============================================================ */
let mapInstance = null;
let markers = {};

function renderSearch() {
  const { checkin, checkout, guests, location: loc } = store;
  const n = nights(checkin, checkout);

  let pool = PROPERTIES.filter(p => p.guests >= guests);
  if (loc && loc !== "All residences") pool = pool.filter(p => p.neighborhood === loc);

  const available = pool.filter(p => isAvailable(p, checkin, checkout));
  const booked = pool.filter(p => !isAvailable(p, checkin, checkout));

  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  app.innerHTML = `
    <div class="results-top">
      <div class="results-top-inner">
        <div class="results-summary">
          <b>${available.length} of ${pool.length} residences available</b>
          · ${fmt(checkin)}–${fmt(checkout)} · ${n} night${n>1?"s":""} · ${guests} guest${guests>1?"s":""}
          ${loc !== "All residences" ? ` · ${loc}` : ""}
        </div>
        <form class="searchbar compact" id="search-form-2" style="grid-template-columns:1fr 1fr 1fr auto;max-width:620px;margin-left:auto">
          <div class="sb-field"><label>Check in</label><input type="date" id="g-ci" value="${checkin}" min="2026-06-06"></div>
          <div class="sb-field"><label>Check out</label><input type="date" id="g-co" value="${checkout}" min="2026-06-07"></div>
          <div class="sb-field"><label>Guests</label>
            <select id="g-g">${[1,2,3,4,5,6,8].map(g=>`<option value="${g}" ${g===guests?"selected":""}>${g}</option>`).join("")}</select>
          </div>
          <div class="sb-submit"><button class="btn btn-dark" type="submit">Update</button></div>
        </form>
      </div>
    </div>

    <div class="results-layout">
      <div class="results-list">
        <div class="cards-2" id="avail-list">
          ${available.length ? available.map(p => cardHTML(p)).join("") :
            `<p style="color:var(--ink-soft)">No residences free for these dates. Try shifting your stay.</p>`}
        </div>
        ${booked.length ? `
          <div class="unavailable-section">
            <h3>Booked for your dates</h3>
            <p>These ${booked.length} residence${booked.length>1?"s are":" is"} already reserved. Our live calendar hides them so you can't double-book.</p>
            <div class="cards-2">${booked.map(p => cardHTML(p, true)).join("")}</div>
          </div>` : ""}
      </div>
      <aside class="results-aside"><div class="preview-panel" id="preview"></div></aside>
    </div>
  `;

  // wire update form
  document.getElementById("search-form-2").addEventListener("submit", (e) => {
    e.preventDefault();
    store.checkin = document.getElementById("g-ci").value;
    store.checkout = document.getElementById("g-co").value;
    store.guests = +document.getElementById("g-g").value;
    renderSearch();
  });

  // card hover → live preview, click → full residence.
  // hover-intent delay + panel lock so the preview doesn't flip while the cursor
  // crosses other cards on its way over to the panel.
  let hoverTimer = null, panelLocked = false;
  const showPreview = (c, p) => {
    app.querySelectorAll(".card.is-active").forEach(o => o.classList.remove("is-active"));
    c.classList.add("is-active");
    renderPreview(p);
  };
  app.querySelectorAll(".results-list .card:not(.is-booked)").forEach(c => {
    const p = available.find(x => x.id === c.dataset.id);
    c.addEventListener("mouseenter", () => {
      if (panelLocked) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => showPreview(c, p), 130);
    });
    c.addEventListener("mouseleave", () => clearTimeout(hoverTimer));
    c.addEventListener("click", () => (location.hash = `#/property/${c.dataset.id}`));
  });
  const aside = app.querySelector(".results-aside");
  if (aside) {
    aside.addEventListener("mouseenter", () => { panelLocked = true; clearTimeout(hoverTimer); });
    aside.addEventListener("mouseleave", () => { panelLocked = false; });
  }
  if (available.length) {
    renderPreview(available[0]);
    const first = app.querySelector(".results-list .card");
    if (first) first.classList.add("is-active");
  }
  wireCardGalleries(app);

  window.scrollTo(0, 0);
}

// Live preview + quick-book panel on the search page (replaces the map).
function renderPreview(p) {
  const panel = document.getElementById("preview");
  if (!panel || !p) return;
  const nn = nights(store.checkin, store.checkout) || 3;
  const subtotal = p.price * nn;
  const fee = Math.round(subtotal * AIRBNB_FEE_RATE);
  const total = subtotal + p.cleaning;
  panel.innerHTML = `
    <div class="pp-media">
      ${imgTag(p.images[0], p.name, "g-photo")}
      ${p.images.length > 1 ? `<button class="gnav gprev" type="button" aria-label="Previous photo">‹</button><button class="gnav gnext" type="button" aria-label="Next photo">›</button><div class="gdots">${p.images.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>` : ""}
      <span class="pp-tag">${p.neighborhood}</span>
    </div>
    <div class="pp-body">
      <div class="pp-row"><h3>${p.name}</h3><span class="pp-rate">${stars(p.rating)}</span></div>
      <div class="pp-meta">${p.guests} guests · ${p.beds} bed · ${p.baths} bath · ${p.sqm} m²</div>
      <div class="pp-amen">${p.tags.slice(0, 4).map(t => `<span>${AMENITIES[t]}</span>`).join("")}</div>
      <div class="pp-break">
        <div class="bk-row"><span>${EUR(p.price)} × ${nn} night${nn>1?"s":""}</span><span>${EUR(subtotal)}</span></div>
        <div class="bk-row"><span>Cleaning fee</span><span>${EUR(p.cleaning)}</span></div>
        <div class="bk-row free"><span>Service fee <span class="bk-strike">${EUR(fee)}</span></span><b>$0</b></div>
        <div class="bk-total"><span>Total</span><b>${EUR(total)}</b></div>
      </div>
      <div class="bk-save">✦ You save ${EUR(fee)} vs Airbnb</div>
      <button class="btn btn-primary btn-block btn-lg" id="pp-reserve" style="margin-top:16px">Reserve direct</button>
      <a class="pp-view" href="#/property/${p.id}">View residence & all photos →</a>
      <div class="bk-note">On-island team · no booking fees</div>
    </div>
  `;
  const rb = document.getElementById("pp-reserve");
  if (rb) rb.addEventListener("click", () => (location.hash = `#/book/${p.id}`));
  initGallery(panel, p.images);
}

// One shared development map for the Location page (all residences sit on the same hilltop).
function buildLocationMap() {
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  if (!document.getElementById("loc-map")) return;

  mapInstance = L.map("loc-map", { scrollWheelZoom: false, zoomControl: true })
    .setView([9.7860, 100.0060], 15);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
  }).addTo(mapInstance);

  const pin = (lat, lng, label, main) => L.marker([lat, lng], {
    icon: L.divIcon({ className: "", html: `<div class="map-pin ${main ? "is-active" : "pin-poi"}">${label}</div>`, iconSize: null }),
  }).addTo(mapInstance);

  // Chaloklum Bay, north coast of Koh Phangan
  pin(9.7843, 100.0056, "Gaia Residence", true);
  pin(9.7873, 100.0042, "Chaloklum Beach");
  pin(9.7881, 100.0083, "Chaloklum Pier");
  pin(9.7861, 100.0064, "Village & cafés");

  mapInstance.fitBounds([
    [9.7843, 100.0056], [9.7873, 100.0042], [9.7881, 100.0083], [9.7861, 100.0064],
  ], { padding: [60, 60], maxZoom: 15 });
}

/* ============================================================
   PROPERTY DETAIL
   ============================================================ */
function renderProperty(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if (!p) { location.hash = "#/search"; return; }

  const n = nights(store.checkin, store.checkout) || 3;
  const avail = isAvailable(p, store.checkin, store.checkout);
  const gall = [...p.images, ...AMENITY_PHOTOS];

  app.innerHTML = `
    <div class="wrap pd">
      <div class="pd-head">
        <div>
          <h1>${p.name}</h1>
          <div class="pd-sub">
            <span>${stars(p.rating)} · ${p.reviews} reviews</span>
            <span>${p.neighborhood}, Koh Phangan</span>
            <span>${p.type}</span>
          </div>
        </div>
        <a class="btn btn-ghost" href="#/search">← Back to results</a>
      </div>

      <div class="pd-gallery" id="pd-gallery">
        ${imgTag(p.images[0], p.name, "g-main")}
        ${p.images.slice(1, 5).map(i => imgTag(i, p.name, "")).join("")}
      </div>
      <div class="pd-extra">
        <div class="pd-extra-h">Residents' spa, sauna & yoga shala</div>
        <div class="pd-more">${AMENITY_PHOTOS.map(im => imgTag(im, "Gaia spa, sauna and yoga")).join("")}</div>
      </div>
      <div class="pd-carousel" id="pd-carousel">
        <div class="gtrack">${gall.map(im => imgTag(im, p.name)).join("")}</div>
        ${gall.length > 1 ? `<div class="gcount">1 / ${gall.length}</div><div class="gdots">${gall.map((_, i) => `<span class="${i === 0 ? "on" : ""}"></span>`).join("")}</div>` : ""}
      </div>

      <div class="pd-body">
        <div>
          <div class="pd-section">
            <h2>${p.blurb}</h2>
            <div class="card-meta" style="font-size:15px;margin:14px 0 18px">
              <span>${p.guests} guests</span><span>${p.beds} bedroom${p.beds>1?"s":""}</span>
              <span>${p.baths} bath${p.baths>1?"s":""}</span><span>${p.sqm} m²</span>
            </div>
            <p>${p.description}</p>
          </div>

          <div class="pd-section">
            <h2>What this place offers</h2>
            <div class="amenity-grid">
              ${p.tags.map(t => `<div class="amenity"><span class="dot">●</span> ${AMENITIES[t]}</div>`).join("")}
            </div>
          </div>

          <div class="pd-section">
            <h2>What's nearby</h2>
            <p style="margin-bottom:18px">${p.neighborhood} · Chaloklum, Koh Phangan. Everything is moments downhill from the hilltop.</p>
            <div class="nearby-grid">
              <div class="nearby"><b>2 min</b><span>walk to Chaloklum Beach</span></div>
              <div class="nearby"><b>3 min</b><span>to village cafés & restaurants</span></div>
              <div class="nearby"><b>5 min</b><span>to Chaloklum Pier</span></div>
              <div class="nearby"><b>20 min</b><span>drive to Thong Sala town</span></div>
            </div>
            <a class="link-more" href="#/location">Explore the location →</a>
          </div>

          <div class="pd-section" style="border-bottom:none">
            <h2>Guest reviews</h2>
            <div class="cards" style="grid-template-columns:1fr 1fr;gap:18px;margin-top:10px">
              ${reviewBlock("Sofia M.", "Stayed 5 nights", "Exactly as pictured and spotless. The view over the bay is unreal at sunset. Booking direct was effortless and saved us a chunk versus the app.")}
              ${reviewBlock("James & Ava", "Stayed 7 nights", "Two minutes to the beach, then the café and yoga right at the residence. The on-site team sorted everything. Will only book Gaia direct from now on.")}
            </div>
          </div>
        </div>

        <aside class="booking">
          <div class="booking-card">
            <div class="booking-price"><b>${EUR(p.price)}</b><span>/ night</span></div>

            <div class="booking-dates">
              <div class="bd"><label>Check in</label><input type="date" id="b-ci" value="${store.checkin}" min="2026-06-06"></div>
              <div class="bd"><label>Check out</label><input type="date" id="b-co" value="${store.checkout}" min="2026-06-07"></div>
            </div>
            <div class="booking-guests">
              <label>Guests</label>
              <select id="b-g">${[1,2,3,4,5,6,8].filter(g=>g<=p.guests).map(g=>`<option value="${g}" ${g===store.guests?"selected":""}>${g} guest${g>1?"s":""}</option>`).join("")}</select>
            </div>

            <div class="bk-avail ${avail?"ok":"no"}" id="bk-avail">
              ${avail ? "✓ Available for your dates" : "✕ Not available for these dates"}
            </div>

            <div class="booking-breakdown" id="bk-breakdown"></div>

            <button class="btn btn-primary btn-block btn-lg" id="reserve-btn" style="margin-top:18px" ${avail?"":"disabled style=opacity:.5"}>
              Reserve direct
            </button>
            <div class="bk-note">You won't be charged yet · on-island team on call</div>
          </div>
        </aside>
      </div>
    </div>
  `;

  function renderBreakdown() {
    const ci = document.getElementById("b-ci").value;
    const co = document.getElementById("b-co").value;
    const nn = nights(ci, co) || 1;
    const subtotal = p.price * nn;
    const fee = Math.round(subtotal * AIRBNB_FEE_RATE);
    const total = subtotal + p.cleaning;
    document.getElementById("bk-breakdown").innerHTML = `
      <div class="bk-row"><span>${EUR(p.price)} × ${nn} night${nn>1?"s":""}</span><span>${EUR(subtotal)}</span></div>
      <div class="bk-row"><span>Cleaning fee</span><span>${EUR(p.cleaning)}</span></div>
      <div class="bk-row free"><span>Service fee <span class="bk-strike">${EUR(fee)}</span></span><b>$0</b></div>
      <div class="bk-total"><span>Total</span><b>${EUR(total)}</b></div>
      <div class="bk-save">✦ You save ${EUR(fee)} vs booking on Airbnb</div>
    `;
    const ok = isAvailable(p, ci, co);
    const av = document.getElementById("bk-avail");
    av.className = "bk-avail " + (ok ? "ok" : "no");
    av.textContent = ok ? "✓ Available for your dates" : "✕ Not available for these dates";
    const rb = document.getElementById("reserve-btn");
    rb.disabled = !ok; rb.style.opacity = ok ? "1" : ".5";
  }
  renderBreakdown();

  ["b-ci","b-co","b-g"].forEach(idd =>
    document.getElementById(idd).addEventListener("change", () => {
      store.checkin = document.getElementById("b-ci").value;
      store.checkout = document.getElementById("b-co").value;
      store.guests = +document.getElementById("b-g").value;
      renderBreakdown();
    }));

  document.getElementById("reserve-btn").addEventListener("click", () => {
    if (!document.getElementById("reserve-btn").disabled) location.hash = `#/book/${p.id}`;
  });

  // mobile photo gallery: real swipe-scroll + dots + counter
  initTrackGallery(document.getElementById("pd-carousel"));

  window.scrollTo(0, 0);
}

function reviewBlock(name, meta, text) {
  return `
    <div class="card" style="cursor:default;padding:22px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="width:42px;height:42px;border-radius:50%;background:var(--cream-2);display:grid;place-items:center;font-family:var(--font-display);font-size:18px">${name[0]}</div>
        <div><b style="font-size:15px">${name}</b><div style="color:var(--ink-soft);font-size:13px">${meta} · <span style="color:var(--clay)">★★★★★</span></div></div>
      </div>
      <p style="color:var(--ink-soft);font-size:15px;line-height:1.6">${text}</p>
    </div>`;
}

/* ============================================================
   CHECKOUT
   ============================================================ */
function renderBook(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if (!p) { location.hash = "#/search"; return; }
  const nn = nights(store.checkin, store.checkout) || 3;
  const subtotal = p.price * nn;
  const fee = Math.round(subtotal * AIRBNB_FEE_RATE);
  const total = subtotal + p.cleaning;
  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  app.innerHTML = `
    <div class="wrap checkout">
      <div>
        <a class="btn btn-ghost" href="#/property/${p.id}" style="margin-bottom:20px">← Back</a>
        <h1>Confirm and pay</h1>
        <p class="lead">You're booking direct with Gaia Residence. No marketplace fees added.</p>

        <div class="field"><label>Full name</label><input id="ck-name" placeholder="Jane Traveller" value=""></div>
        <div class="field-row">
          <div class="field"><label>Email</label><input id="ck-email" placeholder="jane@email.com"></div>
          <div class="field"><label>Phone</label><input placeholder="+351 ..."></div>
        </div>
        <div class="field"><label>Anything we should know? (early check-in, etc.)</label><textarea rows="3" placeholder="Optional message to your host"></textarea></div>

        <h2 style="font-family:var(--font-display);font-size:22px;margin:26px 0 12px">Payment</h2>
        <div class="field-row">
          <div class="field"><label>Card number</label><input placeholder="4242 4242 4242 4242"></div>
          <div class="field"><label>Expiry · CVC</label><input placeholder="04/28 · 123"></div>
        </div>
        <div class="pay-mock">🔒 Prototype checkout. Stripe would be wired here in the real build. No card is charged.</div>

        <button class="btn btn-primary btn-block btn-lg" id="pay-btn" style="margin-top:24px">Pay ${EUR(total)} & confirm</button>
      </div>

      <div class="summary-card">
        <div class="summary-media">${imgTag(p.images[0], p.name, "", 800)}</div>
        <div class="summary-body">
          <div class="card-rate" style="margin-bottom:6px">${stars(p.rating)} · ${p.reviews} reviews</div>
          <h3 style="font-size:21px">${p.name}</h3>
          <div class="card-hood">${p.neighborhood} · ${p.type}</div>
          <div style="margin:18px 0;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
            <div class="bk-row" style="color:var(--ink)"><span>Dates</span><span>${fmt(store.checkin)} → ${fmt(store.checkout)}</span></div>
            <div class="bk-row" style="color:var(--ink)"><span>Guests</span><span>${store.guests}</span></div>
          </div>
          <div class="bk-row"><span>${EUR(p.price)} × ${nn} nights</span><span>${EUR(subtotal)}</span></div>
          <div class="bk-row"><span>Cleaning fee</span><span>${EUR(p.cleaning)}</span></div>
          <div class="bk-row free"><span>Service fee <span class="bk-strike">${EUR(fee)}</span></span><b>$0</b></div>
          <div class="bk-total"><span>Total</span><b>${EUR(total)}</b></div>
          <div class="bk-save">✦ ${EUR(fee)} saved vs Airbnb</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("pay-btn").addEventListener("click", () => {
    window._lastBooking = { p, total, nn };
    location.hash = "#/confirmed";
  });
  window.scrollTo(0, 0);
}

/* ============================================================
   CONFIRMATION
   ============================================================ */
function renderConfirmed() {
  const b = window._lastBooking;
  const p = b ? b.p : PROPERTIES[0];
  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  app.innerHTML = `
    <div class="wrap">
      <div class="confirm">
        <div class="confirm-check">✓</div>
        <h1>You're booked, direct.</h1>
        <p>A confirmation is on its way. Your host at <b>${p.name}</b> will reach out personally before check-in.</p>
        <div class="confirm-box">
          <div class="bk-row" style="color:var(--ink)"><span>Home</span><b>${p.name}</b></div>
          <div class="bk-row" style="color:var(--ink)"><span>Dates</span><span>${fmt(store.checkin)} → ${fmt(store.checkout)}</span></div>
          <div class="bk-row" style="color:var(--ink)"><span>Guests</span><span>${store.guests}</span></div>
          <div class="bk-total"><span>Paid</span><b>${b?EUR(b.total):""}</b></div>
          <div class="bk-save" style="margin-top:14px">✦ You saved on every fee by booking direct with Gaia</div>
        </div>
        <a class="btn btn-dark btn-lg" href="#/" style="margin-top:28px">Back to home</a>
      </div>
    </div>
  `;
  window.scrollTo(0, 0);
}

/* ============================================================
   SUB-PAGES
   ============================================================ */
function pageBanner(eyebrow, title, sub, img) {
  return `
  <section class="page-hero">
    <div class="page-hero-bg">${imgTag(img, title)}</div>
    <div class="wrap page-hero-in">
      <div class="hero-eyebrow">${eyebrow}</div>
      <h1>${title}</h1>
      ${sub ? `<p>${sub}</p>` : ""}
    </div>
  </section>`;
}

function renderAbout() {
  app.innerHTML = pageBanner("The Project", "Where the jungle meets the sea",
    "A private hilltop retreat in Chaloklum, Koh Phangan. Genuine seclusion, two minutes from the sand.", "img/ext-1.jpg") + `
  <section class="page">
    <div class="wrap narrow-page">
      <p class="lede-quote">"Waking up to 180° views over Chaloklum Bay. Two minutes from your door, the beach, the cafés, the life."</p>
      <p class="page-p">Perched on its own private hilltop and wrapped in protected forest that can never be built upon, Gaia Residence is a rare thing: true seclusion, steps from the sea. North-facing for a cool ocean breeze all day, with high-end materials, spacious layouts and panoramic views from every residence.</p>
      <p class="page-p">When you are away, a full turn-key team cares for your home and your guests. When you are here, the spa, yoga shala, gym and sea-view café are all part of daily life.</p>
    </div>
    <div class="wrap">
      <div class="facts-grid">
        <div class="fact"><b>180°</b><span>panoramic bay views</span></div>
        <div class="fact"><b>2 min</b><span>walk to the beach</span></div>
        <div class="fact"><b>North</b><span>facing, cool all day</span></div>
        <div class="fact"><b>Forever</b><span>protected forest view</span></div>
      </div>
    </div>
    <div class="wrap split-feature">
      <div class="sf-text">
        <div class="section-eyebrow">The setting</div>
        <h2>A life elevated by nature</h2>
        <p>Three collections sit across the hillside: the Ocean View Residences with private gardens, the generous Panorama Residences with wrap-around terraces, and the top-floor Penthouse Collection with soaring ceilings and plunge pools. Every home faces the bay.</p>
        <a class="btn btn-primary" href="#/search">Browse the residences</a>
      </div>
      <div class="sf-media">${imgTag("img/ext-2.jpg", "Gaia Residence with pool")}</div>
    </div>
  </section>`;
  window.scrollTo(0, 0);
}

function renderLocation() {
  app.innerHTML = pageBanner("Location", "Chaloklum, Koh Phangan",
    "Where forested national-park mountains reach down to wide white-sand beaches.", "img/ext-site.jpg") + `
  <section class="page">
    <div class="wrap narrow-page">
      <p class="page-p">Gaia sits on a private mini-mountain at the heart of Chaloklum, a relaxed fishing village in the north of Koh Phangan. Walk to the beach, the cafés and the pier in minutes. Yet from your terrace: pure nature, pure silence, 180 degrees of ocean.</p>
    </div>
    <div class="wrap">
      <div class="nearby-grid big">
        <div class="nearby"><b>2 min</b><span>walk to Chaloklum Beach</span></div>
        <div class="nearby"><b>3 min</b><span>to village cafés & restaurants</span></div>
        <div class="nearby"><b>5 min</b><span>to Chaloklum Pier</span></div>
        <div class="nearby"><b>10 min</b><span>to Haad Khom / Coral Bay</span></div>
        <div class="nearby"><b>20 min</b><span>drive to Thong Sala town</span></div>
        <div class="nearby"><b>45 min</b><span>to the Haad Rin ferries</span></div>
      </div>
    </div>
    <div class="wrap"><div class="loc-map-wrap"><div id="loc-map"></div></div></div>
    <div class="wrap narrow-page">
      <div class="section-eyebrow">Getting here</div>
      <h2 style="margin-bottom:14px">How to reach Gaia</h2>
      <p class="page-p">Fly into Koh Samui (USM) or Surat Thani (URT), then take the ferry to Thong Sala pier on Koh Phangan. From the pier it is a 20-minute drive north to Chaloklum. We are happy to arrange a private transfer to your residence.</p>
      <a class="btn btn-primary" href="#/contact">Arrange a transfer</a>
    </div>
  </section>`;
  setTimeout(buildLocationMap, 60);
  window.scrollTo(0, 0);
}

function renderAmenities() {
  const rows = [
    { t: "On-Site Café & Restaurant", img: "img/cafe-1.jpg", d: "A boho-chic three-tier café with sea views, a pool terrace and an air-conditioned co-working space. Morning coffee by the water, sunset dinner in the open air." },
    { t: "High-End Spa & Sauna", img: "img/sauna-ext.jpg", d: "A full spa open to residents, with a sauna over the bay, plunge pool and ice bath on-site. Wellness is part of everyday life at Gaia, not a once-a-trip treat." },
    { t: "Yoga Shala", img: "img/yoga-ext.jpg", d: "A dedicated yoga shala nestled within the grounds, open to the jungle and the sea. Koh Phangan is one of the world's premier wellness destinations, brought home to your doorstep." },
    { t: "Gym, Pool & Beyond", img: "img/ext-2.jpg", d: "A fully-equipped gym, pools across the development and a family day-care centre. A complete daily rhythm without leaving the hilltop." },
  ];
  app.innerHTML = pageBanner("Life at Gaia", "Everything in one place",
    "Spa, yoga, gym, café and pool, steps from your door and the sea.", "img/cafe-2.jpg") + `
  <section class="page">
    ${rows.map((r, i) => `
      <div class="wrap amenity-row ${i % 2 ? "rev" : ""}">
        <div class="ar-media">${imgTag(r.img, r.t)}</div>
        <div class="ar-text"><h2>${r.t}</h2><p>${r.d}</p></div>
      </div>`).join("")}
    <div class="wrap" style="text-align:center;margin-top:24px">
      <a class="btn btn-primary btn-lg" href="#/search">Find your residence</a>
    </div>
  </section>`;
  window.scrollTo(0, 0);
}

function renderContact() {
  app.innerHTML = pageBanner("Contact", "Speak to our island team",
    "Questions, special requests or a private transfer? Our team in Chaloklum is here to help.", "img/ext-4.jpg") + `
  <section class="page">
    <div class="wrap contact-page">
      <div class="cp-form">
        <form id="contact-form">
          <div class="field-row">
            <div class="field"><label>Name</label><input id="cf-name" required placeholder="Your name"></div>
            <div class="field"><label>Email</label><input id="cf-email" type="email" required placeholder="you@email.com"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Check in</label><input type="date" value="${store.checkin}" min="2026-06-06"></div>
            <div class="field"><label>Check out</label><input type="date" value="${store.checkout}" min="2026-06-07"></div>
          </div>
          <div class="field"><label>Message</label><textarea rows="4" placeholder="Tell us about your stay"></textarea></div>
          <button class="btn btn-primary btn-block btn-lg" type="submit">Send enquiry</button>
          <p class="form-success" id="cf-success" hidden>Thank you. Our team will reply within 24 hours.</p>
        </form>
      </div>
      <aside class="cp-info">
        <div class="section-eyebrow">Direct line</div>
        <h2>Gaia Residence</h2>
        <p class="cp-addr">Chaloklum, Koh Phangan, Surat Thani, Thailand</p>
        <div class="cp-details">
          <a href="mailto:hello@gaia-residence.com"><span>Email</span>hello@gaia-residence.com</a>
          <a href="https://www.gaia-residence.com/" target="_blank" rel="noopener"><span>WhatsApp / Enquire</span>gaia-residence.com</a>
        </div>
        <p class="cp-note">Booking direct means no marketplace fees and a real person on the island looking after your stay.</p>
      </aside>
    </div>
  </section>`;
  document.getElementById("contact-form").addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.querySelectorAll("input,textarea,button").forEach(el => el.disabled = true);
    document.getElementById("cf-success").hidden = false;
  });
  window.scrollTo(0, 0);
}

function renderFAQ() {
  const faqs = [
    ["Is booking direct really cheaper than Airbnb?", "Yes. Marketplaces add a guest service fee of roughly 12-16% at checkout. Booking direct with Gaia removes that entirely, and we match any lower price you find for the same dates."],
    ["How does payment work?", "You reserve online and pay securely. In the live site this connects to a payment provider; in this preview no card is charged."],
    ["What are check-in and check-out times?", "Check-in is from 3pm and check-out is by 11am. Early check-in or late check-out can often be arranged with our on-site team."],
    ["Is there a minimum stay?", "Most residences have a 2-night minimum, with better rates for weekly and monthly stays. Ask us about long-stay pricing."],
    ["What is the cancellation policy?", "Cancellation terms depend on the residence and the season. We keep them simple and clear, and confirm everything in writing before you book."],
    ["Do you arrange airport transfers?", "Yes. Tell us your ferry or flight details and we will arrange a private transfer from Thong Sala pier to your residence."],
    ["Are the residences serviced?", "Every residence is fully managed and cleaned, with the spa, yoga shala, gym and café all on-site."],
  ];
  app.innerHTML = pageBanner("FAQ", "Good to know",
    "Everything you might want to ask before you book.", "img/demo-sofa.jpg") + `
  <section class="page">
    <div class="wrap narrow-page">
      <div class="faq-list">
        ${faqs.map(([q, a]) => `<details class="faq-item"><summary>${q}</summary><p>${a}</p></details>`).join("")}
      </div>
      <div style="text-align:center;margin-top:42px">
        <p class="page-p" style="margin-bottom:18px">Still have a question?</p>
        <a class="btn btn-primary" href="#/contact">Contact our team</a>
      </div>
    </div>
  </section>`;
  window.scrollTo(0, 0);
}

/* ============================================================
   ROUTER
   ============================================================ */
function router() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/");

  document.body.dataset.route = parts[0] || "home";
  if (mapInstance && parts[0] !== "location") { mapInstance.remove(); mapInstance = null; }

  if (parts[0] === "") return renderHome();
  if (parts[0] === "search") return renderSearch();
  if (parts[0] === "property") return renderProperty(parts[1]);
  if (parts[0] === "book") return renderBook(parts[1]);
  if (parts[0] === "confirmed") return renderConfirmed();
  if (parts[0] === "about") return renderAbout();
  if (parts[0] === "location") return renderLocation();
  if (parts[0] === "amenities") return renderAmenities();
  if (parts[0] === "contact") return renderContact();
  if (parts[0] === "faq") return renderFAQ();
  return renderHome();
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
router();

// mobile hamburger menu
(function () {
  const nav = document.getElementById("nav");
  const burger = document.getElementById("nav-burger");
  if (!nav || !burger) return;
  const close = () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); };
  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", close));
  window.addEventListener("hashchange", close);
  document.addEventListener("click", (e) => { if (nav.classList.contains("open") && !nav.contains(e.target)) close(); });
})();
