// ESTADO GLOBAL DO JOGO
const gameState = {
  profile: null,
  points: { vivencia: 0, imaginacao: 0, territorio: 0 },
  missions: {
    world1_m1: false,
    world1_m2: false,
    world1_m3: false,
    lit_fugaz: false,
    tematica: false
  },
  milestone100: false,
  wordChallengeCompleted: false,
  cityMazeCompleted: false,
  currentWordChallenge: null,
  currentScreen: 'splash',
  activeNpcId: null,
  controlsBlocked: false, // Flag to block player movement
  visitedBiomeRewards: {},

  // posi\u00e7\u00e3o do avatar no mapa (coordenadas de grid)
  playerPosition: { x: 10, y: 10 }, // Start position adjusted for larger map

  // NPCs (Static positions for now)
  npcs: [
    { x: 2, y: 2, type: 'npc-vivencia', msg: 'Aqui a vida acontece nos detalhes.' },
    { x: 10, y: 5, type: 'npc-imaginacao', msg: 'O laborat\u00f3rio \u00e9 onde o sonho ganha forma.' },
    { x: 2, y: 9, type: 'npc-territorio', msg: 'Nossa voz precisa ocupar todos os espa\u00e7os.' },
    { x: 17, y: 9, type: 'npc-fugaz', msg: 'Psst... viu algo passar por aqui?' }
  ],

  // textos guardados das miss\u00f5es
  m1_fragments: [],
  m1_memory_target: [],
  m1_memory_unlocked: false,
  m1_text: '',
  m2_lab_choices: { pulse: '', texture: '', light: '' },
  m2_lab_target: { pulse: '', texture: '', light: '' },
  m2_lab_unlocked: false,
  m2_image_poem: '',
  m2_user_verse: '',
  m3_voice_choices: { rhythm: '', tone: '', gesture: '' },
  m3_voice_target: { rhythm: '', tone: '', gesture: '' },
  m3_voice_unlocked: false,
  m3_new_verse: '',
  lit_fugaz_text: '',
  tematica_text: '',
  tematica_chosen: ''
};

// ========== MAPA EXPANDIDO (20x12) ========== //
const mapWidth = 20;
const mapHeight = 12;

