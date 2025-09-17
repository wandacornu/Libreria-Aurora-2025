import { fmtCurrency, save, load } from './utils.js';

const KEY='cart_items_books_v1';

export const Cart = {
  items: load(KEY, []),

  add(product, qty=1){
    const found = this.items.find(i=>i.id===product.id);
    if(found){ found.qty += qty; }
    else { this.items.push({ id: product.id, name: product.name, price: product.price, qty }); }
    this.persist(); this.renderBadge();
  },

  remove(id){
    this.items = this.items.filter(i=>i.id!==id);
    this.persist(); this.renderBadge();
  },

  setQty(id, qty){
    const it = this.items.find(i=>i.id===id);
    if(!it) return;
    it.qty = Math.max(1, qty);
    this.persist(); this.renderBadge();
  },

  clear(){ this.items = []; this.persist(); this.renderBadge(); },

  get subtotal(){ return this.items.reduce((a,b)=>a+b.price*b.qty,0); },

  persist(){ save(KEY, this.items); },

  renderBadge(){
    const b = document.getElementById('cart-count');
    if(b){ b.textContent = this.items.reduce((a,b)=>a+b.qty,0); }
  },

  renderList(){
    const list = document.getElementById('cart-items');
    const subtotal = document.getElementById('subtotal'), shipping = document.getElementById('shipping'), total = document.getElementById('total');
    if(!list) return;
    list.innerHTML = '';
    if(this.items.length===0){
      list.innerHTML = '<p class="empty">Tu carrito está vacío.</p>';
    } else {
      for(const it of this.items){
        const row = document.createElement('div');
        row.className='cart-item';
        row.innerHTML = `
          <div class="thumb">PORTADA</div>
          <div>
            <div class="name">${it.name}</div>
            <div class="meta">${fmtCurrency(it.price)}</div>
            <div class="qty">
              <button data-dec="${it.id}" aria-label="Disminuir cantidad">−</button>
              <span>${it.qty}</span>
              <button data-inc="${it.id}" aria-label="Aumentar cantidad">+</button>
              <span class="remove" data-del="${it.id}" role="button" aria-label="Quitar">Quitar</span>
            </div>
          </div>
          <div><strong>${fmtCurrency(it.price * it.qty)}</strong></div>
        `;
        list.appendChild(row);
      }
    }
    const ship = this.items.length ? 2500 : 0;
    if(subtotal) subtotal.textContent = fmtCurrency(this.subtotal);
    if(shipping) shipping.textContent = fmtCurrency(ship);
    if(total) total.textContent = fmtCurrency(this.subtotal + ship);

    list.addEventListener('click', (e)=>{
      const target = e.target;
      if(target.dataset.inc){ this.setQty(target.dataset.inc, (this.items.find(i=>i.id===target.dataset.inc)?.qty ?? 1)+1); this.renderList(); }
      if(target.dataset.dec){ this.setQty(target.dataset.dec, (this.items.find(i=>i.id===target.dataset.dec)?.qty ?? 1)-1); this.renderList(); }
      if(target.dataset.del){ this.remove(target.dataset.del); this.renderList(); }
    }, { once:true });

    const clearBtn = document.getElementById('clear-cart'); if(clearBtn){ clearBtn.onclick = ()=>{ this.clear(); this.renderList(); }; }
    const checkout = document.getElementById('checkout'); if(checkout){ checkout.onclick = ()=> alert('Simulación de checkout.'); }
  }
};
