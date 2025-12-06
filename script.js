async function hashText(text){
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b=>b.toString(16).padStart(2,'0')).join('');
}

const USERS_KEY = 'uralsk_users_v1';
const SESSION_KEY = 'uralsk_session_v1';

function loadUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

async function registerUser(username, email, password){
  const users = loadUsers();
  if(users.find(x=>x.email.toLowerCase()===email.toLowerCase())) return {ok:false, error:'Пользователь с таким email уже существует.'};
  const passHash = await hashText(password);
  users.push({id:Date.now(), username, email, passHash});
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({username,email}));
  return {ok:true};
}

async function loginUser(email, password){
  const users = loadUsers();
  const u = users.find(x=>x.email.toLowerCase()===email.toLowerCase());
  if(!u) return {ok:false, error:'Пользователь не найден.'};
  const hash = await hashText(password);
  if(hash !== u.passHash) return {ok:false, error:'Неправильный пароль.'};
  localStorage.setItem(SESSION_KEY, JSON.stringify({username:u.username,email:u.email}));
  return {ok:true};
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  window.location = 'index.html';
}

function currentSession(){
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

// ==== ПРОФИЛЬ. Вставляет приветствие если есть сессия ====
function renderProfileBox(containerId){
  const c = document.getElementById(containerId);
  if(!c) return;
  const s = currentSession();
  if(!s){
    c.innerHTML = `<p>Вы не в системе. <a href="login.html">Войти</a> или <a href="register.html">Зарегистрироваться</a></p>`;
  } else {
    c.innerHTML = `<p>Привет, <b>${escapeHtml(s.username)}</b> (<span class="muted">${escapeHtml(s.email)}</span>) — <button onclick="logout()">Выйти</button></p>`;
  }
}

// ==== Форум (хранится в localStorage) ====
const FORUM_KEY = 'uralsk_forum_v1';
function loadForum(){ return JSON.parse(localStorage.getItem(FORUM_KEY) || '[]'); }
function saveForum(arr){ localStorage.setItem(FORUM_KEY, JSON.stringify(arr)); }
function addForumPost(name, text){
  const arr = loadForum();
  arr.push({id:Date.now(), name, text, likes:0, date: new Date().toLocaleString()});
  saveForum(arr);
  renderForumList('forumList');
}
function likePost(id){
  const arr = loadForum();
  const p = arr.find(x=>x.id===id);
  if(p){ p.likes++; saveForum(arr); renderForumList('forumList'); }
}
function renderForumList(containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  const arr = loadForum().slice().reverse();
  if(arr.length===0){ el.innerHTML = '<p class="muted">Пока сообщений нет — будьте первым!</p>'; return; }
  el.innerHTML = arr.map(p=>`
    <div class="comment">
      <small class="muted">${escapeHtml(p.date)}</small>
      <p><b>${escapeHtml(p.name)}</b></p>
      <p>${escapeHtml(p.text)}</p>
      <p><button class="secondary" onclick="likePost(${p.id})">❤️ ${p.likes}</button></p>
    </div>
  `).join('');
}

// ==== ОТЗЫВЫ (reviews) - рейтинг + текст ====
const REV_KEY = 'uralsk_reviews_v1';
function loadReviews(){ return JSON.parse(localStorage.getItem(REV_KEY) || '[]'); }
function saveReviews(a){ localStorage.setItem(REV_KEY, JSON.stringify(a)); }
function addReview(name, rating, text){
  const arr = loadReviews();
  arr.push({id:Date.now(), name, rating, text, date:new Date().toLocaleDateString()});
  saveReviews(arr); renderReviews('reviewList');
}
function renderReviews(containerId){
  const el = document.getElementById(containerId); if(!el) return;
  const arr = loadReviews().slice().reverse();
  if(arr.length===0){ el.innerHTML = '<p class="muted">Отзывов пока нет</p>'; return; }
  el.innerHTML = arr.map(r=>`
    <div class="comment">
      <p><b>${escapeHtml(r.name)}</b> — ${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)} <small class="muted">(${escapeHtml(r.date)})</small></p>
      <p>${escapeHtml(r.text)}</p>
    </div>
  `).join('');
}

// ==== Рейтинг места (places). Хранится в localStorage как объект {place:rating,...} ====
const PLACE_KEY = 'uralsk_places_rating_v1';
function setPlaceRating(place, stars){
  const obj = JSON.parse(localStorage.getItem(PLACE_KEY) || '{}');
  obj[place]=stars;
  localStorage.setItem(PLACE_KEY, JSON.stringify(obj));
  renderPlaceRating(place);
}
function renderPlaceRating(place){
  const obj = JSON.parse(localStorage.getItem(PLACE_KEY) || '{}');
  const rating = obj[place]||0;
  for(let i=1;i<=5;i++){
    const el = document.getElementById(`${place}-star-${i`);
  }
  // update DOM by class 'active'
  for(let i=1;i<=5;i++){
    const el = document.getElementById(`${place}-star-${i}`);
    if(!el) continue;
    if(i<=rating) el.classList.add('active'); else el.classList.remove('active');
  }
}
function renderAllPlaceRatings(placeIds){
  placeIds.forEach(id=>renderPlaceRating(id));
}

// ==== Новости: простой локальный список (можно позже добавить форму admin) ====
const NEWS = [
  {
    title: 'Открытие обновлённого парка на набережной',
    text: 'Новая зона отдыха набережной у реки Урал с велодорожками и детскими площадками.',
    date: '3 октября 2025',
    img: 'https://cdn.nur.kz/images/1120/a4bf869125361820.jpeg'
  },
  {
    title: 'Фестиваль уральской кухни',
    text: 'Фестиваль национальных блюд, музыки и ремёсел состоится в центре города.',
    date: '28 сентября 2025',
    img: 'https://kazislam.kz/wp-content/uploads/2023/07/oral-meshiti.jpg'
  }
];
function renderNews(containerId){
  const el = document.getElementById(containerId); if(!el) return;
  el.innerHTML = NEWS.map(n=>`
    <div class="card" style="width:100%;display:flex;gap:12px;align-items:center">
      <img src="${n.img}" style="width:220px;height:140px;object-fit:cover;border-radius:8px;margin-left:8px">
      <div class="card-body">
        <h3>${escapeHtml(n.title)}</h3>
        <p>${escapeHtml(n.text)}</p>
        <small class="muted">${escapeHtml(n.date)}</small>
      </div>
    </div>
  `).join('');
}

// ==== Поиск по топ-местам (простой) ====
function searchPlaces(query, containerId){
  const q = (query||'').toLowerCase();
  const list = [
    {id:'cathedral',title:'Кафедральный собор Архангела Михаила', text:'Старинный собор XIX века.'},
    {id:'museum',title:'Западно-Казахстанский областной музей', text:'История региона и экспонаты.'},
    {id:'river',title:'Река Урал', text:'Набережная, прогулки и рыбалка.'}
  ];
  const el = document.getElementById(containerId); if(!el) return;
  const res = list.filter(p=>p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q));
  if(res.length===0) el.innerHTML='<p class="muted">Ничего не найдено</p>';
  else el.innerHTML = res.map(r=>`<div class="card"><div class="card-body"><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.text)}</p></div></div>`).join('');
}

// ==== HELPERS ====
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"'`=\/]/g, function(s){
    return ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'
    })[s];
  });
}