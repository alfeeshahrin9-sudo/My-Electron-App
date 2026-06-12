const STORAGE_KEYS = {
  timezone: 'desktools_timezone',
  weatherLocation: 'desktools_weather_location',
  notes: 'desktools_notes',
  activeNote: 'desktools_active_note',
};

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const WMO_CODES = {
  0: { icon: '☀', desc: 'Clear sky' },
  1: { icon: '🌤', desc: 'Mainly clear' },
  2: { icon: '⛅', desc: 'Partly cloudy' },
  3: { icon: '☁', desc: 'Overcast' },
  45: { icon: '🌫', desc: 'Fog' },
  48: { icon: '🌫', desc: 'Depositing rime fog' },
  51: { icon: '🌦', desc: 'Light drizzle' },
  53: { icon: '🌦', desc: 'Drizzle' },
  55: { icon: '🌧', desc: 'Dense drizzle' },
  61: { icon: '🌧', desc: 'Slight rain' },
  63: { icon: '🌧', desc: 'Moderate rain' },
  65: { icon: '🌧', desc: 'Heavy rain' },
  71: { icon: '🌨', desc: 'Slight snow' },
  73: { icon: '🌨', desc: 'Moderate snow' },
  75: { icon: '❄', desc: 'Heavy snow' },
  80: { icon: '🌦', desc: 'Rain showers' },
  81: { icon: '🌧', desc: 'Moderate showers' },
  82: { icon: '🌧', desc: 'Violent showers' },
  95: { icon: '⛈', desc: 'Thunderstorm' },
  96: { icon: '⛈', desc: 'Thunderstorm with hail' },
  99: { icon: '⛈', desc: 'Thunderstorm with heavy hail' },
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { icon: '🌡', desc: 'Unknown' };
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ── Navigation ── */
function initNavigation() {
  const buttons = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;

      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      views.forEach((view) => {
        const isActive = view.id === `view-${target}`;
        view.classList.toggle('active', isActive);
        view.hidden = !isActive;
      });
    });
  });
}

/* ── Clock ── */
let selectedTimezone = localStorage.getItem(STORAGE_KEYS.timezone) ||
  Intl.DateTimeFormat().resolvedOptions().timeZone;

function getTimezoneOptions() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      /* fall through */
    }
  }
  return COMMON_TIMEZONES;
}

function initClock() {
  const select = document.getElementById('timezone-select');
  const zones = getTimezoneOptions();

  zones.forEach((zone) => {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone.replace(/_/g, ' ');
    select.appendChild(option);
  });

  if (zones.includes(selectedTimezone)) {
    select.value = selectedTimezone;
  } else {
    select.value = zones[0];
    selectedTimezone = zones[0];
  }

  select.addEventListener('change', () => {
    selectedTimezone = select.value;
    localStorage.setItem(STORAGE_KEYS.timezone, selectedTimezone);
    updateClock();
  });

  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();

  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedTimezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedTimezone,
    day: 'numeric',
    month: 'long',
  }).formatToParts(now);

  const day = parts.find((p) => p.type === 'day')?.value ?? '--';
  const month = parts.find((p) => p.type === 'month')?.value ?? '———';

  document.getElementById('clock-time').textContent = timeFmt.format(now);
  document.getElementById('clock-date').textContent = dateFmt.format(now);
  document.getElementById('calendar-day').textContent = day;
  document.getElementById('calendar-month').textContent = month;
}

/* ── Weather (Open-Meteo — open source, no API key) ── */
let weatherCoords = loadJSON(STORAGE_KEYS.weatherLocation, null);

async function searchLocation(name) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', name);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  if (!data.results?.length) throw new Error('Location not found');
  return data.results[0];
}

async function fetchWeather(lat, lon, label) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('forecast_days', '5');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed');
  const data = await res.json();

  weatherCoords = { lat, lon, label };
  saveJSON(STORAGE_KEYS.weatherLocation, weatherCoords);
  renderWeather(data, label);
}

function renderWeather(data, label) {
  const status = document.getElementById('weather-status');
  const current = document.getElementById('weather-current');
  const forecast = document.getElementById('weather-forecast');

  status.hidden = true;
  current.hidden = false;
  forecast.hidden = false;

  const code = data.current.weather_code;
  const info = getWeatherInfo(code);

  document.getElementById('weather-location-name').textContent = label;
  document.getElementById('weather-icon').textContent = info.icon;
  document.getElementById('weather-temp').textContent =
    `${Math.round(data.current.temperature_2m)}°`;
  document.getElementById('weather-desc').textContent = info.desc;
  document.getElementById('weather-humidity').textContent =
    `Humidity: ${data.current.relative_humidity_2m}%`;
  document.getElementById('weather-wind').textContent =
    `Wind: ${Math.round(data.current.wind_speed_10m)} km/h`;

  forecast.innerHTML = '';
  data.daily.time.forEach((dateStr, i) => {
    const dayInfo = getWeatherInfo(data.daily.weather_code[i]);
    const date = new Date(dateStr + 'T12:00:00');
    const dayName = i === 0
      ? 'Today'
      : date.toLocaleDateString('en-US', { weekday: 'short' });

    const el = document.createElement('div');
    el.className = 'forecast-day';
    el.innerHTML = `
      <span class="forecast-day-name">${dayName}</span>
      <span class="forecast-day-icon">${dayInfo.icon}</span>
      <span class="forecast-day-temps">
        ${Math.round(data.daily.temperature_2m_max[i])}°<br>
        ${Math.round(data.daily.temperature_2m_min[i])}°
      </span>
    `;
    forecast.appendChild(el);
  });
}

