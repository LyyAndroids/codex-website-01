import { destinations, routes, guides, contentByType } from './data.js';
import { filterDestinations } from './search.js';

const assets = 'assets/images/';
const state = { query: '', category: '全部' };
const searchInput = document.querySelector('#destination-search');
const destinationGrid = document.querySelector('#destination-grid');
const resultCount = document.querySelector('#result-count');
const summary = document.querySelector('#search-summary');
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#detail-content');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
let dialogTrigger;
let photoCredits = [];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`;
}
function picture(item, className) {
  return `<div class="${className} media-frame"><img src="${assets}${item.image}" alt="${escapeHTML(item.imageAlt)}" loading="lazy" decoding="async" width="1600" height="1200"><span class="image-fallback" hidden>风景照片暂时无法显示</span></div>`;
}

function renderDestinations() {
  const filtered = filterDestinations(destinations, state);
  destinationGrid.innerHTML = filtered.map(item => `<button class="destination-card" type="button" data-type="destination" data-id="${item.id}" aria-label="查看${item.name}旅行详情">
    <div class="destination-photo media-frame"><img src="${assets}${item.image}" alt="${escapeHTML(item.imageAlt)}" loading="lazy" decoding="async" width="1600" height="1200"><span class="image-fallback" hidden>风景照片暂时无法显示</span><span class="place-region">${icon('pin')}${item.region}</span></div>
    <div class="destination-body"><div class="place-heading"><h3>${item.name}</h3><span>${item.english}</span></div><p class="place-description">${item.tagline}</p><div class="place-tags">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div></div>
  </button>`).join('');
  resultCount.textContent = `发现 ${filtered.length} 个目的地`;
  document.querySelector('#empty-state').hidden = filtered.length !== 0;
  const hasFilters = state.query !== '' || state.category !== '全部';
  summary.hidden = !hasFilters;
  summary.querySelector('span').textContent = [state.query && `关键词「${state.query}」`, state.category !== '全部' && `分类：${state.category}`].filter(Boolean).join(' · ');
  document.querySelectorAll('.filter-button').forEach(button => {
    const selected = button.dataset.category === state.category;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  registerImageFallbacks(destinationGrid);
}

function renderRoutes() {
  document.querySelector('#route-grid').innerHTML = routes.map(item => `<button class="route-card" type="button" data-type="route" data-id="${item.id}" aria-label="查看${item.name}路线">
    <div class="route-photo media-frame"><img src="${assets}${item.image}" alt="${escapeHTML(item.imageAlt)}" loading="lazy" decoding="async" width="1600" height="1200"><span class="image-fallback" hidden>风景照片暂时无法显示</span><span class="route-label">${item.label}</span></div>
    <div class="route-body"><small>${item.region}</small><h3>${item.name}</h3><p>${item.description}</p><div class="route-meta"><span>${icon('clock')}${item.duration}</span><span>查看完整路线</span></div></div>
  </button>`).join('');
}

function renderGuides() {
  const [featured, ...remaining] = guides;
  document.querySelector('#guide-layout').innerHTML = `<button class="guide-feature" type="button" data-type="guide" data-id="${featured.id}" aria-label="阅读攻略：${featured.name}">
    ${picture(featured, 'guide-feature-photo')}<div class="guide-feature-body"><small>${featured.label}</small><h3>${featured.name}</h3><p>${featured.description}</p><span class="guide-read-time">${icon('book')}${featured.duration}</span></div>
  </button><div class="guide-list">${remaining.map(item => `<button class="guide-row" type="button" data-type="guide" data-id="${item.id}" aria-label="阅读攻略：${item.name}">${picture(item, 'guide-thumb')}<div class="guide-row-body"><small>${item.label}</small><h3>${item.name}</h3><p>${item.description}</p><span class="guide-read-time">${icon('book')}${item.duration}</span></div></button>`).join('')}</div>`;
}

function registerImageFallbacks(root) {
  root.querySelectorAll('img').forEach(image => {
    const fallback = image.parentElement.querySelector('.image-fallback');
    if (!fallback) return;
    const showFallback = () => { image.hidden = true; fallback.hidden = false; };
    image.addEventListener('error', showFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) showFallback();
  });
}

function showDialog(markup, trigger) {
  dialogTrigger = trigger;
  dialogContent.innerHTML = markup;
  registerImageFallbacks(dialogContent);
  dialog.querySelector('.dialog-scroll').scrollTop = 0;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
}

function creditMarkup(filename) {
  const credit = photoCredits.find(item => item.file === filename);
  if (!credit) return '照片来源与作者署名见页脚「图片来源与许可」。';
  return `摄影：${escapeHTML(credit.author)} · <a href="${escapeHTML(credit.source_page)}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="${escapeHTML(credit.license_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(credit.license)}</a>。图片已缩放压缩，页面显示时可能裁切。`;
}

function openDetail(type, id, trigger) {
  const item = contentByType[type]?.find(entry => entry.id === id);
  if (!item) return;
  const label = type === 'destination' ? `${item.region} · 目的地手记` : type === 'route' ? `${item.region} · ${item.label}` : item.label;
  showDialog(`${picture(item, 'detail-photo')}<article class="detail-body"><span class="detail-eyebrow">${label}</span><h2 class="detail-title" id="detail-title">${item.name}</h2><p class="detail-description">${item.description}</p><div class="detail-meta">${icon(type === 'guide' ? 'book' : 'clock')}${item.duration}</div><div class="detail-highlights">${item.highlights.map(highlight => `<span>${highlight}</span>`).join('')}</div>${item.sections.map(section => `<section class="detail-section"><h3>${section.title}</h3><p>${section.text}</p></section>`).join('')}<aside class="detail-tips"><h3>${icon('compass')}出发小贴士</h3><ul>${item.tips.map(tip => `<li>${tip}</li>`).join('')}</ul></aside><p class="detail-credit">${creditMarkup(item.image)}</p></article>`, trigger);
}

function applySearch(query, resetCategory = false) {
  state.query = query.trim();
  if (resetCategory) state.category = '全部';
  searchInput.value = state.query;
  renderDestinations();
  document.querySelector('#destinations').scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' });
}
function prefersReducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', '打开导航菜单');
  nav.classList.remove('menu-open');
}

document.querySelector('.search-form').addEventListener('submit', event => {
  event.preventDefault();
  applySearch(searchInput.value);
});
searchInput.addEventListener('search', () => { if (searchInput.value === '') { state.query = ''; renderDestinations(); } });
document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click', () => {
  state.category = button.dataset.category;
  renderDestinations();
}));
document.querySelectorAll('.reset-all').forEach(button => button.addEventListener('click', () => {
  const replacedFocus = button.closest('#empty-state, #search-summary');
  applySearch('', true);
  if (replacedFocus) document.querySelector('.filter-button').focus({ preventScroll: true });
}));
document.querySelectorAll('[data-search]').forEach(button => button.addEventListener('click', () => applySearch(button.dataset.search, true)));
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-type][data-id]');
  if (trigger) openDetail(trigger.dataset.type, trigger.dataset.id, trigger);
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
});
menuToggle.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') === 'false';
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? '关闭导航菜单' : '打开导航菜单');
  nav.classList.toggle('menu-open', opening);
});
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('menu-open')) { closeMenu(); menuToggle.focus(); } });
window.matchMedia('(max-width: 600px)').addEventListener('change', closeMenu);
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
  closeMenu();
  const sectionId = link.getAttribute('href');
  document.querySelectorAll('.nav-link').forEach(navLink => navLink.classList.toggle('active', navLink.getAttribute('href') === sectionId));
}));

document.querySelector('.credits-button').addEventListener('click', event => {
  const contents = photoCredits.length ? `<ul class="credits-list">${photoCredits.map(credit => `<li><strong>${escapeHTML(credit.destination)}</strong>摄影：${escapeHTML(credit.author)}<br><a href="${escapeHTML(credit.source_page)}" target="_blank" rel="noopener noreferrer">原始照片与来源</a> · <a href="${escapeHTML(credit.license_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(credit.license)}</a></li>`).join('')}</ul>` : `<p>完整作者与许可信息可在<a href="assets/images/credits.json" target="_blank" rel="noopener">图片来源记录</a>中查看。</p>`;
  showDialog(`<div class="detail-body"><span class="detail-eyebrow">看见风景，也记住记录风景的人</span><h2 class="detail-title" id="detail-title">图片来源与许可</h2><p class="credits-intro">照片来自 Wikimedia Commons。本站仅进行了等比例缩放和压缩，页面显示时可能裁切。CC BY-SA 图片及其改编继续遵循原许可，其他内容的许可独立于照片。</p>${contents}</div>`, event.currentTarget);
});

renderDestinations();
renderRoutes();
renderGuides();
registerImageFallbacks(document);
fetch(`${assets}credits.json`).then(response => { if (!response.ok) throw new Error('Credits unavailable'); return response.json(); }).then(data => { photoCredits = data.images; }).catch(() => { /* Footer retains a link to the original credit file. */ });

const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  }
}, { rootMargin: '-100px 0px -60% 0px', threshold: 0 });
document.querySelectorAll('main>section[id]').forEach(section => sectionObserver.observe(section));
