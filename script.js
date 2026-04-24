'use strict';

const REPO = 'intjiraya/prod-bdays';
const ADD_ISSUE_URL = `https://github.com/${REPO}/issues/new?template=add-birthday.yml`;

// ============================================================
// CONSTANTS
// ============================================================
const MONTHS = [
  'ЯНВАРЯ','ФЕВРАЛЯ','МАРТА','АПРЕЛЯ','МАЯ','ИЮНЯ',
  'ИЮЛЯ','АВГУСТА','СЕНТЯБРЯ','ОКТЯБРЯ','НОЯБРЯ','ДЕКАБРЯ'
];
const MONTHS_SHORT = [
  'ЯНВ','ФЕВ','МАР','АПР','МАЙ','ИЮН',
  'ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'
];

const ZODIAC = [
  { s: '♑', m1: 1,  d1: 1,  m2: 1,  d2: 19 },
  { s: '♒', m1: 1,  d1: 20, m2: 2,  d2: 18 },
  { s: '♓', m1: 2,  d1: 19, m2: 3,  d2: 20 },
  { s: '♈', m1: 3,  d1: 21, m2: 4,  d2: 19 },
  { s: '♉', m1: 4,  d1: 20, m2: 5,  d2: 20 },
  { s: '♊', m1: 5,  d1: 21, m2: 6,  d2: 20 },
  { s: '♋', m1: 6,  d1: 21, m2: 7,  d2: 22 },
  { s: '♌', m1: 7,  d1: 23, m2: 8,  d2: 22 },
  { s: '♍', m1: 8,  d1: 23, m2: 9,  d2: 22 },
  { s: '♎', m1: 9,  d1: 23, m2: 10, d2: 22 },
  { s: '♏', m1: 10, d1: 23, m2: 11, d2: 21 },
  { s: '♐', m1: 11, d1: 22, m2: 12, d2: 21 },
  { s: '♑', m1: 12, d1: 22, m2: 12, d2: 31 },
];

// ============================================================
// UTILS
// ============================================================
function getZodiac(day, month) {
  for (const z of ZODIAC) {
    if ((month === z.m1 && day >= z.d1) || (month === z.m2 && day <= z.d2)) {
      return z.s;
    }
  }
  return '★';
}

function getMskNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
}

function daysUntilBirthday(day, month) {
  const now   = getMskNow();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next    = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next - today) / 86400000);
}

function parseBirthday(str) {
  const [d, m] = str.split('.');
  return { day: parseInt(d, 10), month: parseInt(m, 10) };
}

function daysLabel(n) {
  if (n === 0) return 'СЕГОДНЯ!';
  const l10  = n % 10;
  const l100 = n % 100;
  if (l100 >= 11 && l100 <= 14) return 'ДНЕЙ';
  if (l10 === 1) return 'ДЕНЬ';
  if (l10 >= 2 && l10 <= 4) return 'ДНЯ';
  return 'ДНЕЙ';
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isValidUrl(str) {
  try { return Boolean(new URL(str)); } catch { return false; }
}

// ============================================================
// STATE
// ============================================================
let allEntries = [];
let activeMonth = 0;
let searchQuery = '';

// ============================================================
// LOAD
// ============================================================
async function loadData() {
  try {
    const res = await fetch('data/birthdays.json');
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    allEntries = data;
    initApp();
  } catch (err) {
    document.getElementById('grid-loader').innerHTML =
      '<span style="color:var(--red)">ОШИБКА ЗАГРУЗКИ DATA.JSON</span>';
  }
}

// ============================================================
// INIT
// ============================================================
function initApp() {
  // Enrich entries with computed fields
  allEntries = allEntries.map((b, i) => {
    const { day, month } = parseBirthday(b.birthday);
    const daysLeft = daysUntilBirthday(day, month);
    return {
      ...b,
      _idx:     i + 1,
      _day:     day,
      _month:   month,
      _days:    daysLeft,
      _today:   daysLeft === 0,
      _soon:    daysLeft > 0 && daysLeft <= 7,
      _zodiac:  getZodiac(day, month),
    };
  });

  // Sort: today first, then upcoming, then by days
  allEntries.sort((a, b) => a._days - b._days);

  // Reassign sequential indices after sort
  allEntries.forEach((b, i) => { b._idx = i + 1; });

  updateStats();
  buildMonthFilters();
  renderSpotlightZones();
  renderGrid();

  // Wire footer link
  document.getElementById('footer-add-link').href = ADD_ISSUE_URL;
  document.getElementById('footer-count').textContent =
    `${allEntries.length} УЧАСТНИК${pluralRu(allEntries.length)}`;

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderGrid();
  });
}

function pluralRu(n) {
  const l10 = n % 10, l100 = n % 100;
  if (l100 >= 11 && l100 <= 14) return 'ОВ';
  if (l10 === 1) return '';
  if (l10 >= 2 && l10 <= 4) return 'А';
  return 'ОВ';
}

