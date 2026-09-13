(() => {
  'use strict';

  const I18N = {
    ru: {
      menu:'Меню', heroLead:'Казахское гостеприимство и современная культура вкуса в одном дастархане.',
      openMenu:'Открыть меню', currency:'Цены указаны в тенге', serviceShort:'обслуживание', search:'Поиск', categories:'Разделы',
      searchPlaceholder:'Плов, лагман, чай…', service:'К стоимости заказа добавляется обслуживание 10%.',
      kitchen:'Кухня', drinks:'Напитки', bar:'Бар', found:'Найдено позиций', nothing:'Ничего не найдено. Попробуйте другое название.',
      closing:'Меню перенесено в удобный цифровой формат с сохранением структуры и цен исходного меню BESH.', backTop:'Наверх', visit:'Ждём вас в BESH', address:'Павлодар, ул. Академика Сатпаева, 15', reserve:'Забронировать стол', whatsapp:'WhatsApp', instagram:'Instagram', call:'Позвонить', map:'Открыть карту'
    },
    kz: {
      menu:'Мәзір', heroLead:'Қазақы қонақжайлық пен заманауи ас мәдениеті тоғысқан BESH дастарханы.',
      openMenu:'Мәзірді ашу', currency:'Бағалар теңгемен көрсетілген', serviceShort:'қызмет көрсету', search:'Іздеу', categories:'Бөлімдер',
      searchPlaceholder:'Палау, лагман, шай…', service:'Тапсырыс құнына 10% қызмет көрсету ақысы қосылады.',
      kitchen:'Асхана', drinks:'Сусындар', bar:'Бар', found:'Табылған позициялар', nothing:'Ештеңе табылмады. Басқа атауды енгізіп көріңіз.',
      closing:'BESH мәзірінің құрылымы мен бағалары сақталып, ыңғайлы цифрлық форматқа көшірілді.', backTop:'Жоғары', visit:'BESH-ке қош келдіңіз', address:'Павлодар, Академик Сәтбаев көшесі, 15', reserve:'Үстел брондау', whatsapp:'WhatsApp', instagram:'Instagram', call:'Қоңырау шалу', map:'Картадан ашу'
    }
  };
  const GROUPS = ['kitchen','drinks','bar'];
  let lang = localStorage.getItem('besh-lang') === 'kz' ? 'kz' : 'ru';
  let activeGroup = 'kitchen';
  let activeCategory = MENU_DATA[0]?.id || '';
  let observer;

  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const menuRoot = $('#menuRoot');
  const categoryStrip = $('#categoryStrip');
  const groupTabs = $('#groupTabs');
  const catalogList = $('#catalogList');
  const langToggle = $('#langToggle');
  const searchButton = $('#searchButton');
  const searchPanel = $('#searchPanel');
  const searchInput = $('#searchInput');
  const searchMeta = $('#searchMeta');
  const clearSearch = $('#clearSearch');
  const drawer = $('#catalogDrawer');
  const catalogButton = $('#catalogButton');
  const modal = $('#itemModal');
  const toTop = $('#toTop');

  function esc(v='') {
    return String(v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function t(key){ return I18N[lang][key] || key; }
  function catTitle(cat){ return lang === 'kz' ? cat.titleKz : cat.titleRu; }
  function altCatTitle(cat){ return lang === 'kz' ? cat.titleRu : cat.titleKz; }
  function itemName(it){ return lang === 'kz' ? it.nameKz : it.nameRu; }
  function itemAlt(it){ return lang === 'kz' ? it.nameRu : it.nameKz; }

  function centerHorizontally(container, el, smooth=true){
    if(!container || !el) return;
    const left = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2;
    try {
      container.scrollTo({left: Math.max(0,left), behavior: smooth ? 'smooth' : 'auto'});
    } catch (_) {
      container.scrollLeft = Math.max(0,left);
    }
  }

  function applyI18n(){
    document.documentElement.lang = lang === 'kz' ? 'kk' : 'ru';
    $$('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
    $$('[data-i18n-placeholder]').forEach(el => el.placeholder = t(el.dataset.i18nPlaceholder));
    langToggle.innerHTML = lang === 'ru'
      ? '<span class="lang__active">RU</span><span class="lang__sep">/</span><span>KZ</span>'
      : '<span>RU</span><span class="lang__sep">/</span><span class="lang__active">KZ</span>';
    langToggle.setAttribute('aria-label', lang === 'ru' ? 'Переключить на казахский' : 'Орыс тіліне ауысу');
  }

  function matches(cat,it,q){
    if(!q) return true;
    const hay = [cat.titleRu,cat.titleKz,it.nameRu,it.nameKz,it.descRu,it.note].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  }

  function filteredData(){
    const q = searchInput.value.trim().toLowerCase();
    if(!q) return MENU_DATA.map(cat => ({...cat, filteredItems:cat.items}));
    return MENU_DATA.map(cat => ({...cat, filteredItems:cat.items.filter(it => matches(cat,it,q))})).filter(cat => cat.filteredItems.length);
  }

  function renderMenu(){
    const data = filteredData();
    const q = searchInput.value.trim();
    const count = data.reduce((n,c)=>n+c.filteredItems.length,0);
    searchMeta.textContent = q ? `${t('found')}: ${count}` : '';
    if(!data.length){
      menuRoot.innerHTML = `<div class="empty shell">${esc(t('nothing'))}</div>`;
      renderGroupTabs([]); categoryStrip.innerHTML=''; disconnectObserver(); return;
    }
    menuRoot.innerHTML = data.map(cat => {
      const visual = cat.image
        ? `<figure class="section-visual"><img loading="lazy" src="${esc(cat.image)}" alt="${esc(catTitle(cat))} — BESH"><figcaption class="section-visual__label">BESH · ${esc(catTitle(cat))}</figcaption></figure>`
        : `<div class="section-visual bar-visual" aria-hidden="true"></div>`;
      return `<section class="menu-section shell" id="${esc(cat.id)}" data-section data-group="${esc(cat.group)}">
        <div class="menu-grid">
          <div>
            <header class="section-head"><h3>${esc(catTitle(cat))}</h3><div class="section-head__alt">${esc(altCatTitle(cat))}</div></header>
            <div class="items">${cat.filteredItems.map(it => itemHTML(cat,it)).join('')}</div>
          </div>
          ${visual}
        </div>
      </section>`;
    }).join('');
    bindItems();
    const groups = GROUPS.filter(g => data.some(c=>c.group===g));
    if(!groups.includes(activeGroup)) activeGroup = groups[0];
    renderGroupTabs(groups);
    renderCategoryStrip(data);
    observeSections();
  }

  function itemHTML(cat,it){
    return `<article class="item" tabindex="0" role="button"
      data-cat="${esc(cat.id)}" data-name="${esc(it.nameRu)}" data-kz="${esc(it.nameKz)}"
      data-price="${esc(it.price)}" data-desc="${esc(it.descRu || '')}" data-note="${esc(it.note || '')}">
      <div><div class="item__name">${esc(itemName(it))}</div>${itemAlt(it) && itemAlt(it)!==itemName(it) ? `<div class="item__alt">${esc(itemAlt(it))}</div>`:''}${it.descRu ? `<div class="item__desc">${esc(it.descRu)}</div>`:''}</div>
      <div><div class="item__price">${esc(it.price)}</div>${it.note ? `<div class="item__note">${esc(it.note)}</div>`:''}</div>
    </article>`;
  }

  function renderGroupTabs(groups=GROUPS){
    groupTabs.innerHTML = groups.map(g => `<button class="group-tab ${g===activeGroup?'is-active':''}" type="button" data-group-target="${g}">${esc(t(g))}</button>`).join('');
    $$('[data-group-target]',groupTabs).forEach(btn => btn.addEventListener('click',() => {
      const group = btn.dataset.groupTarget;
      const data = filteredData();
      const target = data.find(c=>c.group===group);
      if(target){ activeGroup=group; activeCategory=target.id; renderGroupTabs(groups); renderCategoryStrip(data); document.getElementById(target.id)?.scrollIntoView({behavior:'smooth',block:'start'}); }
    }));
  }

  function renderCategoryStrip(data=filteredData()){
    const cats = data.filter(c=>c.group===activeGroup);
    categoryStrip.innerHTML = cats.map(c => `<button class="category-chip ${c.id===activeCategory?'is-active':''}" type="button" data-cat-target="${esc(c.id)}">${esc(catTitle(c))}</button>`).join('');
    $$('[data-cat-target]',categoryStrip).forEach(btn => btn.addEventListener('click',()=>document.getElementById(btn.dataset.catTarget)?.scrollIntoView({behavior:'smooth',block:'start'})));
    requestAnimationFrame(()=>centerHorizontally(categoryStrip, categoryStrip.querySelector('.is-active')));
  }

  function renderCatalog(){
    catalogList.innerHTML = GROUPS.map(g => {
      const cats = MENU_DATA.filter(c=>c.group===g);
      return `<section class="catalog-group"><p class="catalog-group__title">${esc(t(g))}</p>${cats.map(c=>`<button class="catalog-link" type="button" data-drawer-target="${esc(c.id)}"><span>${esc(catTitle(c))}</span><span>${c.items.length}</span></button>`).join('')}</section>`;
    }).join('');
    $$('[data-drawer-target]',catalogList).forEach(btn => btn.addEventListener('click',()=>{ const id=btn.dataset.drawerTarget; closeDrawer(); setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),100); }));
  }

  function bindItems(){
    $$('.item').forEach(el => {
      const open=()=>openItem(el);
      el.addEventListener('click',open);
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
  }

  function openItem(el){
    const cat = MENU_DATA.find(c=>c.id===el.dataset.cat);
    const ru = el.dataset.name, kz = el.dataset.kz;
    $('#modalCategory').textContent = cat ? catTitle(cat) : 'BESH';
    $('#modalName').textContent = lang==='kz' ? kz : ru;
    $('#modalAlt').textContent = lang==='kz' ? ru : kz;
    $('#modalDesc').textContent = el.dataset.desc || '';
    $('#modalDesc').hidden = !el.dataset.desc;
    $('#modalPrice').textContent = el.dataset.price;
    $('#modalNote').textContent = el.dataset.note || '';
    modal.hidden=false; document.body.style.overflow='hidden';
    requestAnimationFrame(()=>$('.modal__close')?.focus());
  }
  function closeModal(){ modal.hidden=true; document.body.style.overflow=''; }

  function openDrawer(){ renderCatalog(); drawer.hidden=false; catalogButton.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; requestAnimationFrame(()=>$('.drawer .icon-btn')?.focus()); }
  function closeDrawer(){ drawer.hidden=true; catalogButton.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }

  function disconnectObserver(){ if(observer) observer.disconnect(); }
  function observeSections(){
    disconnectObserver();
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible) return;
      const id=visible.target.id, group=visible.target.dataset.group;
      const changedGroup = group!==activeGroup;
      activeCategory=id; activeGroup=group;
      const groups = GROUPS.filter(g=>filteredData().some(c=>c.group===g));
      renderGroupTabs(groups); renderCategoryStrip(filteredData());
      if(changedGroup) requestAnimationFrame(()=>centerHorizontally(groupTabs, groupTabs.querySelector('.is-active')));
    },{rootMargin:'-31% 0px -58% 0px',threshold:[0,.12,.35,.65]});
    $$('[data-section]').forEach(s=>observer.observe(s));
  }

  langToggle.addEventListener('click',()=>{
    lang = lang==='ru'?'kz':'ru'; localStorage.setItem('besh-lang',lang); applyI18n(); renderMenu(); renderCatalog();
  });
  searchButton.addEventListener('click',()=>{
    const show = searchPanel.hidden; searchPanel.hidden=!show; searchButton.setAttribute('aria-expanded',String(show)); if(show) setTimeout(()=>searchInput.focus(),30);
  });
  searchInput.addEventListener('input',renderMenu);
  clearSearch.addEventListener('click',()=>{searchInput.value='';renderMenu();searchInput.focus();});
  catalogButton.addEventListener('click',openDrawer);
  $$('[data-drawer-close]').forEach(el=>el.addEventListener('click',closeDrawer));
  $$('[data-modal-close]').forEach(el=>el.addEventListener('click',closeModal));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!modal.hidden)closeModal();else if(!drawer.hidden)closeDrawer();}});
  toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll',()=>toTop.classList.toggle('is-visible',window.scrollY>850),{passive:true});

  applyI18n(); renderMenu(); renderCatalog();
  if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