// Cada linha = y, cada coluna = x
// Legend:
// 'decor': Wall/Border
// 'empty': Grass/Path
// 'start': Start Point
// 'm1', 'lab', 'm3', 'lit', 'tematica': Missions
// 'laje', 'feira', 'quadra', 'igreja', 'ponto': Biomes
const mapTiles = [
  // y=0
  ['decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor'],
  // y=1
  ['decor', 'laje', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'tematica', 'empty', 'decor'],
  // y=2
  ['decor', 'empty', 'm1', 'empty', 'empty', 'laje', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=3
  ['decor', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=4
  ['decor', 'empty', 'empty', 'empty', 'feira', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=5
  ['decor', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'lab', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=6
  ['decor', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=7
  ['decor', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'quadra', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=8
  ['decor', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=9
  ['decor', 'empty', 'm3', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'igreja', 'empty', 'lit', 'empty', 'decor'],
  // y=10
  ['decor', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'start', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'decor'],
  // y=11
  ['decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor', 'decor']
];

function getTotalPoints() {
  return gameState.points.vivencia + gameState.points.imaginacao + gameState.points.territorio;
}

function showToast(message, variant = 'default') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${variant}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 260);
  }, 2200);
}

function formatPointReward(reward) {
  const parts = [];
  if (reward.vivencia) parts.push(`+${reward.vivencia} Viv\u00eancia`);
  if (reward.imaginacao) parts.push(`+${reward.imaginacao} Imagina\u00e7\u00e3o`);
  if (reward.territorio) parts.push(`+${reward.territorio} Territ\u00f3rio`);
  return parts.join(' \u2022 ');
}

function awardPoints(reward, message, variant = 'reward') {
  if (reward.vivencia) gameState.points.vivencia += reward.vivencia;
  if (reward.imaginacao) gameState.points.imaginacao += reward.imaginacao;
  if (reward.territorio) gameState.points.territorio += reward.territorio;

  updateHUD();

  if (message) {
    showToast(message, variant);
  }
}

const missionFlow = [
  {
    id: 'world1_m1',
    tileType: 'm1',
    screen: 'world1_m1',
    coords: { x: 2, y: 2 },
    shortTitle: 'Dona Cida',
    title: 'Despertar da Viv\u00eancia',
    objective: 'V\u00e1 at\u00e9 Dona Cida e registre um fragmento da sua vida.',
    lockedMessage: 'Comece sua jornada falando com Dona Cida.',
    dialog: 'Dona Cida: "Ei, meu filho! Senta aqui. A vida \u00e9 feita de detalhes, n\u00e9? Me conta um..."'
  },
  {
    id: 'world1_m2',
    tileType: 'lab',
    screen: 'world1_m2',
    coords: { x: 10, y: 5 },
    shortTitle: 'Laborat\u00f3rio',
    title: 'Mapa Simb\u00f3lico do Sentir',
    objective: 'Siga at\u00e9 o laborat\u00f3rio e transforme mem\u00f3ria em imagem-poema.',
    lockedMessage: 'Antes de ir ao laborat\u00f3rio, conclua a fala com Dona Cida.',
    dialog: 'Cau\u00e3: "Opa! Aqui no laborat\u00f3rio a gente mistura sonho com realidade. Bora criar?"'
  },
  {
    id: 'world1_m3',
    tileType: 'm3',
    screen: 'world1_m3',
    coords: { x: 2, y: 9 },
    shortTitle: 'Z\u00e9 do Bon\u00e9',
    title: 'Inscri\u00e7\u00e3o Territorial da Voz',
    objective: 'Encontre Z\u00e9 do Bon\u00e9 e reescreva seu verso com o territ\u00f3rio.',
    lockedMessage: 'Sua voz ainda precisa passar pelo laborat\u00f3rio antes de ganhar territ\u00f3rio.',
    dialog: 'Z\u00e9 do Bon\u00e9: "A\u00ed, a quebrada tem voz! Mas ela precisa ocupar o muro, a rua, o papel. Manda a letra!"'
  },
  {
    id: 'lit_fugaz',
    tileType: 'lit',
    screen: 'lit_fugaz',
    coords: { x: 17, y: 9 },
    shortTitle: 'Encontro Fugaz',
    title: 'Flash no Territ\u00f3rio',
    objective: 'Procure o vulto \u00e0 direita do mapa e escreva a cena antes que suma.',
    lockedMessage: 'Feche primeiro o arco principal de viv\u00eancia, imagina\u00e7\u00e3o e voz.',
    dialog: 'Viajante: "Psst... viu aquele vulto? Foi r\u00e1pido, n\u00e9? Escreve antes que suma da mem\u00f3ria."'
  },
  {
    id: 'tematica',
    tileType: 'tematica',
    screen: 'mission_tematica',
    coords: { x: 17, y: 1 },
    shortTitle: 'Biblioteca Tem\u00e1tica',
    title: 'Desafio Tem\u00e1tico',
    objective: 'Visite a biblioteca tem\u00e1tica e escolha um tema para escrever.',
    lockedMessage: 'A biblioteca tem\u00e1tica abre depois que voc\u00ea explorar o encontro fugaz.',
    dialog: 'Bibliotec\u00e1ria: "Bem-vindo! Aqui guardamos saberes de todos os cantos. Escolha um tema e se inspire."'
  }
];

const npcEncounterConfig = {
  world1_m1: {
    npcType: 'npc-vivencia',
    portrait: 'assets/npcs/dona-cida.svg',
    name: 'Dona Cida',
    badge: 'D',
    kicker: 'Memoria viva',
    prompt: 'Chegue perto e escute uma lembranca antes de abrir o caderno.',
    actionLabel: 'Ouvir e escrever',
    completedText: 'Dona Cida sorri. A memoria dela agora faz parte do seu mapa.',
    nearbyText: 'Dona Cida esta pronta para conversar.'
  },
  world1_m2: {
    npcType: 'npc-imaginacao',
    portrait: 'assets/npcs/caua.svg',
    name: 'Caua',
    badge: 'C',
    kicker: 'Laboratorio do sentir',
    prompt: 'Ative o laboratorio para misturar imagem, ambiente e verso.',
    actionLabel: 'Entrar no laboratorio',
    completedText: 'Caua aponta para os simbolos. A mistura agora responde ao seu verso.',
    nearbyText: 'Caua acenou para voce do laboratorio.'
  },
  world1_m3: {
    npcType: 'npc-territorio',
    portrait: 'assets/npcs/ze-do-bone.svg',
    name: 'Ze do Bone',
    badge: 'Z',
    kicker: 'Voz no territorio',
    prompt: 'Pare no muro e prepare sua fala antes de inscrever a rua no verso.',
    actionLabel: 'Pegar o spray poetico',
    completedText: 'Ze do Bone bate no peito. Sua voz ja ficou marcada no territorio.',
    nearbyText: 'Ze do Bone ja puxou assunto no canto do muro.'
  },
  lit_fugaz: {
    npcType: 'npc-fugaz',
    portrait: 'assets/npcs/viajante.svg',
    name: 'Viajante',
    badge: 'V',
    kicker: 'Cena fugaz',
    prompt: 'Aproxime-se rapido e capture a cena antes que ela desapareca.',
    actionLabel: 'Seguir o vulto',
    completedText: 'O vulto virou lembranca escrita. Ainda ha rastro no ar.',
    nearbyText: 'Um vulto atravessou o mapa e deixou um rastro.'
  },
  tematica: {
    npcType: 'npc-biblioteca',
    portrait: 'assets/npcs/bibliotecaria.svg',
    name: 'Bibliotecaria',
    badge: 'B',
    kicker: 'Acervo tematico',
    prompt: 'Toque a estante e escolha uma trilha para puxar novas palavras.',
    actionLabel: 'Abrir a estante',
    completedText: 'A bibliotecaria marcou sua visita e deixou o acervo aberto.',
    nearbyText: 'A bibliotecaria separou um livro para voce.'
  }
};

const MEMORY_FRAGMENTS = [
  'o cheiro do cafe cedo',
  'o eco do onibus na subida',
  'a luz da janela na madrugada',
  'o portao batendo no fim da tarde',
  'o barulho da feira montando',
  'o passo apressado na viela'
];

const LAB_STATIONS = {
  pulse: ['eletrico', 'manso', 'cortado', 'febril'],
  texture: ['ferrugem', 'neblina', 'cimento', 'poeira dourada'],
  light: ['azul de neon', 'laranja da tarde', 'brilho do poste', 'sombra da laje']
};

const VOICE_CHOICES = {
  rhythm: ['grave', 'cortado', 'arrastado', 'marcado no peito'],
  tone: ['manifesto', 'intimo', 'coletivo', 'afronta poetica'],
  gesture: ['palma no portao', 'passo no beco', 'spray no muro', 'dedo apontando o horizonte']
};

function pickRandomItems(options, count) {
  const clone = [...options];
  const selected = [];

  while (clone.length && selected.length < count) {
    const index = Math.floor(Math.random() * clone.length);
    selected.push(clone.splice(index, 1)[0]);
  }

  return selected;
}

function ensureMissionMicroTargets() {
  if (!Array.isArray(gameState.m1_memory_target) || gameState.m1_memory_target.length !== 2) {
    gameState.m1_memory_target = pickRandomItems(MEMORY_FRAGMENTS, 2);
  }

  if (!gameState.m2_lab_target || !gameState.m2_lab_target.pulse || !gameState.m2_lab_target.texture || !gameState.m2_lab_target.light) {
    gameState.m2_lab_target = {
      pulse: pickRandomItems(LAB_STATIONS.pulse, 1)[0],
      texture: pickRandomItems(LAB_STATIONS.texture, 1)[0],
      light: pickRandomItems(LAB_STATIONS.light, 1)[0]
    };
  }

  if (!gameState.m3_voice_target || !gameState.m3_voice_target.rhythm || !gameState.m3_voice_target.tone || !gameState.m3_voice_target.gesture) {
    gameState.m3_voice_target = {
      rhythm: pickRandomItems(VOICE_CHOICES.rhythm, 1)[0],
      tone: pickRandomItems(VOICE_CHOICES.tone, 1)[0],
      gesture: pickRandomItems(VOICE_CHOICES.gesture, 1)[0]
    };
  }
}

function sameItems(first, second) {
  if (first.length !== second.length) return false;
  const a = [...first].sort();
  const b = [...second].sort();
  return a.every((item, index) => item === b[index]);
}

function getNpcRoster() {
  const roster = gameState.npcs
    .map((npc) => ({
      ...npc,
      missionId: npc.missionId || {
        'npc-vivencia': 'world1_m1',
        'npc-imaginacao': 'world1_m2',
        'npc-territorio': 'world1_m3',
        'npc-fugaz': 'lit_fugaz',
        'npc-biblioteca': 'tematica'
      }[npc.type]
    }))
    .filter((npc) => npc.missionId);

  if (!roster.some((npc) => npc.missionId === 'tematica')) {
    roster.push({
      x: 17,
      y: 1,
      missionId: 'tematica',
      type: 'npc-biblioteca',
      msg: 'Historias dormem aqui ate alguem puxar um livro.'
    });
  }

  return roster;
}

function getNpcByMission(missionId) {
  return getNpcRoster().find((npc) => npc.missionId === missionId) || null;
}

// ATUALIZA HUD (pontua\u00e7\u00e3o)
function updateHUD() {
  const v = document.getElementById('p-vivencia');
  const i = document.getElementById('p-imaginacao');
  const t = document.getElementById('p-territorio');
  const progressFill = document.getElementById('hud-progress-fill');
  const progressLabel = document.getElementById('hud-progress-label');
  if (v && i && t) {
    v.textContent = gameState.points.vivencia;
    i.textContent = gameState.points.imaginacao;
    t.textContent = gameState.points.territorio;
  }

  // Check for 100 points milestone
  const totalPoints = getTotalPoints();
  const progressPercent = Math.min(100, Math.round((totalPoints / 100) * 100));

  if (progressFill) {
    progressFill.style.width = `${progressPercent}%`;
  }

  if (progressLabel) {
    progressLabel.textContent = totalPoints >= 100
      ? 'Marco de 100 pontos alcan\u00e7ado'
      : `${totalPoints}/100 pontos`;
  }

  if (totalPoints >= 100 && !gameState.milestone100) {
    gameState.milestone100 = true;
    saveGame();
    showTransitionToWordChallenge();
    return;
  }

  saveGame();
}

// ========== SISTEMA DE DI\u00c3\u0081LOGO ========== //
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildDialogMarkup(content) {
  if (typeof content === 'string') {
    return `
      <div class="dialog-copy">
        <p class="dialog-text">${escapeHtml(content)}</p>
      </div>
      <div class="dialog-actions">
        <button type="button" data-dialog-primary>Continuar</button>
      </div>
    `;
  }

  const kicker = content.kicker ? `<p class="dialog-kicker">${escapeHtml(content.kicker)}</p>` : '';
  const title = content.name ? `<h3 class="dialog-name">${escapeHtml(content.name)}</h3>` : '';
  const portrait = content.portrait
    ? `<div class="dialog-portrait-frame ${escapeHtml(content.themeClass || '')}"><img class="dialog-portrait" src="${escapeHtml(content.portrait)}" alt="${escapeHtml(content.name || 'Personagem')}" /></div>`
    : '';
  const aside = content.prompt ? `<p class="dialog-aside">${escapeHtml(content.prompt)}</p>` : '';

  return `
    <div class="dialog-character ${escapeHtml(content.themeClass || '')}">
      ${portrait}
      <div class="dialog-copy">
        ${kicker}
        ${title}
        <p class="dialog-text">${escapeHtml(content.text || '')}</p>
        ${aside}
      </div>
    </div>
    <div class="dialog-actions">
      <button type="button" data-dialog-primary>${escapeHtml(content.actionLabel || 'Continuar')}</button>
    </div>
  `;
}

function showDialog(content, onDismiss) {
  let overlay = document.getElementById('dialog-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dialog-overlay';
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = '<div class="dialog-box"></div>';
    document.body.appendChild(overlay);
  }

  const box = overlay.querySelector('.dialog-box');
  box.className = `dialog-box ${typeof content === 'object' && content && content.themeClass ? content.themeClass : ''}`.trim();
  box.innerHTML = buildDialogMarkup(content);
  overlay.style.display = 'flex';

  // Remove listener anterior para evitar m\u00faltiplos disparos
  const dismiss = () => {
    overlay.style.display = 'none';
    if (onDismiss) onDismiss();
  };

  overlay.onclick = (event) => {
    if (event.target === overlay) {
      dismiss();
    }
  };

  box.onclick = (event) => {
    event.stopPropagation();
  };

  const primaryButton = box.querySelector('[data-dialog-primary]');
  if (primaryButton) {
    primaryButton.onclick = dismiss;
  }
}

// Helper function to navigate safely (respects milestone transition)
function safeNavigateToMap() {
  if (gameState.controlsBlocked) {
    return;
  }
  goToMap();
}

// ========== 100 POINTS MILESTONE TRANSITION ========== //

function showTransitionToWordChallenge() {
  // Block all game controls immediately
  blockControls();

  // Create a full-screen overlay that takes over everything
  const overlay = document.createElement('div');
  overlay.id = 'milestone-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.animation = 'fadeIn 0.5s ease-in';

  overlay.innerHTML = `
    <div class="center transition-scene" style="background: var(--bg-color); padding: 40px; border: 4px solid var(--border-color); max-width: 600px; box-shadow: 0 0 50px rgba(255, 222, 0, 0.5);">
      <div id="transition-content">
        <h1>\ud83c\udf89 CONQUISTA DESBLOQUEADA! \ud83c\udf89</h1>
        <p>Voc\u00ea alcan\u00e7ou 100 pontos!</p>
        <div id="player-transform" class="player-transform">
          <div class="player-small">\u270d\ufe0f</div>
        </div>
        <p id="transform-text"></p>
      </div>
    </div>
  `;

  // Append overlay to body (not app) so it's truly unavoidable
  document.body.appendChild(overlay);

  // Animate transformation
  setTimeout(() => {
    const textEl = document.getElementById('transform-text');
    if (textEl) textEl.textContent = 'O escritor ganha um l\u00e1pis m\u00e1gico...';
  }, 1000);

  setTimeout(() => {
    const playerEl = document.querySelector('.player-small');
    if (playerEl) {
      playerEl.classList.add('growing');
      playerEl.textContent = '\u270d\ufe0f\u270f\ufe0f';
    }
  }, 2500);

  setTimeout(() => {
    const textEl = document.getElementById('transform-text');
    if (textEl) textEl.textContent = '...e cresce com o poder da escrita!';
  }, 3000);

  setTimeout(() => {
    // Remove overlay before transitioning
    const milestoneOverlay = document.getElementById('milestone-overlay');
    if (milestoneOverlay) {
      milestoneOverlay.remove();
    }
    fadeToWordChallenge();
  }, 5000);
}

function fadeToWordChallenge() {
  const app = document.getElementById('app');
  app.classList.add('fade-out');

  setTimeout(() => {
    app.classList.remove('fade-out');
    unblockControls();
    renderWordChallenge();
  }, 1000);
}

// ========== WORD CHALLENGE GAME ========== //

const challengeWords = [
  'Poesia', 'Viv\u00eancias', 'Criatividade', 'prosa',
  'cordel', 'Sentimentos', 'territ\u00f3rio', 'voz', 'escrita'
];

function renderWordChallenge() {
  clearWordTimer();
  setCurrentScreen('word_challenge');
  unblockControls();

  // Select a random word if not already set
  if (!gameState.currentWordChallenge) {
    const randomIndex = Math.floor(Math.random() * challengeWords.length);
    gameState.currentWordChallenge = challengeWords[randomIndex];
    saveGame();
  }

  const word = gameState.currentWordChallenge;
  const scrambled = scrambleWord(word);

  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="form word-challenge">
      <h2>\ud83e\udde9 Desafio das Palavras Ocultas</h2>
      <p>Organize as letras para formar a palavra correta!</p>
      <p class="hint">Dica: Relacionado \u00e0 literatura e territ\u00f3rio</p>
      
      <p class="maze-reward">Recompensa: +15 Imagina\u00e7\u00e3o e acesso ao Labirinto da Cidade</p>
      <div class="timer" id="timer">
        <span>\u23f1\ufe0f Tempo: </span>
        <span id="time-remaining">60</span>
        <span> segundos</span>
      </div>
      
      <div class="scrambled-word">${scrambled.split('').join(' ')}</div>
      
      <label>Digite a palavra:
        <input id="word-input" type="text" placeholder="Digite aqui..." autocomplete="off" />
      </label>
      
      <button id="btn-submit-word">Enviar Resposta</button>
      <div id="word-feedback"></div>
    </section>
  `;

  // Start countdown
  let timeLeft = 60;
  const timerInterval = setInterval(() => {
    timeLeft--;
    const timeEl = document.getElementById('time-remaining');
    if (timeEl) {
      timeEl.textContent = timeLeft;
      if (timeLeft <= 10) {
        timeEl.style.color = 'red';
        timeEl.style.fontWeight = 'bold';
      }
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleWordTimeout();
    }
  }, 1000);

  // Submit button handler
  document.getElementById('btn-submit-word').onclick = () => {
    clearInterval(timerInterval);
    checkWordAnswer();
  };

  // Allow Enter key to submit
  document.getElementById('word-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      clearInterval(timerInterval);
      checkWordAnswer();
    }
  });

  // Store timer interval in case we need to clear it
  gameState.wordTimerInterval = timerInterval;
}

function scrambleWord(word) {
  const arr = word.split('');
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

function checkWordAnswer() {
  const input = document.getElementById('word-input').value.trim();
  const correct = gameState.currentWordChallenge;

  if (input.toLowerCase() === correct.toLowerCase()) {
    // Success!
    gameState.wordChallengeCompleted = true;
    gameState.currentWordChallenge = null;
    awardPoints({ imaginacao: 15 }, 'Palavra revelada! +15 Imagina\u00e7\u00e3o', 'success');
    saveGame();
    showDialog('\ud83c\udf8a Parab\u00e9ns! Voc\u00ea acertou a palavra!', () => {
      transitionToCityMaze();
    });
  } else {
    // Wrong answer
    showDialog('\u274c Ops! Palavra incorreta. Tente novamente com outra palavra.', () => {
      gameState.currentWordChallenge = null; // Reset to get a new word
      saveGame();
      renderWordChallenge();
    });
  }
}

function handleWordTimeout() {
  showDialog('\u23f0 Tempo esgotado! Vamos tentar com outra palavra.', () => {
    gameState.currentWordChallenge = null; // Reset to get a new word
    saveGame();
    renderWordChallenge();
  });
}

// ========== CITY MAZE LEVEL ========== //

function transitionToCityMaze() {
  clearWordTimer();
  const app = document.getElementById('app');
  app.classList.add('fade-out');

  setTimeout(() => {
    app.classList.remove('fade-out');
    renderCityMaze();
  }, 1000);
}

function renderCityMaze() {
  setCurrentScreen('city_maze');
  unblockControls();
  const mazeRewardText = gameState.cityMazeCompleted
    ? 'Recompensa j\u00e1 coletada: voc\u00ea j\u00e1 conquistou este territ\u00f3rio.'
    : 'Recompensa ao concluir: +10 Territ\u00f3rio e +5 Imagina\u00e7\u00e3o';

  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="city-maze">
      <h2>\ud83c\udfd9\ufe0f Labirinto da Cidade</h2>
      <p>Voc\u00ea entrou em um novo territ\u00f3rio urbano!</p>
      <p class="hint">Explore as ruas da cidade. Novos desafios vir\u00e3o em breve...</p>
      
      <div class="maze-status">
        <p>Voc\u00ea entrou em um novo territ\u00f3rio urbano. Encontre a estrela no canto inferior direito.</p>
        <p class="maze-reward">${mazeRewardText}</p>
        <p class="hint">Use as setas para atravessar as ruas abertas e evitar os pr\u00e9dios.</p>
      </div>
      <div class="maze-container">
        <div class="maze-grid" id="city-maze-grid"></div>
      </div>
      
      <div class="controls">
        <button id="btn-maze-up">\u2191</button>
        <div style="display:flex; gap:4px;">
          <button id="btn-maze-left">\u2190</button>
          <button id="btn-maze-down">\u2193</button>
          <button id="btn-maze-right">\u2192</button>
        </div>
      </div>
      
      <div style="text-align:center; margin-top:20px;">
        <button id="btn-back-to-map">Voltar ao Territ\u00f3rio Original</button>
      </div>
    </section>
  `;

  drawCityMaze();

  // Movement controls
  document.getElementById('btn-maze-up').onclick = () => moveMaze(0, -1);
  document.getElementById('btn-maze-down').onclick = () => moveMaze(0, 1);
  document.getElementById('btn-maze-left').onclick = () => moveMaze(-1, 0);
  document.getElementById('btn-maze-right').onclick = () => moveMaze(1, 0);

  document.getElementById('btn-back-to-map').onclick = () => goToMap();
}

// Simple city maze (10x10 grid)
const cityMazeData = [
  ['\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83d\udee3\ufe0f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83d\udee3\ufe0f', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udf1f', '\ud83c\udfe2'],
  ['\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2', '\ud83c\udfe2']
];

let mazePlayerPos = { x: 1, y: 1 }; // Start position in maze
const STORAGE_KEY = 'jornadas-do-territorio-save-v1';

function saveGame() {
  const serializableState = {
    profile: gameState.profile,
    points: gameState.points,
    missions: gameState.missions,
    milestone100: gameState.milestone100,
    wordChallengeCompleted: gameState.wordChallengeCompleted,
    cityMazeCompleted: gameState.cityMazeCompleted,
    currentWordChallenge: gameState.currentWordChallenge,
    currentScreen: gameState.currentScreen,
    playerPosition: gameState.playerPosition,
    visitedBiomeRewards: gameState.visitedBiomeRewards,
    m1_fragments: gameState.m1_fragments,
    m1_memory_target: gameState.m1_memory_target,
    m1_memory_unlocked: gameState.m1_memory_unlocked,
    m1_text: gameState.m1_text,
    m2_lab_choices: gameState.m2_lab_choices,
    m2_lab_target: gameState.m2_lab_target,
    m2_lab_unlocked: gameState.m2_lab_unlocked,
    m2_image_poem: gameState.m2_image_poem,
    m2_user_verse: gameState.m2_user_verse,
    m3_voice_choices: gameState.m3_voice_choices,
    m3_voice_target: gameState.m3_voice_target,
    m3_voice_unlocked: gameState.m3_voice_unlocked,
    m3_new_verse: gameState.m3_new_verse,
    lit_fugaz_text: gameState.lit_fugaz_text,
    tematica_text: gameState.tematica_text,
    tematica_chosen: gameState.tematica_chosen,
    mazePlayerPos
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return false;

    gameState.profile = saved.profile || null;
    gameState.points = saved.points || { vivencia: 0, imaginacao: 0, territorio: 0 };
    gameState.missions = saved.missions || {
      world1_m1: false,
      world1_m2: false,
      world1_m3: false,
      lit_fugaz: false,
      tematica: false
    };
    gameState.milestone100 = !!saved.milestone100;
    gameState.wordChallengeCompleted = !!saved.wordChallengeCompleted;
    gameState.cityMazeCompleted = !!saved.cityMazeCompleted;
    gameState.currentWordChallenge = saved.currentWordChallenge || null;
    gameState.currentScreen = saved.currentScreen || 'splash';
    gameState.playerPosition = saved.playerPosition || { x: 10, y: 10 };
    gameState.controlsBlocked = false;
    gameState.visitedBiomeRewards = saved.visitedBiomeRewards || {};
    gameState.m1_fragments = Array.isArray(saved.m1_fragments) ? saved.m1_fragments : [];
    gameState.m1_memory_target = Array.isArray(saved.m1_memory_target) ? saved.m1_memory_target : [];
    gameState.m1_memory_unlocked = !!saved.m1_memory_unlocked;
    gameState.m1_text = saved.m1_text || '';
    gameState.m2_lab_choices = saved.m2_lab_choices || { pulse: '', texture: '', light: '' };
    gameState.m2_lab_target = saved.m2_lab_target || { pulse: '', texture: '', light: '' };
    gameState.m2_lab_unlocked = !!saved.m2_lab_unlocked;
    gameState.m2_image_poem = saved.m2_image_poem || '';
    gameState.m2_user_verse = saved.m2_user_verse || '';
    gameState.m3_voice_choices = saved.m3_voice_choices || { rhythm: '', tone: '', gesture: '' };
    gameState.m3_voice_target = saved.m3_voice_target || { rhythm: '', tone: '', gesture: '' };
    gameState.m3_voice_unlocked = !!saved.m3_voice_unlocked;
    gameState.m3_new_verse = saved.m3_new_verse || '';
    gameState.lit_fugaz_text = saved.lit_fugaz_text || '';
    gameState.tematica_text = saved.tematica_text || '';
    gameState.tematica_chosen = saved.tematica_chosen || '';

    if (saved.mazePlayerPos && typeof saved.mazePlayerPos.x === 'number' && typeof saved.mazePlayerPos.y === 'number') {
      mazePlayerPos = saved.mazePlayerPos;
    } else {
      mazePlayerPos = { x: 1, y: 1 };
    }

    return true;
  } catch (err) {
    console.error('Erro ao carregar save local:', err);
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function clearWordTimer() {
  if (gameState.wordTimerInterval) {
    clearInterval(gameState.wordTimerInterval);
    gameState.wordTimerInterval = null;
  }
}

function setCurrentScreen(screenId) {
  gameState.currentScreen = screenId;
  saveGame();
}

function blockControls() {
  gameState.controlsBlocked = true;
  saveGame();
}

function unblockControls() {
  gameState.controlsBlocked = false;
  saveGame();
}

function isDialogOpen() {
  const overlay = document.getElementById('dialog-overlay');
  return !!overlay && overlay.style.display === 'flex';
}

function isTypingField(target) {
  if (!target) return false;
  const tagName = target.tagName ? target.tagName.toLowerCase() : '';
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

function navigateTo(screenId) {
  clearWordTimer();

  if (screenId === 'word_challenge') {
    renderWordChallenge();
    return;
  }

  if (screenId === 'city_maze') {
    renderCityMaze();
    return;
  }

  if (screenId === 'library') {
    showLibrary();
    return;
  }

  renderScreen(screenId);
}

function goToMap() {
  unblockControls();
  navigateTo('world_map');
}

function getResumeScreen() {
  if (!gameState.profile) {
    if (gameState.currentScreen === 'create_profile') return 'create_profile';
    return 'splash';
  }

  if (gameState.milestone100 && !gameState.wordChallengeCompleted) {
    return 'word_challenge';
  }

  if (gameState.currentScreen === 'city_maze') {
    return 'city_maze';
  }

  if (gameState.currentScreen === 'library') {
    return 'library';
  }

  if (gameState.currentScreen && gameState.currentScreen !== 'splash') {
    return gameState.currentScreen;
  }

  return 'world_map';
}

function getMapTileSize() {
  if (window.innerWidth <= 480) {
    return Math.max(14, Math.min(20, Math.floor((window.innerWidth - 52) / mapWidth)));
  }

  if (window.innerWidth <= 768) {
    return Math.max(18, Math.min(28, Math.floor((window.innerWidth - 88) / mapWidth)));
  }

  return 32;
}

function getMazeCellSize() {
  const availableWidth = window.innerWidth <= 480 ? window.innerWidth - 56 : window.innerWidth - 120;
  return Math.max(24, Math.min(40, Math.floor(availableWidth / 10)));
}

function getMissionById(missionId) {
  return missionFlow.find((mission) => mission.id === missionId) || null;
}

function getMissionByTile(tileType) {
  return missionFlow.find((mission) => mission.tileType === tileType) || null;
}

function getMissionStatus(missionId) {
  if (gameState.missions[missionId]) return 'completed';

  const missionIndex = missionFlow.findIndex((mission) => mission.id === missionId);
  if (missionIndex <= 0) return 'available';

  const previousMission = missionFlow[missionIndex - 1];
  return gameState.missions[previousMission.id] ? 'available' : 'locked';
}

function getCurrentObjectiveMission() {
  return missionFlow.find((mission) => getMissionStatus(mission.id) === 'available') || null;
}

function getCompletedMissionCount() {
  return missionFlow.filter((mission) => gameState.missions[mission.id]).length;
}

function getObjectiveSummary() {
  const currentMission = getCurrentObjectiveMission();

  if (currentMission) {
    return {
      kicker: 'Miss\u00e3o atual',
      title: currentMission.title,
      text: currentMission.objective,
      progress: `${getCompletedMissionCount()}/${missionFlow.length} miss\u00f5es conclu\u00eddas`
    };
  }

  if (!gameState.milestone100) {
    return {
      kicker: 'Pr\u00f3ximo marco',
      title: 'Chegue a 100 pontos',
      text: 'Explore o territ\u00f3rio e finalize suas cria\u00e7\u00f5es para desbloquear o desafio extra.',
      progress: `${getCompletedMissionCount()}/${missionFlow.length} miss\u00f5es conclu\u00eddas`
    };
  }

  if (!gameState.wordChallengeCompleted) {
    return {
      kicker: 'Desafio extra',
      title: 'Palavras Ocultas',
      text: 'O marco de 100 pontos j\u00e1 foi alcan\u00e7ado. Resolva o desafio para abrir o labirinto.',
      progress: `${getCompletedMissionCount()}/${missionFlow.length} miss\u00f5es conclu\u00eddas`
    };
  }

  if (!gameState.cityMazeCompleted) {
    return {
      kicker: 'Cap\u00edtulo b\u00f4nus',
      title: 'Labirinto da Cidade',
      text: 'Voc\u00ea liberou o cap\u00edtulo extra. Volte ao labirinto e alcance a estrela para conquistar o territ\u00f3rio urbano.',
      progress: `${getCompletedMissionCount()}/${missionFlow.length} miss\u00f5es conclu\u00eddas`
    };
  }

  return {
    kicker: 'Jornada conclu\u00edda',
    title: 'Mapa principal completo',
    text: 'Voc\u00ea j\u00e1 concluiu as miss\u00f5es principais. Releia seus cord\u00e9is, baixe sua jornada ou sincronize na nuvem.',
    progress: `${getCompletedMissionCount()}/${missionFlow.length} miss\u00f5es conclu\u00eddas`
  };
}

function getBiomeRewardKey(tileType) {
  return `${tileType}:${gameState.playerPosition.x}:${gameState.playerPosition.y}`;
}

function grantBiomeReward(tileType) {
  const rewardMap = {
    feira: { territory: 1 },
    laje: { vivencia: 1 },
    quadra: { imaginacao: 1 },
    ponto: { vivencia: 1 }
  };

  const reward = rewardMap[tileType];
  if (!reward) return;

  const rewardKey = getBiomeRewardKey(tileType);
  if (gameState.visitedBiomeRewards[rewardKey]) return;

  gameState.visitedBiomeRewards[rewardKey] = true;
  awardPoints(
    { vivencia: reward.vivencia || 0, imaginacao: reward.imaginacao || 0, territorio: reward.territory || 0 },
    `Explora\u00e7\u00e3o do territ\u00f3rio! ${formatPointReward({ vivencia: reward.vivencia || 0, imaginacao: reward.imaginacao || 0, territorio: reward.territory || 0 })}`,
    'alert'
  );
}

function getNearbyMissionContext() {
  const roster = getNpcRoster();
  let bestContext = null;

  roster.forEach((npc) => {
    const mission = getMissionById(npc.missionId);
    if (!mission) return;

    const distance = Math.abs(gameState.playerPosition.x - npc.x) + Math.abs(gameState.playerPosition.y - npc.y);
    if (distance > 1) return;

    const status = getMissionStatus(mission.id);
    const config = npcEncounterConfig[mission.id] || {};
    const isCurrentObjective = !!getCurrentObjectiveMission() && getCurrentObjectiveMission().id === mission.id;
    const rank = distance === 0 ? 0 : 1;

    if (!bestContext || rank < bestContext.rank) {
      bestContext = { npc, mission, status, config, distance, rank, isCurrentObjective };
    }
  });

  return bestContext;
}

function getNpcVisualState(npc) {
  const mission = getMissionById(npc.missionId);
  if (!mission) return 'idle';

  const status = getMissionStatus(mission.id);
  const nearby = getNearbyMissionContext();
  const currentMission = getCurrentObjectiveMission();

  if (status === 'completed') return 'completed';
  if (nearby && nearby.mission.id === mission.id) return 'aware';
  if (currentMission && currentMission.id === mission.id) return 'current';
  return 'idle';
}

function updateInteractionHud() {
  const hud = document.getElementById('interaction-hud');
  const button = document.getElementById('btn-interact');
  if (!hud || !button) return;

  const context = getNearbyMissionContext();
  if (!context) {
    hud.className = 'interaction-hud';
    hud.innerHTML = `
      <div class="interaction-copy">
        <p class="interaction-kicker">Exploracao livre</p>
        <p class="interaction-title">Aproxime-se de uma personagem para interagir.</p>
      </div>
    `;
    button.style.display = 'none';
    gameState.activeNpcId = null;
    return;
  }

  const { mission, status, config, distance } = context;
  gameState.activeNpcId = mission.id;
  const statusLabel = status === 'completed' ? 'Memoria registrada' : status === 'locked' ? 'Ainda travado' : 'Encontro proximo';
  const promptText = status === 'completed'
    ? (config.completedText || 'Essa personagem ja deixou uma marca no seu mapa.')
    : status === 'locked'
      ? mission.lockedMessage
      : (config.nearbyText || mission.objective);

  hud.className = `interaction-hud interaction-${status}`;
  hud.innerHTML = `
    <div class="interaction-badge ${escapeHtml(config.npcType || '')}">${escapeHtml(config.badge || mission.shortTitle.charAt(0))}</div>
    <div class="interaction-copy">
      <p class="interaction-kicker">${escapeHtml(statusLabel)}</p>
      <p class="interaction-title">${escapeHtml(config.name || mission.shortTitle)}</p>
      <p class="interaction-text">${escapeHtml(promptText)}</p>
      <p class="interaction-hint">${distance === 0 ? 'Voce esta no mesmo tile da personagem.' : 'Pressione espaco, enter ou toque no botao para conversar.'}</p>
    </div>
  `;
  button.style.display = 'inline-flex';
  button.textContent = status === 'completed'
    ? 'Relembrar encontro'
    : status === 'locked'
      ? 'Ouvir pista'
      : (config.actionLabel || 'Interagir');
}

function interactWithNearbyNpc() {
  const context = getNearbyMissionContext();
  if (!context) {
    showToast('Chegue perto de uma personagem para ativar o encontro.', 'alert');
    return;
  }

  const { mission, status, config } = context;
  if (status === 'locked') {
    showDialog({
      themeClass: config.npcType || '',
      kicker: 'Caminho bloqueado',
      name: config.name || mission.shortTitle,
      portrait: config.portrait,
      text: mission.lockedMessage,
      prompt: 'Conclua a etapa anterior e volte aqui para liberar este encontro.',
      actionLabel: 'Entendi'
    });
    return;
  }

  if (status === 'completed') {
    showDialog({
      themeClass: config.npcType || '',
      kicker: config.kicker || 'Encontro',
      name: config.name || mission.shortTitle,
      portrait: config.portrait,
      text: config.completedText || `Voce ja concluiu ${mission.title}.`,
      prompt: 'O mapa reconhece esse encontro como parte da sua jornada.',
      actionLabel: 'Seguir jornada'
    });
    return;
  }

  showDialog({
    themeClass: config.npcType || '',
    kicker: config.kicker || 'Encontro',
    name: config.name || mission.shortTitle,
    portrait: config.portrait,
    text: mission.dialog,
    prompt: config.prompt || mission.objective,
    actionLabel: config.actionLabel || 'Comecar'
  }, () => renderScreen(mission.screen));
}

function drawCityMaze() {
  const grid = document.getElementById('city-maze-grid');
  if (!grid) return;
  const cellSize = getMazeCellSize();

  grid.innerHTML = '';
  grid.style.display = 'grid';
  grid.style.setProperty('--maze-cell-size', `${cellSize}px`);
  grid.style.gridTemplateColumns = `repeat(10, ${cellSize}px)`;
  grid.style.gap = '2px';
  grid.style.margin = '20px auto';
  grid.style.width = 'fit-content';

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = document.createElement('div');
      cell.classList.add('maze-cell');

      if (x === mazePlayerPos.x && y === mazePlayerPos.y) {
        cell.textContent = '\ud83d\udeb6';
        cell.style.backgroundColor = '#ffeb3b';
      } else {
        cell.textContent = cityMazeData[y][x];
        if (cityMazeData[y][x] === '\ud83d\udee3\ufe0f') {
          cell.style.backgroundColor = '#e0e0e0';
        } else if (cityMazeData[y][x] === '\ud83c\udfe2') {
          cell.style.backgroundColor = '#90a4ae';
        } else if (cityMazeData[y][x] === '\ud83c\udf1f') {
          cell.style.backgroundColor = '#ffd54f';
        }
      }

      grid.appendChild(cell);
    }
  }
}

function moveMaze(dx, dy) {
  if (gameState.controlsBlocked || isDialogOpen()) return;

  const newX = mazePlayerPos.x + dx;
  const newY = mazePlayerPos.y + dy;

  // Check bounds
  if (newX < 0 || newX >= 10 || newY < 0 || newY >= 10) return;

  // Check if it's a wall (building)
  if (cityMazeData[newY][newX] === '\ud83c\udfe2') return;

  // Move player
  mazePlayerPos = { x: newX, y: newY };
  saveGame();
  drawCityMaze();

  if (newX === 8 && newY === 8 && !gameState.cityMazeCompleted) {
    gameState.cityMazeCompleted = true;
    awardPoints({ imaginacao: 5, territorio: 10 }, 'Territ\u00f3rio conquistado! +10 Territ\u00f3rio \u2022 +5 Imagina\u00e7\u00e3o', 'success');
  }

  // Check if reached the goal
  if (cityMazeData[newY][newX] === '\ud83c\udf1f') {
    showDialog('\ud83c\udf1f Voc\u00ea encontrou um ponto especial da cidade! Mais aventuras vir\u00e3o...', () => {
      goToMap();
    });
  }
}

// ========== SISTEMA DE TELAS ========== //

function renderScreen(id) {
  const app = document.getElementById('app');
  if (!app) return;

  ensureMissionMicroTargets();
  setCurrentScreen(id);

  // SPLASH
  if (id === 'splash') {
    app.innerHTML = `
      <section class="center">
        <h1>Jornadas do Territ\u00f3rio</h1>
        <p>Um jogo de escrita viva, mem\u00f3ria e territ\u00f3rio.</p>
        <p>Aqui, quem escreve \u00e9 voc\u00ea. A IA entra s\u00f3 depois \u2014 sua hist\u00f3ria \u00e9 essencial.</p>
        <button id="btn-start">Come\u00e7ar jornada</button>
      </section>
    `;
    document.getElementById('btn-start').onclick = () => renderScreen('create_profile');
    return;
  }

  // PERFIL
  if (id === 'create_profile') {
    app.innerHTML = `
      <section class="form">
        <h2>Quem \u00e9 voc\u00ea na quebrada do poema?</h2>
        <label>Seu nome ou apelido po\u00e9tico
          <input id="nome-poetico" placeholder="Ex.: Nina da Laje" value="${gameState.profile ? gameState.profile.nome : ''}" />
        </label>
        <label>De onde voc\u00ea fala?
          <input id="territorio" placeholder="Bairro, comunidade ou cidade" value="${gameState.profile ? gameState.profile.territorio : ''}" />
        </label>
        <label>Seu e-mail para receber a jornada
          <input id="email" type="email" placeholder="voce@exemplo.com" value="${gameState.profile && gameState.profile.email ? gameState.profile.email : ''}" />
        </label>
        <button id="btn-save">Salvar e continuar</button>
      </section>
    `;
    document.getElementById('btn-save').onclick = () => {
      const nome = document.getElementById('nome-poetico').value.trim();
      const terr = document.getElementById('territorio').value.trim();
      const email = document.getElementById('email').value.trim();
      if (!nome) {
        showDialog('Precisa pelo menos do nome ou apelido po\u00e9tico.');
        return;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showDialog('Digite um e-mail v\u00e1lido para receber seus textos.');
        return;
      }
      gameState.profile = { nome, territorio: terr, email };
      saveGame();
      renderScreen('world_map');
    };
    return;
  }

  // MAPA
  if (id === 'world_map') {
    renderMapScreen();
    return;
  }

  // MISS\u00c3O 1
  if (id === 'world1_m1') {
    const memoryReady = gameState.m1_memory_unlocked;
    app.innerHTML = `
      <section class="form">
        <h2>Miss\u00e3o 1: Despertar da Viv\u00eancia</h2>
        <p>Antes de escrever, Dona Cida abre a mem\u00f3ria em pequenos fragmentos do cotidiano.</p>
        <section class="micro-action-panel">
          <p class="micro-action-kicker">Microa\u00e7\u00e3o</p>
          <h3 class="micro-action-title">Colete dois fragmentos de mem\u00f3ria</h3>
          <p class="micro-action-text">Toque em dois sinais do territ\u00f3rio para aquecer sua lembran\u00e7a.</p>
          ${renderMemoryScene()}
          <div class="micro-option-grid">
            ${renderOptionButtons(MEMORY_FRAGMENTS, gameState.m1_fragments, 'memory-fragment')}
          </div>
          <p class="micro-action-status">${escapeHtml(getMemoryPrompt())}</p>
          <div class="micro-action-buttons">
            <button type="button" id="btn-m1-check">Testar lembranca</button>
            <button type="button" id="btn-m1-reset" class="micro-secondary">Trocar fragmentos</button>
          </div>
        </section>
        <textarea id="m1-text" ${memoryReady ? '' : 'disabled'} placeholder="Ex.: O som do \u00f4nibus passando na subida da minha rua de madrugada.">${gameState.m1_text}</textarea>
        <button id="btn-m1">Concluir miss\u00e3o</button>
        <button id="btn-m1-back">Voltar ao mapa</button>
      </section>
    `;
    document.querySelectorAll('[data-memory-fragment]').forEach((button) => {
      button.onclick = () => {
        const fragment = button.getAttribute('data-memory-fragment');
        const alreadySelected = gameState.m1_fragments.includes(fragment);
        if (alreadySelected) {
          gameState.m1_fragments = gameState.m1_fragments.filter((item) => item !== fragment);
        } else if (gameState.m1_fragments.length < 2) {
          gameState.m1_fragments = [...gameState.m1_fragments, fragment];
        } else {
          showToast('Dona Cida segura s\u00f3 dois fragmentos por vez. Troque um para continuar.', 'alert');
          return;
        }
        saveGame();
        renderScreen('world1_m1');
      };
    });
    document.getElementById('btn-m1-check').onclick = () => {
      if (gameState.m1_fragments.length !== 2) {
        showDialog('Escolha exatamente dois fragmentos antes de testar a lembranca.');
        return;
      }
      if (sameItems(gameState.m1_fragments, gameState.m1_memory_target)) {
        gameState.m1_memory_unlocked = true;
        saveGame();
        showToast('Dona Cida abriu o caderno da memoria!', 'success');
        renderScreen('world1_m1');
        return;
      }
      gameState.m1_fragments = [];
      saveGame();
      showToast('Os sinais nao se encaixaram. Dona Cida pediu outra combinacao.', 'alert');
      renderScreen('world1_m1');
    };
    document.getElementById('btn-m1-reset').onclick = () => {
      gameState.m1_fragments = [];
      saveGame();
      renderScreen('world1_m1');
    };
    document.getElementById('btn-m1').onclick = () => {
      const txt = document.getElementById('m1-text').value.trim();
      if (!memoryReady) {
        showDialog('Resolva a combinacao de memoria antes de escrever.');
        return;
      }
      if (!txt) {
        showDialog('Tente escrever pelo menos uma frase sobre a sua viv\u00eancia.');
        return;
      }
      gameState.missions.world1_m1 = true;
      gameState.m1_text = txt;
      awardPoints({ vivencia: 20 }, 'Viv\u00eancia registrada! +20 Viv\u00eancia');
      showDialog('Viv\u00eancia registrada! Voc\u00ea ganhou +20 Pontos de Viv\u00eancia.', () => safeNavigateToMap());
    };
    document.getElementById('btn-m1-back').onclick = () => safeNavigateToMap();
    return;
  }

  // MISS\u00c3O 2 \u2013 LABORAT\u00d3RIO
  if (id === 'world1_m2') {
    const labReady = gameState.m2_lab_unlocked;
    app.innerHTML = `
      <section class="form">
        <h2>Miss\u00e3o 2: Mapa Simb\u00f3lico do Sentir</h2>
        <p>Antes de escrever, Cau\u00e3 pede que voc\u00ea monte o clima do laborat\u00f3rio com tr\u00eas combina\u00e7\u00f5es visuais.</p>
        <section class="micro-action-panel">
          <p class="micro-action-kicker">Microa\u00e7\u00e3o</p>
          <h3 class="micro-action-title">Ative o laborat\u00f3rio visual</h3>
          ${renderLabScene()}
          <div class="micro-station">
            <p class="micro-station-title">Pulso</p>
            <div class="micro-option-grid">
              ${renderSingleChoiceButtons(LAB_STATIONS.pulse, gameState.m2_lab_choices.pulse, 'lab-pulse')}
            </div>
          </div>
          <div class="micro-station">
            <p class="micro-station-title">Textura</p>
            <div class="micro-option-grid">
              ${renderSingleChoiceButtons(LAB_STATIONS.texture, gameState.m2_lab_choices.texture, 'lab-texture')}
            </div>
          </div>
          <div class="micro-station">
            <p class="micro-station-title">Luz</p>
            <div class="micro-option-grid">
              ${renderSingleChoiceButtons(LAB_STATIONS.light, gameState.m2_lab_choices.light, 'lab-light')}
            </div>
          </div>
          <p class="micro-action-status">${escapeHtml(getLabPrompt())}</p>
          <div class="micro-action-buttons">
            <button type="button" id="btn-m2-check">Ativar reator</button>
            <button type="button" id="btn-m2-reset" class="micro-secondary">Zerar painel</button>
          </div>
        </section>
        <p>Agora vamos criar uma imagem-poema: Substantivo + Adjetivos + Conector + Ambiente.</p>
        <label>Substantivo
          <input id="m2-noun" placeholder="Ex.: vento, rua, sil\u00eancio, laje..." />
        </label>
        <label>Adjetivos (1 a 3)
          <input id="m2-adj" placeholder="Ex.: pesado, el\u00e9trico, silencioso..." />
        </label>
        <label>Ambiente do seu territ\u00f3rio
          <input id="m2-env" placeholder="Ex.: laje, ponto de \u00f4nibus, feira..." />
        </label>
        <label>Conector
          <input id="m2-con" placeholder="Ex.: em, sobre, perto de..." />
        </label>
        <button id="btn-m2-generate">Gerar imagem-poema</button>
        <div id="m2-result"></div>
        <button id="btn-m2-back">Voltar ao mapa</button>
      </section>
    `;
    [
      ['lab-pulse', 'pulse'],
      ['lab-texture', 'texture'],
      ['lab-light', 'light']
    ].forEach(([attribute, key]) => {
      document.querySelectorAll(`[data-${attribute}]`).forEach((button) => {
        button.onclick = () => {
          gameState.m2_lab_choices = {
            ...gameState.m2_lab_choices,
            [key]: button.getAttribute(`data-${attribute}`)
          };
          saveGame();
          renderScreen('world1_m2');
        };
      });
    });
    document.getElementById('btn-m2-check').onclick = () => {
      const target = gameState.m2_lab_target;
      const choices = gameState.m2_lab_choices;
      if (!choices.pulse || !choices.texture || !choices.light) {
        showDialog('Preencha as tres chaves do laboratorio antes de ativar o reator.');
        return;
      }
      if (choices.pulse === target.pulse && choices.texture === target.texture && choices.light === target.light) {
        gameState.m2_lab_unlocked = true;
        saveGame();
        showToast('Reator estavel. O laboratorio liberou a imagem-poema!', 'success');
        renderScreen('world1_m2');
        return;
      }
      gameState.m2_lab_choices = { pulse: '', texture: '', light: '' };
      saveGame();
      showToast('O reator falhou. Caua pediu outra combinacao visual.', 'alert');
      renderScreen('world1_m2');
    };
    document.getElementById('btn-m2-reset').onclick = () => {
      gameState.m2_lab_choices = { pulse: '', texture: '', light: '' };
      saveGame();
      renderScreen('world1_m2');
    };

    document.getElementById('btn-m2-generate').onclick = () => {
      if (!labReady) {
        showDialog('Ative o reator com a combinacao certa antes de gerar a imagem-poema.');
        return;
      }
      const noun = document.getElementById('m2-noun').value.trim();
      const adj = document.getElementById('m2-adj').value.trim();
      const env = document.getElementById('m2-env').value.trim();
      const con = document.getElementById('m2-con').value.trim() || 'em';

      if (!noun || !adj || !env) {
        showDialog('Preencha pelo menos substantivo, adjetivos e ambiente.');
        return;
      }

      const imagePoem = `${noun} ${adj} ${con} ${env} sob ${gameState.m2_lab_choices.light}`;
      gameState.m2_image_poem = imagePoem;

      document.getElementById('m2-result').innerHTML = `
        <hr>
        <p><strong>Imagem-poema:</strong> ${imagePoem}</p>
        <label>Escreva um verso a partir dessa imagem
          <textarea id="m2-verse" placeholder="Ex.: O vento el\u00e9trico varre a laje em sil\u00eancio.">${gameState.m2_user_verse}</textarea>
        </label>
        <button id="btn-m2-finish">Concluir miss\u00e3o</button>
      `;

      document.getElementById('btn-m2-finish').onclick = () => {
        const verse = document.getElementById('m2-verse').value.trim();
        if (!verse) {
          showDialog('Escreva pelo menos um verso.');
          return;
        }
        gameState.m2_user_verse = verse;
        gameState.missions.world1_m2 = true;
        awardPoints({ imaginacao: 15 }, 'Imagem-poema criada! +15 Imagina\u00e7\u00e3o');
        showDialog('Miss\u00e3o 2 conclu\u00edda! Voc\u00ea ganhou +15 Pontos de Imagina\u00e7\u00e3o.', () => safeNavigateToMap());
      };
    };

    document.getElementById('btn-m2-back').onclick = () => safeNavigateToMap();
    return;
  }

  // MISS\u00c3O 3 \u2013 INSCRI\u00c7\u00c3O TERRITORIAL
  if (id === 'world1_m3') {
    const appVerse = gameState.m2_user_verse || '(Voc\u00ea ainda n\u00e3o concluiu a Miss\u00e3o 2)';
    const voiceReady = gameState.m3_voice_unlocked;
    app.innerHTML = `
      <section class="form">
        <h2>Miss\u00e3o 3: Inscri\u00e7\u00e3o Territorial da Voz</h2>
        <p>Antes de escrever no muro, Z\u00e9 do Bon\u00e9 pede que voc\u00ea escolha como a voz entra em cena.</p>
        <section class="micro-action-panel">
          <p class="micro-action-kicker">Microa\u00e7\u00e3o</p>
          <h3 class="micro-action-title">Monte o corpo da voz</h3>
          ${renderVoiceScene()}
          <div class="micro-station">
            <p class="micro-station-title">Ritmo</p>
            <div class="micro-option-grid">
              ${renderSingleChoiceButtons(VOICE_CHOICES.rhythm, gameState.m3_voice_choices.rhythm, 'voice-rhythm')}
            </div>
          </div>
          <div class="micro-station">
            <p class="micro-station-title">Tom</p>
            <div class="micro-option-grid">
              ${renderSingleChoiceButtons(VOICE_CHOICES.tone, gameState.m3_voice_choices.tone, 'voice-tone')}
            </div>
          </div>
          <div class="micro-station">
            <p class="micro-station-title">Gesto</p>
            <div class="micro-option-grid">
              ${renderSingleChoiceButtons(VOICE_CHOICES.gesture, gameState.m3_voice_choices.gesture, 'voice-gesture')}
            </div>
          </div>
          <p class="micro-action-status">${escapeHtml(getVoicePrompt())}</p>
          <div class="micro-action-buttons">
            <button type="button" id="btn-m3-check">Acender mural</button>
            <button type="button" id="btn-m3-reset" class="micro-secondary">Refazer voz</button>
          </div>
        </section>
        <p>Reescreva seu verso incluindo: uma cor, um som, um gesto e algo da sua rua/bairro.</p>
        <p><strong>Verso anterior:</strong> ${appVerse}</p>
        <textarea id="m3-text" ${voiceReady ? '' : 'disabled'} placeholder="Ex.: O vento el\u00e9trico varre a laje azul enquanto algu\u00e9m bate palma no port\u00e3o da minha rua.">${gameState.m3_new_verse}</textarea>
        <button id="btn-m3">Concluir miss\u00e3o</button>
        <button id="btn-m3-back">Voltar ao mapa</button>
      </section>
    `;
    [
      ['voice-rhythm', 'rhythm'],
      ['voice-tone', 'tone'],
      ['voice-gesture', 'gesture']
    ].forEach(([attribute, key]) => {
      document.querySelectorAll(`[data-${attribute}]`).forEach((button) => {
        button.onclick = () => {
          gameState.m3_voice_choices = {
            ...gameState.m3_voice_choices,
            [key]: button.getAttribute(`data-${attribute}`)
          };
          saveGame();
          renderScreen('world1_m3');
        };
      });
    });
    document.getElementById('btn-m3-check').onclick = () => {
      const target = gameState.m3_voice_target;
      const choices = gameState.m3_voice_choices;
      if (!choices.rhythm || !choices.tone || !choices.gesture) {
        showDialog('Escolha ritmo, tom e gesto antes de testar o mural.');
        return;
      }
      if (choices.rhythm === target.rhythm && choices.tone === target.tone && choices.gesture === target.gesture) {
        gameState.m3_voice_unlocked = true;
        saveGame();
        showToast('O mural respondeu. Sua voz foi aceita pela rua!', 'success');
        renderScreen('world1_m3');
        return;
      }
      gameState.m3_voice_choices = { rhythm: '', tone: '', gesture: '' };
      saveGame();
      showToast('A batida nao encaixou. Ze do Bone pediu outra entrada.', 'alert');
      renderScreen('world1_m3');
    };
    document.getElementById('btn-m3-reset').onclick = () => {
      gameState.m3_voice_choices = { rhythm: '', tone: '', gesture: '' };
      saveGame();
      renderScreen('world1_m3');
    };
    document.getElementById('btn-m3').onclick = () => {
      if (!voiceReady) {
        showDialog('Resolva o microjogo do mural antes de inscrever sua voz no territ\u00f3rio.');
        return;
      }
      const txt = document.getElementById('m3-text').value.trim();
      if (!txt) {
        showDialog('Escreva seu novo verso com o territ\u00f3rio.');
        return;
      }
      gameState.m3_new_verse = txt;
      gameState.missions.world1_m3 = true;
      awardPoints({ territorio: 30 }, 'Voz inscrita no territ\u00f3rio! +30 Territ\u00f3rio');
      showDialog('Miss\u00e3o 3 conclu\u00edda! Voc\u00ea ganhou +30 Pontos de Territ\u00f3rio.', () => safeNavigateToMap());
    };
    document.getElementById('btn-m3-back').onclick = () => safeNavigateToMap();
    return;
  }

  // ========= MISS\u00c3O LITER\u00c3\u0081RIA \u2013 ENCONTRO FUGAZ =========
  if (id === 'lit_fugaz') {
    app.innerHTML = `
      <section class="form">
        <h2>Miss\u00e3o Liter\u00e1ria: Encontro Fugaz no Territ\u00f3rio</h2>
        <p>
          Em alguns lugares, um encontro dura s\u00f3 alguns segundos e muda tudo por dentro. 
        </p>
        <textarea id="lit-text" placeholder="Descreva a cena em poucas linhas, como se fosse um flash de filme.">${gameState.lit_fugaz_text}</textarea>
        <button id="btn-lit">Concluir miss\u00e3o liter\u00e1ria</button>
        <button id="btn-lit-back">Voltar ao mapa</button>
      </section>
    `;

    document.getElementById('btn-lit').onclick = () => {
      const txt = document.getElementById('lit-text').value.trim();
      if (!txt) {
        showDialog('Escreva pelo menos algumas linhas sobre essa cena fugaz.');
        return;
      }
      gameState.lit_fugaz_text = txt;
      gameState.missions.lit_fugaz = true;
      awardPoints({ imaginacao: 20, territorio: 10 }, 'Cena fugaz registrada! +20 Imagina\u00e7\u00e3o \u2022 +10 Territ\u00f3rio');
      showDialog('Miss\u00e3o liter\u00e1ria conclu\u00edda! Voc\u00ea ganhou +20 Imagina\u00e7\u00e3o e +10 Territ\u00f3rio.', () => safeNavigateToMap());
    };

    document.getElementById('btn-lit-back').onclick = () => safeNavigateToMap();
    return;
  }

  // ========= MISS\u00c3O TEM\u00c3\u0081TICA \u2013 BIBLIOTECAS =========
  if (id === 'mission_tematica') {
    const themes = [
      "Cultura Afro-brasileira",
      "Contos de Fadas",
      "Cinema",
      "Ci\u00eancias",
      "Arquitetura e Urbanismo",
      "Poesia",
      "M\u00fasica",
      "Meio Ambiente e Sustentabilidade",
      "Literatura Policial",
      "Literatura Fant\u00e1stica",
      "Literatura Feminista",
      "Cultura Popular",
      "Direitos Humanos"
    ];

    // Create options
    const optionsHtml = themes.map(t => `<option value="${t}">${t}</option>`).join('');

    app.innerHTML = `
      <section class="form">
        <h2>Desafio das Bibliotecas Tem\u00e1ticas</h2>
        <p>
          As bibliotecas de S\u00e3o Paulo guardam tesouros tem\u00e1ticos. 
          Escolha um tema e escreva um pequeno texto ou poema inspirado nele.
        </p>
        <label>Escolha o tema:
          <select id="tematica-select" style="width:100%; padding:8px; margin-top:4px;">
            ${optionsHtml}
          </select>
        </label>
        <textarea id="tematica-text" placeholder="Escreva aqui sua inspira\u00e7\u00e3o sobre o tema escolhido...">${gameState.tematica_text}</textarea>
        <button id="btn-tematica">Concluir Desafio</button>
        <button id="btn-tematica-back">Voltar ao mapa</button>
      </section>
    `;

    document.getElementById('btn-tematica').onclick = () => {
      const theme = document.getElementById('tematica-select').value;
      const txt = document.getElementById('tematica-text').value.trim();
      if (!txt) {
        showDialog('Escreva algo sobre o tema escolhido.');
        return;
      }
      gameState.tematica_chosen = theme;
      gameState.tematica_text = txt;
      gameState.missions.tematica = true;
      awardPoints({ imaginacao: 25, vivencia: 10 }, `Tema ${theme} conclu\u00eddo! +25 Imagina\u00e7\u00e3o \u2022 +10 Viv\u00eancia`);
      showDialog(`Desafio de ${theme} conclu\u00eddo! +25 Imagina\u00e7\u00e3o, +10 Viv\u00eancia.`, () => safeNavigateToMap());
    };

    document.getElementById('btn-tematica-back').onclick = () => safeNavigateToMap();
    return;
  }
}

// ========== MAPA VISUAL + MOVIMENTO ========== //

function renderMapScreen() {
  const app = document.getElementById('app');
  const objectiveSummary = getObjectiveSummary();
  app.innerHTML = `
    <section class="map-wrapper">
      <h2>Territ\u00f3rio</h2>
      <div class="quest-panel">
        <p class="quest-kicker">${objectiveSummary.kicker}</p>
        <h3 class="quest-title">${objectiveSummary.title}</h3>
        <p class="quest-text">${objectiveSummary.text}</p>
        <p class="quest-progress">${objectiveSummary.progress}</p>
      </div>
      <div id="map" class="map-grid"></div>
      <div id="interaction-hud" class="interaction-hud">
        <div class="interaction-copy">
          <p class="interaction-kicker">Exploracao livre</p>
          <p class="interaction-title">Aproxime-se de uma personagem para interagir.</p>
        </div>
        <button id="btn-interact" type="button" style="display:none;">Interagir</button>
      </div>
      
      <div class="controls">
        <button id="btn-up">\u2191</button>
        <div style="display:flex; gap:4px;">
            <button id="btn-left">\u2190</button>
            <button id="btn-down">\u2193</button>
            <button id="btn-right">\u2192</button>
        </div>
      </div>
      
      <div class="biome-legend">
        <span class="legend-tile laje">Laje</span>
        <span class="legend-tile feira">Feira</span>
        <span class="legend-tile quadra">Quadra</span>
        <span class="legend-tile igreja">Igreja</span>
        <span class="legend-tile ponto">Ponto</span>
        <span class="legend-tile lit">Encontro</span>
        <span class="legend-tile tematica">Biblioteca Tem\u00e1tica</span>
      </div>
      
      <div style="text-align:center; margin-top:20px; display:flex; flex-direction:column; gap:8px;">
        <button id="btn-library" style="background:#81d4fa; color:#000;">\ud83d\udcd6 Ler Cord\u00e9is Encontrados</button>
        <button id="btn-send-email" style="background:#ffeb3b; color:#000;">\ud83d\udcbe Baixar Jornada (.doc)</button>
      </div>
    </section>
  `;

  drawMap();
  updatePlayerPosition();
  updateInteractionHud();

  document.getElementById('btn-up').onclick = () => step(0, -1);
  document.getElementById('btn-down').onclick = () => step(0, 1);
  document.getElementById('btn-left').onclick = () => step(-1, 0);
  document.getElementById('btn-right').onclick = () => step(1, 0);
  document.getElementById('btn-interact').onclick = () => interactWithNearbyNpc();

  document.getElementById('btn-send-email').onclick = downloadJourney;
  document.getElementById('btn-library').onclick = showLibrary;

  const actionsContainer = document.getElementById('btn-send-email').parentElement;
  if (actionsContainer && !document.getElementById('btn-sync-journey')) {
    const syncButton = document.createElement('button');
    syncButton.id = 'btn-sync-journey';
    syncButton.textContent = 'Sincronizar na Nuvem';
    syncButton.style.background = '#c8e6c9';
    syncButton.style.color = '#000';
    syncButton.onclick = syncJourney;
    actionsContainer.appendChild(syncButton);
  }

  if (actionsContainer && !document.getElementById('btn-new-sheet')) {
    const sheetButton = document.createElement('button');
    sheetButton.id = 'btn-new-sheet';
    sheetButton.textContent = 'Nova Planilha';
    sheetButton.style.background = '#d1c4e9';
    sheetButton.style.color = '#000';
    sheetButton.onclick = () => {
      createCloudSpreadsheet()
        .then((result) => {
          const payload = result && result.payload ? result.payload : {};
          showDialog(`Nova planilha preparada com sucesso. URL: ${payload.spreadsheetUrl || 'consulte o Apps Script para abrir.'}`);
        })
        .catch((err) => {
          console.error('Erro ao criar nova planilha:', err);
          showDialog('Nao foi possivel criar uma nova planilha agora.');
        });
    };
    actionsContainer.appendChild(sheetButton);
  }
}

function showLibrary() {
  setCurrentScreen('library');
  const app = document.getElementById('app');
  let poemsHtml = '';
  if (typeof cordelLibrary !== 'undefined') {
    poemsHtml = cordelLibrary.map(p => `
      <div style="margin-bottom:24px; border-bottom:1px dashed #ccc; padding-bottom:16px;">
        <h3 style="margin-bottom:8px; color:#d32f2f;">${p.title}</h3>
        <pre style="font-family:inherit; white-space:pre-wrap; line-height:1.6;">${p.body}</pre>
      </div>
    `).join('');
  } else {
    poemsHtml = '<p>Nenhum cordel encontrado na biblioteca.</p>';
  }

  app.innerHTML = `
    <section class="form">
      <h2>Biblioteca de Cordel</h2>
      <p>Versos recolhidos na mem\u00f3ria do territ\u00f3rio.</p>
      <div style="max-height:300px; overflow-y:auto; text-align:left;">
        ${poemsHtml}
      </div>
      <button id="btn-lib-back">Voltar ao Mapa</button>
    </section>
  `;

  document.getElementById('btn-lib-back').onclick = () => safeNavigateToMap();
}

function drawMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;
  const tileSize = getMapTileSize();

  mapEl.innerHTML = '';
  mapEl.style.setProperty('--tile-size', `${tileSize}px`);
  mapEl.style.gridTemplateColumns = `repeat(${mapWidth}, ${tileSize}px)`;

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const tileType = mapTiles[y][x];
      const mission = getMissionByTile(tileType);
      const tile = document.createElement('div');
      tile.classList.add('tile');

      if (tileType === 'decor') tile.classList.add('tile-decor');
      if (tileType === 'start') tile.classList.add('tile-start');
      if (tileType === 'm1' || tileType === 'lab' || tileType === 'm3') {
        tile.classList.add('tile-mission');
      }
      if (tileType === 'laje') tile.classList.add('tile-laje');
      if (tileType === 'feira') tile.classList.add('tile-feira');
      if (tileType === 'quadra') tile.classList.add('tile-quadra');
      if (tileType === 'igreja') tile.classList.add('tile-igreja');
      if (tileType === 'ponto') tile.classList.add('tile-ponto');
      if (tileType === 'lit') tile.classList.add('tile-lit');
      if (tileType === 'tematica') tile.classList.add('tile-tematica');

      if (mission) {
        const status = getMissionStatus(mission.id);
        tile.classList.add(`tile-mission-${status}`);
        if (getCurrentObjectiveMission() && getCurrentObjectiveMission().id === mission.id) {
          tile.classList.add('tile-mission-current');
        }
      }

      mapEl.appendChild(tile);
    }
  }

  // Render NPCs
  getNpcRoster().forEach((npc) => {
    const mission = getMissionById(npc.missionId);
    const config = npcEncounterConfig[npc.missionId] || {};
    const state = getNpcVisualState(npc);
    const emote = state === 'aware' ? '!' : state === 'completed' ? 'OK' : state === 'current' ? '...' : '';
    const npcEl = document.createElement('button');
    npcEl.type = 'button';
    npcEl.className = `npc-base ${npc.type} npc-state-${state}`;
    npcEl.style.left = (npc.x * tileSize) + 'px';
    npcEl.style.top = (npc.y * tileSize) + 'px';

    npcEl.innerHTML = `
      <span class="npc-shadow"></span>
      <span class="npc-token">${escapeHtml(config.badge || (mission ? mission.shortTitle.charAt(0) : '?'))}</span>
      <span class="npc-emote">${escapeHtml(emote)}</span>
    `;
    npcEl.setAttribute('aria-label', `Interagir com ${config.name || (mission ? mission.shortTitle : 'personagem')}`);
    npcEl.onclick = () => {
      const distance = Math.abs(gameState.playerPosition.x - npc.x) + Math.abs(gameState.playerPosition.y - npc.y);
      if (distance > 1) {
        showToast(`Chegue mais perto de ${config.name || 'uma personagem'} para conversar.`, 'alert');
        return;
      }
      interactWithNearbyNpc();
    };
    mapEl.appendChild(npcEl);
  });

  // Cria o elemento do jogador
  const player = document.createElement('div');
  player.id = 'player-sprite';
  player.classList.add('player-sprite');
  mapEl.appendChild(player);
}

function updatePlayerPosition() {
  const player = document.getElementById('player-sprite');
  const tileSize = getMapTileSize();
  if (player) {
    player.style.left = (gameState.playerPosition.x * tileSize) + 'px';
    player.style.top = (gameState.playerPosition.y * tileSize) + 'px';
  }
}

// Movimento
function step(dx, dy) {
  // Block movement if controls are blocked (during transition)
  if (gameState.controlsBlocked || isDialogOpen()) return;

  const newX = gameState.playerPosition.x + dx;
  const newY = gameState.playerPosition.y + dy;

  if (newX < 0 || newX >= mapWidth || newY < 0 || newY >= mapHeight) return;

  const tileType = mapTiles[newY][newX];
  if (tileType === 'decor') return; // muro / borda

  gameState.playerPosition = { x: newX, y: newY };
  saveGame();
  drawMap();
  updatePlayerPosition();
  updateInteractionHud();

  // Pequeno delay para permitir a anima\u00e7\u00e3o antes do evento (opcional)
  setTimeout(() => processTileEvent(tileType), 300);
}

function processTileEvent(tileType) {
  const mission = getMissionByTile(tileType);
  if (mission) {
    updateInteractionHud();
    return;
  }

  grantBiomeReward(tileType);
}

// Fun\u00e7\u00e3o de Email
// Coleta todos os dados do jogo para exporta\u00e7\u00e3o
const AUTHOR_REFERENCE_RULES = [
  { name: 'Patativa do Assare', patterns: ['patativa', 'patativa do assare'] },
  { name: 'Conceicao Evaristo', patterns: ['conceicao evaristo', 'escrevivencia'] },
  { name: 'Carolina Maria de Jesus', patterns: ['carolina maria de jesus', 'quarto de despejo'] },
  { name: 'Ariano Suassuna', patterns: ['ariano suassuna', 'suassuna'] },
  { name: 'Cora Coralina', patterns: ['cora coralina', 'cora'] },
  { name: 'Solano Trindade', patterns: ['solano trindade', 'solano'] },
  { name: 'Joao Cabral de Melo Neto', patterns: ['joao cabral', 'melo neto', 'morte e vida severina'] },
  { name: 'Paulo Freire', patterns: ['paulo freire'] },
  { name: 'Drummond', patterns: ['drummond', 'carlos drummond'] }
];

function normalizeForAnalysis(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s\n]/g, ' ');
}

