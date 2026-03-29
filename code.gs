var APP_CONFIG = {
  propertiesKey: 'CORDEL20_WRITING_SHEET_ID',
  defaultSpreadsheetName: 'Cordel 2.0 | Escritos do Game',
  writingsSheetName: 'Escritos',
  rankingSheetName: 'Ranking',
  institutionalSignature: 'Cordel 2.0',
  institutionalReplyTo: 'contato@cordel2pontozero.com'
};

var AUTHOR_REFERENCE_RULES = [
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

var WRITINGS_HEADERS = [
  'timestamp',
  'nickname',
  'email',
  'place',
  'points_total',
  'points_vivencia',
  'points_imaginacao',
  'points_territorio',
  'writing_score_total',
  'writing_extension_points',
  'writing_rhyme_points',
  'writing_subject_points',
  'writing_adjective_points',
  'writing_reference_points',
  'writing_structure_points',
  'references_found',
  'missions_completed',
  'milestone100',
  'word_challenge_completed',
  'city_maze_completed',
  'text_m1',
  'text_m2_poem',
  'text_m2_verse',
  'text_m3',
  'text_lit_fugaz',
  'text_tematica_theme',
  'text_tematica',
  'writing_entries_json',
  'encountered_npcs_json',
  'mail_status'
];

var RANKING_HEADERS = [
  'nickname',
  'email',
  'place',
  'latest_timestamp',
  'best_writing_score',
  'best_game_score',
  'references_found',
  'missions_completed',
  'last_sync_status'
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'status';

  if (action === 'create_sheet') {
    var name = (e && e.parameter && e.parameter.name) || '';
    var spreadsheet = createWritingSpreadsheet_(name);
    return createJsonResponse_({
      status: 'success',
      action: 'create_sheet',
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl()
    });
  }

  var spreadsheet = ensureSpreadsheet_();
  return createJsonResponse_({
    status: 'success',
    action: 'status',
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheetName: spreadsheet.getName()
  });
}

function doPost(e) {
  var payload;
  try {
    payload = parseRequestPayload_(e);
    var action = payload.action || 'sync_game';
    var responsePayload;

    if (action === 'create_sheet') {
      var spreadsheet = createWritingSpreadsheet_(payload.name || '');
      responsePayload = {
        status: 'success',
        action: 'create_sheet',
        spreadsheetId: spreadsheet.getId(),
        spreadsheetUrl: spreadsheet.getUrl()
      };
      return createResponse_(responsePayload, payload);
    }

    var normalized = normalizePayload_(payload);
    var scoreboard = scorePayloadWritings_(normalized);
    var spreadsheetForSync = ensureSpreadsheet_();
    var writingsSheet = ensureSheetWithHeaders_(spreadsheetForSync, APP_CONFIG.writingsSheetName, WRITINGS_HEADERS);
    var rankingSheet = ensureSheetWithHeaders_(spreadsheetForSync, APP_CONFIG.rankingSheetName, RANKING_HEADERS);
    var mailStatus = sendInstitutionalEmail_(normalized, scoreboard);

    appendWritingRow_(writingsSheet, normalized, scoreboard, mailStatus);
    upsertRankingRow_(rankingSheet, normalized, scoreboard, mailStatus);

    responsePayload = {
      status: 'success',
      action: 'sync_game',
      spreadsheetId: spreadsheetForSync.getId(),
      spreadsheetUrl: spreadsheetForSync.getUrl(),
      writingScore: scoreboard.totals.total,
      writingBreakdown: scoreboard.totals,
      referencesFound: scoreboard.totals.referencesFound,
      mailStatus: mailStatus
    };
    return createResponse_(responsePayload, payload);
  } catch (error) {
    return createResponse_({
      status: 'error',
      message: error && error.message ? error.message : String(error)
    }, payload || {});
  }
}

function createOrResetWritingSpreadsheet(name) {
  var spreadsheet = createWritingSpreadsheet_(name || '');
  Logger.log('Planilha criada: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function createWritingSpreadsheet_(name) {
  var spreadsheetName = name || APP_CONFIG.defaultSpreadsheetName;
  var spreadsheet = SpreadsheetApp.create(spreadsheetName);
  PropertiesService.getScriptProperties().setProperty(APP_CONFIG.propertiesKey, spreadsheet.getId());
  ensureSheetWithHeaders_(spreadsheet, APP_CONFIG.writingsSheetName, WRITINGS_HEADERS);
  ensureSheetWithHeaders_(spreadsheet, APP_CONFIG.rankingSheetName, RANKING_HEADERS);
  return spreadsheet;
}

function ensureSpreadsheet_() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(APP_CONFIG.propertiesKey);

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      properties.deleteProperty(APP_CONFIG.propertiesKey);
    }
  }

  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      properties.setProperty(APP_CONFIG.propertiesKey, active.getId());
      return active;
    }
  } catch (error) {
    // Ignore and create a new spreadsheet below.
  }

  return createWritingSpreadsheet_('');
}

