import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { getUserInitials } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { SAMPLE_REPORTS } from '../data/reportsData';
import { LAST_SUBMITTED_REPORT_ID_KEY } from './LaporanTerkirimPage';
import {
  COBLONG_CENTER,
  SIMILAR_REPORT_RADIUS_METERS,
  hasGeoapifyApiKey,
  isInsideCoblongArea,
  autocompleteAddress,
  reverseGeocodeCoordinates,
  findSimilarReports,
} from '../services/geoapifyService';
import './DashboardPage.css';
import './BuatLaporanPage.css';

const REPORT_DRAFT_STORAGE_KEY = 'terang_report_draft_v1';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', type: 'route' },
  {
    key: 'peta-laporan',
    label: 'Peta Laporan',
    href: '/peta-laporan',
    type: 'route',
  },
  {
    key: 'transparansi',
    label: 'Transparansi',
    href: '/transparansi',
    type: 'route',
  },
  {
    key: 'laporan-saya',
    label: 'Laporan Saya',
    href: '/laporan-saya',
    type: 'route',
  },
];

const STEPPER_ITEMS = [
  { step: 1, label: 'Lokasi & Jenis' },
  { step: 2, label: 'Foto & Keterangan' },
  { step: 3, label: 'Tinjau & Kirim' },
];

const DAMAGE_CATEGORIES = [
  {
    id: 'Jalan Rusak',
    label: 'Jalan Rusak',
    desc: 'Lubang aspal, retakan, atau jalan ambles',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19L9 5" />
        <path d="M15 5l5 14" />
        <path d="M12 6v2" />
        <path d="M12 11v2" />
        <path d="M12 16v2" />
      </svg>
    ),
  },
  {
    id: 'Drainase',
    label: 'Drainase',
    desc: 'Saluran tersumbat, meluap, atau penutup pecah',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        <path d="M12 3c-2.5 3.2-4 5.2-4 7a4 4 0 0 0 8 0c0-1.8-1.5-3.8-4-7z" />
      </svg>
    ),
  },
  {
    id: 'Lampu Jalan',
    label: 'Lampu Jalan',
    desc: 'PJU padam, berkedip, atau tiang miring',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    id: 'Fasilitas Umum',
    label: 'Fasilitas Umum',
    desc: 'Trotoar, halte, rambu, atau bangku publik',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <path d="M5 14v5" />
        <path d="M19 14v5" />
        <path d="M6 10V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4" />
      </svg>
    ),
  },
  {
    id: 'Lainnya',
    label: 'Lainnya',
    desc: 'Kerusakan fasilitas lingkungan lainnya',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
];

