// GAIA Residence · direct booking prototype data.
// Real photos + real project info from gaia-residence.com (Chaloklum, Koh Phangan).
// Nightly rates are placeholders for the booking demo (site lists sale prices only).

const AMENITIES = {
  seaview: "180° sea view",
  beach: "2 min walk to beach",
  pool: "Pool",
  terrace: "Panoramic terrace",
  garden: "Private garden",
  ac: "Air conditioning",
  kitchen: "Full kitchen",
  wifi: "Fast fibre Wi-Fi",
  workspace: "Workspace",
  spa: "Spa & sauna access",
  yoga: "Yoga shala",
  gym: "Gym access",
  cafe: "On-site café",
  parking: "Parking",
};

// Development-wide amenities every residence enjoys.
const SHARED = ["spa", "yoga", "gym", "cafe", "wifi", "ac", "pool"];

function gimg(name) { return "img/" + name; }

const PROPERTIES = [
  {
    id: "lotus-garden",
    name: "Lotus · Garden Sea-View Suite",
    neighborhood: "Ocean View Residences",
    type: "1-bedroom residence · Entire place",
    lat: 9.7548, lng: 100.0083,
    price: 175, cleaning: 35, beds: 1, baths: 1, guests: 2, sqm: 88,
    rating: 4.93, reviews: 86,
    tags: ["seaview", "garden", "beach", "kitchen", "workspace", ...SHARED],
    blurb: "A sunlit one-bedroom with a private garden and the bay at your feet.",
    description:
      "Wake to 180° views over Chaloklum Bay in this calm, light-filled suite. Floor-to-ceiling glass opens to a private garden, two minutes from the sand. North-facing for a cool ocean breeze all day, with the café, spa and yoga shala just steps away.",
    images: [gimg("demo-sofa.jpg"), gimg("demo-bed.jpg"), gimg("demo-corner.jpg"), gimg("demo-plants.jpg")],
    booked: [["2026-06-20", "2026-06-26"], ["2026-07-10", "2026-07-15"]],
  },
  {
    id: "frangipani-seaview",
    name: "Frangipani · Two-Bed Sea View",
    neighborhood: "Ocean View Residences",
    type: "2-bedroom residence · Entire place",
    lat: 9.7541, lng: 100.0091,
    price: 245, cleaning: 45, beds: 2, baths: 2, guests: 4, sqm: 103,
    rating: 4.9, reviews: 112,
    tags: ["seaview", "terrace", "beach", "kitchen", "workspace", ...SHARED],
    blurb: "Spacious two-bedroom with a panoramic terrace over the bay.",
    description:
      "103 m² of effortless island living. Two double bedrooms, a generous living space that flows onto a panoramic terrace, and uninterrupted ocean views protected forever by the national park beyond.",
    images: [gimg("demo-greenery.jpg"), gimg("demo-sofatable.jpg"), gimg("demo-curtains.jpg"), gimg("demo-tv.jpg")],
    booked: [["2026-06-12", "2026-06-16"]],
  },
  {
    id: "hibiscus-garden",
    name: "Hibiscus · Garden Two-Bed",
    neighborhood: "Ocean View Residences",
    type: "2-bedroom residence · Entire place",
    lat: 9.7555, lng: 100.0078,
    price: 235, cleaning: 45, beds: 2, baths: 2, guests: 4, sqm: 103,
    rating: 4.88, reviews: 74,
    tags: ["garden", "seaview", "beach", "kitchen", ...SHARED],
    blurb: "Ground-floor two-bedroom opening to a lush private garden.",
    description:
      "Surrounded by protected forest that can never be built upon. This ground-floor residence pairs a private garden with sweeping bay views, the best of both worlds for families and longer stays.",
    images: [gimg("demo-corner.jpg"), gimg("demo-bed2.jpg"), gimg("demo-sofa2.jpg"), gimg("demo-plants.jpg")],
    booked: [["2026-08-01", "2026-08-12"]],
  },
  {
    id: "banyan-panorama",
    name: "Banyan · Panorama Three-Bed",
    neighborhood: "Panorama Residences",
    type: "3-bedroom residence · Entire place",
    lat: 9.7536, lng: 100.0098,
    price: 420, cleaning: 70, beds: 3, baths: 3, guests: 6, sqm: 206,
    rating: 4.96, reviews: 64,
    tags: ["seaview", "terrace", "beach", "kitchen", "workspace", "parking", ...SHARED],
    blurb: "Generous 206 m² with three ensuites and a wrap-around terrace.",
    description:
      "The flagship layout. 206 m² with a dedicated dining room, three ensuite bedrooms and a wrap-around panoramic terrace that follows the sun from sunrise over the jungle to sunset across the bay.",
    images: [gimg("duplex-living.jpg"), gimg("duplex-bed1.jpg"), gimg("duplex-dining.jpg"), gimg("cafe-1.jpg")],
    booked: [["2026-07-20", "2026-07-30"]],
  },
  {
    id: "teak-terrace",
    name: "Teak · Wrap-Terrace Residence",
    neighborhood: "Panorama Residences",
    type: "3-bedroom residence · Entire place",
    lat: 9.7530, lng: 100.0089,
    price: 440, cleaning: 70, beds: 3, baths: 3, guests: 6, sqm: 206,
    rating: 4.92, reviews: 58,
    tags: ["seaview", "terrace", "beach", "kitchen", "parking", ...SHARED],
    blurb: "Three ensuites, soaring living space and 180° of ocean.",
    description:
      "High-end materials, spacious open-plan living and a wrap-around terrace built for long lunches and longer sunsets. Steps from the café, spa and the beach below.",
    images: [gimg("duplex-dining.jpg"), gimg("duplex-bed2.jpg"), gimg("duplex-kitchen.jpg"), gimg("ext-2.jpg")],
    booked: [],
  },
  {
    id: "monsoon-panorama",
    name: "Monsoon · Two-Bed Panorama",
    neighborhood: "Panorama Residences",
    type: "2-bedroom residence · Entire place",
    lat: 9.7544, lng: 100.0102,
    price: 360, cleaning: 60, beds: 2, baths: 2, guests: 4, sqm: 180,
    rating: 4.89, reviews: 47,
    tags: ["seaview", "terrace", "beach", "kitchen", "workspace", ...SHARED],
    blurb: "A wide two-bedroom with one of the best terraces in the project.",
    description:
      "Designed around the view. An expansive terrace wraps the living space, framing the full sweep of Chaloklum Bay. Cool, north-facing and serene, with the village a short stroll downhill.",
    images: [gimg("duplex-bedgreen.jpg"), gimg("duplex-living.jpg"), gimg("duplex-bath.jpg"), gimg("cafe-4.jpg")],
    booked: [["2026-06-13", "2026-06-15"], ["2026-09-01", "2026-09-05"]],
  },
  {
    id: "sky-penthouse",
    name: "Sky · Penthouse with Plunge Pool",
    neighborhood: "Penthouse Collection",
    type: "Penthouse · Entire place",
    lat: 9.7539, lng: 100.0085,
    price: 560, cleaning: 90, beds: 2, baths: 2, guests: 4, sqm: 160,
    rating: 4.97, reviews: 39,
    tags: ["seaview", "terrace", "pool", "beach", "kitchen", "workspace", ...SHARED],
    blurb: "Top-floor penthouse with 4.7 m ceilings and a private plunge pool.",
    description:
      "Soaring 4.7 m ceilings, a private plunge pool and the most expansive terrace in the development. The whole of Chaloklum Bay laid out below, with nothing to block the view, ever.",
    images: [gimg("demo-curtains.jpg"), gimg("demo-greenery.jpg"), gimg("demo-bed.jpg"), gimg("duplex-living.jpg")],
    booked: [["2026-06-18", "2026-06-22"]],
  },
  {
    id: "horizon-penthouse",
    name: "Horizon · Grand Penthouse",
    neighborhood: "Penthouse Collection",
    type: "Penthouse · Entire place",
    lat: 9.7533, lng: 100.0094,
    price: 690, cleaning: 110, beds: 3, baths: 3, guests: 6, sqm: 206,
    rating: 4.98, reviews: 33,
    tags: ["seaview", "terrace", "pool", "beach", "kitchen", "workspace", "parking", ...SHARED],
    blurb: "The grandest residence at Gaia, three ensuites, vast terrace, plunge pool.",
    description:
      "The crown of the hilltop. 206 m² of penthouse living with three ensuite bedrooms, a private plunge pool and a terrace that feels suspended over the sea. Sunset dinners you will never forget.",
    images: [gimg("demo-sofatable.jpg"), gimg("demo-tv.jpg"), gimg("ext-3.jpg"), gimg("demo-sofa2.jpg")],
    booked: [],
  },
];

// Average marketplace service fee used to illustrate direct-booking savings.
const AIRBNB_FEE_RATE = 0.14;
