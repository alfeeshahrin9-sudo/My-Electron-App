const STORAGE_KEYS = {
  theme: 'desktools_theme',
  sound: 'desktools_sound',
  timezone: 'desktools_timezone',
  clock24h: 'desktools_clock_24h',
  calendarMode: 'desktools_calendar_mode',
  weatherLocation: 'desktools_weather_location',
  weatherUnit: 'desktools_weather_unit',
  focusSessions: 'desktools_focus_sessions',
  tasks: 'desktools_tasks',
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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* ── Synthesized Retro Sound Effects (Web Audio API) ── */
let soundEnabled = localStorage.getItem(STORAGE_KEYS.sound) !== 'false';
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

function playTone(freq = 600, duration = 0.05, type = 'sine', volume = 0.06) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* ignore audio errors */
  }
}

function playClickSound() {
  playTone(680, 0.035, 'triangle', 0.05);
}

function playSuccessSound() {
  playTone(587.33, 0.09, 'sine', 0.07);
  setTimeout(() => playTone(880, 0.14, 'sine', 0.08), 80);
}

function playAlarmChime() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 0.22, 'sine', 0.12), idx * 140);
  });
}

/* ── Titlebar & Theme Controls ── */
function initTitlebar() {
  const btnSound = document.getElementById('btn-sound');
  const btnTheme = document.getElementById('btn-theme');
  const btnPin = document.getElementById('btn-pin');
  const btnMinimize = document.getElementById('btn-minimize');
  const btnClose = document.getElementById('btn-close');

  const updateSoundBtn = () => {
    btnSound.textContent = soundEnabled ? '🔊' : '🔇';
    btnSound.classList.toggle('active', soundEnabled);
  };
  updateSoundBtn();

  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(STORAGE_KEYS.sound, String(soundEnabled));
    updateSoundBtn();
    if (soundEnabled) playClickSound();
  });

  let isDark = localStorage.getItem(STORAGE_KEYS.theme) === 'dark';
  const applyTheme = () => {
    document.body.classList.toggle('dark-mode', isDark);
    btnTheme.textContent = isDark ? '☀' : '🌙';
    btnTheme.classList.toggle('active', isDark);
  };
  applyTheme();

  btnTheme.addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
    applyTheme();
    playClickSound();
  });

  if (window.electronAPI) {
    window.electronAPI.isPinned().then((pinned) => {
      btnPin.classList.toggle('active', Boolean(pinned));
    });

    btnPin.addEventListener('click', async () => {
      playClickSound();
      const pinned = await window.electronAPI.togglePin();
      btnPin.classList.toggle('active', Boolean(pinned));
    });

    btnMinimize.addEventListener('click', () => {
      playClickSound();
      window.electronAPI.minimize();
    });

    btnClose.addEventListener('click', () => {
      window.electronAPI.close();
    });
  } else {
    btnPin.addEventListener('click', () => {
      playClickSound();
      btnPin.classList.toggle('active');
    });
    btnMinimize.addEventListener('click', () => playClickSound());
    btnClose.addEventListener('click', () => window.close());
  }
}

/* ── Navigation & Keyboard Shortcuts ── */
function switchView(target) {
  const buttons = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  buttons.forEach((b) => b.classList.toggle('active', b.dataset.view === target));
  views.forEach((view) => {
    const isActive = view.id === `view-${target}`;
    view.classList.toggle('active', isActive);
    view.hidden = !isActive;
  });
}

function initNavigation() {
  const buttons = document.querySelectorAll('.nav-btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      playClickSound();
      switchView(btn.dataset.view);
    });
  });

  const viewOrder = ['clock', 'weather', 'focus', 'tasks', 'notes'];
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const idx = Number(e.key) - 1;
      if (viewOrder[idx]) {
        playClickSound();
        switchView(viewOrder[idx]);
      }
    }
  });
}

/* ══════════════════════════════════════════════════
   1. CLOCK & INTERACTIVE MONTHLY CALENDAR
   ══════════════════════════════════════════════════ */
let selectedTimezone =
  localStorage.getItem(STORAGE_KEYS.timezone) ||
  Intl.DateTimeFormat().resolvedOptions().timeZone;
