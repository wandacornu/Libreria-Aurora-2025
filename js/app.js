import { fmtCurrency, readJSON, debounce } from './utils.js';
import { Cart } from './cart.js';

const state = {
    products: [],
    filtered: [],
    q: '',
    cat: '',
    sort: 'relevancia',
    max: '',
    page: 1,
    pageSize: 8
};

const views = {
    catalogo: document.getElementById('view-catalogo'),
    carrito: document.getElementById('view-carrito'),
    libro: document.getElementById('view-book'),
    contacto: document.getElementById('view-contacto')
};

function show(view) {
    for (const v of Object.values(views)) v.hidden = true;
    views[view].hidden = false;
    window.scrollTo(0, 0);
    if (view === 'carrito') Cart.renderList();
}

function renderCategories(list){
  const select = document.getElementById('cat');
  const cats = Array.from(new Set(list.map(p=>p.category))).sort();
  for(const c of cats){
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    select.appendChild(opt);
  }
}

function paginate(list){
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = (state.page - 1) * state.pageSize;
  const end = start + state.pageSize;
  return { pageItems: list.slice(start, end), page: state.page, pages, total };
}

function renderPagination(pages, page){
  const nav = document.querySelector('.pagination');
  if(!nav) return;
  nav.innerHTML = '';

  // Solo mostramos el botón "Siguiente" si no estamos en la última página
  if(page < pages){
    const next = document.createElement('button');
    next.textContent = 'Siguiente ›';
    next.onclick = () => { state.page++; applyFilters(); };
    nav.appendChild(next);
  }
}