function ensureSheetWithHeaders_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }

  var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (existingHeaders.join('|') !== headers.join('|')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function parseRequestPayload_(e) {
  if (!e) {
    throw new Error('Requisicao vazia.');
  }

  if (e.parameter && e.parameter.payload) {
    var payloadFromParam = JSON.parse(e.parameter.payload);
    if (e.parameter.transport) payloadFromParam.transport = e.parameter.transport;
    if (e.parameter.requestId) payloadFromParam.requestId = e.parameter.requestId;
    return payloadFromParam;
  }

  if (e.parameters && e.parameters.payload && e.parameters.payload[0]) {
    var payloadFromParams = JSON.parse(e.parameters.payload[0]);
    if (e.parameters.transport && e.parameters.transport[0]) payloadFromParams.transport = e.parameters.transport[0];
    if (e.parameters.requestId && e.parameters.requestId[0]) payloadFromParams.requestId = e.parameters.requestId[0];
    return payloadFromParams;
  }

  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }

  throw new Error('Payload invalido ou ausente.');
}

function normalizePayload_(payload) {
  var safePayload = payload || {};
  return {
    timestamp: safePayload.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'),
    nickname: safePayload.nickname || 'Viajante',
    email: safePayload.email || '',
    place: safePayload.place || 'Desconhecido',
    points_total: Number(safePayload.points_total || 0),
    points_vivencia: Number(safePayload.points_vivencia || 0),
    points_imaginacao: Number(safePayload.points_imaginacao || 0),
    points_territorio: Number(safePayload.points_territorio || 0),
    missions_completed: Number(safePayload.missions_completed || 0),
    milestone100: !!safePayload.milestone100,
    word_challenge_completed: !!safePayload.word_challenge_completed,
    city_maze_completed: !!safePayload.city_maze_completed,
    text_m1: safePayload.text_m1 || '',
    text_m2_poem: safePayload.text_m2_poem || '',
    text_m2_verse: safePayload.text_m2_verse || '',
    text_m3: safePayload.text_m3 || '',
    text_lit_fugaz: safePayload.text_lit_fugaz || '',
    text_tematica_theme: safePayload.text_tematica_theme || '',
    text_tematica: safePayload.text_tematica || '',
    encountered_npcs: safePayload.encountered_npcs || []
  };
}

function scorePayloadWritings_(payload) {
  var entries = [
    { id: 'world1_m1', label: 'Despertar da Vivencia', text: payload.text_m1 },
    { id: 'world1_m2', label: 'Verso do laboratorio', text: [payload.text_m2_poem, payload.text_m2_verse].filter(Boolean).join('\n') },
    { id: 'world1_m3', label: 'Inscricao territorial', text: payload.text_m3 },
    { id: 'lit_fugaz', label: 'Encontro fugaz', text: payload.text_lit_fugaz },
    { id: 'tematica', label: payload.text_tematica_theme ? 'Desafio tematico: ' + payload.text_tematica_theme : 'Desafio tematico', text: payload.text_tematica }
  ].map(function(entry) {
    entry.score = scoreSingleWriting_(entry.text);
    return entry;
  });

  var totals = {
    total: 0,
    extension: 0,
    rhymes: 0,
    subjects: 0,
    adjectives: 0,
    references: 0,
    structure: 0,
    referencesFound: []
  };

  var referenceMap = {};

  entries.forEach(function(entry) {
    totals.total += entry.score.total;
    totals.extension += entry.score.breakdown.extension;
    totals.rhymes += entry.score.breakdown.rhymes;
    totals.subjects += entry.score.breakdown.subjects;
    totals.adjectives += entry.score.breakdown.adjectives;
    totals.references += entry.score.breakdown.references;
    totals.structure += entry.score.breakdown.structure;
    entry.score.references.forEach(function(reference) {
      referenceMap[reference] = true;
    });
  });

  totals.referencesFound = Object.keys(referenceMap);

  return {
    entries: entries,
    totals: totals,
    summary: 'Placar da escrita: ' + totals.total + ' pts | Extensao ' + totals.extension + ' | Rimas ' + totals.rhymes + ' | Sujeitos ' + totals.subjects + ' | Adjetivos ' + totals.adjectives + ' | Referencias ' + totals.references + ' | Estrutura ' + totals.structure
  };
}