let use24Hour = localStorage.getItem(STORAGE_KEYS.clock24h) === 'true';
let showMonthGrid = localStorage.getItem(STORAGE_KEYS.calendarMode) === 'month';
let lastRenderedDayKey = '';

function getTodayInTimezone(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((p) => p.type === 'year')?.value) || new Date().getFullYear(),
    month: (Number(parts.find((p) => p.type === 'month')?.value) || 1) - 1,
    day: Number(parts.find((p) => p.type === 'day')?.value) || 1,
  };
}

let calendarCursor = (() => {
  try {
    const t = getTodayInTimezone(selectedTimezone);
    return new Date(t.year, t.month, 1);
  } catch {
    return new Date();
  }
})();

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

function populateTimezoneSelect(zones, filterText = '') {
  const select = document.getElementById('timezone-select');
  const query = filterText.trim().toLowerCase();
  const filtered = query
    ? zones.filter((z) => z.toLowerCase().replace(/_/g, ' ').includes(query))
    : zones;

  select.innerHTML = '';

  if (filtered.length === 0) {
    const emptyOpt = document.createElement('option');
    emptyOpt.value = selectedTimezone;
    emptyOpt.textContent = `No match — keeping ${selectedTimezone.replace(/_/g, ' ')}`;
    select.appendChild(emptyOpt);
    select.value = selectedTimezone;
    return;
  }

  filtered.forEach((zone) => {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone.replace(/_/g, ' ');
    select.appendChild(option);
  });

  if (filtered.includes(selectedTimezone)) {
    select.value = selectedTimezone;
  } else {
    select.value = filtered[0];
    selectedTimezone = filtered[0];
    localStorage.setItem(STORAGE_KEYS.timezone, selectedTimezone);
    const t = getTodayInTimezone(selectedTimezone);
    calendarCursor = new Date(t.year, t.month, 1);
  }
}

function initClock() {
  const select = document.getElementById('timezone-select');
  const searchInput = document.getElementById('timezone-search');
  const formatBtn = document.getElementById('clock-format-btn');
  const calViewBtn = document.getElementById('calendar-view-btn');
  const zones = getTimezoneOptions();

  if (!zones.includes(selectedTimezone)) {
    selectedTimezone = zones[0];
  }

  const initToday = getTodayInTimezone(selectedTimezone);
  calendarCursor = new Date(initToday.year, initToday.month, 1);

  populateTimezoneSelect(zones);

  searchInput.addEventListener('input', () => {
    populateTimezoneSelect(zones, searchInput.value);
    updateClock();
    renderMonthCalendar();
  });

  select.addEventListener('change', () => {
    selectedTimezone = select.value;
    localStorage.setItem(STORAGE_KEYS.timezone, selectedTimezone);
    const t = getTodayInTimezone(selectedTimezone);
    calendarCursor = new Date(t.year, t.month, 1);
    playClickSound();
    updateClock();
    renderMonthCalendar();
  });

  const syncFormatBtn = () => {
    formatBtn.textContent = use24Hour ? '24H' : '12H';
    formatBtn.classList.toggle('active', use24Hour);
  };
  syncFormatBtn();

  formatBtn.addEventListener('click', () => {
    use24Hour = !use24Hour;
    localStorage.setItem(STORAGE_KEYS.clock24h, String(use24Hour));
    playClickSound();
    syncFormatBtn();
    updateClock();
  });

  const syncCalView = () => {
    document.getElementById('calendar-card').hidden = showMonthGrid;
    document.getElementById('calendar-grid-card').hidden = !showMonthGrid;
    calViewBtn.textContent = showMonthGrid ? 'Day ▢' : 'Month ▦';
    calViewBtn.classList.toggle('active', showMonthGrid);
  };
  syncCalView();

  calViewBtn.addEventListener('click', () => {
    showMonthGrid = !showMonthGrid;
    localStorage.setItem(STORAGE_KEYS.calendarMode, showMonthGrid ? 'month' : 'day');
    playClickSound();
    syncCalView();
    renderMonthCalendar();
  });

  document.getElementById('cal-prev').addEventListener('click', () => {
    playClickSound();
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    renderMonthCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    playClickSound();
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    renderMonthCalendar();
  });

  document.getElementById('cal-title').addEventListener('click', () => {
    playClickSound();
    const t = getTodayInTimezone(selectedTimezone);
    calendarCursor = new Date(t.year, t.month, 1);
    renderMonthCalendar();
  });

  updateClock();
  renderMonthCalendar();
  setInterval(updateClock, 1000);
}