function setWeatherStatus(message) {
  const status = document.getElementById('weather-status');
  status.hidden = false;
  status.textContent = message;
  document.getElementById('weather-current').hidden = true;
  document.getElementById('weather-forecast').hidden = true;
}

function initWeather() {
  const form = document.getElementById('location-form');
  const input = document.getElementById('location-input');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    setWeatherStatus('Loading forecast…');
    try {
      const place = await searchLocation(query);
      const label = [place.name, place.admin1, place.country]
        .filter(Boolean)
        .join(', ');
      await fetchWeather(place.latitude, place.longitude, label);
    } catch (err) {
      setWeatherStatus(err.message || 'Could not load weather.');
    }
  });

  if (weatherCoords) {
    input.value = weatherCoords.label || '';
    setWeatherStatus('Loading forecast…');
    fetchWeather(weatherCoords.lat, weatherCoords.lon, weatherCoords.label).catch(() => {
      setWeatherStatus('Could not refresh weather. Search again.');
    });
  }
}

/* ── Notes ── */
let notes = loadJSON(STORAGE_KEYS.notes, []);
let activeNoteId = localStorage.getItem(STORAGE_KEYS.activeNote) || null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function saveNotes() {
  saveJSON(STORAGE_KEYS.notes, notes);
}

function renderNotesList() {
  const list = document.getElementById('notes-list');
  const empty = document.getElementById('notes-empty');

  list.innerHTML = '';
  empty.hidden = notes.length > 0;

  notes.forEach((note) => {
    const li = document.createElement('li');
    li.textContent = note.title || 'Untitled';
    li.classList.toggle('active', note.id === activeNoteId);
    li.addEventListener('click', () => selectNote(note.id));
    list.appendChild(li);
  });
}

function selectNote(id) {
  activeNoteId = id;
  localStorage.setItem(STORAGE_KEYS.activeNote, id);

  const note = notes.find((n) => n.id === id);
  const titleInput = document.getElementById('note-title');
  const bodyInput = document.getElementById('note-body');
  const deleteBtn = document.getElementById('delete-note-btn');

  if (!note) {
    titleInput.value = '';
    bodyInput.value = '';
    titleInput.disabled = true;
    bodyInput.disabled = true;
    deleteBtn.hidden = true;
    renderNotesList();
    return;
  }

  titleInput.disabled = false;
  bodyInput.disabled = false;
  deleteBtn.hidden = false;
  titleInput.value = note.title;
  bodyInput.value = note.body;
  renderNotesList();
}

function createNote() {
  const note = {
    id: generateId(),
    title: 'New note',
    body: '',
    updatedAt: Date.now(),
  };
  notes.unshift(note);
  saveNotes();
  selectNote(note.id);
  document.getElementById('note-title').focus();
  document.getElementById('note-title').select();
}

function deleteActiveNote() {
  if (!activeNoteId) return;
  notes = notes.filter((n) => n.id !== activeNoteId);
  saveNotes();
  activeNoteId = notes[0]?.id ?? null;
  if (activeNoteId) {
    localStorage.setItem(STORAGE_KEYS.activeNote, activeNoteId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeNote);
  }
  selectNote(activeNoteId);
}

function initNotes() {
  document.getElementById('new-note-btn').addEventListener('click', createNote);
  document.getElementById('delete-note-btn').addEventListener('click', deleteActiveNote);

  const titleInput = document.getElementById('note-title');
  const bodyInput = document.getElementById('note-body');

  titleInput.addEventListener('input', () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    note.title = titleInput.value;
    note.updatedAt = Date.now();
    saveNotes();
    renderNotesList();
  });

  bodyInput.addEventListener('input', () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    note.body = bodyInput.value;
    note.updatedAt = Date.now();
    saveNotes();
  });

  renderNotesList();
  if (activeNoteId && notes.some((n) => n.id === activeNoteId)) {
    selectNote(activeNoteId);
  } else {
    selectNote(null);
  }
}

/* ── Boot ── */
initNavigation();
initClock();
initWeather();
initNotes();
