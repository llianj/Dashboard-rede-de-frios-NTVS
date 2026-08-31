import '../css/style.css';

import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, onSnapshot, doc,
  addDoc, updateDoc, deleteDoc, getDocs, writeBatch
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  setPersistence, browserLocalPersistence,
  sendPasswordResetEmail, createUserWithEmailAndPassword
} from "firebase/auth";

import { firebaseConfig } from "./firebase-config.js";
import { IMUNO_CATALOG, INSUMO_CATALOG, CATALOG_BY_NAME } from "./catalog.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const vaccinesCol = collection(db, "vaccines");

let vaccines = [];
let isLoggedIn = false;
let unsubscribeVaccines = null;

// ---- Tema claro/escuro ----
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.getElementById('btnThemeLight').classList.toggle('active', theme === 'light');
  document.getElementById('btnThemeDark').classList.toggle('active', theme === 'dark');
}
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
document.getElementById('btnThemeLight').addEventListener('click', () => applyTheme('light'));
document.getElementById('btnThemeDark').addEventListener('click', () => applyTheme('dark'));
document.getElementById('btnLoginThemeToggle').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
});

// ---- Alternância entre telas de login / esqueci senha / criar conta ----
function showLoginView(view){
  document.getElementById('viewSignIn').style.display = view === 'signin' ? 'block' : 'none';
  document.getElementById('viewForgot').style.display = view === 'forgot' ? 'block' : 'none';
  document.getElementById('viewSignup').style.display = view === 'signup' ? 'block' : 'none';
  document.getElementById('loginError').classList.remove('show');
  document.getElementById('forgotError').classList.remove('show');
  document.getElementById('forgotSuccess').classList.remove('show');
  document.getElementById('signupError').classList.remove('show');
}
document.getElementById('linkForgot').addEventListener('click', () => showLoginView('forgot'));
document.getElementById('linkGoSignup').addEventListener('click', () => showLoginView('signup'));
document.getElementById('linkBackFromForgot').addEventListener('click', () => showLoginView('signin'));
document.getElementById('linkBackFromSignup').addEventListener('click', () => showLoginView('signin'));

setPersistence(auth, browserLocalPersistence);

onAuthStateChanged(auth, user => {
  isLoggedIn = !!user;
  const loginScreen = document.getElementById('loginScreen');
  const dashboardApp = document.getElementById('dashboardApp');
  const authLabel = document.getElementById('authLabel');

  if(user){
    authLabel.textContent = user.email;
    loginScreen.style.display = 'none';
    dashboardApp.style.display = 'block';
    subscribeToVaccines();
  }else{
    loginScreen.style.display = 'flex';
    dashboardApp.style.display = 'none';
    showLoginView('signin');
    if(unsubscribeVaccines){ unsubscribeVaccines(); unsubscribeVaccines = null; }
    vaccines = [];
  }
});

document.getElementById('btnAuthToggle').addEventListener('click', () => {
  signOut(auth);
});
document.getElementById('btnLogin').addEventListener('click', doLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if(e.key === 'Enter') doLogin(); });
document.getElementById('loginEmail').addEventListener('keydown', e => { if(e.key === 'Enter') doLogin(); });