function getTimezoneOffsetLabel(now, tz) {
  try {
    const offsetParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(now);
    return offsetParts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';
  } catch {
    const offsetParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(now);
    return offsetParts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';
  }
}

function updateClock() {
  const now = new Date();

  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: use24Hour ? 'h23' : 'h12',
  });

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedTimezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tzOffset = getTimezoneOffsetLabel(now, selectedTimezone);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: selectedTimezone,
    year: 'numeric',
    day: 'numeric',
    month: 'long',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  const day = parts.find((p) => p.type === 'day')?.value ?? '--';
  const month = parts.find((p) => p.type === 'month')?.value ?? '———';

  document.getElementById('clock-time').textContent = timeFmt.format(now);
  document.getElementById('clock-date').textContent = dateFmt.format(now);
  document.getElementById('clock-offset').textContent = `${selectedTimezone.replace(/_/g, ' ')} (${tzOffset})`;
  document.getElementById('calendar-day').textContent = day;
  document.getElementById('calendar-month').textContent = month;

  const dayKey = `${selectedTimezone}:${year}-${month}-${day}`;
  if (lastRenderedDayKey && lastRenderedDayKey !== dayKey) {
    renderMonthCalendar();
  }
  lastRenderedDayKey = dayKey;
}

function renderMonthCalendar() {
  const daysContainer = document.getElementById('cal-days');
  const titleBtn = document.getElementById('cal-title');
  if (!daysContainer || !titleBtn) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();

  titleBtn.textContent = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const { year: todayY, month: todayM, day: todayD } = getTodayInTimezone(selectedTimezone);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  daysContainer.innerHTML = '';

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell other-month';
    cell.textContent = daysInPrevMonth - i;
    daysContainer.appendChild(cell);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell';
    if (year === todayY && month === todayM && d === todayD) {
      cell.classList.add('today');
    }
    cell.textContent = d;
    daysContainer.appendChild(cell);
  }

  const totalCells = firstDayOfWeek + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-cell other-month';
    cell.textContent = i;
    daysContainer.appendChild(cell);
  }
}

/* ══════════════════════════════════════════════════
   2. WEATHER (Open-Meteo + °C/°F + Auto Locate)
   ══════════════════════════════════════════════════ */
let weatherCoords = loadJSON(STORAGE_KEYS.weatherLocation, null);
let weatherUnit = localStorage.getItem(STORAGE_KEYS.weatherUnit) || 'C';
let lastWeatherData = null;
let weatherRequestId = 0;

function formatTemp(celsius) {
  if (celsius === undefined || celsius === null || Number.isNaN(Number(celsius))) return '--°';
  const val = weatherUnit === 'F' ? celsius * 1.8 + 32 : celsius;
  return `${Math.round(val)}°${weatherUnit}`;
}