function splitWords(text) {
  return normalizeForAnalysis(text).split(/\s+/).filter(Boolean);
}

function countRhymeGroups(text) {
  const lines = (text || '')
    .split(/\n+/)
    .map((line) => normalizeForAnalysis(line).trim())
    .filter(Boolean);

  if (lines.length < 2) return 0;

  const endings = lines
    .map((line) => {
      const parts = line.split(/\s+/).filter(Boolean);
      return parts.length ? parts[parts.length - 1].slice(-3) : '';
    })
    .filter((ending) => ending.length >= 2);

  const counts = {};
  endings.forEach((ending) => {
    counts[ending] = (counts[ending] || 0) + 1;
  });

  return Object.values(counts).filter((count) => count >= 2).length;
}

function countSubjectLikeWords(words) {
  const subjectHints = new Set(['eu', 'tu', 'ela', 'ele', 'nos', 'n\u00f3s', 'eles', 'elas', 'voce', 'voc\u00ea', 'gente', 'povo', 'rua', 'bairro', 'laje', 'feira', 'cidade', 'quebrada', 'territorio', 'territ\u00f3rio', 'muro', 'corpo', 'voz']);
  return words.filter((word) => subjectHints.has(word)).length;
}

function countAdjectiveLikeWords(words) {
  return words.filter((word) => /(oso|osa|vel|veis|ante|entes|al|ais|iva|ivo|ado|ada|ente|ino|ina|ico|ica|eira|eiro)$/.test(word)).length;
}