async function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorBox = document.getElementById('loginError');
  const btn = document.getElementById('btnLogin');
  errorBox.classList.remove('show');
  if(!email || !password){
    errorBox.textContent = 'Preencha e-mail e senha.';
    errorBox.classList.add('show');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Entrando...';
  try{
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
  }catch(e){
    errorBox.textContent = 'E-mail ou senha incorretos.';
    errorBox.classList.add('show');
  }finally{
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

// ---- Esqueci minha senha ----
document.getElementById('btnSendReset').addEventListener('click', doSendReset);
document.getElementById('forgotEmail').addEventListener('keydown', e => { if(e.key === 'Enter') doSendReset(); });

async function doSendReset(){
  const email = document.getElementById('forgotEmail').value.trim();
  const errorBox = document.getElementById('forgotError');
  const successBox = document.getElementById('forgotSuccess');
  const btn = document.getElementById('btnSendReset');
  errorBox.classList.remove('show');
  successBox.classList.remove('show');
  if(!email){
    errorBox.textContent = 'Informe seu e-mail.';
    errorBox.classList.add('show');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try{
    await sendPasswordResetEmail(auth, email);
    successBox.classList.add('show');
    document.getElementById('forgotEmail').value = '';
  }catch(e){
    // Não revelamos se o e-mail existe ou não, exceto quando o formato é inválido.
    if(e.code === 'auth/invalid-email'){
      errorBox.textContent = 'Informe um e-mail válido.';
      errorBox.classList.add('show');
    }else{
      successBox.classList.add('show');
    }
  }finally{
    btn.disabled = false;
    btn.textContent = 'Enviar link de redefinição';
  }
}

// ---- Criar conta ----
document.getElementById('btnSignup').addEventListener('click', doSignup);
[document.getElementById('signupEmail'), document.getElementById('signupPassword'), document.getElementById('signupPasswordConfirm')]
  .forEach(el => el.addEventListener('keydown', e => { if(e.key === 'Enter') doSignup(); }));

async function doSignup(){
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupPasswordConfirm').value;
  const errorBox = document.getElementById('signupError');
  const btn = document.getElementById('btnSignup');
  errorBox.classList.remove('show');

  if(!email || !password || !confirm){
    errorBox.textContent = 'Preencha todos os campos.';
    errorBox.classList.add('show');
    return;
  }
  if(password.length < 6){
    errorBox.textContent = 'A senha precisa ter pelo menos 6 caracteres.';
    errorBox.classList.add('show');
    return;
  }
  if(password !== confirm){
    errorBox.textContent = 'As senhas não coincidem.';
    errorBox.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Criando conta...';
  try{
    await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged cuida de levar para o dashboard automaticamente.
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupPasswordConfirm').value = '';
  }catch(e){
    if(e.code === 'auth/email-already-in-use'){
      errorBox.textContent = 'Já existe uma conta com esse e-mail.';
    }else if(e.code === 'auth/invalid-email'){
      errorBox.textContent = 'Informe um e-mail válido.';
    }else{
      errorBox.textContent = 'Não foi possível criar a conta. Tente novamente.';
    }
    errorBox.classList.add('show');
  }finally{
    btn.disabled = false;
    btn.textContent = 'Criar conta';
  }
}

function daysUntil(dateStr){
  if(!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

function getStatus(v){
  const qty = Number(v.quantity);
  const min = Number(v.min) || 0;
  const isInsumo = v.category === 'insumo';
  const days = isInsumo ? null : daysUntil(v.expiry);
  if(days !== null && days < 0) return 'crit';
  if(qty <= 0) return 'crit';
  if(days !== null && days <= 30) return 'crit';
  if(qty < min) return 'warn';
  if(days !== null && days <= 60) return 'warn';
  return 'ok';
}

function statusLabel(status, v){
  const isInsumo = v.category === 'insumo';
  const days = isInsumo ? null : daysUntil(v.expiry);
  if(days !== null && days < 0) return 'Vencido';
  if(Number(v.quantity) <= 0) return 'Sem estoque';
  if(status === 'crit') return 'Vence em breve';
  if(status === 'warn' && Number(v.quantity) < Number(v.min)) return 'Estoque baixo';
  if(status === 'warn') return 'Atenção validade';
  return 'Disponível';
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ---- Sincronização em tempo real com o Firestore (só depois do login) ----
function subscribeToVaccines(){
  if(unsubscribeVaccines) return;
  document.getElementById('syncText').textContent = 'conectando ao banco de dados...';
  unsubscribeVaccines = onSnapshot(vaccinesCol, snapshot => {
    vaccines = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    document.getElementById('syncDot').classList.remove('off');
    document.getElementById('syncText').textContent = 'sincronizado com a equipe';
    document.getElementById('connBanner').classList.remove('show');
    document.getElementById('lastUpdate').textContent = 'atualizado às ' + new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    render();
  }, error => {
    console.error(error);
    document.getElementById('syncDot').classList.add('off');
    document.getElementById('syncText').textContent = 'erro de conexão';
    document.getElementById('connBanner').classList.add('show');
  });
}

function render(){
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filter = document.getElementById('filterStatus').value;
  const categoryFilter = document.getElementById('filterCategory').value;
  const grid = document.getElementById('grid');

  let list = vaccines.filter(v => (v.name||'').toLowerCase().includes(search));
  if(filter !== 'all') list = list.filter(v => getStatus(v) === filter);
  if(categoryFilter !== 'all') list = list.filter(v => (v.category || 'imuno') === categoryFilter);

  let counts = {ok:0, warn:0, crit:0};
  vaccines.forEach(v => counts[getStatus(v)]++);
  document.getElementById('statTotal').textContent = vaccines.length;
  document.getElementById('statOk').textContent = counts.ok;
  document.getElementById('statWarn').textContent = counts.warn;
  document.getElementById('statCrit').textContent = counts.crit;

  if(list.length === 0){
    grid.innerHTML = `<div class="empty">
      <h3>${vaccines.length === 0 ? 'Nenhum item cadastrado ainda' : 'Nada encontrado'}</h3>
      <p>${vaccines.length === 0 ? 'Adicione o primeiro item para começar a monitorar o estoque.' : 'Tente ajustar a busca ou os filtros.'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(v => {
    const status = getStatus(v);
    const isInsumo = v.category === 'insumo';
    const days = isInsumo ? null : daysUntil(v.expiry);
    const min = Number(v.min) || 1;
    const fillPct = Math.max(4, Math.min(100, Math.round((Number(v.quantity) / (min * 2 || 1)) * 100)));
    const fillColor = status === 'crit' ? 'var(--critical)' : status === 'warn' ? 'var(--warning)' : 'var(--ok)';
    let expiryText = '—';
    let expiryClass = '';
    if(!isInsumo && v.expiry){
      const d = new Date(v.expiry + 'T00:00:00');
      expiryText = d.toLocaleDateString('pt-BR');
      if(days < 0){ expiryText += ' (vencida)'; expiryClass = 'crit'; }
      else if(days <= 30){ expiryText += ` (${days}d)`; expiryClass = 'crit'; }
      else if(days <= 60){ expiryText += ` (${days}d)`; expiryClass = 'warn'; }
    }
    const unitLabel = v.unit ? v.unit.toLowerCase() : 'un';
    return `
    <div class="card">
      <div class="vial"><div class="vial-fill" style="height:${fillPct}%; background:${fillColor};"></div></div>
      <div class="card-body">
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(v.name)}</div>
            <div class="card-kind">${isInsumo ? 'Insumo' : 'Imunobiológico'}</div>
          </div>
          <span class="badge ${status}">${statusLabel(status, v)}</span>
        </div>
        <div class="card-meta">
          <div class="meta-row"><span>Estoque</span><span class="val ${Number(v.quantity) < Number(v.min) ? 'warn' : ''} mono">${v.quantity} ${unitLabel} ${v.min ? '(mín. ' + v.min + ')' : ''}</span></div>
          ${!isInsumo ? `<div class="meta-row"><span>Validade</span><span class="val ${expiryClass} mono">${expiryText}</span></div>` : ''}
          ${v.lot ? `<div class="meta-row"><span>Lote</span><span class="val mono">${escapeHtml(v.lot)}</span></div>` : ''}
        </div>
        <div class="card-actions">
          ${isLoggedIn ? `<div class="icon-btn" data-edit="${v.id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
          </div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-edit]').forEach(el => {
    el.addEventListener('click', () => openEdit(el.getAttribute('data-edit')));
  });
}

// Popula os datalists de sugestões a partir do catálogo da planilha
function populateDatalist(id, catalog){
  const dl = document.getElementById(id);
  dl.innerHTML = catalog.map(it => `<option value="${escapeHtml(it.name)}">`).join('');
}
populateDatalist('imunoSuggestions', IMUNO_CATALOG);
populateDatalist('insumoSuggestions', INSUMO_CATALOG);

function updateFormForCategory(){
  const cat = document.getElementById('fCategory').value;
  document.getElementById('fName').setAttribute('list', cat === 'insumo' ? 'insumoSuggestions' : 'imunoSuggestions');
  document.getElementById('expiryField').style.display = cat === 'insumo' ? 'none' : 'block';
}
document.getElementById('fCategory').addEventListener('change', updateFormForCategory);

// Ao digitar/selecionar um nome que existe no catálogo, preenche a unidade automaticamente
document.getElementById('fName').addEventListener('input', () => {
  const name = document.getElementById('fName').value;
  if(CATALOG_BY_NAME[name]){
    document.getElementById('fUnit').value = CATALOG_BY_NAME[name];
  }
});

function openAdd(){
  document.getElementById('modalTitle').textContent = 'Adicionar item';
  document.getElementById('editId').value = '';
  document.getElementById('fCategory').value = 'imuno';
  document.getElementById('fName').value = '';
  document.getElementById('fQty').value = '';
  document.getElementById('fMin').value = '';
  document.getElementById('fUnit').value = '';
  document.getElementById('fExpiry').value = '';
  document.getElementById('fLot').value = '';
  document.getElementById('btnDelete').style.display = 'none';
  updateFormForCategory();
  document.getElementById('overlay').classList.add('open');
}

function openEdit(id){
  const v = vaccines.find(x => x.id === id);
  if(!v) return;
  document.getElementById('modalTitle').textContent = 'Editar item';
  document.getElementById('editId').value = v.id;
  document.getElementById('fCategory').value = v.category || 'imuno';
  document.getElementById('fName').value = v.name;
  document.getElementById('fQty').value = v.quantity;
  document.getElementById('fMin').value = v.min;
  document.getElementById('fUnit').value = v.unit || '';
  document.getElementById('fExpiry').value = v.expiry || '';
  document.getElementById('fLot').value = v.lot || '';
  document.getElementById('btnDelete').style.display = 'inline-block';
  updateFormForCategory();
  document.getElementById('overlay').classList.add('open');
}

function closeModal(){
  document.getElementById('overlay').classList.remove('open');
}

async function saveForm(){
  const id = document.getElementById('editId').value;
  const name = document.getElementById('fName').value.trim();
  if(!name){ alert('Informe o nome do item.'); return; }
  const category = document.getElementById('fCategory').value;
  const data = {
    name,
    category,
    quantity: Number(document.getElementById('fQty').value) || 0,
    min: Number(document.getElementById('fMin').value) || 0,
    unit: document.getElementById('fUnit').value.trim(),
    expiry: category === 'insumo' ? '' : document.getElementById('fExpiry').value,
    lot: document.getElementById('fLot').value.trim()
  };
  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  try{
    if(id){
      await updateDoc(doc(db, "vaccines", id), data);
    }else{
      await addDoc(vaccinesCol, data);
    }
    closeModal();
  }catch(e){
    console.error(e);
    alert('Erro ao salvar. Verifique a conexão e as regras do Firestore.');
  }finally{
    btn.disabled = false;
  }
}

async function deleteCurrent(){
  const id = document.getElementById('editId').value;
  if(!id) return;
  if(!confirm('Excluir esta vacina do painel?')) return;
  try{
    await deleteDoc(doc(db, "vaccines", id));
    closeModal();
  }catch(e){
    console.error(e);
    alert('Erro ao excluir. Verifique a conexão e as regras do Firestore.');
  }
}

async function clearAllItems(){
  if(!isLoggedIn) return;
  const total = vaccines.length;
  if(total === 0){
    alert('Não há itens cadastrados para excluir.');
    return;
  }
  if(!confirm(`Isso vai excluir TODOS os ${total} itens cadastrados (imunobiológicos e insumos) para todo mundo que usa este painel. Essa ação não pode ser desfeita. Deseja continuar?`)) return;

  const typed = prompt('Para confirmar, digite EXCLUIR (em maiúsculas):');
  if(typed !== 'EXCLUIR'){
    alert('Confirmação incorreta. Nenhum item foi excluído.');
    return;
  }

  const btn = document.getElementById('btnClearAll');
  btn.disabled = true;
  btn.textContent = 'Excluindo...';
  try{
    const snapshot = await getDocs(vaccinesCol);
    const docs = snapshot.docs;
    // Firestore permite no máximo 500 operações por lote
    for(let i = 0; i < docs.length; i += 450){
      const batch = writeBatch(db);
      docs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    alert('Todos os itens foram excluídos.');
  }catch(e){
    console.error(e);
    alert('Erro ao excluir os itens. Verifique a conexão e as regras do Firestore.');
  }finally{
    btn.disabled = false;
    btn.textContent = 'Excluir todos os itens';
  }
}
document.getElementById('btnClearAll').addEventListener('click', clearAllItems);

document.getElementById('btnAdd').addEventListener('click', openAdd);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnSave').addEventListener('click', saveForm);
document.getElementById('btnDelete').addEventListener('click', deleteCurrent);
document.getElementById('overlay').addEventListener('click', e => { if(e.target.id === 'overlay') closeModal(); });
document.getElementById('searchInput').addEventListener('input', render);
document.getElementById('filterStatus').addEventListener('change', render);
document.getElementById('filterCategory').addEventListener('change', render);