function formatWind(kmh) {
  if (kmh === undefined || kmh === null || Number.isNaN(Number(kmh))) return '—';
  if (weatherUnit === 'F') {
    return `${Math.round(kmh * 0.621371)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

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

async function detectIpLocation() {
  const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
  if (!res.ok) throw new Error('Could not detect location');
  const data = await res.json();
  const lat = parseFloat(data.latitude);
  const lon = parseFloat(data.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new Error('Invalid coordinates from location service');
  }
  const label =
    [data.city, data.region, data.country].filter(Boolean).join(', ') || 'Current Location';
  return { lat, lon, label };
}

async function fetchWeather(lat, lon, label) {
  const reqId = ++weatherRequestId;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m'
  );
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,uv_index_max'
  );
  url.searchParams.set('forecast_days', '5');
  url.searchParams.set('timezone', 'auto');

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed');
  const data = await res.json();

  if (reqId !== weatherRequestId) return; // Superseded by a newer request
  if (!data?.current || !data?.daily?.time) {
    throw new Error('Unexpected weather data format');
  }

  weatherCoords = { lat, lon, label };
  lastWeatherData = data;
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
  document.getElementById('weather-temp').textContent = formatTemp(data.current.temperature_2m);
  document.getElementById('weather-desc').textContent = info.desc;
  document.getElementById('weather-feels').textContent = formatTemp(
    data.current.apparent_temperature
  );
  document.getElementById('weather-humidity').textContent = `${data.current.relative_humidity_2m}%`;
  document.getElementById('weather-wind').textContent = formatWind(data.current.wind_speed_10m);

  const uvToday = data.daily?.uv_index_max?.[0];
  document.getElementById('weather-uv').textContent =
    uvToday !== undefined && uvToday !== null ? Number(uvToday).toFixed(1) : '—';

  forecast.innerHTML = '';
  data.daily.time.forEach((dateStr, i) => {
    const dayInfo = getWeatherInfo(data.daily.weather_code[i]);
    const date = new Date(dateStr + 'T12:00:00');
    const dayName =
      i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });

    const el = document.createElement('div');
    el.className = 'forecast-day';
    el.title = dayInfo.desc;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'forecast-day-name';
    nameSpan.textContent = dayName;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'forecast-day-icon';
    iconSpan.textContent = dayInfo.icon;

    const tempsSpan = document.createElement('span');
    tempsSpan.className = 'forecast-day-temps';
    const highStrong = document.createElement('strong');
    highStrong.textContent = formatTemp(data.daily.temperature_2m_max[i]);
    tempsSpan.append(
      highStrong,
      document.createElement('br'),
      document.createTextNode(formatTemp(data.daily.temperature_2m_min[i]))
    );

    el.append(nameSpan, iconSpan, tempsSpan);
    forecast.appendChild(el);
  });
}

function setWeatherStatus(message, hideExisting = true) {
  const status = document.getElementById('weather-status');
  status.hidden = false;
  status.textContent = message;
  if (hideExisting) {
    document.getElementById('weather-current').hidden = true;
    document.getElementById('weather-forecast').hidden = true;
  }
}

function initWeather() {
  const form = document.getElementById('location-form');
  const input = document.getElementById('location-input');
  const unitBtn = document.getElementById('weather-unit-btn');
  const locateBtn = document.getElementById('weather-locate-btn');
  const refreshBtn = document.getElementById('weather-refresh-btn');

  const syncUnitBtn = () => {
    unitBtn.textContent = `°${weatherUnit}`;
  };
  syncUnitBtn();

  unitBtn.addEventListener('click', () => {
    weatherUnit = weatherUnit === 'C' ? 'F' : 'C';
    localStorage.setItem(STORAGE_KEYS.weatherUnit, weatherUnit);
    playClickSound();
    syncUnitBtn();
    if (lastWeatherData && weatherCoords) {
      renderWeather(lastWeatherData, weatherCoords.label);
    }
  });

  locateBtn.addEventListener('click', async () => {
    playClickSound();
    setWeatherStatus('Detecting location…', !lastWeatherData);
    try {
      const loc = await detectIpLocation();
      input.value = loc.label;
      await fetchWeather(loc.lat, loc.lon, loc.label);
    } catch (err) {
      setWeatherStatus(err.message || 'Could not auto-detect location.', !lastWeatherData);
    }
  });

  refreshBtn.addEventListener('click', async () => {
    playClickSound();
    if (!weatherCoords) {
      locateBtn.click();
      return;
    }
    setWeatherStatus('Refreshing forecast…', !lastWeatherData);
    try {
      await fetchWeather(weatherCoords.lat, weatherCoords.lon, weatherCoords.label);
    } catch {
      setWeatherStatus('Could not refresh weather.', !lastWeatherData);
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    playClickSound();
    setWeatherStatus('Loading forecast…', !lastWeatherData);
    try {
      const place = await searchLocation(query);
      const label = [place.name, place.admin1, place.country]
        .filter(Boolean)
        .join(', ');
      await fetchWeather(place.latitude, place.longitude, label);
    } catch (err) {
      setWeatherStatus(err.message || 'Could not load weather.', !lastWeatherData);
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

/* ══════════════════════════════════════════════════
   3. FOCUS TIMER & STOPWATCH
   ══════════════════════════════════════════════════ */
let timerTotalSeconds = 25 * 60;
let timerRemainingSeconds = 25 * 60;
let timerEndTime = 0;
let timerInterval = null;
let timerLabel = 'Focus Session';

let swElapsedMs = 0;
let swStartTime = 0;
let swInterval = null;
let swLaps = [];

function getFocusSessionsToday() {
  const todayStr = getLocalDateKey();
  const stored = loadJSON(STORAGE_KEYS.focusSessions, { date: todayStr, count: 0 });
  if (stored.date !== todayStr) {
    return { date: todayStr, count: 0 };
  }
  return stored;
}

function saveFocusSessionsToday(count) {
  const todayStr = getLocalDateKey();
  saveJSON(STORAGE_KEYS.focusSessions, { date: todayStr, count });
  document.getElementById('focus-sessions-count').textContent = String(count);
}

function formatTimerMMSS(totalSec) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerUI() {
  document.getElementById('timer-display').textContent = formatTimerMMSS(timerRemainingSeconds);
  document.getElementById('timer-label').textContent = timerLabel;
  const pct =
    timerTotalSeconds > 0
      ? Math.max(0, Math.min(100, (timerRemainingSeconds / timerTotalSeconds) * 100))
      : 0;
  document.getElementById('timer-progress-bar').style.width = `${pct}%`;
  document.getElementById('timer-start-btn').textContent = timerInterval ? '⏸ Pause' : '▶ Start';
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function setTimerPreset(minutes, label) {
  stopTimerInterval();
  timerTotalSeconds = minutes * 60;
  timerRemainingSeconds = timerTotalSeconds;
  timerLabel = label;
  updateTimerUI();
}

function initFocus() {
  const modePomodoroBtn = document.getElementById('mode-pomodoro-btn');
  const modeStopwatchBtn = document.getElementById('mode-stopwatch-btn');
  const timerPanel = document.getElementById('focus-timer-panel');
  const swPanel = document.getElementById('focus-stopwatch-panel');

  modePomodoroBtn.addEventListener('click', () => {
    playClickSound();
    modePomodoroBtn.classList.add('active');
    modeStopwatchBtn.classList.remove('active');
    timerPanel.hidden = false;
    swPanel.hidden = true;
  });

  modeStopwatchBtn.addEventListener('click', () => {
    playClickSound();
    modeStopwatchBtn.classList.add('active');
    modePomodoroBtn.classList.remove('active');
    swPanel.hidden = false;
    timerPanel.hidden = true;
  });

  const presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playClickSound();
      presetBtns.forEach((b) => b.classList.toggle('active', b === btn));
      const mins = Number(btn.dataset.minutes) || 25;
      document.getElementById('custom-minutes-input').value = String(mins);
      setTimerPreset(mins, btn.dataset.label || 'Focus Session');
    });
  });

  document.getElementById('custom-minutes-set').addEventListener('click', () => {
    playClickSound();
    const raw = Number(document.getElementById('custom-minutes-input').value);
    const mins = Math.max(1, Math.min(180, Number.isFinite(raw) ? Math.round(raw) : 25));
    document.getElementById('custom-minutes-input').value = String(mins);
    presetBtns.forEach((b) => b.classList.remove('active'));
    setTimerPreset(mins, `Custom (${mins}m)`);
  });

  document.getElementById('timer-start-btn').addEventListener('click', () => {
    playClickSound();
    if (timerInterval) {
      timerRemainingSeconds = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
      stopTimerInterval();
      updateTimerUI();
      return;
    }

    if (timerRemainingSeconds <= 0) {
      timerRemainingSeconds = timerTotalSeconds;
    }

    timerEndTime = Date.now() + timerRemainingSeconds * 1000;

    timerInterval = setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
      timerRemainingSeconds = nextRemaining;

      if (timerRemainingSeconds <= 0) {
        timerRemainingSeconds = 0;
        stopTimerInterval();
        playAlarmChime();

        if (!timerLabel.toLowerCase().includes('break')) {
          const current = getFocusSessionsToday();
          saveFocusSessionsToday(current.count + 1);
        }
      }
      updateTimerUI();
    }, 250);

    updateTimerUI();
  });

  document.getElementById('timer-reset-btn').addEventListener('click', () => {
    playClickSound();
    stopTimerInterval();
    timerRemainingSeconds = timerTotalSeconds;
    updateTimerUI();
  });

  const sessionData = getFocusSessionsToday();
  document.getElementById('focus-sessions-count').textContent = String(sessionData.count);

  document.getElementById('focus-sessions-reset').addEventListener('click', () => {
    playClickSound();
    saveFocusSessionsToday(0);
  });

  // Stopwatch logic
  const swDisplay = document.getElementById('sw-display');
  const swStartBtn = document.getElementById('sw-start-btn');
  const swLapBtn = document.getElementById('sw-lap-btn');
  const swResetBtn = document.getElementById('sw-reset-btn');
  const swLapsList = document.getElementById('sw-laps');

  function formatStopwatch(ms) {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSecs = Math.floor(totalTenths / 10);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
  }

  function renderStopwatch() {
    const currentMs = swInterval ? swElapsedMs + (Date.now() - swStartTime) : swElapsedMs;
    swDisplay.textContent = formatStopwatch(currentMs);
  }

  swStartBtn.addEventListener('click', () => {
    playClickSound();
    if (swInterval) {
      swElapsedMs += Date.now() - swStartTime;
      clearInterval(swInterval);
      swInterval = null;
      swStartBtn.textContent = '▶ Resume';
      swLapBtn.disabled = true;
    } else {
      swStartTime = Date.now();
      swInterval = setInterval(renderStopwatch, 100);
      swStartBtn.textContent = '⏸ Pause';
      swLapBtn.disabled = false;
    }
  });

  swLapBtn.addEventListener('click', () => {
    if (!swInterval) return;
    playClickSound();
    const currentMs = swElapsedMs + (Date.now() - swStartTime);
    swLaps.unshift(formatStopwatch(currentMs));
    swLapsList.innerHTML = '';
    swLaps.forEach((lapTime, idx) => {
      const li = document.createElement('li');
      li.className = 'sw-lap-item';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = `Lap ${swLaps.length - idx}`;
      const timeStrong = document.createElement('strong');
      timeStrong.textContent = lapTime;
      li.append(labelSpan, timeStrong);
      swLapsList.appendChild(li);
    });
  });

  swResetBtn.addEventListener('click', () => {
    playClickSound();
    if (swInterval) {
      clearInterval(swInterval);
      swInterval = null;
    }
    swElapsedMs = 0;
    swLaps = [];
    swLapsList.innerHTML = '';
    swStartBtn.textContent = '▶ Start';
    swLapBtn.disabled = true;
    renderStopwatch();
  });

  updateTimerUI();
}

/* ══════════════════════════════════════════════════
   4. DAILY TASKS / TO-DO CHECKLIST
   ══════════════════════════════════════════════════ */
let tasks = loadJSON(STORAGE_KEYS.tasks, []);
let taskFilter = 'all';

function saveTasks() {
  saveJSON(STORAGE_KEYS.tasks, tasks);
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  const empty = document.getElementById('tasks-empty');
  const summaryText = document.getElementById('task-summary-text');
  const progressFill = document.getElementById('task-progress-fill');
  const clearDoneBtn = document.getElementById('tasks-clear-done');

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  summaryText.textContent = `${doneCount} of ${totalCount} completed (${pct}%)`;
  progressFill.style.width = `${pct}%`;
  clearDoneBtn.hidden = doneCount === 0;

  const filtered = tasks.filter((t) => {
    if (taskFilter === 'active') return !t.done;
    if (taskFilter === 'done') return t.done;
    return true;
  });

  list.innerHTML = '';
  empty.hidden = filtered.length > 0;

  filtered.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = Boolean(task.done);
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      if (task.done) playSuccessSound();
      else playClickSound();
      saveTasks();
      renderTasks();
    });

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const badge = document.createElement('span');
    const prio = task.priority || 'normal';
    badge.className = `priority-badge priority-${prio}`;
    badge.textContent = prio === 'normal' ? 'med' : prio;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'task-del-btn';
    delBtn.title = 'Delete task';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      playClickSound();
      tasks = tasks.filter((t) => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    li.append(checkbox, span, badge, delBtn);
    list.appendChild(li);
  });
}

function initTasks() {
  const form = document.getElementById('task-form');
  const input = document.getElementById('task-input');
  const prioritySelect = document.getElementById('task-priority');
  const clearDoneBtn = document.getElementById('tasks-clear-done');
  const filterBtns = document.querySelectorAll('#task-filters .mini-pill-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    playClickSound();
    tasks.unshift({
      id: generateId(),
      text,
      priority: prioritySelect.value || 'normal',
      done: false,
      createdAt: Date.now(),
    });
    input.value = '';
    saveTasks();
    renderTasks();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      playClickSound();
      taskFilter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderTasks();
    });
  });

  clearDoneBtn.addEventListener('click', () => {
    playClickSound();
    tasks = tasks.filter((t) => !t.done);
    saveTasks();
    renderTasks();
  });

  renderTasks();
}

/* ══════════════════════════════════════════════════
   5. NOTES STUDIO (Search, Pin, Stats, Copy, Export)
   ══════════════════════════════════════════════════ */
let notes = loadJSON(STORAGE_KEYS.notes, []);
let activeNoteId = localStorage.getItem(STORAGE_KEYS.activeNote) || null;
let noteSearchQuery = '';
let deleteConfirmTimeout = null;
let copyFeedbackTimeout = null;

function saveNotes() {
  saveJSON(STORAGE_KEYS.notes, notes);
}

function getSortedFilteredNotes() {
  const q = noteSearchQuery.trim().toLowerCase();
  const filtered = q
    ? notes.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.body || '').toLowerCase().includes(q)
      )
    : [...notes];

  return filtered.sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function updateNoteStats(note) {
  const statsEl = document.getElementById('note-stats');
  if (!note) {
    statsEl.textContent = '0 words · 0 chars';
    return;
  }
  const body = note.body || '';
  const chars = body.length;
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  statsEl.textContent = `${words} word${words === 1 ? '' : 's'} · ${chars} char${chars === 1 ? '' : 's'}`;
}

function resetDeleteConfirm() {
  const deleteBtn = document.getElementById('delete-note-btn');
  if (deleteConfirmTimeout) {
    clearTimeout(deleteConfirmTimeout);
    deleteConfirmTimeout = null;
  }
  deleteBtn.classList.remove('confirming');
  deleteBtn.textContent = 'Delete';
}

function resetCopyFeedback() {
  const copyBtn = document.getElementById('copy-note-btn');
  if (copyFeedbackTimeout) {
    clearTimeout(copyFeedbackTimeout);
    copyFeedbackTimeout = null;
  }
  if (copyBtn) copyBtn.textContent = 'Copy';
}

function renderNotesList() {
  const list = document.getElementById('notes-list');
  const empty = document.getElementById('notes-empty');
  const displayed = getSortedFilteredNotes();

  list.innerHTML = '';
  empty.hidden = displayed.length > 0;
  empty.textContent = noteSearchQuery.trim()
    ? 'No matching notes found.'
    : 'No notes yet. Create one!';

  displayed.forEach((note) => {
    const li = document.createElement('li');
    li.classList.toggle('active', note.id === activeNoteId);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'note-li-title';
    titleSpan.textContent = `${note.pinned ? '★ ' : ''}${note.title || 'Untitled'}`;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'note-li-meta';
    if (note.updatedAt) {
      const d = new Date(note.updatedAt);
      metaSpan.textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    li.append(titleSpan, metaSpan);
    li.addEventListener('click', () => {
      playClickSound();
      selectNote(note.id);
    });
    list.appendChild(li);
  });
}

function selectNote(id) {
  resetDeleteConfirm();
  resetCopyFeedback();
  activeNoteId = id;
  if (id) {
    localStorage.setItem(STORAGE_KEYS.activeNote, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeNote);
  }

  const note = notes.find((n) => n.id === id);
  const titleInput = document.getElementById('note-title');
  const bodyInput = document.getElementById('note-body');
  const pinBtn = document.getElementById('pin-note-btn');
  const footer = document.getElementById('note-footer');

  if (!note) {
    titleInput.value = '';
    bodyInput.value = '';
    titleInput.disabled = true;
    bodyInput.disabled = true;
    pinBtn.disabled = true;
    pinBtn.classList.remove('pinned');
    pinBtn.textContent = '☆';
    footer.hidden = true;
    renderNotesList();
    return;
  }

  titleInput.disabled = false;
  bodyInput.disabled = false;
  pinBtn.disabled = false;
  footer.hidden = false;

  titleInput.value = note.title;
  bodyInput.value = note.body;
  pinBtn.classList.toggle('pinned', Boolean(note.pinned));
  pinBtn.textContent = note.pinned ? '★' : '☆';

  updateNoteStats(note);
  renderNotesList();
}

function createNote() {
  playClickSound();
  const searchInput = document.getElementById('note-search-input');
  if (noteSearchQuery) {
    noteSearchQuery = '';
    if (searchInput) searchInput.value = '';
  }

  const note = {
    id: generateId(),
    title: 'New note',
    body: '',
    pinned: false,
    updatedAt: Date.now(),
  };
  notes.unshift(note);
  saveNotes();
  selectNote(note.id);
  const titleInput = document.getElementById('note-title');
  titleInput.focus();
  titleInput.select();
}

function handleDeleteNoteClick() {
  if (!activeNoteId) return;
  const deleteBtn = document.getElementById('delete-note-btn');

  if (!deleteBtn.classList.contains('confirming')) {
    playClickSound();
    deleteBtn.classList.add('confirming');
    deleteBtn.textContent = 'Sure?';
    deleteConfirmTimeout = setTimeout(resetDeleteConfirm, 3000);
    return;
  }

  playClickSound();
  notes = notes.filter((n) => n.id !== activeNoteId);
  saveNotes();
  const remaining = getSortedFilteredNotes();
  activeNoteId = remaining[0]?.id ?? null;
  selectNote(activeNoteId);
}

function initNotes() {
  document.getElementById('new-note-btn').addEventListener('click', createNote);
  document.getElementById('delete-note-btn').addEventListener('click', handleDeleteNoteClick);

  const searchInput = document.getElementById('note-search-input');
  const titleInput = document.getElementById('note-title');
  const bodyInput = document.getElementById('note-body');
  const pinBtn = document.getElementById('pin-note-btn');
  const copyBtn = document.getElementById('copy-note-btn');
  const exportBtn = document.getElementById('export-note-btn');

  searchInput.addEventListener('input', () => {
    noteSearchQuery = searchInput.value;
    renderNotesList();
  });

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
    updateNoteStats(note);
  });

  pinBtn.addEventListener('click', () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    playClickSound();
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    saveNotes();
    selectNote(note.id);
  });

  copyBtn.addEventListener('click', async () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    playClickSound();
    try {
      await navigator.clipboard.writeText(`${note.title}\n\n${note.body}`.trim());
      resetCopyFeedback();
      copyBtn.textContent = 'Copied!';
      copyFeedbackTimeout = setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyFeedbackTimeout = null;
      }, 1500);
    } catch {
      /* ignore clipboard error */
    }
  });

  exportBtn.addEventListener('click', () => {
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return;
    playClickSound();
    const content = `${note.title || 'Untitled'}\n${'='.repeat(24)}\n\n${note.body || ''}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (note.title || 'note').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase();
    a.href = url;
    a.download = `${safeName || 'note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  renderNotesList();
  if (activeNoteId && notes.some((n) => n.id === activeNoteId)) {
    selectNote(activeNoteId);
  } else if (notes.length > 0) {
    selectNote(notes[0].id);
  } else {
    selectNote(null);
  }
}

/* ── Boot ── */
initTitlebar();
initNavigation();
initClock();
initWeather();
initFocus();
initTasks();
initNotes();