function extractAuthorReferences(text) {
  const normalized = normalizeForAnalysis(text);
  return AUTHOR_REFERENCE_RULES
    .filter((entry) => entry.patterns.some((pattern) => normalized.includes(pattern)))
    .map((entry) => entry.name);
}

function scoreSingleWriting(text) {
  const rawText = (text || '').trim();
  const words = splitWords(rawText);
  const lineCount = rawText ? rawText.split(/\n+/).filter((line) => line.trim()).length : 0;
  const rhymeGroups = countRhymeGroups(rawText);
  const subjects = countSubjectLikeWords(words);
  const adjectives = countAdjectiveLikeWords(words);
  const references = extractAuthorReferences(rawText);

  const extensionPoints = Math.min(12, Math.floor(words.length / 8));
  const rhymePoints = Math.min(8, rhymeGroups * 4);
  const subjectPoints = Math.min(6, subjects * 2);
  const adjectivePoints = Math.min(6, adjectives * 2);
  const referencePoints = Math.min(8, references.length * 4);
  const structurePoints = lineCount >= 3 ? 4 : lineCount >= 2 ? 2 : 0;

  return {
    wordCount: words.length,
    lineCount,
    rhymeGroups,
    subjects,
    adjectives,
    references,
    total: extensionPoints + rhymePoints + subjectPoints + adjectivePoints + referencePoints + structurePoints,
    breakdown: {
      extension: extensionPoints,
      rhymes: rhymePoints,
      subjects: subjectPoints,
      adjectives: adjectivePoints,
      references: referencePoints,
      structure: structurePoints
    }
  };
}

