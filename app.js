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
function cardHTML(p, booked = false) {
  return `
    <article class="card ${booked ? "is-booked" : ""}" data-id="${p.id}">
      <div class="card-media">
        ${imgTag(p.images[0], p.name, "", 800)}
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

/* ============================================================
   HOME
   ============================================================ */
function renderHome() {
  const featured = PROPERTIES.slice(0, 6);
  const hoods = [
    { n: "180° Sea Views", img: "img/view1.webp", t: "Every residence faces the bay" },
    { n: "2′ to the Beach", img: "img/ext1.webp", t: "Sand, cafés and the pier" },
    { n: "Café & Restaurant", img: "img/cafe.webp", t: "Boho-chic, sea-view dining" },
    { n: "Spa & Sauna", img: "img/bath.webp", t: "Sauna and ice bath on-site" },
    { n: "Yoga Shala", img: "img/cafe2.webp", t: "Movement nestled in the grounds" },
  ];

  app.innerHTML = `
  <section class="hero">
    <div class="hero-bg">${imgTag("img/ext_main.webp", "Gaia Residence over Chaloklum Bay", "")}</div>
    <div class="hero-content wrap">
      <div class="hero-eyebrow">Sea-view residences · book direct · Koh Phangan</div>
      <h1>Hilltop living over Chaloklum Bay. <em>Book direct, save more.</em></h1>
      <p class="hero-sub">The same sea-view residences you'd find on Airbnb, booked straight with us. No service fees, a best-price guarantee, and our team on the island for you.</p>

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
          <button class="btn btn-primary" type="submit">Search stays</button>
        </div>
      </form>
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

  <section class="why" id="why">
    <div class="wrap">
      <div class="section-head">
        <div class="section-eyebrow">Why book direct</div>
        <h2>The same residences, a better deal for you.</h2>
        <p>When you book Gaia direct instead of through a marketplace, you skip the middleman's cut. Everyone wins, except the fee.</p>
      </div>
      <div class="why-grid">
        <div class="why-card"><div class="why-ico">％</div><h3>Zero service fees</h3><p>Marketplaces add 12-16% at checkout. We don't. The price you see is the price you pay.</p></div>
        <div class="why-card"><div class="why-ico">✓</div><h3>Best-price guarantee</h3><p>See it cheaper on another site for the same dates? We'll match it and take off another 5%.</p></div>
        <div class="why-card"><div class="why-ico">⚡</div><h3>Live availability</h3><p>Our calendar syncs across every platform in real time, so what you see is genuinely free.</p></div>
        <div class="why-card"><div class="why-ico">♥</div><h3>A real host</h3><p>Direct line to the people who own and care for each home. Early check-in? Just ask.</p></div>
      </div>

      <div class="why-savings">
        <div>
          <h3>Booking direct saves a typical guest real money.</h3>
          <p>On a 3-night stay at $320/night, a marketplace would add roughly $134 in service fees. With Gaia, that stays in your pocket.</p>
        </div>
        <div class="savings-figure">
          <div class="big">~14%</div>
          <div class="lbl">average saved vs Airbnb</div>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="grid-head">
        <div class="section-head" style="margin-bottom:0">
          <div class="section-eyebrow">Hand-picked</div>
          <h2>Featured residences</h2>
        </div>
        <a class="btn btn-ghost" href="#/search">View all residences →</a>
      </div>
      <div class="cards">
        ${featured.map(p => cardHTML(p)).join("")}
      </div>
    </div>
  </section>

  <section class="why" id="neighborhoods">
    <div class="wrap">
      <div class="section-head">
        <div class="section-eyebrow">Life at Gaia</div>
        <h2>Everything in one place, steps from the sea</h2>
      </div>
      <div class="hoods">
        ${hoods.map(h => `
          <div class="hood" data-hood="">
            ${imgTag(h.img, h.n, "")}
            <div class="hood-label"><h4>${h.n}</h4><span>${h.t}</span></div>
          </div>`).join("")}
      </div>
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
  app.querySelectorAll(".card").forEach(c =>
    c.addEventListener("click", () => (location.hash = `#/property/${c.dataset.id}`)));
  app.querySelectorAll(".hood").forEach(h =>
    h.addEventListener("click", () => { store.location = "All residences"; location.hash = "#/search"; }));
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
      <div class="results-map-wrap"><div id="map"></div></div>
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

  // card → detail + hover sync with map
  app.querySelectorAll(".card:not(.is-booked)").forEach(c => {
    c.addEventListener("click", () => (location.hash = `#/property/${c.dataset.id}`));
    c.addEventListener("mouseenter", () => highlightPin(c.dataset.id, true));
    c.addEventListener("mouseleave", () => highlightPin(c.dataset.id, false));
  });

  buildMap(available);
}