function scoreSingleWriting_(text) {
  var rawText = (text || '').trim();
  var words = splitWords_(rawText);
  var lineCount = rawText ? rawText.split(/\n+/).filter(function(line) { return line.trim(); }).length : 0;
  var rhymeGroups = countRhymeGroups_(rawText);
  var subjects = countSubjectLikeWords_(words);
  var adjectives = countAdjectiveLikeWords_(words);
  var references = extractAuthorReferences_(rawText);

  var extensionPoints = Math.min(12, Math.floor(words.length / 8));
  var rhymePoints = Math.min(8, rhymeGroups * 4);
  var subjectPoints = Math.min(6, subjects * 2);
  var adjectivePoints = Math.min(6, adjectives * 2);
  var referencePoints = Math.min(8, references.length * 4);
  var structurePoints = lineCount >= 3 ? 4 : lineCount >= 2 ? 2 : 0;

  return {
    wordCount: words.length,
    lineCount: lineCount,
    rhymeGroups: rhymeGroups,
    subjects: subjects,
    adjectives: adjectives,
    references: references,
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

function normalizeForAnalysis_(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s\n]/g, ' ');
}

function splitWords_(text) {
  return normalizeForAnalysis_(text).split(/\s+/).filter(function(word) { return word; });
}

function countRhymeGroups_(text) {
  var lines = (text || '')
    .split(/\n+/)
    .map(function(line) { return normalizeForAnalysis_(line).trim(); })
    .filter(function(line) { return line; });

  if (lines.length < 2) {
    return 0;
  }

  var counts = {};
  lines.forEach(function(line) {
    var parts = line.split(/\s+/).filter(function(word) { return word; });
    if (!parts.length) {
      return;
    }
    var ending = parts[parts.length - 1].slice(-3);
    if (ending.length < 2) {
      return;
    }
    counts[ending] = (counts[ending] || 0) + 1;
  });

  return Object.keys(counts).filter(function(ending) {
    return counts[ending] >= 2;
  }).length;
}

function countSubjectLikeWords_(words) {
  var subjectHints = {
    eu: true, tu: true, ela: true, ele: true, nos: true, eles: true, elas: true,
    voce: true, gente: true, povo: true, rua: true, bairro: true, laje: true,
    feira: true, cidade: true, quebrada: true, territorio: true, muro: true,
    corpo: true, voz: true
  };

  return words.filter(function(word) {
    return !!subjectHints[word];
  }).length;
}

function countAdjectiveLikeWords_(words) {
  return words.filter(function(word) {
    return /(oso|osa|vel|veis|ante|entes|al|ais|iva|ivo|ado|ada|ente|ino|ina|ico|ica|eira|eiro)$/.test(word);
  }).length;
}

function extractAuthorReferences_(text) {
  var normalized = normalizeForAnalysis_(text);
  return AUTHOR_REFERENCE_RULES
    .filter(function(rule) {
      return rule.patterns.some(function(pattern) {
        return normalized.indexOf(pattern) >= 0;
      });
    })
    .map(function(rule) { return rule.name; });
}