function buildWritingScoreboard() {
  const writings = [
    { id: 'world1_m1', label: 'Despertar da Vivencia', text: gameState.m1_text || '' },
    { id: 'world1_m2', label: 'Verso do laboratorio', text: [gameState.m2_image_poem || '', gameState.m2_user_verse || ''].filter(Boolean).join('\n') },
    { id: 'world1_m3', label: 'Inscricao territorial', text: gameState.m3_new_verse || '' },
    { id: 'lit_fugaz', label: 'Encontro fugaz', text: gameState.lit_fugaz_text || '' },
    { id: 'tematica', label: gameState.tematica_chosen ? `Desafio tematico: ${gameState.tematica_chosen}` : 'Desafio tematico', text: gameState.tematica_text || '' }
  ];

  const entries = writings.map((entry) => ({ ...entry, score: scoreSingleWriting(entry.text) }));
  const totals = {
    total: 0,
    extension: 0,
    rhymes: 0,
    subjects: 0,
    adjectives: 0,
    references: 0,
    structure: 0,
    referencesFound: new Set()
  };

  entries.forEach((entry) => {
    totals.total += entry.score.total;
    totals.extension += entry.score.breakdown.extension;
    totals.rhymes += entry.score.breakdown.rhymes;
    totals.subjects += entry.score.breakdown.subjects;
    totals.adjectives += entry.score.breakdown.adjectives;
    totals.references += entry.score.breakdown.references;
    totals.structure += entry.score.breakdown.structure;
    entry.score.references.forEach((reference) => totals.referencesFound.add(reference));
  });

  return {
    entries,
    totals: {
      total: totals.total,
      extension: totals.extension,
      rhymes: totals.rhymes,
      subjects: totals.subjects,
      adjectives: totals.adjectives,
      references: totals.references,
      structure: totals.structure,
      referencesFound: Array.from(totals.referencesFound)
    }
  };
}