// ============================================================
// STATS
// ============================================================
function updateStats() {
  const curMonth = getMskNow().getMonth() + 1;
  document.getElementById('stat-total').textContent  = allEntries.length;
  document.getElementById('stat-today').textContent  = allEntries.filter(b => b._today).length;
  document.getElementById('stat-month').textContent  = allEntries.filter(b => b._month === curMonth).length;
}

// ============================================================
// MONTH FILTERS
// ============================================================
function buildMonthFilters() {
  const nav = document.getElementById('month-nav');
  const months = [...new Set(allEntries.map(b => b._month))].sort((a, b) => a - b);

  months.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'month-btn';
    btn.dataset.month = m;
    btn.textContent = MONTHS_SHORT[m - 1];
    nav.appendChild(btn);
  });

  nav.addEventListener('click', e => {
    const btn = e.target.closest('.month-btn');
    if (!btn) return;
    nav.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeMonth = parseInt(btn.dataset.month, 10);
    renderGrid();
  });
}

// ============================================================
// SPOTLIGHT ZONES (today / upcoming)
// ============================================================
function renderSpotlightZones() {
  const todayList    = allEntries.filter(b => b._today);
  const upcomingList = allEntries.filter(b => b._soon);

  if (todayList.length > 0) {
    document.getElementById('today-cards').innerHTML = todayList.map(b => renderCard(b, 0)).join('');
    document.getElementById('today-zone').removeAttribute('hidden');
  }

  if (upcomingList.length > 0) {
    document.getElementById('upcoming-cards').innerHTML = upcomingList.map((b, i) => renderCard(b, i)).join('');
    document.getElementById('upcoming-zone').removeAttribute('hidden');
  }
}

// ============================================================
// MAIN GRID
// ============================================================
function renderGrid() {
  const grid     = document.getElementById('birthday-grid');
  const emptyMsg = document.getElementById('empty-state');

  let list = allEntries;

  if (activeMonth > 0) {
    list = list.filter(b => b._month === activeMonth);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(b =>
      b.telegram.toLowerCase().includes(q) ||
      (b.note && b.note.toLowerCase().includes(q))
    );
  }

  if (list.length === 0) {
    grid.innerHTML = '';
    emptyMsg.removeAttribute('hidden');
    return;
  }

  emptyMsg.setAttribute('hidden', '');

  // Cap animation delay so late cards aren't frozen
  grid.innerHTML = list.map((b, i) => renderCard(b, i)).join('');
}

// ============================================================
// CARD TEMPLATE
// ============================================================
function renderCard(b, animIdx) {
  const delay = Math.min(animIdx, 24) * 0.045;

  const handle = b.telegram.startsWith('@') ? b.telegram : '@' + b.telegram;
  const tgUrl  = `https://t.me/${handle.replace('@', '')}`;

  const cls = ['bday-card', b._today ? 'is-today' : '', b._soon ? 'is-upcoming' : '']
    .filter(Boolean).join(' ');

  const badges = [];
  if (b._today) badges.push(`<span class="badge badge-today">ДР!</span>`);
  else if (b._soon) badges.push(`<span class="badge badge-soon">СКОРО</span>`);

  const countHtml = b._today
    ? `<div class="count-num">🎂</div><div class="count-unit">С ДНЁМ!</div>`
    : `<div class="count-num">${b._days}</div><div class="count-unit">${daysLabel(b._days)}</div>`;

  const wishlistHtml = (b.wishlist && isValidUrl(b.wishlist))
    ? `<a href="${esc(b.wishlist)}" class="card-wishlist" target="_blank" rel="noopener noreferrer">⬕ ВИШЛИСТ ↗</a>`
    : '';

  const noteHtml = b.note
    ? `<div class="card-note">${esc(b.note)}</div>`
    : '';

  const extraHtml = (wishlistHtml || noteHtml)
    ? `<div class="card-sep"></div>${wishlistHtml}${noteHtml}`
    : '';

  return `
<div class="${cls}" style="--card-delay:${delay}s">
  <div class="card-header">
    <div class="card-index">#${String(b._idx).padStart(3, '0')}</div>
    <div class="card-meta-right">
      ${badges.join('')}
      <div class="card-zodiac" title="${b._zodiac}">${b._zodiac}</div>
    </div>
  </div>

  <div class="card-handle">
    <a href="${tgUrl}" target="_blank" rel="noopener noreferrer">${esc(handle)}</a>
  </div>

  <div class="card-date-block">
    <div class="card-date">${String(b._day).padStart(2,'0')} ${MONTHS[b._month - 1]}</div>
    <div class="card-date-label">ДЕНЬ РОЖДЕНИЯ</div>
  </div>

  <div class="card-countdown">
    ${countHtml}
  </div>

  ${extraHtml}
</div>`;
}

// ============================================================
// BOOT
// ============================================================
loadData();