// Custom Leaflet DivIcon sesuai palet TERANG (#271A62 & #FFFF6B)
const TERANG_MARKER_ICON = L.divIcon({
  className: 'terang-map-marker-icon',
  html: `
    <div class="terang-pin-wrap" aria-hidden="true">
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 1.5C8.8873 1.5 1.5 8.8873 1.5 18C1.5 29.25 18 42.2 18 42.2C18 42.2 34.5 29.25 34.5 18C34.5 8.8873 27.1127 1.5 18 1.5Z" fill="#271A62" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="18" cy="17.5" r="7.5" fill="#FFFF6B" stroke="#271A62" stroke-width="1.5"/>
      </svg>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  popupAnchor: [0, -38],
});

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per foto
const MAX_PHOTOS_COUNT = 3;

const SAFETY_IMPACT_OPTIONS = [
  { id: 'Ya', label: 'Ya' },
  { id: 'Tidak', label: 'Tidak' },
  { id: 'Tidak Yakin', label: 'Tidak Yakin' },
];

// Penyimpanan sementara objek File & preview URL asli di memori selama sesi navigasi SPA
let inMemoryUploadedPhotos = [];

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSupportedImageFile(file) {
  if (!file) return false;
  const mime = String(file.type || '').toLowerCase();
  if (ALLOWED_IMAGE_MIME_TYPES.includes(mime)) return true;
  const lowerName = String(file.name || '').toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function createPersistablePhotoDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof window === 'undefined') {
      resolve('');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!rawDataUrl) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 760;
            let width = img.naturalWidth || img.width || maxDim;
            let height = img.naturalHeight || img.height || maxDim;
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              width = Math.max(1, Math.round(width * ratio));
              height = Math.max(1, Math.round(height * ratio));
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawDataUrl);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.76));
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
}

const INITIAL_FORM_STATE = {
  step: 1,
  locationSelected: false,
  address: '',
  searchQuery: '',
  latitude: null,
  longitude: null,
  subdistrict: '',
  ward: '',
  locationSource: '', // 'map' | 'gps' | 'autocomplete'
  category: '',
  customCategory: '',
  // Step 2 & 3 fields preserved
  description: '',
  safetyImpact: '', // 'Ya' | 'Tidak' | 'Tidak Yakin' (awalnya kosong / tidak ada pilihan aktif)
  reporterVisibility: 'anonim', // 'anonim' (default) | 'nama'
};

function loadSavedDraft() {
  if (typeof window === 'undefined') return INITIAL_FORM_STATE;
  try {
    const raw = window.sessionStorage.getItem(REPORT_DRAFT_STORAGE_KEY);
    if (!raw) return INITIAL_FORM_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return INITIAL_FORM_STATE;
    const nextStep =
      parsed.step === 2 || parsed.step === 3 ? parsed.step : 1;
    // Jika halaman di-reload penuh dan foto di memori kosong pada Step 3, kembali ke Step 2
    const safeStep =
      nextStep === 3 && inMemoryUploadedPhotos.length === 0 ? 2 : nextStep;
    return {
      ...INITIAL_FORM_STATE,
      ...parsed,
      step: safeStep,
    };
  } catch {
    return INITIAL_FORM_STATE;
  }
}

/**
 * Komponen internal React Leaflet untuk sinkronisasi posisi kamera peta
 * dan menangani klik langsung pada peta.
 */
function MapInteractionController({ targetCoords, targetZoom, onMapPick }) {
  const map = useMap();
  const prevTargetRef = useRef(null);

  useEffect(() => {
    if (
      targetCoords &&
      Number.isFinite(targetCoords.lat) &&
      Number.isFinite(targetCoords.lng)
    ) {
      const key = `${targetCoords.lat.toFixed(6)},${targetCoords.lng.toFixed(6)},${targetCoords.seq || 0}`;
      if (prevTargetRef.current !== key) {
        prevTargetRef.current = key;
        map.flyTo([targetCoords.lat, targetCoords.lng], targetZoom || map.getZoom(), {
          duration: 0.75,
        });
      }
    }
  }, [map, targetCoords, targetZoom]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (typeof onMapPick === 'function') {
        onMapPick(lat, lng, 'map');
      }
    },
  });

  return null;
}

function ErrorIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export default function BuatLaporanPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { addUserReport } = useAuth();

  // Navbar profile dropdown state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const dropdownRef = useRef(null);

  // Form state (persisted across Step 1 <-> Step 2 <-> Step 3)
  const [formData, setFormData] = useState(() => loadSavedDraft());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);

  // Step 2 — Upload Foto state (menyimpan file asli yang dipilih pengguna beserta preview URL asli)
  const [photos, setPhotos] = useState(() => inMemoryUploadedPhotos);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [replaceSlotIndex, setReplaceSlotIndex] = useState(null);
  const addPhotoInputRef = useRef(null);
  const replacePhotoInputRef = useRef(null);
  const descriptionRef = useRef(null);

  // Map camera & marker state
  const [mapTarget, setMapTarget] = useState(() => {
    const draft = loadSavedDraft();
    if (
      draft.locationSelected &&
      Number.isFinite(draft.latitude) &&
      Number.isFinite(draft.longitude)
    ) {
      return {
        lat: draft.latitude,
        lng: draft.longitude,
        zoom: 17,
        seq: 1,
      };
    }
    return {
      lat: COBLONG_CENTER.lat,
      lng: COBLONG_CENTER.lng,
      zoom: COBLONG_CENTER.zoom,
      seq: 0,
    };
  });

  // Reverse geocoding & GPS status
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState(null);

  // Geoapify Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState(null);
  const searchWrapperRef = useRef(null);
  const suppressNextAutocompleteRef = useRef(false);
  const reverseAbortRef = useRef(null);
  const customCategoryInputRef = useRef(null);

  // Cancel confirmation dialog state
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Dynamic user display info
  const displayName =
    user?.fullName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warga TERANG');
  const avatarInitials = user?.initials || getUserInitials(displayName);
  const avatarUrl = user?.avatarUrl || null;

  const geoapifyConfigured = hasGeoapifyApiKey();

  // Peringatan luar Coblong hanya muncul setelah pengguna memilih lokasi (via GPS, pencarian, atau klik/geser peta)
  const outsideCoblongNotice =
    formData.locationSelected &&
    Boolean(formData.locationSource) &&
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude) &&
    !isInsideCoblongArea(formData.latitude, formData.longitude);

  // Persist form draft to sessionStorage whenever formData changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(
        REPORT_DRAFT_STORAGE_KEY,
        JSON.stringify(formData)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [formData]);

  // Sinkronkan daftar foto asli di memori agar tetap bertahan saat berpindah Step 1 <-> Step 2 <-> Step 3
  useEffect(() => {
    inMemoryUploadedPhotos = photos;
  }, [photos]);

  // Close profile menu and autocomplete dropdown on outside click / Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
        setShowDropdown(false);
        setShowCancelModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Geoapify Address Autocomplete with 380ms debounce (within 300-500ms requirement)
  useEffect(() => {
    if (suppressNextAutocompleteRef.current) {
      suppressNextAutocompleteRef.current = false;
      return undefined;
    }

    const query = String(formData.searchQuery || '').trim();
    if (query.length < 3) {
      return undefined;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      setAutocompleteError(null);

      const result = await autocompleteAddress(query, {
        signal: controller.signal,
      });

      if (result.aborted) return;

      setIsSearchingAddress(false);

      if (!result.ok) {
        setSuggestions([]);
        setAutocompleteError(result.error);
        setShowDropdown(true);
        return;
      }

      setSuggestions(result.suggestions || []);
      setShowDropdown(true);
    }, 380);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.searchQuery]);

  // Apply coordinates from map click, marker drag, or GPS and resolve address via Geoapify Reverse Geocoding
  const applyCoordinatesSelection = useCallback(
    async (lat, lng, source = 'map', targetZoom = null) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      // Cancel any in-flight reverse geocoding request
      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort();
      }
      const controller = new AbortController();
      reverseAbortRef.current = controller;

      const provisionalLabel = `Memuat alamat... (${lat.toFixed(6)}, ${lng.toFixed(6)})`;

      suppressNextAutocompleteRef.current = true;
      setShowDropdown(false);
      setErrors((prev) => {
        if (!prev.location) return prev;
        const next = { ...prev };
        delete next.location;
        return next;
      });

      setFormData((prev) => ({
        ...prev,
        locationSelected: true,
        latitude: lat,
        longitude: lng,
        address: prev.address || provisionalLabel,
        locationSource: source,
      }));

      if (targetZoom) {
        setMapTarget((prev) => ({
          lat,
          lng,
          zoom: targetZoom,
          seq: (prev?.seq || 0) + 1,
        }));
      }

      setIsReverseGeocoding(true);
      const rev = await reverseGeocodeCoordinates(lat, lng, {
        signal: controller.signal,
      });

      if (rev.aborted) return;
      setIsReverseGeocoding(false);

      const resolvedAddress =
        rev.formatted ||
        `Titik Koordinat (${lat.toFixed(6)}, ${lng.toFixed(6)})`;

      suppressNextAutocompleteRef.current = true;
      setFormData((prev) => ({
        ...prev,
        locationSelected: true,
        latitude: lat,
        longitude: lng,
        address: resolvedAddress,
        searchQuery: resolvedAddress,
        subdistrict: rev.subdistrict || prev.subdistrict || '',
        ward: rev.ward || prev.ward || '',
        locationSource: source,
      }));
    },
    []
  );

  // Handle selecting an address suggestion from Geoapify Autocomplete
  const handleSelectSuggestion = (item) => {
    if (!item || !Number.isFinite(item.lat) || !Number.isFinite(item.lng)) {
      return;
    }

    suppressNextAutocompleteRef.current = true;
    setShowDropdown(false);
    setSuggestions([]);
    setAutocompleteError(null);
    setGpsStatusMessage(null);

    setErrors((prev) => {
      if (!prev.location) return prev;
      const next = { ...prev };
      delete next.location;
      return next;
    });

    setFormData((prev) => ({
      ...prev,
      locationSelected: true,
      address: item.formatted,
      searchQuery: item.formatted,
      latitude: item.lat,
      longitude: item.lng,
      subdistrict: item.subdistrict || '',
      ward: item.ward || '',
      locationSource: 'autocomplete',
    }));

    setMapTarget((prev) => ({
      lat: item.lat,
      lng: item.lng,
      zoom: 17,
      seq: (prev?.seq || 0) + 1,
    }));
  };

  // 2. Tombol Gunakan Lokasi Saya -> navigator.geolocation.getCurrentPosition()
  // Hanya dipanggil saat pengguna mengklik tombol
  const handleUseMyLocation = () => {
    setGpsStatusMessage(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatusMessage({
        type: 'error',
        text: 'Perangkat atau browser Anda belum mendukung fitur lokasi GPS. Silakan cari nama jalan atau pilih titik langsung pada peta.',
      });
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        setGpsStatusMessage({
          type: 'neutral',
          text: 'Lokasi GPS berhasil ditemukan. Anda dapat menggeser pin pada peta jika titik perlu disesuaikan.',
        });

        applyCoordinatesSelection(lat, lng, 'gps', 17);
      },
      (geoError) => {
        setGpsLoading(false);
        let friendlyMessage =
          'Gagal mendapatkan lokasi GPS. Silakan ketik alamat secara manual atau klik titik lokasi pada peta.';

        if (geoError.code === 1) {
          // PERMISSION_DENIED
          friendlyMessage =
            'Izin akses lokasi ditolak oleh browser. Anda tetap dapat mencari nama jalan di kolom pencarian atau mengklik titik lokasi langsung pada peta.';
        } else if (geoError.code === 2) {
          // POSITION_UNAVAILABLE
          friendlyMessage =
            'Sinyal GPS sedang tidak tersedia di perangkat Anda. Silakan gunakan pencarian alamat atau pilih titik lokasi pada peta.';
        } else if (geoError.code === 3) {
          // TIMEOUT
          friendlyMessage =
            'Waktu permintaan lokasi habis (timeout). Silakan coba lagi atau cari nama jalan secara manual di bawah ini.';
        }

        setGpsStatusMessage({
          type: 'error',
          text: friendlyMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Reset map camera to Kecamatan Coblong center
  const handleRecenterCoblong = () => {
    setMapTarget((prev) => ({
      lat: COBLONG_CENTER.lat,
      lng: COBLONG_CENTER.lng,
      zoom: COBLONG_CENTER.zoom,
      seq: (prev?.seq || 0) + 1,
    }));
  };

  // 4. Pilih Jenis Kerusakan
  const handleSelectCategory = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId,
      // Sembunyikan & bersihkan error customCategory saat memilih kategori selain Lainnya
      customCategory: categoryId === 'Lainnya' ? prev.customCategory : '',
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.category;
      if (categoryId !== 'Lainnya') {
        delete next.customCategory;
      }
      return next;
    });

    if (categoryId === 'Lainnya') {
      setTimeout(() => {
        if (customCategoryInputRef.current) {
          customCategoryInputRef.current.focus();
        }
      }, 40);
    }
  };

  // 5. Deteksi Laporan Serupa (hanya dijalankan setelah pengguna memilih lokasi DAN kategori)
  const combinedReportsDataset = useMemo(() => {
    const userReports = Array.isArray(user?.reports) ? user.reports : [];
    const seenIds = new Set(SAMPLE_REPORTS.map((r) => r.id));
    const extras = userReports.filter((r) => r && r.id && !seenIds.has(r.id));
    return [...SAMPLE_REPORTS, ...extras];
  }, [user]);

  const canRunSimilarityCheck =
    formData.locationSelected &&
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude) &&
    Boolean(formData.category);

  const similarReports = useMemo(() => {
    if (!canRunSimilarityCheck) return [];
    return findSimilarReports({
      lat: formData.latitude,
      lng: formData.longitude,
      category: formData.category,
      reports: combinedReportsDataset,
      radiusMeters: SIMILAR_REPORT_RADIUS_METERS,
    });
  }, [
    canRunSimilarityCheck,
    formData.latitude,
    formData.longitude,
    formData.category,
    combinedReportsDataset,
  ]);

  // 6. Validasi Step 1 sebelum menuju Step 2
  const validateStep1 = () => {
    const nextErrors = {};

    if (
      !formData.locationSelected ||
      !Number.isFinite(formData.latitude) ||
      !Number.isFinite(formData.longitude) ||
      !String(formData.address || '').trim()
    ) {
      nextErrors.location =
        'Pilih titik lokasi kerusakan terlebih dahulu melalui pencarian alamat, tombol Gunakan Lokasi Saya, atau klik/geser pin pada peta.';
    }

    if (!formData.category) {
      nextErrors.category =
        'Pilih salah satu jenis kerusakan terlebih dahulu.';
    } else if (
      formData.category === 'Lainnya' &&
      !String(formData.customCategory || '').trim()
    ) {
      nextErrors.customCategory =
        'Sebutkan jenis kerusakan terlebih dahulu untuk kategori Lainnya.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    if (!validateStep1()) {
      return;
    }

    setErrors({});
    setFormData((prev) => ({
      ...prev,
      step: 2,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep1 = () => {
    setErrors({});
    setPhotoUploadError('');
    setFormData((prev) => ({
      ...prev,
      step: 1,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Pemrosesan & Validasi File Foto (JPG, JPEG, PNG, WebP, maks 5 MB, maks 3 foto)
  const processSelectedFiles = (fileList, targetReplaceIndex = null) => {
    const incomingFiles = Array.from(fileList || []);
    if (incomingFiles.length === 0) return;

    setPhotoUploadError('');
    let validationMessage = '';
    const validItems = [];

    for (const file of incomingFiles) {
      if (!isSupportedImageFile(file)) {
        validationMessage = `Format "${file.name}" tidak didukung. Pilih foto berformat JPG, JPEG, PNG, atau WebP.`;
        continue;
      }
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        validationMessage = `Ukuran foto "${file.name}" (${formatFileSize(
          file.size
        )}) melebihi batas maksimal 5 MB per foto.`;
        continue;
      }
      validItems.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validItems.length === 0) {
      if (validationMessage) {
        setPhotoUploadError(validationMessage);
      }
      return;
    }

    // Jika mengganti foto pada slot tertentu
    if (
      Number.isInteger(targetReplaceIndex) &&
      targetReplaceIndex >= 0 &&
      targetReplaceIndex < MAX_PHOTOS_COUNT
    ) {
      const replacementItem = validItems[0];
      // Revoke kelebihan preview jika memilih lebih dari 1 saat ganti foto
      for (let i = 1; i < validItems.length; i += 1) {
        URL.revokeObjectURL(validItems[i].previewUrl);
      }

      setPhotos((prev) => {
        const next = [...prev];
        if (next[targetReplaceIndex]?.previewUrl) {
          URL.revokeObjectURL(next[targetReplaceIndex].previewUrl);
        }
        next[targetReplaceIndex] = replacementItem;
        return next.filter(Boolean);
      });

      setErrors((prev) => {
        if (!prev.photos) return prev;
        const next = { ...prev };
        delete next.photos;
        return next;
      });

      if (validationMessage) {
        setPhotoUploadError(validationMessage);
      }
      return;
    }

    // Jika menambah foto baru (maksimal total 3 foto)
    setPhotos((prev) => {
      const remainingSlots = MAX_PHOTOS_COUNT - prev.length;
      if (remainingSlots <= 0) {
        validItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        setPhotoUploadError('Maksimal 3 foto yang dapat diunggah.');
        return prev;
      }

      const accepted = validItems.slice(0, remainingSlots);
      const rejected = validItems.slice(remainingSlots);
      rejected.forEach((item) => URL.revokeObjectURL(item.previewUrl));

      if (rejected.length > 0) {
        setPhotoUploadError(
          'Maksimal 3 foto yang dapat dipilih. Foto selebihnya tidak ditambahkan.'
        );
      } else if (validationMessage) {
        setPhotoUploadError(validationMessage);
      }

      return [...prev, ...accepted];
    });

    setErrors((prev) => {
      if (!prev.photos) return prev;
      const next = { ...prev };
      delete next.photos;
      return next;
    });
  };

  const handleAddPhotoInputChange = (e) => {
    processSelectedFiles(e.target.files, null);
    e.target.value = '';
  };

  const handleReplacePhotoInputChange = (e) => {
    processSelectedFiles(e.target.files, replaceSlotIndex);
    setReplaceSlotIndex(null);
    e.target.value = '';
  };

  const handleTriggerAddPhoto = () => {
    setPhotoUploadError('');
    if (addPhotoInputRef.current) {
      addPhotoInputRef.current.click();
    }
  };

  const handleTriggerReplacePhoto = (slotIdx) => {
    setPhotoUploadError('');
    setReplaceSlotIndex(slotIdx);
    if (replacePhotoInputRef.current) {
      replacePhotoInputRef.current.click();
    }
  };

  const handleRemovePhoto = (slotIdx) => {
    setPhotoUploadError('');
    setPhotos((prev) => {
      const target = prev[slotIdx];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, idx) => idx !== slotIdx);
    });
  };

  const handleDropzoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDropzoneDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDropzoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files, null);
    }
  };

  // Validasi Step 2 sebelum menuju Step 3
  const validateStep2 = () => {
    const nextErrors = {};

    if (photos.length < 1) {
      nextErrors.photos =
        'Unggah minimal 1 foto kondisi kerusakan sebelum melanjutkan.';
    }

    if (!String(formData.description || '').trim()) {
      nextErrors.description =
        'Deskripsi kerusakan wajib diisi agar kondisi di lapangan jelas.';
    }

    if (!formData.safetyImpact) {
      nextErrors.safetyImpact =
        'Pilih salah satu jawaban dampak kerusakan terlebih dahulu.';
    }

    setErrors(nextErrors);

    if (!nextErrors.photos && nextErrors.description && descriptionRef.current) {
      descriptionRef.current.focus();
    }

    return Object.keys(nextErrors).length === 0;
  };

  const handleProceedToStep3 = (e) => {
    e.preventDefault();
    if (!validateStep2()) {
      return;
    }

    setErrors({});
    setFormData((prev) => ({
      ...prev,
      step: 3,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStep2 = () => {
    setErrors({});
    setPhotoUploadError('');
    setFormData((prev) => ({
      ...prev,
      step: 2,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Validasi seluruh data Step 1–3 & Pengiriman Laporan
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Validasi Step 1 (Lokasi & Kategori)
    if (!validateStep1()) {
      setIsSubmitting(false);
      setFormData((prev) => ({
        ...prev,
        step: 1,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Validasi Step 2 (Foto, Deskripsi, & Dampak Kerusakan)
    if (!validateStep2()) {
      setIsSubmitting(false);
      setFormData((prev) => ({
        ...prev,
        step: 2,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const visibilityMode =
      formData.reporterVisibility === 'nama' ? 'nama' : 'anonim';
    const publicReporterName =
      visibilityMode === 'nama' ? displayName : 'Pelapor Anonim';

    // Konversi foto ke Data URL terkompresi agar tetap muncul di Dashboard, Laporan Saya, & Detail Laporan setelah navigasi/refresh
    const persistedPreviews = await Promise.all(
      photos.map(async (p) => {
        const dataUrl = await createPersistablePhotoDataUrl(p.file);
        return {
          id: p.id,
          name: p.name,
          size: p.size,
          previewUrl: dataUrl || p.previewUrl,
        };
      })
    );

    const reportNumber = Math.floor(100000 + Math.random() * 900000);
    const createdReport = {
      id: `TRG-${reportNumber}`,
      title:
        formData.category === 'Lainnya' && formData.customCategory.trim()
          ? `${formData.customCategory.trim()} (Lainnya)`
          : formData.category,
      category: formData.category,
      customCategory:
        formData.category === 'Lainnya' ? formData.customCategory.trim() : '',
      location: formData.address,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      coordinates: `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`,
      subdistrict: formData.subdistrict || 'Coblong',
      ward: formData.ward || '',
      description: formData.description.trim(),
      safetyImpact: formData.safetyImpact,
      reporterVisibility: visibilityMode,
      reporterPublicName: publicReporterName,
      photoCount: photos.length,
      photoNames: photos.map((p) => p.name),
      photoUrl: persistedPreviews[0]?.previewUrl || '',
      photoPreviews: persistedPreviews,
      status: 'Menunggu Verifikasi',
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    if (typeof addUserReport === 'function') {
      addUserReport(createdReport);
    }

    // Bersihkan draft & arahkan ke halaman sukses /laporan-terkirim
    photos.forEach((p) => {
      if (p?.previewUrl && p.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
    inMemoryUploadedPhotos = [];
    setPhotos([]);

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
        window.sessionStorage.setItem(
          LAST_SUBMITTED_REPORT_ID_KEY,
          createdReport.id
        );
      } catch {
        // Ignore storage errors
      }
    }

    setErrors({});
    setSubmittedReport(createdReport);
    navigate(`/laporan-terkirim?id=${encodeURIComponent(createdReport.id)}`, {
      replace: true,
    });
  };

  const handleStartNewReport = () => {
    photos.forEach((p) => {
      if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    inMemoryUploadedPhotos = [];
    setPhotos([]);
    setErrors({});
    setPhotoUploadError('');
    setSubmittedReport(null);
    setFormData(INITIAL_FORM_STATE);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cek apakah pengguna sudah mengisi data pada form
  const hasDirtyData = Boolean(
    formData.locationSelected ||
      String(formData.searchQuery || '').trim() ||
      formData.category ||
      String(formData.customCategory || '').trim() ||
      photos.length > 0 ||
      String(formData.description || '').trim() ||
      Boolean(formData.safetyImpact)
  );

  // Tombol Batalkan -> kembali ke /dashboard (konfirmasi jika ada data yang sudah diisi)
  const handleCancelClick = () => {
    if (hasDirtyData) {
      setShowCancelModal(true);
      return;
    }
    navigate('/dashboard');
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    photos.forEach((p) => {
      if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    inMemoryUploadedPhotos = [];
    setPhotos([]);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    navigate('/dashboard');
  };

  // Navbar handlers (identik dengan Dashboard Warga)
  const handleNavClick = (e, item) => {
    e.preventDefault();

    if (item.type === 'route') {
      navigate(item.href);
      return;
    }

    if (item.type === 'dashboard-anchor') {
      navigate('/dashboard');
      setTimeout(() => {
        const el = document.querySelector('#laporan-saya');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }

    if (item.type === 'landing-section') {
      navigate('/');
      setTimeout(() => {
        const hash = item.href.replace('/', '');
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  const handleLogoutClick = async () => {
    setProfileMenuOpen(false);
    if (typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  const handleBrandClick = async (e) => {
    e.preventDefault();
    if (hasDirtyData) {
      const confirmLeave = window.confirm(
        'Draft laporan Anda belum disimpan. Apakah Anda yakin ingin kembali ke Beranda? Draft yang belum dikirim akan dibatalkan.'
      );
      if (!confirmLeave) return;
      try {
        window.sessionStorage.removeItem(REPORT_DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    if (typeof onLogout === 'function') {
      await onLogout();
    }
    navigate('/', { replace: true });
  };

  // Posisi marker pada peta:
  // Jika pengguna sudah memilih lokasi -> gunakan koordinat terpilih.
  // Jika belum -> tampilkan pin pada pusat awal Kecamatan Coblong yang bisa langsung diklik/digeser.
  const markerPosition =
    formData.locationSelected &&
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude)
      ? [formData.latitude, formData.longitude]
      : [COBLONG_CENTER.lat, COBLONG_CENTER.lng];

  return (
    <div className="lapor-page">
      {/* Authenticated Top Navbar (Dashboard, Peta Laporan, Transparansi, Laporan Saya, Profil) */}
      <header className="dashboard-navbar">
        <div className="dashboard-navbar-inner">
          <a
            href="/"
            className="dashboard-brand-link"
            onClick={handleBrandClick}
            aria-label="TERANG — Kembali ke Beranda"
          >
            {!logoError ? (
              <img
                src="/logo-terang.png"
                alt="TERANG"
                className="dashboard-brand-logo"
                width="148"
                height="33"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="dashboard-brand-fallback">TERANG</span>
            )}
          </a>

          <nav aria-label="Navigasi Utama Warga">
            <ul className="dashboard-nav-center">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className="dashboard-nav-item"
                    onClick={(e) => handleNavClick(e, item)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="dashboard-profile-wrap" ref={dropdownRef}>
            <button
              type="button"
              className={`dashboard-profile-trigger ${profileMenuOpen ? 'open' : ''}`}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label={`Menu profil ${displayName}`}
            >
              <span className="dashboard-avatar" aria-hidden="true">
                {avatarUrl && !avatarImgError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="dashboard-avatar-img"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </span>
              <span className="dashboard-profile-name">{displayName}</span>
              <svg
                className={`dashboard-profile-chevron ${profileMenuOpen ? 'open' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {profileMenuOpen && (
              <div
                className="dashboard-profile-dropdown"
                role="menu"
                aria-label="Menu Akun Warga"
              >
                <div className="dashboard-dropdown-header">
                  <div className="dashboard-dropdown-name">{displayName}</div>
                  {user?.email && (
                    <div className="dashboard-dropdown-email">{user.email}</div>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  <span>Dashboard Warga</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate('/laporan-saya');
                  }}
                >
                  <span>Laporan Saya</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="dashboard-dropdown-item dashboard-dropdown-logout"
                  onClick={handleLogoutClick}
                >
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="lapor-main">
        {/* Header + 3-Stage Stepper */}
        <section className="lapor-header-card" aria-labelledby="lapor-page-title">
          <div className="lapor-header-top">
            <div>
              <h1 id="lapor-page-title" className="lapor-title">
                Buat Laporan Kerusakan
              </h1>
              <p className="lapor-subtitle">
                Tandai titik lokasi secara akurat dan pilih jenis kerusakan agar laporanmu dapat diverifikasi dengan cepat.
              </p>
            </div>
          </div>

          {/* Stepper 3 Tahap: Lokasi & Jenis -> Foto & Keterangan -> Tinjau & Kirim */}
          <ol className="lapor-stepper" aria-label="Tahapan Pembuatan Laporan">
            {STEPPER_ITEMS.map((item) => {
              const isCompleted =
                Boolean(submittedReport) || formData.step > item.step;
              const isActive =
                !submittedReport && formData.step === item.step;
              return (
                <li
                  key={item.step}
                  className={`lapor-step-item ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => {
                    if (!submittedReport && isCompleted) {
                      setFormData((prev) => ({ ...prev, step: item.step }));
                    }
                  }}
                >
                  <span className="lapor-step-badge" aria-hidden="true">
                    {isCompleted ? '✓' : item.step}
                  </span>
                  <div className="lapor-step-text">
                    <span className="lapor-step-num">Tahap 0{item.step}</span>
                    <span className="lapor-step-label">{item.label}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ==================================================================
            STEP 1 — LOKASI & JENIS
            ================================================================== */}
        {formData.step === 1 && (
          <form
            className="lapor-form-card"
            onSubmit={handleProceedToStep2}
            noValidate
          >
            {/* 1, 2, 3. Lokasi Kerusakan: Autocomplete Geoapify, GPS, & Peta Leaflet */}
            <div className="lapor-section-block">
              <div className="lapor-section-head">
                <div>
                  <h2 className="lapor-section-title">Tentukan Lokasi Kerusakan</h2>
                  <p className="lapor-section-desc">
                    Cari nama jalan di Kecamatan Coblong, gunakan lokasi GPS Anda, atau klik dan geser pin langsung pada peta.
                  </p>
                </div>
              </div>

              {/* Search Input (Geoapify Address Autocomplete) + Tombol Gunakan Lokasi Saya */}
              <div className="lapor-location-controls">
                <div className="lapor-search-wrapper" ref={searchWrapperRef}>
                  <div className="lapor-search-input-box">
                    <span className="lapor-search-icon" aria-hidden="true">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>

                    <input
                      id="lapor-address-search"
                      type="text"
                      className={`lapor-search-input ${
                        errors.location ? 'has-error' : ''
                      }`}
                      placeholder="Ketik minimal 3 huruf nama jalan / tempat (contoh: Jl. Dipatiukur, Ganesha, Cisitu)..."
                      value={formData.searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          searchQuery: val,
                        }));
                        if (val.trim().length < 3) {
                          setSuggestions([]);
                          setIsSearchingAddress(false);
                          setAutocompleteError(null);
                          setShowDropdown(false);
                        }
                      }}
                      onFocus={() => {
                        if (
                          suggestions.length > 0 ||
                          Boolean(autocompleteError)
                        ) {
                          setShowDropdown(true);
                        }
                      }}
                      aria-label="Cari alamat atau nama jalan"
                      aria-autocomplete="list"
                      aria-expanded={showDropdown}
                      autoComplete="off"
                    />

                    {isSearchingAddress && (
                      <span
                        className="lapor-search-spinner"
                        aria-label="Mencari rekomendasi alamat..."
                      />
                    )}

                    {formData.searchQuery && (
                      <button
                        type="button"
                        className="lapor-search-clear"
                        aria-label="Bersihkan pencarian alamat"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            searchQuery: '',
                          }));
                          setSuggestions([]);
                          setAutocompleteError(null);
                          setShowDropdown(false);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown Rekomendasi Alamat Geoapify (Maksimal 5 Saran) */}
                  {showDropdown && (
                    <ul
                      className="lapor-autocomplete-dropdown"
                      role="listbox"
                      aria-label="Rekomendasi alamat Geoapify"
                    >
                      {autocompleteError ? (
                        <li className="lapor-autocomplete-empty" role="status">
                          {autocompleteError}
                        </li>
                      ) : suggestions.length === 0 ? (
                        <li className="lapor-autocomplete-empty" role="status">
                          Tidak ditemukan alamat yang cocok. Silakan klik titik lokasi langsung pada peta di bawah.
                        </li>
                      ) : (
                        suggestions.map((item) => (
                          <li key={item.id} role="option" aria-selected="false">
                            <button
                              type="button"
                              className="lapor-autocomplete-item"
                              onClick={() => handleSelectSuggestion(item)}
                            >
                              <span
                                className="lapor-autocomplete-pin"
                                aria-hidden="true"
                              >
                                <svg
                                  width="17"
                                  height="17"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              </span>
                              <span className="lapor-autocomplete-texts">
                                <span className="lapor-autocomplete-primary">
                                  {item.primaryText}
                                </span>
                                {item.secondaryText && (
                                  <span className="lapor-autocomplete-secondary">
                                    {item.secondaryText}
                                  </span>
                                )}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>

                {/* Tombol Gunakan Lokasi Saya */}
                <button
                  type="button"
                  className="lapor-gps-btn"
                  onClick={handleUseMyLocation}
                  disabled={gpsLoading}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3" />
                    <path d="M12 19v3" />
                    <path d="M2 12h3" />
                    <path d="M19 12h3" />
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                  <span>
                    {gpsLoading ? 'Mendeteksi GPS...' : 'Gunakan Lokasi Saya'}
                  </span>
                </button>
              </div>

              {/* Informasi Konfigurasi Geoapify jika API key belum diisi */}
              {!geoapifyConfigured && (
                <div className="lapor-info-banner warning" role="status">
                  <ErrorIcon />
                  <span>
                    <strong>Info Konfigurasi Geoapify:</strong> Variabel{' '}
                    <code>VITE_GEOAPIFY_API_KEY</code> pada{' '}
                    <code>terang/.env.local</code> belum diisi. Anda tetap dapat memilih dan menggeser titik lokasi langsung pada peta interaktif atau menggunakan tombol <strong>Gunakan Lokasi Saya</strong>.
                  </span>
                </div>
              )}

              {/* Pesan Status / Error GPS */}
              {gpsStatusMessage && (
                <div
                  className={`lapor-info-banner ${gpsStatusMessage.type}`}
                  role="status"
                >
                  <ErrorIcon />
                  <span>{gpsStatusMessage.text}</span>
                </div>
              )}

              {/* 1. Peta Interaktif React Leaflet + OpenStreetMap */}
              <div
                className={`lapor-map-frame ${
                  errors.location ? 'has-error' : ''
                }`}
              >
                <div className="lapor-map-overlay-hint">
                  Klik peta atau geser pin untuk memilih titik akurat
                </div>

                <MapContainer
                  center={[COBLONG_CENTER.lat, COBLONG_CENTER.lng]}
                  zoom={COBLONG_CENTER.zoom}
                  scrollWheelZoom={true}
                  className="lapor-leaflet-container"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapInteractionController
                    targetCoords={mapTarget}
                    targetZoom={mapTarget.zoom}
                    onMapPick={(lat, lng) =>
                      applyCoordinatesSelection(lat, lng, 'map')
                    }
                  />

                  <Marker
                    position={markerPosition}
                    icon={TERANG_MARKER_ICON}
                    draggable={true}
                    eventHandlers={{
                      click: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        applyCoordinatesSelection(lat, lng, 'map');
                      },
                      dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        applyCoordinatesSelection(lat, lng, 'map');
                      },
                    }}
                  />
                </MapContainer>
              </div>

              {/* Keterangan kecil wilayah demo & peringatan singkat jika titik di luar Coblong */}
              <div className="lapor-map-submeta">
                <span className="lapor-map-region-caption">
                  Wilayah pelaporan demo: Kecamatan Coblong, Kota Bandung
                </span>

                {outsideCoblongNotice && (
                  <span className="lapor-outside-note" role="status">
                    <ErrorIcon />
                    <span>
                      Lokasi terpilih berada di luar area demo Kecamatan Coblong, Bandung.
                    </span>
                  </span>
                )}
              </div>

              {/* Ringkasan Alamat & Koordinat Lokasi yang Dipilih */}
              <div
                className={`lapor-selected-location-box ${
                  formData.locationSelected ? 'active' : ''
                }`}
                aria-live="polite"
              >
                <div className="lapor-selected-location-main">
                  <span className="lapor-location-pin-badge" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>

                  <div className="lapor-location-details">
                    <span className="lapor-location-label">
                      {formData.locationSelected
                        ? isReverseGeocoding
                          ? 'Memperbarui Alamat dari Koordinat...'
                          : 'Lokasi Terpilih'
                        : 'Belum Ada Titik Lokasi Dipilih'}
                    </span>

                    <div className="lapor-location-address">
                      {formData.locationSelected
                        ? formData.address
                        : 'Klik lokasi pada peta, geser pin, cari alamat, atau klik "Gunakan Lokasi Saya".'}
                    </div>

                    <div className="lapor-location-coords">
                      {formData.locationSelected &&
                      Number.isFinite(formData.latitude) &&
                      Number.isFinite(formData.longitude) ? (
                        <>
                          Koordinat: {formData.latitude.toFixed(6)},{' '}
                          {formData.longitude.toFixed(6)}
                        </>
                      ) : (
                        <>
                          Pusat peta awal: Kecamatan Coblong, Bandung (
                          {COBLONG_CENTER.lat.toFixed(4)},{' '}
                          {COBLONG_CENTER.lng.toFixed(4)})
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="lapor-recenter-btn"
                  onClick={handleRecenterCoblong}
                  title="Arahkan ulang tampilan peta ke pusat Kecamatan Coblong"
                >
                  Pusatkan ke Coblong
                </button>
              </div>

              {errors.location && (
                <div className="lapor-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.location}</span>
                </div>
              )}
            </div>

            {/* 4. Pilih Jenis Kerusakan */}
            <div className="lapor-section-block">
              <div className="lapor-section-head">
                <div>
                  <h2 className="lapor-section-title">Pilih Jenis Kerusakan</h2>
                  <p className="lapor-section-desc">
                    Pilih satu kategori yang paling sesuai dengan kondisi kerusakan di lapangan.
                  </p>
                </div>
              </div>

              <div
                className="lapor-category-grid"
                role="radiogroup"
                aria-label="Pilih Jenis Kerusakan"
              >
                {DAMAGE_CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`lapor-category-card ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleSelectCategory(cat.id)}
                    >
                      <span className="lapor-category-icon">{cat.icon}</span>
                      <div>
                        <div className="lapor-category-name">{cat.label}</div>
                        <div className="lapor-category-desc">{cat.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {errors.category && (
                <div className="lapor-field-error" role="alert">
                  <ErrorIcon />
                  <span>{errors.category}</span>
                </div>
              )}

              {/* Khusus Lainnya: Input tambahan tepat di bawah pilihan kategori */}
              {formData.category === 'Lainnya' && (
                <div className="lapor-custom-category-box">
                  <label
                    htmlFor="lapor-custom-category-input"
                    className="lapor-custom-label"
                  >
                    Sebutkan jenis kerusakannya
                  </label>
                  <input
                    ref={customCategoryInputRef}
                    id="lapor-custom-category-input"
                    type="text"
                    className={`lapor-custom-input ${
                      errors.customCategory ? 'has-error' : ''
                    }`}
                    placeholder="Contoh: Pagar taman rusak"
                    value={formData.customCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        customCategory: val,
                      }));
                      if (errors.customCategory && val.trim()) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.customCategory;
                          return next;
                        });
                      }
                    }}
                  />
                  {errors.customCategory && (
                    <div className="lapor-field-error" role="alert">
                      <ErrorIcon />
                      <span>{errors.customCategory}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Deteksi Laporan Serupa (hanya tampil ringkas ketika ditemukan laporan berpotensi serupa) */}
            {canRunSimilarityCheck && similarReports.length > 0 && (
              <div className="lapor-section-block" aria-live="polite">
                <div className="lapor-similar-card" role="region" aria-label="Deteksi Laporan Serupa">
                  <div className="lapor-similar-header">
                    <div className="lapor-similar-title-row">
                      <span className="lapor-similar-badge">
                        Indikasi Serupa
                      </span>
                      <h3 className="lapor-similar-heading">
                        Ditemukan laporan serupa di sekitar titik ini (radius {SIMILAR_REPORT_RADIUS_METERS}m)
                      </h3>
                    </div>
                  </div>

                  <ul className="lapor-similar-list">
                    {similarReports.map((rep) => (
                      <li key={rep.id} className="lapor-similar-item">
                        <div className="lapor-similar-item-main">
                          <div className="lapor-similar-item-top">
                            <span className="lapor-similar-id">{rep.id}</span>
                            <span className="lapor-similar-distance">
                              • ±{rep.distanceMeters} m dari titik pilihanmu
                            </span>
                          </div>
                          <div className="lapor-similar-item-title">
                            {rep.title}
                          </div>
                          {rep.address && (
                            <div className="lapor-similar-item-addr">
                              {rep.address}
                            </div>
                          )}
                        </div>
                        <span className="lapor-similar-status">
                          {rep.status}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="lapor-similar-note">
                    Indikasi awal (perlu verifikasi admin). Anda tetap dapat melanjutkan jika objek kerusakannya berbeda.
                  </p>
                </div>
              </div>
            )}

            {/* 6. Tombol Navigasi: Batalkan & Lanjutkan */}
            <div className="lapor-footer-actions">
              <button
                type="button"
                className="lapor-btn-secondary"
                onClick={handleCancelClick}
              >
                Batalkan
              </button>

              <button type="submit" className="lapor-btn-primary">
                <span>Lanjutkan</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================
            STEP 2 — FOTO & KETERANGAN (Layout 2 Kolom Konsisten dengan Step 1)
            ================================================================== */}
        {formData.step === 2 && (
          <form
            className="lapor-form-card"
            onSubmit={handleProceedToStep3}
            noValidate
          >
            {/* Hidden Native File Inputs (Tambah Foto & Ganti Foto) */}
            <input
              ref={addPhotoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              className="lapor-hidden-file-input"
              onChange={handleAddPhotoInputChange}
              tabIndex={-1}
              aria-hidden="true"
            />
            <input
              ref={replacePhotoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="lapor-hidden-file-input"
              onChange={handleReplacePhotoInputChange}
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Two-Column Layout Step 2: 45% Foto (Kiri) & 55% Keterangan (Kanan) */}
            <div className="lapor-step2-grid">
              {/* KOLOM KIRI (45%): Upload Foto Kerusakan */}
              <div className="lapor-step2-col lapor-step2-col-left">
                <div className="lapor-section-block">
                  <div className="lapor-section-head">
                    <div>
                      <h2 className="lapor-section-title">
                        Foto Kerusakan <span aria-hidden="true">*</span>
                      </h2>
                      <p className="lapor-section-desc">
                        Unggah 1–3 foto kondisi kerusakan yang terlihat jelas.
                      </p>
                    </div>
                    <span
                      className={`lapor-photo-counter ${
                        photos.length > 0 ? 'has-photos' : ''
                      }`}
                      aria-live="polite"
                    >
                      {photos.length}/{MAX_PHOTOS_COUNT} foto dipilih
                    </span>
                  </div>

                  {/* SEBELUM UPLOAD (photos.length === 0): Tampilkan Area Besar "Tarik dan lepas foto di sini" */}
                  {photos.length === 0 ? (
                    <div
                      className={`lapor-upload-dropzone ${
                        isDraggingOver ? 'dragging' : ''
                      } ${errors.photos ? 'has-error' : ''}`}
                      onDragOver={handleDropzoneDragOver}
                      onDragLeave={handleDropzoneDragLeave}
                      onDrop={handleDropzoneDrop}
                      onClick={handleTriggerAddPhoto}
                      role="button"
                      tabIndex={0}
                      aria-label="Tarik dan lepas foto di sini atau klik untuk memilih foto"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTriggerAddPhoto();
                        }
                      }}
                    >
                      <span className="lapor-dropzone-icon" aria-hidden="true">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </span>

                      <span className="lapor-dropzone-title">
                        Tarik dan lepas foto di sini
                      </span>

                      <button
                        type="button"
                        className="lapor-dropzone-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerAddPhoto();
                        }}
                      >
                        Pilih Foto
                      </button>

                      <span className="lapor-dropzone-hint">
                        JPG, PNG, WebP • Maks. 5 MB/foto
                      </span>
                    </div>
                  ) : (
                    /* SETELAH FOTO PERTAMA DIPILIH (photos.length > 0): Sembunyikan area besar, gantikan dengan 3 slot horizontal */
                    <div
                      className="lapor-photo-slots-grid"
                      onDragOver={handleDropzoneDragOver}
                      onDragLeave={handleDropzoneDragLeave}
                      onDrop={handleDropzoneDrop}
                    >
                      {[0, 1, 2].map((slotIdx) => {
                        const photoItem = photos[slotIdx] || null;

                        if (photoItem) {
                          return (
                            <div
                              key={photoItem.id}
                              className="lapor-photo-slot filled"
                            >
                              <div className="lapor-photo-thumb-wrap">
                                <img
                                  src={photoItem.previewUrl}
                                  alt={`Foto kerusakan ${slotIdx + 1}: ${photoItem.name}`}
                                  className="lapor-photo-thumb"
                                />
                                <button
                                  type="button"
                                  className="lapor-photo-remove-btn"
                                  onClick={() => handleRemovePhoto(slotIdx)}
                                  aria-label={`Hapus foto ${slotIdx + 1} (${photoItem.name})`}
                                  title="Hapus foto"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="lapor-photo-slot-footer">
                                <span
                                  className="lapor-photo-filename"
                                  title={photoItem.name}
                                >
                                  {photoItem.name}
                                </span>
                                <button
                                  type="button"
                                  className="lapor-photo-replace-btn"
                                  onClick={() =>
                                    handleTriggerReplacePhoto(slotIdx)
                                  }
                                >
                                  Ganti
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={`empty-slot-${slotIdx}`}
                            type="button"
                            className="lapor-photo-slot empty"
                            onClick={handleTriggerAddPhoto}
                            aria-label={`Tambah foto pada slot ${slotIdx + 1}`}
                          >
                            <span
                              className="lapor-slot-plus-icon"
                              aria-hidden="true"
                            >
                              +
                            </span>
                            <span className="lapor-slot-add-text">
                              + Tambah Foto
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {photoUploadError && (
                    <div className="lapor-field-error" role="alert">
                      <ErrorIcon />
                      <span>{photoUploadError}</span>
                    </div>
                  )}

                  {errors.photos && (
                    <div className="lapor-field-error" role="alert">
                      <ErrorIcon />
                      <span>{errors.photos}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN (55%): Deskripsi Kerusakan & Dampak Kerusakan */}
              <div className="lapor-step2-col lapor-step2-col-right">
                {/* Deskripsi Kerusakan */}
                <div className="lapor-section-block">
                  <label
                    htmlFor="lapor-description-input"
                    className="lapor-section-title"
                  >
                    Deskripsi Kerusakan <span aria-hidden="true">*</span>
                  </label>

                  <textarea
                    ref={descriptionRef}
                    id="lapor-description-input"
                    className={`lapor-textarea ${
                      errors.description ? 'has-error' : ''
                    }`}
                    placeholder="Ceritakan kondisi kerusakan yang kamu temukan..."
                    value={formData.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        description: val,
                      }));
                      if (errors.description && val.trim()) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.description;
                          return next;
                        });
                      }
                    }}
                  />

                  {errors.description && (
                    <div className="lapor-field-error" role="alert">
                      <ErrorIcon />
                      <span>{errors.description}</span>
                    </div>
                  )}
                </div>

                {/* Dampak Kerusakan */}
                <div className="lapor-section-block lapor-impact-section">
                  <h2
                    id="lapor-impact-heading"
                    className="lapor-section-title"
                  >
                    Apakah kerusakan ini berpotensi membahayakan warga?{' '}
                    <span aria-hidden="true">*</span>
                  </h2>

                  <div
                    className="lapor-impact-grid"
                    role="radiogroup"
                    aria-labelledby="lapor-impact-heading"
                  >
                    {SAFETY_IMPACT_OPTIONS.map((opt) => {
                      const isSelected = formData.safetyImpact === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`lapor-impact-btn ${
                            isSelected ? 'selected' : ''
                          }`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              safetyImpact: opt.id,
                            }));
                            if (errors.safetyImpact) {
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.safetyImpact;
                                return next;
                              });
                            }
                          }}
                        >
                          <span
                            className="lapor-impact-indicator"
                            aria-hidden="true"
                          >
                            {isSelected && (
                              <span className="lapor-impact-indicator-dot" />
                            )}
                          </span>
                          <span className="lapor-impact-label">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="lapor-impact-helper">
                    Membantu penilaian risiko awal dan akan diperiksa kembali oleh admin.
                  </p>

                  {errors.safetyImpact && (
                    <div className="lapor-field-error" role="alert">
                      <ErrorIcon />
                      <span>{errors.safetyImpact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Navigasi Step 2: Kembali & Lanjutkan */}
            <div className="lapor-footer-actions">
              <button
                type="button"
                className="lapor-btn-secondary"
                onClick={handleBackToStep1}
              >
                <span aria-hidden="true">←</span>
                <span>Kembali</span>
              </button>

              <button type="submit" className="lapor-btn-primary">
                <span>Lanjutkan</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================================================================
            STEP 3 — TINJAU & KIRIM (Layout 2 Kolom & Tampilan Berhasil Kirim)
            ================================================================== */}
        {formData.step === 3 && !submittedReport && (
          <form
            className="lapor-form-card"
            onSubmit={handleSubmitReport}
            noValidate
          >
            <div className="lapor-step3-grid">
              {/* KOLOM KIRI: Tinjau Lokasi & Jenis + Foto & Keterangan */}
              <div className="lapor-step3-col lapor-step3-col-left">
                {/* Kartu Lokasi & Jenis Kerusakan */}
                <section
                  className="lapor-review-card"
                  aria-labelledby="review-location-heading"
                >
                  <div className="lapor-review-card-header">
                    <h2
                      id="review-location-heading"
                      className="lapor-review-card-title"
                    >
                      Lokasi & Jenis Kerusakan
                    </h2>
                    <button
                      type="button"
                      className="lapor-review-edit-btn"
                      onClick={handleBackToStep1}
                    >
                      <PencilIcon />
                      <span>Ubah Lokasi</span>
                    </button>
                  </div>

                  {/* Mini Map Leaflet pada titik koordinat yang benar-benar dipilih di Step 1 */}
                  <div className="lapor-step3-minimap-wrap">
                    {formData.locationSelected &&
                    Number.isFinite(formData.latitude) &&
                    Number.isFinite(formData.longitude) ? (
                      <MapContainer
                        key={`minimap-${formData.latitude.toFixed(6)}-${formData.longitude.toFixed(6)}`}
                        center={[formData.latitude, formData.longitude]}
                        zoom={17}
                        scrollWheelZoom={false}
                        dragging={false}
                        doubleClickZoom={false}
                        touchZoom={false}
                        zoomControl={false}
                        className="lapor-step3-minimap"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[formData.latitude, formData.longitude]}
                          icon={TERANG_MARKER_ICON}
                        />
                      </MapContainer>
                    ) : (
                      <div className="lapor-step3-minimap-empty">
                        <span>Lokasi belum dipilih. Klik Ubah Lokasi untuk memilih titik di Step 1.</span>
                      </div>
                    )}
                  </div>

                  {/* Detail Alamat Lengkap (menonjol), Koordinat (kecil netral), & Kategori (badge kuning) */}
                  <div className="lapor-review-details-list">
                    <div className="lapor-review-detail-row">
                      <span className="lapor-review-detail-label">
                        Alamat Lokasi
                      </span>
                      <span className="lapor-review-address-primary">
                        {formData.address || 'Belum ada alamat yang dipilih'}
                      </span>
                      <span className="lapor-coord-mono">
                        Koordinat:{' '}
                        {Number.isFinite(formData.latitude) &&
                        Number.isFinite(formData.longitude)
                          ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                          : '-'}
                      </span>
                    </div>

                    <div className="lapor-review-detail-row">
                      <span className="lapor-review-detail-label">
                        Jenis Kerusakan
                      </span>
                      <div className="lapor-review-category-wrap">
                        <span className="lapor-review-category-pill">
                          {formData.category || 'Belum dipilih'}
                        </span>
                        {formData.category === 'Lainnya' &&
                          formData.customCategory.trim() && (
                            <span className="lapor-review-custom-category">
                              {formData.customCategory.trim()}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Kartu Foto & Keterangan */}
                <section
                  className="lapor-review-card"
                  aria-labelledby="review-photo-heading"
                >
                  <div className="lapor-review-card-header">
                    <h2
                      id="review-photo-heading"
                      className="lapor-review-card-title"
                    >
                      Foto & Keterangan
                    </h2>
                    <button
                      type="button"
                      className="lapor-review-edit-btn"
                      onClick={handleBackToStep2}
                    >
                      <PencilIcon />
                      <span>Ubah Foto</span>
                    </button>
                  </div>

                  {/* Foto Asli yang Diunggah pada Step 2 */}
                  <div className="lapor-review-detail-row">
                    <span className="lapor-review-detail-label">
                      Foto Kerusakan ({photos.length}/{MAX_PHOTOS_COUNT} foto)
                    </span>

                    {photos.length > 0 ? (
                      <div className="lapor-step3-photo-preview-row">
                        {photos.map((p, idx) => (
                          <div key={p.id} className="lapor-step3-photo-card">
                            <img
                              src={p.previewUrl}
                              alt={`Foto bukti ${idx + 1}: ${p.name}`}
                              className="lapor-step3-photo-img"
                            />
                            <span
                              className="lapor-step3-photo-caption"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="lapor-review-detail-value">
                        Belum ada foto yang diunggah.
                      </span>
                    )}
                  </div>

                  <div className="lapor-review-details-list">
                    <div className="lapor-review-detail-row">
                      <span className="lapor-review-detail-label">
                        Deskripsi Kerusakan
                      </span>
                      <p className="lapor-review-description-text">
                        {formData.description.trim() || '-'}
                      </p>
                    </div>

                    <div className="lapor-review-detail-row">
                      <span className="lapor-review-detail-label">
                        Berpotensi membahayakan warga?
                      </span>
                      <span className="lapor-review-impact-badge">
                        {formData.safetyImpact || '-'}
                      </span>
                    </div>
                  </div>
                </section>
              </div>

              {/* KOLOM KANAN: Tampilkan Identitas Pelapor? */}
              <div className="lapor-step3-col lapor-step3-col-right">
                <section
                  className="lapor-review-card"
                  aria-labelledby="review-identity-heading"
                >
                  <div className="lapor-review-card-header">
                    <div>
                      <h2
                        id="review-identity-heading"
                        className="lapor-review-card-title"
                      >
                        Tampilkan identitas pelapor?
                      </h2>
                      <p className="lapor-review-card-subtitle">
                        Pilih bagaimana nama Anda ditampilkan pada halaman laporan publik.
                      </p>
                    </div>
                  </div>

                  <div
                    className="lapor-identity-options"
                    role="radiogroup"
                    aria-labelledby="review-identity-heading"
                  >
                    {/* Pilihan 1: Anonim (Default) */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={
                        (formData.reporterVisibility || 'anonim') === 'anonim'
                      }
                      className={`lapor-identity-option ${
                        (formData.reporterVisibility || 'anonim') === 'anonim'
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reporterVisibility: 'anonim',
                        }))
                      }
                    >
                      <span
                        className="lapor-identity-radio"
                        aria-hidden="true"
                      >
                        {(formData.reporterVisibility || 'anonim') ===
                          'anonim' && (
                          <span className="lapor-identity-radio-dot" />
                        )}
                      </span>
                      <div className="lapor-identity-text">
                        <div className="lapor-identity-title-row">
                          <span className="lapor-identity-title">Anonim</span>
                          <span className="lapor-identity-default-tag">
                            Default
                          </span>
                        </div>
                        <span className="lapor-identity-desc">
                          Nama Anda disembunyikan dari tampilan publik.
                        </span>
                      </div>
                    </button>

                    {/* Pilihan 2: Tampilkan nama saya */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={formData.reporterVisibility === 'nama'}
                      className={`lapor-identity-option ${
                        formData.reporterVisibility === 'nama' ? 'selected' : ''
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          reporterVisibility: 'nama',
                        }))
                      }
                    >
                      <span
                        className="lapor-identity-radio"
                        aria-hidden="true"
                      >
                        {formData.reporterVisibility === 'nama' && (
                          <span className="lapor-identity-radio-dot" />
                        )}
                      </span>
                      <div className="lapor-identity-text">
                        <div className="lapor-identity-title-row">
                          <span className="lapor-identity-title">
                            Tampilkan nama saya
                          </span>
                        </div>
                        <span className="lapor-identity-desc">
                          Gunakan nama akun Anda ({displayName}) pada laporan publik.
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Pratinjau satu baris + catatan admin */}
                  <div className="lapor-identity-preview-simple">
                    <p className="lapor-identity-preview-line">
                      Nama yang terlihat publik:{' '}
                      <strong className="lapor-identity-preview-value">
                        {formData.reporterVisibility === 'nama'
                          ? displayName
                          : 'Pelapor Anonim'}
                      </strong>
                    </p>
                    <p className="lapor-identity-note">
                      Identitas asli tetap tersedia bagi admin berwenang untuk keperluan verifikasi laporan.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Kalimat singkat sebelum tombol Kirim Laporan + Footer Navigasi Step 3 */}
            <div className="lapor-step3-footer-wrap">
              <p className="lapor-submit-inline-note">
                Pastikan titik lokasi, foto bukti, dan keterangan kerusakan sudah sesuai kondisi sebenarnya sebelum mengirim laporan.
              </p>

              <div className="lapor-footer-actions">
                <button
                  type="button"
                  className="lapor-btn-secondary"
                  onClick={handleBackToStep2}
                >
                  <span aria-hidden="true">←</span>
                  <span>Kembali</span>
                </button>

                <button
                  type="submit"
                  className="lapor-btn-primary"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ==================================================================
            TAMPILAN BERHASIL KIRIM (Setelah tombol Kirim Laporan diklik)
            ================================================================== */}
        {submittedReport && (
          <section
            className="lapor-form-card lapor-success-card"
            aria-labelledby="lapor-success-heading"
          >
            <div className="lapor-success-header">
              <div className="lapor-success-icon" aria-hidden="true">
                ✓
              </div>
              <div className="lapor-success-header-text">
                <div className="lapor-success-badges">
                  <span className="lapor-success-id-badge">
                    {submittedReport.id}
                  </span>
                  <span className="lapor-success-status-badge">
                    {submittedReport.status}
                  </span>
                </div>
                <h2 id="lapor-success-heading" className="lapor-success-title">
                  Laporan Berhasil Dikirim!
                </h2>
                <p className="lapor-success-subtitle">
                  Terima kasih atas partisipasi Anda. Laporan kerusakan telah tercatat dan dapat dipantau melalui halaman Dashboard Warga.
                </p>
              </div>
            </div>

            <div className="lapor-success-recap-grid">
              <div className="lapor-review-detail-row">
                <span className="lapor-review-detail-label">Lokasi</span>
                <span className="lapor-review-detail-value">
                  {submittedReport.address}
                </span>
                <span className="lapor-coord-mono">
                  {submittedReport.coordinates}
                </span>
              </div>

              <div className="lapor-review-detail-row">
                <span className="lapor-review-detail-label">
                  Jenis Kerusakan
                </span>
                <span className="lapor-review-detail-value">
                  {submittedReport.title}
                </span>
              </div>

              <div className="lapor-review-detail-row">
                <span className="lapor-review-detail-label">
                  Dampak Bahaya bagi Warga
                </span>
                <span className="lapor-review-detail-value">
                  {submittedReport.safetyImpact}
                </span>
              </div>

              <div className="lapor-review-detail-row">
                <span className="lapor-review-detail-label">
                  Identitas Publik Pelapor
                </span>
                <span className="lapor-review-detail-value">
                  {submittedReport.reporterPublicName}
                </span>
              </div>
            </div>

            <div className="lapor-footer-actions">
              <button
                type="button"
                className="lapor-btn-secondary"
                onClick={handleStartNewReport}
              >
                <span>Buat Laporan Baru</span>
              </button>

              <button
                type="button"
                className="lapor-btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                <span>Lihat di Dashboard Warga</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Dialog Konfirmasi Batalkan Laporan */}
      {showCancelModal && (
        <div
          className="lapor-confirm-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="lapor-confirm-dialog">
            <h3 id="cancel-dialog-title" className="lapor-confirm-title">
              Batalkan pembuatan laporan?
            </h3>
            <p className="lapor-confirm-desc">
              Data lokasi dan kategori yang sudah Anda pilih akan dihapus dan Anda akan kembali ke halaman Dashboard Warga.
            </p>
            <div className="lapor-confirm-actions">
              <button
                type="button"
                className="lapor-btn-secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Lanjut Mengisi
              </button>
              <button
                type="button"
                className="lapor-btn-primary"
                onClick={handleConfirmCancel}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