function formatScoreSummary(scoreboard) {
  return `Placar da escrita: ${scoreboard.totals.total} pts | Extensao ${scoreboard.totals.extension} | Rimas ${scoreboard.totals.rhymes} | Sujeitos ${scoreboard.totals.subjects} | Adjetivos ${scoreboard.totals.adjectives} | Referencias ${scoreboard.totals.references} | Estrutura ${scoreboard.totals.structure}`;
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function renderOptionButtons(options, selectedValues, dataKey) {
  return options.map((option) => `
    <button
      type="button"
      class="micro-option ${selectedValues.includes(option) ? 'is-selected' : ''}"
      data-${dataKey}="${escapeAttribute(option)}"
    >
      ${escapeHtml(option)}
    </button>
  `).join('');
}

function renderSingleChoiceButtons(options, selectedValue, dataKey) {
  return options.map((option) => `
    <button
      type="button"
      class="micro-option ${selectedValue === option ? 'is-selected' : ''}"
      data-${dataKey}="${escapeAttribute(option)}"
    >
      ${escapeHtml(option)}
    </button>
  `).join('');
}

function getMemoryPrompt() {
  if (gameState.m1_memory_unlocked) return `Memoria aberta. Dona Cida liberou: ${gameState.m1_memory_target.join(' + ')}.`;
  if (!gameState.m1_fragments.length) return `Dona Cida pediu: ${gameState.m1_memory_target.join(' + ')}.`;
  return `Voce juntou: ${gameState.m1_fragments.join(' + ')}. Compare com o pedido dela antes de destravar o caderno.`;
}

function getLabPrompt() {
  const { pulse, texture, light } = gameState.m2_lab_choices;
  if (gameState.m2_lab_unlocked) return `Reator estabilizado com ${gameState.m2_lab_target.pulse}, ${gameState.m2_lab_target.texture} e ${gameState.m2_lab_target.light}.`;
  if (!pulse || !texture || !light) return `Caua quer ${gameState.m2_lab_target.pulse}, ${gameState.m2_lab_target.texture} e ${gameState.m2_lab_target.light}.`;
  return `Painel montado: pulso ${pulse}, textura ${texture} e luz ${light}. Teste a combinacao para liberar a escrita.`;
}

function getVoicePrompt() {
  const { rhythm, tone, gesture } = gameState.m3_voice_choices;
  if (gameState.m3_voice_unlocked) return `Mural ativado com ritmo ${gameState.m3_voice_target.rhythm}, tom ${gameState.m3_voice_target.tone} e gesto ${gameState.m3_voice_target.gesture}.`;
  if (!rhythm || !tone || !gesture) return `Ze do Bone pediu ritmo ${gameState.m3_voice_target.rhythm}, tom ${gameState.m3_voice_target.tone} e gesto ${gameState.m3_voice_target.gesture}.`;
  return `Sua voz entrou com ritmo ${rhythm}, tom ${tone} e gesto ${gesture}. Teste se a rua responde.`;
}

function renderMemoryScene() {
  const selected = gameState.m1_fragments;
  const fragments = MEMORY_FRAGMENTS.map((fragment, index) => `
    <span class="memory-chip ${selected.includes(fragment) ? 'is-active' : ''}" style="--memory-delay:${index * 0.08}s;">
      ${escapeHtml(fragment)}
    </span>
  `).join('');

  const intensityClass = gameState.m1_memory_unlocked ? 'scene-awake scene-unlocked' : selected.length >= 1 ? 'scene-warming' : 'scene-idle';
  const prompt = gameState.m1_memory_unlocked
    ? 'Caderno destravado'
    : `Pedido de Dona Cida: ${gameState.m1_memory_target.join(' \u2022 ')}`;

  return `
    <div class="micro-scene memory-scene ${intensityClass}">
      <div class="memory-character">
        <span class="memory-head"></span>
        <span class="memory-body"></span>
      </div>
      <div class="memory-cloud">
        ${fragments}
      </div>
      ${gameState.m1_memory_unlocked ? '<div class="scene-success-badge">Memoria aberta</div>' : ''}
      <p class="micro-scene-caption">${escapeHtml(prompt)}</p>
    </div>
  `;
}

function renderLabScene() {
  const choices = gameState.m2_lab_choices;
  const activeCount = [choices.pulse, choices.texture, choices.light].filter(Boolean).length;
  const reactorClass = gameState.m2_lab_unlocked ? 'scene-awake scene-unlocked' : activeCount > 0 ? 'scene-warming' : 'scene-idle';

  return `
    <div class="micro-scene lab-scene ${reactorClass}">
      <div class="lab-core">
        <span class="lab-ring ring-1"></span>
        <span class="lab-ring ring-2"></span>
        <span class="lab-ring ring-3"></span>
        <span class="lab-center">${escapeHtml(String(activeCount))}/3</span>
      </div>
      <div class="lab-readouts">
        <p><strong>Alvo:</strong> ${escapeHtml(`${gameState.m2_lab_target.pulse} \u2022 ${gameState.m2_lab_target.texture} \u2022 ${gameState.m2_lab_target.light}`)}</p>
        <p><strong>Pulso:</strong> ${escapeHtml(choices.pulse || 'pendente')}</p>
        <p><strong>Textura:</strong> ${escapeHtml(choices.texture || 'pendente')}</p>
        <p><strong>Luz:</strong> ${escapeHtml(choices.light || 'pendente')}</p>
      </div>
      ${gameState.m2_lab_unlocked ? '<div class="scene-success-badge">Reator liberado</div>' : ''}
    </div>
  `;
}

function renderVoiceScene() {
  const choices = gameState.m3_voice_choices;
  const activeCount = [choices.rhythm, choices.tone, choices.gesture].filter(Boolean).length;
  const sceneClass = gameState.m3_voice_unlocked ? 'scene-awake scene-unlocked' : activeCount > 0 ? 'scene-warming' : 'scene-idle';
  const bars = [1, 2, 3, 4, 5].map((index) => `
    <span class="voice-bar ${activeCount >= 1 ? 'is-rhythm' : ''} ${activeCount >= 2 ? 'is-tone' : ''} ${activeCount >= 3 ? 'is-gesture' : ''}" style="--voice-delay:${index * 0.09}s; --voice-height:${18 + index * 8}px;"></span>
  `).join('');

  return `
    <div class="micro-scene voice-scene ${sceneClass}">
      <div class="voice-wall">
        <span class="voice-tag tag-rhythm">${escapeHtml(choices.rhythm || 'ritmo')}</span>
        <span class="voice-tag tag-tone">${escapeHtml(choices.tone || 'tom')}</span>
        <span class="voice-tag tag-gesture">${escapeHtml(choices.gesture || 'gesto')}</span>
      </div>
      <div class="voice-wave">
        ${bars}
      </div>
      ${gameState.m3_voice_unlocked ? '<div class="scene-success-badge">Mural aceso</div>' : ''}
      <p class="micro-scene-caption">${escapeHtml(`Pedido da rua: ${gameState.m3_voice_target.rhythm} \u2022 ${gameState.m3_voice_target.tone} \u2022 ${gameState.m3_voice_target.gesture}`)}</p>
    </div>
  `;
}

function getGameData() {
  const now = new Date();
  const scoreboard = buildWritingScoreboard();
  return {
    timestamp: now.toLocaleString('pt-BR'),
    nickname: gameState.profile ? gameState.profile.nome : 'Viajante',
    place: gameState.profile ? gameState.profile.territorio : 'Desconhecido',
    email: gameState.profile && gameState.profile.email ? gameState.profile.email : '',
    points_vivencia: gameState.points.vivencia,
    points_imaginacao: gameState.points.imaginacao,
    points_territorio: gameState.points.territorio,
    points_total: getTotalPoints(),
    text_m1: gameState.m1_text || '',
    text_m2_poem: gameState.m2_image_poem || '',
    text_m2_verse: gameState.m2_user_verse || '',
    text_m3: gameState.m3_new_verse || '',
    text_lit_fugaz: gameState.lit_fugaz_text || '',
    text_tematica_theme: gameState.tematica_chosen || '',
    text_tematica: gameState.tematica_text || '',
    missions_completed: getCompletedMissionCount(),
    milestone100: gameState.milestone100,
    word_challenge_completed: gameState.wordChallengeCompleted,
    city_maze_completed: gameState.cityMazeCompleted,
    writing_scoreboard: scoreboard,
    writing_score_summary: formatScoreSummary(scoreboard),
    encountered_npcs: getNpcRoster().map((npc) => ({
      missionId: npc.missionId,
      type: npc.type,
      state: getNpcVisualState(npc)
    }))
  };
}

// Gera e baixa um arquivo DOC (compat\u00edvel com Word)
function saveToDoc(data) {
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
    "xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'> " +
    "<head><meta charset='utf-8'><title>Jornada do Territ\u00f3rio</title></head><body>";
  const footer = "</body></html>";

  // Cordel 2.0 logo as base64 (you can replace this with the actual logo)
  const cordelLogo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGF0lEQVR4nO2dT2wbRRTGv7U3TuI/TdM0adI2SUvbNKSlQIFSQUGIIiQOSBw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAgQMHDhw4cODAg';

  const content = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${cordelLogo}" alt="Cordel 2.0" style="width: 80px; height: 80px;" />
      </div>
      <h1 style="text-align: center;">Registro de Jornada: ${data.nickname}</h1>
      <p><strong>Data:</strong> ${data.timestamp}</p>
      <p><strong>Lugar:</strong> ${data.place}</p>
      <hr>
      <h2>Pontua\u00e7\u00e3o</h2>
      <ul>
          <li>Viv\u00eancia: ${data.points_vivencia}</li>
          <li>Imagina\u00e7\u00e3o: ${data.points_imaginacao}</li>
          <li>Territ\u00f3rio: ${data.points_territorio}</li>
          <li>Total no game: ${data.points_total}</li>
      </ul>
      <h2>Placar da Escrita</h2>
      <p>${data.writing_score_summary}</p>
      <p><strong>Referencias encontradas:</strong> ${(data.writing_scoreboard.totals.referencesFound || []).join(', ') || 'Nenhuma referencia detectada ainda'}</p>
      <hr>
      <h2>Produ\u00e7\u00f5es Textuais</h2>
      <h3>1. Viv\u00eancia</h3>
      <p>${data.text_m1}</p>
      
      <h3>2. Imagem-Poema</h3>
      <p><strong>Imagem:</strong> ${data.text_m2_poem}</p>
      <p><strong>Verso:</strong> ${data.text_m2_verse}</p>
      
      <h3>3. Inscri\u00e7\u00e3o Territorial</h3>
      <p>${data.text_m3}</p>
      
      <h3>4. Encontro Fugaz</h3>
      <p>${data.text_lit_fugaz}</p>
      
      <h3>5. Desafio Tem\u00e1tico (${data.text_tematica_theme})</h3>
      <p>${data.text_tematica}</p>
      <hr>
      <h2>Mensagem Cordel 2.0</h2>
      <p>Obrigado por caminhar com a gente no Cordel 2.0. Sua escrita faz o territorio falar.</p>
      <p>Continue escrevendo, lendo cordeis, revisitando seus versos e compartilhando suas memorias com quem esta perto de voce.</p>
      <p>Se quiser seguir na jornada, volte ao jogo, refine seus textos e explore novas leituras no acervo.</p>
  `;

  const sourceHTML = header + content + footer;

  const blob = new Blob(['\ufeff', sourceHTML], {
    type: 'application/msword'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jornada_${data.nickname.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Fun\u00e7\u00e3o de Registro e Download
function downloadJourney() {
  const data = getGameData();

  // 1. Baixa o arquivo DOC para o usu\u00e1rio
  saveToDoc(data);

  // 2. Envia para o Google Sheets (mantendo o registro)
  showDialog('Seu registro foi baixado em .doc no seu dispositivo.');
}

function syncJourney() {
  const data = getGameData();

  if (!data.email) {
    showDialog('Cadastre um e-mail no seu perfil para receber os textos e registrar a jornada na nuvem.');
    return;
  }

  requestCloudSync(data)
    .then((result) => {
      const payload = result && result.payload ? result.payload : {};
      const scoreText = typeof payload.writingScore === 'number' ? ` Placar validado: ${payload.writingScore} pontos.` : '';
      const mailText = payload.mailStatus === 'sent' ? ` Os textos foram encaminhados para ${data.email}.` : '';
      return showDialog(`Sincronizacao concluida com sucesso.${scoreText}${mailText}`);
    })
    .catch(err => {
      console.error('Erro ao enviar para planilha:', err);
      showDialog('N\u00e3o foi poss\u00edvel sincronizar agora. Verifique sua conex\u00e3o e tente novamente.');
    });
}

// Fun\u00e7\u00e3o para envio autom\u00e1tico para o Google Sheets
let appsScriptListenerReady = false;
const pendingAppsScriptRequests = new Map();
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby3v0Iy6ubR33mXcyaDUtFHdHsEwUvDyw7t2k-PHCNoH2FTCxNHpsFAeWVwTn1XLZVE4Q/exec';
const APPS_SCRIPT_ALLOWED_MESSAGE_HOSTS = [
  'script.google.com',
  'script.googleusercontent.com'
];

function isAllowedAppsScriptOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return APPS_SCRIPT_ALLOWED_MESSAGE_HOSTS.some((allowedHost) => {
      if (host === allowedHost) return true;
      return new RegExp(`(^|[.-])${allowedHost.replace(/\./g, '\\.')}$`).test(host);
    });
  } catch (error) {
    return false;
  }
}

function ensureAppsScriptMessageListener() {
  if (appsScriptListenerReady) return;

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || typeof data !== 'object' || !data.requestId) return;

    const pending = pendingAppsScriptRequests.get(data.requestId);
    if (!pending) return;
    if (!isAllowedAppsScriptOrigin(event.origin)) return;

    pendingAppsScriptRequests.delete(data.requestId);
    if (pending.cleanup) pending.cleanup();

    if (data.payload && data.payload.status === 'error') {
      pending.reject(new Error(data.payload.message || 'Erro ao receber resposta do Apps Script.'));
      return;
    }

    pending.resolve(data);
  });

  appsScriptListenerReady = true;
}

function requestAppsScriptViaIframe(payload) {
  const scriptUrl = APPS_SCRIPT_WEB_APP_URL;

  if (!scriptUrl || scriptUrl === 'COLE_SUA_URL_DO_WEB_APP_AQUI') {
    return Promise.reject(new Error('URL do Google Sheets n\u00e3o configurada.'));
  }

  ensureAppsScriptMessageListener();

  return new Promise((resolve, reject) => {
    const requestId = `apps-script-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement('iframe');
    const form = document.createElement('form');
    const timeoutId = window.setTimeout(() => {
      pendingAppsScriptRequests.delete(requestId);
      cleanup();
      reject(new Error('Tempo limite excedido ao aguardar resposta do Apps Script.'));
    }, 30000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      iframe.remove();
      form.remove();
    };

    iframe.name = requestId;
    iframe.style.display = 'none';

    form.method = 'POST';
    form.action = scriptUrl;
    form.target = requestId;
    form.style.display = 'none';

    [
      {
        name: 'payload',
        value: JSON.stringify({
          ...payload,
          parentOrigin: window.location.origin,
          appUrl: window.location.href
        })
      },
      { name: 'transport', value: 'iframe' },
      { name: 'requestId', value: requestId }
    ].forEach((entry) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entry.name;
      input.value = entry.value;
      form.appendChild(input);
    });

    pendingAppsScriptRequests.set(requestId, {
      resolve,
      reject,
      cleanup
    });
    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}