function buildMap(list) {
  if (mapInstance) { mapInstance.remove(); mapInstance = null; }
  markers = {};
  if (!document.getElementById("map")) return;

  mapInstance = L.map("map", { scrollWheelZoom: false, zoomControl: true })
    .setView([9.7539, 100.0092], 15);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap © CARTO",
    maxZoom: 19,
  }).addTo(mapInstance);

  const bounds = [];
  list.forEach(p => {
    const icon = L.divIcon({
      className: "",
      html: `<div class="map-pin" data-id="${p.id}">${EUR(p.price)}</div>`,
      iconSize: null,
    });
    const m = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance);
    m.bindPopup(`<b>${p.name}</b><br>${p.neighborhood} · ${EUR(p.price)}/night<br>★ ${p.rating}`);
    m.on("click", () => (location.hash = `#/property/${p.id}`));
    m.on("mouseover", () => highlightCard(p.id, true));
    m.on("mouseout", () => highlightCard(p.id, false));
    markers[p.id] = m;
    bounds.push([p.lat, p.lng]);
  });
  if (bounds.length) mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
}

function highlightPin(id, on) {
  const el = document.querySelector(`.map-pin[data-id="${id}"]`);
  if (el) el.classList.toggle("is-active", on);
}
function highlightCard(id, on) {
  const el = document.querySelector(`.card[data-id="${id}"]`);
  if (el) el.classList.toggle("is-active", on);
}

/* ============================================================
   PROPERTY DETAIL
   ============================================================ */
function renderProperty(id) {
  const p = PROPERTIES.find(x => x.id === id);
  if (!p) { location.hash = "#/search"; return; }

  const n = nights(store.checkin, store.checkout) || 3;
  const avail = isAvailable(p, store.checkin, store.checkout);

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

      <div class="pd-gallery">
        ${imgTag(p.images[0], p.name, "g-main", 1400)}
        ${p.images.slice(1, 5).map(i => imgTag(i, p.name, "", 700)).join("")}
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
            <h2>Where you'll be</h2>
            <p style="margin-bottom:16px">${p.neighborhood} · Chaloklum, Koh Phangan. Two minutes downhill to the beach, cafés and pier.</p>
            <div class="pd-map" id="pd-map"></div>
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
            <div class="bk-note">You won't be charged yet · free cancellation for 48h</div>
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

  // mini map
  setTimeout(() => {
    if (!document.getElementById("pd-map")) return;
    const m = L.map("pd-map", { scrollWheelZoom: false, zoomControl: true }).setView([p.lat, p.lng], 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { attribution: "© OSM © CARTO" }).addTo(m);
    L.marker([p.lat, p.lng], {
      icon: L.divIcon({ html: `<div class="map-pin is-active">${p.name}</div>`, iconSize: null }),
    }).addTo(m);
  }, 60);

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
   ROUTER
   ============================================================ */
function router() {
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\//, "").split("/");

  if (mapInstance && parts[0] !== "search") { mapInstance.remove(); mapInstance = null; }

  if (parts[0] === "" ) return renderHome();
  if (parts[0] === "search") return renderSearch();
  if (parts[0] === "property") return renderProperty(parts[1]);
  if (parts[0] === "book") return renderBook(parts[1]);
  if (parts[0] === "confirmed") return renderConfirmed();
  return renderHome();
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
router();