function renderGrid(list){
  const grid = document.getElementById('grid'), empty = document.getElementById('empty');
  grid.innerHTML = '';
  if(!list.length){ empty.hidden=false; renderPagination(1,1); return; }
  empty.hidden = true;

  const { pageItems, page, pages } = paginate(list);

  for(const p of pageItems){
    const card = document.createElement('article');
    card.className='card';
    const authorLine = p.author ? `<small class="author">por ${p.author}</small>` : '';
    const img = p.image ? `<img src="${p.image}" alt="Portada de ${p.name}" loading="lazy">` : 'PORTADA';
    card.innerHTML = `
      <div class="img" role="img" aria-label="Portada de ${p.name}">${img}</div>
      <div class="body">
        <small class="category">${p.category}</small>
        <h3><a href="#/libro/${p.id}" aria-label="Ver detalle de ${p.name}">${p.name}</a></h3>
        ${authorLine}
        <p>${p.description}</p>
        <div class="row">
          <span class="price">${fmtCurrency(p.price)}</span>
          <button class="btn btn-primary" data-add="${p.id}">Agregar</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }

  grid.addEventListener('click', (e)=>{
    const id = e.target?.dataset?.add;
    if(!id) return;
    const product = state.products.find(p=>p.id===id);
    if(product){ Cart.add(product, 1); }
  }, { once:true });

  renderPagination(pages, page);
}

function applyFilters(){
  let list = [...state.products];

  if(state.q){
    const q = state.q.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q)) ||
      (p.author?.toLowerCase().includes(q))
    );
  }

  if(state.cat){
    list = list.filter(p => p.category === state.cat);
  }

  if(state.max){
    const m = Number(state.max);
    if(!Number.isNaN(m)) list = list.filter(p => p.price <= m);
  }

  // 👉 Mostramos todo junto sin paginación
  renderGrid(list);   
  document.querySelector('.pagination').innerHTML = ''; 
}


function bindControls(){
  const q = document.getElementById('q'),
        cat = document.getElementById('cat'),
        sort = document.getElementById('sort'),
        max = document.getElementById('max'),
        clear = document.getElementById('clear');
  q.addEventListener('input', debounce(()=>{ state.q = q.value.trim(); state.page=1; applyFilters(); }, 200));
  cat.addEventListener('change', ()=>{ state.cat = cat.value; state.page=1; applyFilters(); });
  sort.addEventListener('change', ()=>{ state.sort = sort.value; applyFilters(); });
  max.addEventListener('input', debounce(()=>{ state.max = max.value.trim(); state.page=1; applyFilters(); }, 200));
  clear.addEventListener('click', ()=>{
    q.value=''; cat.value=''; sort.value='relevancia'; max.value='';
    state.q=''; state.cat=''; state.sort='relevancia'; state.max=''; state.page=1;
    applyFilters();
  });

  const openFilters = document.getElementById('open-filters');
  openFilters.addEventListener('click', ()=>{
    const panel = document.getElementById('controls');
    const isOpen = panel.style.display==='grid' || panel.style.display==='';
    panel.style.display = isOpen ? 'none' : 'grid';
    openFilters.setAttribute('aria-expanded', String(!isOpen));
  });
}

function handleRouting(){
  const hash = location.hash.replace('#/','') || 'catalogo';
  if(hash.startsWith('libro/')){
    const id = hash.split('/')[1];
    renderBookDetail(id);
    show('libro');
  } else if (hash === 'contacto') {
      show('contacto');
  } else {
      show(hash);
  }
}

function renderBookDetail(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) {
        document.getElementById('book-title').textContent = 'Libro no encontrado';
        return; // 👈 importante, así corta si no lo encuentra
    }

    const img = document.getElementById('book-img');
    if (img) {
        img.src = p.image || '';
        img.alt = 'Portada de ' + p.name;
    }

    document.getElementById('book-title').textContent = p.name;
    document.getElementById('book-cat').textContent = p.category;
    document.getElementById('book-author').textContent = p.author ? 'por ' + p.author : '';
    document.getElementById('book-desc').textContent = p.description || '';
    document.getElementById('book-price').textContent = fmtCurrency(p.price);

    const add = document.getElementById('detail-add');
    add.onclick = () => Cart.add(p, 1);
}
function bindContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const name = document.getElementById('cname');
    const email = document.getElementById('cemail');
    const subject = document.getElementById('csubject');
    const msg = document.getElementById('cmsg');
    const ok = document.getElementById('contact-ok');

    const errName = document.getElementById('err-name');
    const errEmail = document.getElementById('err-email');
    const errSubject = document.getElementById('err-subject');
    const errMsg = document.getElementById('err-msg');

    const hide = (el) => el && (el.hidden = true);

    const validate = () => {
        let valid = true;
        if (!name.value.trim()) { errName.hidden = false; valid = false; } else hide(errName);
        const ev = email.value.trim();
        const emailOk = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(ev);
        if (!emailOk) { errEmail.hidden = false; valid = false; } else hide(errEmail);
        if (!subject.value.trim()) { errSubject.hidden = false; valid = false; } else hide(errSubject);
        if (!msg.value.trim()) { errMsg.hidden = false; valid = false; } else hide(errMsg);
        return valid;
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validate()) return;
        ok.hidden = false;
        form.reset();
    });

    const clearBtn = document.getElementById('clear-msg');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            form.reset(); ok.hidden = true;
            [errName, errEmail, errSubject, errMsg].forEach(hide);
        });
    }
} 
  // Ir al inicio al hacer click en la marca (reset de filtros y paginación)
  const brand = document.querySelector('.brand');
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      state.q = '';
      state.cat = '';
      state.sort = 'relevancia';
      state.max = '';
      state.page = 1;
      applyFilters();
      location.hash = '#/catalogo';
    });
  }
// Resetear al inicio cuando se clickea en la marca
  document.querySelector('.brand').addEventListener('click', (e) => {
    e.preventDefault();
    state.q = '';
    state.cat = '';
    state.sort = 'relevancia';
    state.max = '';
    state.page = 1;
    applyFilters();
    location.hash = '#/catalogo';
  });
window.addEventListener('hashchange', handleRouting);

async function init() {
    Cart.renderBadge();
    bindControls();
    bindContactForm();
    window.addEventListener('hashchange', handleRouting);

    try {
        const data = await readJSON('data/books.json');
        state.products = data;
        renderCategories(data);
        applyFilters();
    } catch (err) {
        console.error(err);
        const grid = document.getElementById('grid');
        if (grid) grid.innerHTML = '<p class="empty">No se pudo cargar el catálogo.</p>';
    }

    if (!location.hash) location.hash = '#/catalogo';
    handleRouting();
}

init();

