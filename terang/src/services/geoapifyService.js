/**
 * Layanan Geoapify Geocoding & Deteksi Laporan Serupa TERANG
 * Wilayah Studi Kasus Demo: Kecamatan Coblong, Kota Bandung
 *
 * Menggunakan:
 * - Geoapify Address Autocomplete API (https://api.geoapify.com/v1/geocode/autocomplete)
 * - Geoapify Reverse Geocoding API (https://api.geoapify.com/v1/geocode/reverse)
 * Tidak menggunakan endpoint Nominatim publik.
 */

export const COBLONG_CENTER = {
  lat: -6.8904,
  lng: 107.6145,
  zoom: 16,
  label: 'Kecamatan Coblong, Kota Bandung',
};

// Batas geografis perkiraan wilayah Kecamatan Coblong, Kota Bandung
// (mencakup Lebakgede, Lebak Siliwangi, Sadang Serang, Sekeloa, Dago, Cipaganti)
export const COBLONG_BOUNDS = {
  minLat: -6.912,
  maxLat: -6.858,
  minLng: 107.592,
  maxLng: 107.642,
};

// Radius deteksi laporan serupa pada proyek TERANG (meter)
export const SIMILAR_REPORT_RADIUS_METERS = 250;

/**
 * Mengambil API Key Geoapify dari environment variable Vite
 */
export function getGeoapifyApiKey() {
  const raw = import.meta.env.VITE_GEOAPIFY_API_KEY;
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (
    !trimmed ||
    trimmed === 'masukkan_api_key_geoapify_anda_di_sini' ||
    trimmed === 'YOUR_GEOAPIFY_API_KEY'
  ) {
    return '';
  }
  return trimmed;
}

export function hasGeoapifyApiKey() {
  return Boolean(getGeoapifyApiKey());
}

/**
 * Memeriksa apakah koordinat berada di dalam wilayah studi kasus Kecamatan Coblong, Bandung
 */
export function isInsideCoblongArea(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= COBLONG_BOUNDS.minLat &&
    lat <= COBLONG_BOUNDS.maxLat &&
    lng >= COBLONG_BOUNDS.minLng &&
    lng <= COBLONG_BOUNDS.maxLng
  );
}

/**
 * Menghitung jarak Haversine antara dua titik koordinat dalam satuan meter
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius bumi dalam meter
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normalisasi properti fitur Geoapify menjadi objek lokasi terstruktur
 */
function normalizeGeoapifyFeature(feature, index = 0) {
  const props = feature?.properties || {};
  const coords = feature?.geometry?.coordinates || [];
  const lat = Number.isFinite(props.lat) ? props.lat : Number(coords[1]);
  const lng = Number.isFinite(props.lon) ? props.lon : Number(coords[0]);

  const primaryText =
    props.address_line1 ||
    props.name ||
    props.street ||
    props.suburb ||
    props.formatted ||
    'Lokasi terpilih';

  const secondaryText =
    props.address_line2 ||
    [props.suburb || props.quarter, props.district || props.city_district, props.city]
      .filter(Boolean)
      .join(', ');

  const formatted =
    props.formatted ||
    [primaryText, secondaryText].filter(Boolean).join(', ');

  return {
    id:
      props.place_id ||
      `${lat.toFixed(6)}_${lng.toFixed(6)}_${index}`,
    formatted,
    primaryText,
    secondaryText,
    street: props.street || props.name || primaryText,
    ward: props.suburb || props.quarter || props.village || '',
    subdistrict: props.district || props.city_district || props.suburb || '',
    city: props.city || props.county || 'Bandung',
    lat,
    lng,
  };
}

/**
 * Geoapify Address Autocomplete API
 * Dipanggil saat pengguna mengetik minimal 3 karakter dengan bias area Coblong, Bandung.
 * Mengembalikan maksimal 5 rekomendasi alamat.
 */
export async function autocompleteAddress(query, { signal } = {}) {
  const cleaned = String(query || '').trim();
  if (cleaned.length < 3) {
    return { ok: true, suggestions: [] };
  }

  const apiKey = getGeoapifyApiKey();
  if (!apiKey) {
    return {
      ok: false,
      code: 'MISSING_API_KEY',
      error:
        'VITE_GEOAPIFY_API_KEY belum dikonfigurasi pada file terang/.env.local. Anda tetap dapat memilih lokasi langsung pada peta atau menggunakan tombol Gunakan Lokasi Saya.',
      suggestions: [],
    };
  }

  // Bias pencarian ke sekitar Kecamatan Coblong & filter negara Indonesia
  const params = new URLSearchParams({
    text: cleaned,
    limit: '5',
    lang: 'id',
    filter: 'countrycode:id',
    bias: `proximity:${COBLONG_CENTER.lng},${COBLONG_CENTER.lat}`,
    apiKey,
  });

  const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          code: 'INVALID_API_KEY',
          error:
            'API key Geoapify tidak valid atau ditolak. Periksa kembali nilai VITE_GEOAPIFY_API_KEY di terang/.env.local.',
          suggestions: [],
        };
      }
      return {
        ok: false,
        code: 'API_ERROR',
        error: `Gagal memuat rekomendasi alamat (HTTP ${response.status}). Silakan pilih titik langsung di peta.`,
        suggestions: [],
      };
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    const suggestions = features
      .map((f, idx) => normalizeGeoapifyFeature(f, idx))
      .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .slice(0, 5);

    return {
      ok: true,
      suggestions,
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { ok: true, aborted: true, suggestions: [] };
    }
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error:
        'Tidak dapat terhubung ke layanan Geoapify. Periksa koneksi internet Anda atau pilih titik langsung pada peta.',
      suggestions: [],
    };
  }
}