function requestCloudSync(data) {
  const payload = { action: 'sync_game', ...data };
  return requestAppsScriptViaIframe(payload);
}

function createCloudSpreadsheet(name = 'Cordel 2.0 | Escritos do Game') {
  return requestAppsScriptViaIframe({ action: 'create_sheet', name });
}

// Controles pelo teclado
window.addEventListener('keydown', (e) => {
  const currentScreenIsMap = document.querySelector('.map-grid');
  const currentScreenIsMaze = document.getElementById('city-maze-grid');
  const typing = isTypingField(e.target);
  const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const interactionKeys = [' ', 'Enter'];

  if (!movementKeys.includes(e.key) && !interactionKeys.includes(e.key)) return;

  if (currentScreenIsMap && !currentScreenIsMaze) {
    e.preventDefault();
    if (typing) return;

    if (interactionKeys.includes(e.key)) {
      interactWithNearbyNpc();
      return;
    }

    if (e.key === 'ArrowUp') step(0, -1);
    if (e.key === 'ArrowDown') step(0, 1);
    if (e.key === 'ArrowLeft') step(-1, 0);
    if (e.key === 'ArrowRight') step(1, 0);
  } else if (currentScreenIsMaze) {
    e.preventDefault();
    if (typing) return;
    if (interactionKeys.includes(e.key)) return;

    if (e.key === 'ArrowUp') moveMaze(0, -1);
    if (e.key === 'ArrowDown') moveMaze(0, 1);
    if (e.key === 'ArrowLeft') moveMaze(-1, 0);
    if (e.key === 'ArrowRight') moveMaze(1, 0);
  }
});

// INICIALIZA\u00c7\u00c3O
let resizeTimeoutId = null;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeoutId);
  resizeTimeoutId = setTimeout(() => {
    if (gameState.currentScreen === 'world_map') {
      renderMapScreen();
      updateHUD();
      return;
    }

    if (gameState.currentScreen === 'city_maze') {
      drawCityMaze();
    }
  }, 120);
});

window.onload = () => {
  loadGame();
  updateHUD();
  navigateTo(getResumeScreen());
};