function appendWritingRow_(sheet, payload, scoreboard, mailStatus) {
  sheet.appendRow([
    payload.timestamp,
    payload.nickname,
    payload.email,
    payload.place,
    payload.points_total,
    payload.points_vivencia,
    payload.points_imaginacao,
    payload.points_territorio,
    scoreboard.totals.total,
    scoreboard.totals.extension,
    scoreboard.totals.rhymes,
    scoreboard.totals.subjects,
    scoreboard.totals.adjectives,
    scoreboard.totals.references,
    scoreboard.totals.structure,
    scoreboard.totals.referencesFound.join(', '),
    payload.missions_completed,
    payload.milestone100,
    payload.word_challenge_completed,
    payload.city_maze_completed,
    payload.text_m1,
    payload.text_m2_poem,
    payload.text_m2_verse,
    payload.text_m3,
    payload.text_lit_fugaz,
    payload.text_tematica_theme,
    payload.text_tematica,
    JSON.stringify(scoreboard.entries),
    JSON.stringify(payload.encountered_npcs || []),
    mailStatus
  ]);
}

function upsertRankingRow_(sheet, payload, scoreboard, mailStatus) {
  var data = sheet.getDataRange().getValues();
  var matchRow = -1;

  for (var i = 1; i < data.length; i += 1) {
    if (String(data[i][0]).toLowerCase() === String(payload.nickname).toLowerCase() &&
        String(data[i][1]).toLowerCase() === String(payload.email).toLowerCase()) {
      matchRow = i + 1;
      break;
    }
  }

  var rowValues = [[
    payload.nickname,
    payload.email,
    payload.place,
    payload.timestamp,
    scoreboard.totals.total,
    payload.points_total,
    scoreboard.totals.referencesFound.join(', '),
    payload.missions_completed,
    mailStatus
  ]];

  if (matchRow === -1) {
    sheet.appendRow(rowValues[0]);
    return;
  }

  var currentBestWriting = Number(sheet.getRange(matchRow, 5).getValue() || 0);
  var currentBestGame = Number(sheet.getRange(matchRow, 6).getValue() || 0);
  rowValues[0][4] = Math.max(currentBestWriting, scoreboard.totals.total);
  rowValues[0][5] = Math.max(currentBestGame, payload.points_total);
  sheet.getRange(matchRow, 1, 1, rowValues[0].length).setValues(rowValues);
}

function sendInstitutionalEmail_(payload, scoreboard) {
  if (!payload.email) {
    return 'skipped:no-email';
  }

  var subject = 'Cordel 2.0 | Sua jornada de escrita continua';
  var body = [
    'Ola, ' + payload.nickname + '.',
    '',
    'A equipe do Cordel 2.0 agradece por seguir escrevendo conosco.',
    'Seu territorio, sua memoria e sua leitura estao vivos neste percurso.',
    '',
    scoreboard.summary,
    scoreboard.totals.referencesFound.length ? 'Referencias detectadas: ' + scoreboard.totals.referencesFound.join(', ') : 'Referencias detectadas: nenhuma ainda.',
    '',
    'Seus textos:',
    '',
    '1. Despertar da Vivencia',
    payload.text_m1 || '-',
    '',
    '2. Imagem-Poema',
    payload.text_m2_poem || '-',
    payload.text_m2_verse || '-',
    '',
    '3. Inscricao Territorial',
    payload.text_m3 || '-',
    '',
    '4. Encontro Fugaz',
    payload.text_lit_fugaz || '-',
    '',
    '5. Desafio Tematico (' + (payload.text_tematica_theme || 'sem tema') + ')',
    payload.text_tematica || '-',
    '',
    'Continue escrevendo, lendo cordel e voltando ao jogo para aprofundar seus versos.',
    'Nos vemos na proxima jornada.',
    '',
    APP_CONFIG.institutionalSignature
  ].join('\n');

  MailApp.sendEmail({
    to: payload.email,
    subject: subject,
    body: body,
    name: APP_CONFIG.institutionalSignature,
    noReply: true,
    replyTo: APP_CONFIG.institutionalReplyTo
  });

  return 'sent';
}

function createJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function createIframeResponse_(payload, requestPayload) {
  var requestId = requestPayload && requestPayload.requestId ? String(requestPayload.requestId) : '';
  var html = ''
    + '<!DOCTYPE html><html><body><script>'
    + 'var message = ' + JSON.stringify({
      requestId: requestId,
      payload: payload
    }) + ';'
    + 'if (window.parent) { window.parent.postMessage(message, "*"); }'
    + '</script></body></html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createResponse_(payload, requestPayload) {
  if (requestPayload && requestPayload.transport === 'iframe') {
    return createIframeResponse_(payload, requestPayload);
  }
  return createJsonResponse_(payload);
}