/**
 * Geoapify Reverse Geocoding API
 * Mengubah koordinat (lat, lng) menjadi nama jalan/alamat.
 */
export async function reverseGeocodeCoordinates(lat, lng, { signal } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      formatted: '',
    };
  }

  const fallbackCoordLabel = `Titik Koordinat (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
  const apiKey = getGeoapifyApiKey();

  if (!apiKey) {
    return {
      ok: false,
      code: 'MISSING_API_KEY',
      formatted: fallbackCoordLabel,
      street: fallbackCoordLabel,
      ward: '',
      subdistrict: isInsideCoblongArea(lat, lng) ? 'Coblong' : '',
      city: 'Bandung',
    };
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    lang: 'id',
    apiKey,
  });

  const url = `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        code: 'API_ERROR',
        formatted: fallbackCoordLabel,
        street: fallbackCoordLabel,
        ward: '',
        subdistrict: isInsideCoblongArea(lat, lng) ? 'Coblong' : '',
        city: 'Bandung',
      };
    }

    const data = await response.json();
    const firstFeature = Array.isArray(data?.features) ? data.features[0] : null;
    if (!firstFeature) {
      return {
        ok: true,
        formatted: fallbackCoordLabel,
        street: fallbackCoordLabel,
        ward: '',
        subdistrict: isInsideCoblongArea(lat, lng) ? 'Coblong' : '',
        city: 'Bandung',
      };
    }

    const normalized = normalizeGeoapifyFeature(firstFeature, 0);
    return {
      ok: true,
      ...normalized,
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { ok: false, aborted: true, formatted: '' };
    }
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      formatted: fallbackCoordLabel,
      street: fallbackCoordLabel,
      ward: '',
      subdistrict: isInsideCoblongArea(lat, lng) ? 'Coblong' : '',
      city: 'Bandung',
    };
  }
}

/**
 * Mencocokkan kategori pilihan form dengan kategori pada dataset SAMPLE_REPORTS
 */
function isCategoryMatch(selectedCategory, reportCategory) {
  if (!selectedCategory || !reportCategory) return false;
  const normSelected = String(selectedCategory).trim().toLowerCase();
  const normReport = String(reportCategory).trim().toLowerCase();

  if (normSelected === normReport) return true;

  // Normalisasi "Lampu Jalan" <-> "Penerangan Jalan" pada dataset SAMPLE_REPORTS
  const lightingAliases = ['lampu jalan', 'penerangan jalan', 'pju'];
  if (
    lightingAliases.includes(normSelected) &&
    lightingAliases.includes(normReport)
  ) {
    return true;
  }

  return false;
}

/**
 * Mengurai string koordinat "-6.8924, 107.6178" menjadi { lat, lng }
 */
export function parseReportCoordinates(report) {
  if (!report) return null;
  if (Number.isFinite(report.latitude) && Number.isFinite(report.longitude)) {
    return { lat: Number(report.latitude), lng: Number(report.longitude) };
  }
  if (typeof report.coordinates === 'string') {
    const parts = report.coordinates.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  return null;
}

/**
 * Deteksi Laporan Serupa berdasarkan dataset nyata yang tersedia (SAMPLE_REPORTS)
 * Hanya dijalankan setelah pengguna memilih lokasi (lat, lng) DAN kategori.
 * Tidak menghasilkan jumlah laporan palsu.
 */
export function findSimilarReports({
  lat,
  lng,
  category,
  reports = [],
  radiusMeters = SIMILAR_REPORT_RADIUS_METERS,
}) {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    !category ||
    !Array.isArray(reports)
  ) {
    return [];
  }

  const matches = [];

  for (const report of reports) {
    if (!isCategoryMatch(category, report.category)) {
      continue;
    }

    const coords = parseReportCoordinates(report);
    if (!coords) continue;

    const distanceMeters = calculateDistanceMeters(
      lat,
      lng,
      coords.lat,
      coords.lng
    );

    if (distanceMeters <= radiusMeters) {
      matches.push({
        id: report.id,
        title: report.title || report.category,
        category: report.category,
        address: report.address || report.location || '',
        status: report.status || 'Menunggu Verifikasi',
        urgency: report.urgency || null,
        distanceMeters,
        coordinates: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        isRecurring: Boolean(report.radarDetails?.isRecurring),
        linkedReportId: report.radarDetails?.linkedReportId || null,
      });
    }
  }

  matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return matches;
}
