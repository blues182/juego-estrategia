const API_BASE = "http://localhost:3000";

const $ = (id) => document.getElementById(id);

async function createGame() {
  const res = await fetch(`${API_BASE}/games`, { method: 'POST' });
  const json = await res.json();
  if (json.success) {
    $('inputGameId').value = json.gameId;
    renderGame(json.game);
  } else alert('Error creating game');
}

async function loadGame() {
  const id = $('inputGameId').value.trim();
  if (!id) return alert('Introduce Game ID');
  const res = await fetch(`${API_BASE}/games/${id}`);
  const json = await res.json();
  if (json.success) renderGame(json.game);
  else alert(json.error || 'No se pudo cargar');
}

async function saveGame() {
  const id = $('inputGameId').value.trim();
  if (!id) return alert('Introduce Game ID');
  const res = await fetch(`${API_BASE}/games/${id}/save`, { method: 'POST' });
  const json = await res.json();
  if (json.success) alert('Guardado en: ' + json.file);
  else alert(json.error || 'Error guardando');
}

async function tick() {
  const id = $('inputGameId').value.trim();
  if (!id) return alert('Introduce Game ID');
  const res = await fetch(`${API_BASE}/games/${id}/tick`, { method: 'POST' });
  const json = await res.json();
  if (json.success) renderGame(json.gameState || json.game);
  else alert(json.error || 'Error al tick');
}

async function createArmy() {
  const id = $('inputGameId').value.trim();
  if (!id) return alert('Introduce Game ID');
  const owner = $('armyOwner').value.trim();
  const provinceId = $('armyProvince').value.trim();
  const units = $('armyUnits').value.split(',').map(s => ({ typeId: s.trim() })).filter(u => u.typeId);
  const res = await fetch(`${API_BASE}/games/${id}/armies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, provinceId, units })
  });
  const json = await res.json();
  if (json.success) {
    alert('Ejército creado: ' + json.armyId);
    loadGame();
  } else alert(json.error || 'Error creando ejército');
}

async function sendOrder() {
  const id = $('inputGameId').value.trim();
  if (!id) return alert('Introduce Game ID');
  const armyId = $('orderArmyId').value.trim();
  const type = $('orderType').value;
  const target = $('orderTarget').value.trim();
  const body = { armyId, orderType: type };
  if (type === 'move' || type === 'attack') body.targetProvinceId = target;
  const res = await fetch(`${API_BASE}/games/${id}/orders`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json.success) {
    alert('Orden enviada'); loadGame();
  } else alert(json.error || 'Error enviando orden');
}

function renderGame(game) {
  $('gameState').textContent = JSON.stringify(game, null, 2);
}

// Attach events
$('btnCreate').addEventListener('click', createGame);
$('btnLoad').addEventListener('click', loadGame);
$('btnSave').addEventListener('click', saveGame);
$('btnTick').addEventListener('click', tick);
$('btnCreateArmy').addEventListener('click', createArmy);
$('btnSendOrder').addEventListener('click', sendOrder);

// health check
fetch(`${API_BASE}/health`).catch(()=>console.warn('No backend'));
