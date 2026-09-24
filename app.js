/**
 * SP ENGENHARIA 360° - CLIENT JAVASCRIPT APPLICATION (V2 - FULL MATCHING & SCORING)
 * Author: Senior Data Science & Engineering
 */

// Application State
const state = {
  allObras: [],
  filteredObras: [],
  summary: null,
  charts: {},
  activeTab: 'overview',
  viewMode: 'table',
  currentPage: 1,
  pageSize: 25,
  filters: {
    search: '',
    setor: '',
    fase: '',
    statusB2B: '',
    qualidade: '',
    municipio: '',
    sort: 'capex_desc'
  },
  currentModalObra: null
  ,crmPipeline: [],
  draggedCrmId: null,
  currentRfqObra: null,
  crmSearch: '',
  geoMap: null,
  geoLayer: null
};

// DOM Elements
const elements = {
  loadingOverlay: document.getElementById('loadingOverlay'),
  globalSearch: document.getElementById('globalSearch'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  headerCapex: document.getElementById('headerCapex'),
  btnExportCsv: document.getElementById('btnExportCsv'),
  btnExportSweetSpot: document.getElementById('btnExportSweetSpot'),
  btnResetFilters: document.getElementById('btnResetFilters'),
  btnFilterMegaObras: document.getElementById('btnFilterMegaObras'),
  
  // Tabs
  navTabs: document.querySelectorAll('.nav-tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  tabCountObras: document.getElementById('tabCountObras'),
  tabCountSweetSpot: document.getElementById('tabCountSweetSpot'),

  // Filters
  filterSetor: document.getElementById('filterSetor'),
  filterFase: document.getElementById('filterFase'),
  filterStatusB2B: document.getElementById('filterStatusB2B'),
  filterQualidade: document.getElementById('filterQualidade'),
  filterMunicipio: document.getElementById('filterMunicipio'),
  filterSort: document.getElementById('filterSort'),
  activeFilterBadge: document.getElementById('activeFilterBadge'),

  // Views & Counters
  displayedCount: document.getElementById('displayedCount'),
  totalFilteredCount: document.getElementById('totalFilteredCount'),
  filteredCapexSum: document.getElementById('filteredCapexSum'),
  btnViewCards: document.getElementById('btnViewCards'),
  btnViewTable: document.getElementById('btnViewTable'),
  obrasGrid: document.getElementById('obrasGrid'),
  obrasTableContainer: document.getElementById('obrasTableContainer'),
  obrasMainTableBody: document.getElementById('obrasMainTableBody'),

  // Pagination
  btnPrevPage: document.getElementById('btnPrevPage'),
  btnNextPage: document.getElementById('btnNextPage'),
  pageIndicator: document.getElementById('pageIndicator'),

  // Tables
  tbodyTopMegaObras: document.getElementById('tbodyTopMegaObras'),
  tbodySweetSpot: document.getElementById('tbodySweetSpot'),
  tbodyRegional: document.getElementById('tbodyRegional'),
  tbodySuppliersCategories: document.getElementById('tbodySuppliersCategories'),

  // Modal
  obraModal: document.getElementById('obraModal'),
  btnModalClose: document.getElementById('btnModalClose'),
  btnModalCloseFooter: document.getElementById('btnModalCloseFooter'),
  btnModalCopyDossie: document.getElementById('btnModalCopyDossie'),

  // Toast
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMsg')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadData();
});

// Load JSON data
async function loadData() {
  try {
    const res = await fetch('data/obras_data.json');
    const data = await res.json();
    
    // Compatibilidade com a base mestre: o arquivo pode ser um array de
    // registros brutos ou o envelope antigo { obras, summary }.
    const rawObras = Array.isArray(data) ? data : (data.obras || []);
    state.allObras = rawObras.map(normalizeObraRecord);
    state.summary = (!Array.isArray(data) && data.summary)
      ? data.summary
      : buildSummary(state.allObras);
    state.filteredObras = [...state.allObras];

    populateFilterOptions();
    renderOverviewKPIs();
    initCharts();
    renderTopMegaObras();
    renderSweetSpotTab();
    initCrm();
    renderRegionalTab();
    renderSuppliersTab();
    applyFilters();

    // Hide Loading
    setTimeout(() => {
      elements.loadingOverlay.classList.add('hidden');
      lucide.createIcons();
    }, 400);

  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Erro ao carregar dados. Verifique a pasta data/obras_data.json.');
  }
}

function normalizeObraRecord(o) {
  const splitItems = value => String(value || '')
    .split(/\s*;\s*(?:\r?\n)?/)
    .map(x => x.trim())
    .filter(Boolean);
  const num = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return {
    ...o,
    id: String(o.id ?? o.obra_id ?? ''),
    nome: String(o.nome ?? o.obra_nome ?? ''),
    desc: String(o.desc ?? o.descricao_obra ?? o.descricao_publica ?? ''),
    muni: String(o.muni ?? o.municipio_normalizado ?? o.municipio ?? 'NÃO INFORMADO'),
    setor: String(o.setor || 'OUTROS'),
    fase_real: String(o.fase_real ?? o.fase_real_obra ?? 'NAO_INFORMADA'),
    capex: num(o.capex ?? o.capex_ajustado_brl ?? o.capex_num),
    capex_fmt: String(o.capex_fmt ?? o.capex_ajustado_formatado ?? o.valor_formatado ?? 'R$ 0'),
    contratante: String(o.contratante ?? o.empresa_contratante ?? ''),
    executora: String(o.executora ?? o.empresa_executora ?? ''),
    status_b2b: String(o.status_b2b ?? o.status_marketplace_b2b ?? ''),
    qualidade: String(o.qualidade ?? o.classificacao_nivel_qualidade ?? ''),
    lead_score: num(o.lead_score),
    total_decisores: num(o.total_decisores ?? o.total_decisores_mapeados),
    dec_principal_nome: String(o.dec_principal_nome ?? o.decisor_principal_nome ?? ''),
    dec_principal_cargo: String(o.dec_principal_cargo ?? o.decisor_principal_cargo ?? ''),
    dec_principal_email: String(o.dec_principal_email ?? o.decisor_principal_email ?? ''),
    dec_principal_tel: String(o.dec_principal_tel ?? o.decisor_principal_telefone ?? ''),
    dec_principal_lkd: String(o.dec_principal_lkd ?? o.decisor_principal_linkedin ?? ''),
    decisores_lista: Array.isArray(o.decisores_lista)
      ? o.decisores_lista
      : splitItems(o.decisores_lista_completa || o.decisores_resumo_estruturado),
    score_max: num(o.score_max ?? o.score_compatibilidade_max),
    demanda_insumos_mi: num(o.demanda_insumos_mi ?? o.demanda_estimada_insumos_matches_mi),
    matches_mdo: Array.isArray(o.matches_mdo) ? o.matches_mdo : splitItems(o.top_matches_mao_de_obra),
    matches_mat: Array.isArray(o.matches_mat) ? o.matches_mat : splitItems(o.top_matches_insumos_materiais),
    data_pub: String(o.data_pub ?? o.data_publicacao_edital ?? ''),
    data_anuncio: String(o.data_anuncio || ''),
    fonte_primaria: String(o.fonte_primaria || ''),
    url_fonte: String(o.url_fonte || '')
  };
}

function buildSummary(obras) {
  const countBy = key => obras.reduce((acc, obra) => {
    const value = obra[key] || 'NÃO INFORMADO';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const municipioDist = countBy('muni');
  const topMunicipios = Object.fromEntries(
    Object.entries(municipioDist).sort((a, b) => b[1] - a[1]).slice(0, 12)
  );
  return {
    total_obras: obras.length,
    total_capex_bi: (obras.reduce((sum, obra) => sum + obra.capex, 0) / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
    obras_com_decisores: obras.filter(obra => obra.total_decisores > 0).length,
    sweet_spot_ouro: obras.filter(obra => obra.status_b2b.startsWith('1_')).length,
    fase_dist: countBy('fase_real'),
    setor_dist: countBy('setor'),
    top_municipios: topMunicipios
  };
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Search input with debounce
  let debounceTimeout;
  elements.globalSearch.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      state.filters.search = e.target.value.trim().toLowerCase();
      elements.clearSearchBtn.classList.toggle('active', state.filters.search.length > 0);
      state.currentPage = 1;
      applyFilters();
    }, 200);
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.globalSearch.value = '';
    state.filters.search = '';
    elements.clearSearchBtn.classList.remove('active');
    state.currentPage = 1;
    applyFilters();
  });

  // Filter Dropdowns
  const filterSelects = [
    { el: elements.filterSetor, key: 'setor' },
    { el: elements.filterFase, key: 'fase' },
    { el: elements.filterStatusB2B, key: 'statusB2B' },
    { el: elements.filterQualidade, key: 'qualidade' },
    { el: elements.filterMunicipio, key: 'municipio' },
    { el: elements.filterSort, key: 'sort' }
  ];

  filterSelects.forEach(({ el, key }) => {
    if (el) {
      el.addEventListener('change', (e) => {
        state.filters[key] = e.target.value;
        state.currentPage = 1;
        applyFilters();
      });
    }
  });

  // Reset Filters
  elements.btnResetFilters.addEventListener('click', resetFilters);

  // View Toggles
  elements.btnViewCards.addEventListener('click', () => setViewMode('cards'));
  elements.btnViewTable.addEventListener('click', () => setViewMode('table'));

  // Pagination
  elements.btnPrevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderObrasView();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  });

  elements.btnNextPage.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredObras.length / state.pageSize);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderObrasView();
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  });

  // Modal Close
  elements.btnModalClose.addEventListener('click', closeModal);
  elements.btnModalCloseFooter.addEventListener('click', closeModal);
  elements.obraModal.addEventListener('click', (e) => {
    if (e.target === elements.obraModal) closeModal();
  });

  // Export Buttons
  elements.btnExportCsv.addEventListener('click', exportFilteredCsv);
  elements.btnExportSweetSpot.addEventListener('click', exportSweetSpotCsv);
  elements.btnFilterMegaObras.addEventListener('click', filterByMegaObras);

  // Copy Dossier
  elements.btnModalCopyDossie.addEventListener('click', copyModalDossie);
}

// Switch Tabs
function switchTab(tabId) {
  state.activeTab = tabId;
  elements.navTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
  elements.tabContents.forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
  if (tabId === 'crm') renderCrmPipeline();
  if (tabId === 'rfq') initRfq();
  if (tabId === 'map') initGeoMap();
  lucide.createIcons();
}

// Populate Filter Dropdowns dynamically
function populateFilterOptions() {
  const setores = new Set();
  const fases = new Set();
  const municipios = new Map();

  state.allObras.forEach(o => {
    if (o.setor) setores.add(o.setor);
    if (o.fase_real) fases.add(o.fase_real);
    if (o.muni && o.muni !== 'NÃO INFORMADO') {
      municipios.set(o.muni, (municipios.get(o.muni) || 0) + 1);
    }
  });

  // Populate Setores
  Array.from(setores).sort().forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = formatSetorName(s);
    elements.filterSetor.appendChild(opt);
  });

  // Populate Fases
  Array.from(fases).sort().forEach(f => {
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = formatFaseName(f);
    elements.filterFase.appendChild(opt);
  });

  // Populate Municipios (Sorted by frequency)
  Array.from(municipios.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .forEach(([muni, count]) => {
      const opt = document.createElement('option');
      opt.value = muni;
      opt.textContent = `${muni} (${count})`;
      elements.filterMunicipio.appendChild(opt);
    });
}

// Apply Filters & Search
function applyFilters() {
  let list = state.allObras.filter(o => {
    // Search
    if (state.filters.search) {
      const s = state.filters.search;
      const matchSearch = 
        o.nome.toLowerCase().includes(s) ||
        o.contratante.toLowerCase().includes(s) ||
        o.executora.toLowerCase().includes(s) ||
        o.muni.toLowerCase().includes(s) ||
        o.setor.toLowerCase().includes(s) ||
        o.dec_principal_nome.toLowerCase().includes(s) ||
        o.desc.toLowerCase().includes(s);
      if (!matchSearch) return false;
    }

    // Setor
    if (state.filters.setor && o.setor !== state.filters.setor) return false;

    // Fase
    if (state.filters.fase && o.fase_real !== state.filters.fase) return false;

    // Status B2B
    if (state.filters.statusB2B) {
      if (!o.status_b2b.startsWith(state.filters.statusB2B)) return false;
    }

    // Qualidade
    if (state.filters.qualidade && o.qualidade !== state.filters.qualidade) return false;

    // Município
    if (state.filters.municipio && o.muni !== state.filters.municipio) return false;

    return true;
  });

  // Sort
  list.sort((a, b) => {
    switch (state.filters.sort) {
      case 'capex_desc': return b.capex - a.capex;
      case 'capex_asc': return a.capex - b.capex;
      case 'lead_score_desc': return b.lead_score - a.lead_score;
      case 'matches_desc': return b.score_max - a.score_max;
      case 'decisores_desc': return b.total_decisores - a.total_decisores;
      case 'nome_asc': return a.nome.localeCompare(b.nome);
      default: return 0;
    }
  });

  state.filteredObras = list;

  // Update Active Filter Count Badge
  let activeCount = 0;
  if (state.filters.search) activeCount++;
  if (state.filters.setor) activeCount++;
  if (state.filters.fase) activeCount++;
  if (state.filters.statusB2B) activeCount++;
  if (state.filters.qualidade) activeCount++;
  if (state.filters.municipio) activeCount++;
  elements.activeFilterBadge.textContent = `${activeCount} ativo${activeCount !== 1 ? 's' : ''}`;

  // Update Counters
  const totalCapex = list.reduce((acc, x) => acc + (x.capex || 0), 0);
  elements.totalFilteredCount.textContent = list.length.toLocaleString('pt-BR');
  elements.filteredCapexSum.textContent = `(CAPEX Total: R$ ${(totalCapex / 1e9).toFixed(2)} Bi)`;

  renderObrasView();
}

// Reset Filters
function resetFilters() {
  state.filters = {
    search: '',
    setor: '',
    fase: '',
    statusB2B: '',
    qualidade: '',
    municipio: '',
    sort: 'capex_desc'
  };

  elements.globalSearch.value = '';
  elements.filterSetor.value = '';
  elements.filterFase.value = '';
  elements.filterStatusB2B.value = '';
  elements.filterQualidade.value = '';
  elements.filterMunicipio.value = '';
  elements.filterSort.value = 'capex_desc';
  elements.clearSearchBtn.classList.remove('active');

  state.currentPage = 1;
  applyFilters();
}

// Set View Mode (Cards or Table)
function setViewMode(mode) {
  state.viewMode = mode;
  elements.btnViewCards.classList.toggle('active', mode === 'cards');
  elements.btnViewTable.classList.toggle('active', mode === 'table');
  elements.obrasGrid.classList.toggle('hidden', mode === 'table');
  elements.obrasTableContainer.classList.toggle('hidden', mode === 'cards');
}

// Render Obras View (Cards or Table with Pagination)
function renderObrasView() {
  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  const pageItems = state.filteredObras.slice(start, end);

  elements.displayedCount.textContent = pageItems.length > 0 ? `${start + 1} - ${Math.min(end, state.filteredObras.length)}` : '0';

  // Render Cards
  elements.obrasGrid.innerHTML = pageItems.map(o => createObraCardHTML(o)).join('');

  // Render Table
  elements.obrasMainTableBody.innerHTML = pageItems.map(o => createObraTableRowHTML(o)).join('');

  // Pagination controls
  const totalPages = Math.max(1, Math.ceil(state.filteredObras.length / state.pageSize));
  elements.pageIndicator.textContent = `Página ${state.currentPage} de ${totalPages}`;
  elements.btnPrevPage.disabled = state.currentPage <= 1;
  elements.btnNextPage.disabled = state.currentPage >= totalPages;

  lucide.createIcons();
}

// Create Card HTML
function createObraCardHTML(o) {
  const badgeQual = getBadgeQualHTML(o.qualidade);
  const badgeFase = getBadgeFaseHTML(o.fase_real);
  const badgeStatusB2B = getBadgeStatusB2BHTML(o.status_b2b);

  return `
    <div class="obra-card" onclick="openObraModal('${o.id}')">
      <div>
        <div class="obra-card-header">
          <div class="obra-badges-row">
            ${badgeStatusB2B}
            ${badgeQual}
            ${badgeFase}
          </div>
        </div>

        <h4 class="obra-card-title" title="${escapeHTML(o.nome)}">${escapeHTML(o.nome)}</h4>

        <div class="obra-card-meta">
          <span><i data-lucide="map-pin"></i> ${escapeHTML(o.muni)}</span>
          <span><i data-lucide="tag"></i> ${formatSetorName(o.setor)}</span>
        </div>

        <div class="obra-capex-box">
          <span class="capex-lbl">CAPEX Estimado</span>
          <span class="capex-val">${o.capex_fmt}</span>
        </div>

        <div class="obra-entities">
          <div class="entity-row" title="${escapeHTML(o.contratante)}">
            <span class="entity-lbl">Contratante:</span>
            <span class="entity-name">${escapeHTML(o.contratante)}</span>
          </div>
          <div class="entity-row" title="${escapeHTML(o.dec_principal_nome || 'Aguardando mapeamento')}">
            <span class="entity-lbl">Decisor Líder:</span>
            <span class="entity-name">${escapeHTML(o.dec_principal_nome || 'Aguardando mapeamento')}</span>
          </div>
        </div>
      </div>

      <div class="obra-card-footer">
        <div class="decisores-summary-pill">
          <i data-lucide="users"></i>
          <span>${o.total_decisores} contato${o.total_decisores !== 1 ? 's' : ''}</span>
          ${o.score_max > 0 ? `<span class="badge badge-ouro" style="margin-left: 6px;" title="Maior score de match">Match ${o.score_max}/100</span>` : ''}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openObraModal('${o.id}')">
          <span>Dossiê</span>
          <i data-lucide="arrow-right"></i>
        </button>
      </div>
    </div>
  `;
}

// Create Table Row HTML
function createObraTableRowHTML(o) {
  return `
    <tr onclick="openObraModal('${o.id}')" style="cursor: pointer;">
      <td>${getBadgeStatusB2BHTML(o.status_b2b)}</td>
      <td style="font-weight: 600; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHTML(o.nome)}
      </td>
      <td>${formatSetorName(o.setor)}</td>
      <td>${escapeHTML(o.muni)}</td>
      <td style="color: var(--accent-emerald); font-weight: 700;">${o.capex_fmt}</td>
      <td>${getBadgeFaseHTML(o.fase_real)}</td>
      <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(o.contratante)}</td>
      <td>${escapeHTML(o.dec_principal_nome || '-')}</td>
      <td>
        ${o.score_max > 0 ? `<span class="badge badge-ouro">${o.score_max} pts</span>` : '-'}
      </td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); openObraModal('${o.id}')">
          <i data-lucide="eye"></i>
        </button>
      </td>
    </tr>
  `;
}

// Render Overview KPI Cards
function renderOverviewKPIs() {
  if (!state.summary) return;
  const s = state.summary;
  document.getElementById('kpiCapexTotal').textContent = `R$ ${s.total_capex_bi} Bilhões`;
  document.getElementById('kpiTotalObras').textContent = s.total_obras.toLocaleString('pt-BR');
  document.getElementById('kpiTotalDecisores').innerHTML = `${s.obras_com_decisores.toLocaleString('pt-BR')} <small>obras</small>`;
  document.getElementById('kpiTotalMatches').textContent = "47.504 matches";
  document.getElementById('kpiSweetSpot').innerHTML = `${s.sweet_spot_ouro} <small>obras</small>`;
}

// Initialize Interactive Charts
function initCharts() {
  if (!state.summary) return;
  const s = state.summary;

  // Chart 1: Fases Real Funnel (Bar)
  const ctxFases = document.getElementById('chartFases').getContext('2d');
  const fasesLabels = Object.keys(s.fase_dist).map(formatFaseName);
  const fasesData = Object.values(s.fase_dist);

  state.charts.fases = new Chart(ctxFases, {
    type: 'bar',
    data: {
      labels: fasesLabels,
      datasets: [{
        label: 'Quantidade de Obras',
        data: fasesData,
        backgroundColor: [
          'rgba(6, 182, 212, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(100, 116, 139, 0.7)'
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });

  // Chart 2: Setores (Donut)
  const ctxSetores = document.getElementById('chartSetores').getContext('2d');
  const setorEntries = Object.entries(s.setor_dist).slice(0, 6);
  state.charts.setores = new Chart(ctxSetores, {
    type: 'doughnut',
    data: {
      labels: setorEntries.map(([k]) => formatSetorName(k)),
      datasets: [{
        data: setorEntries.map(([, v]) => v),
        backgroundColor: [
          '#6366f1',
          '#06b6d4',
          '#10b981',
          '#f59e0b',
          '#a855f7',
          '#64748b'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 12 } }
      }
    }
  });

  // Chart 3: Top Municípios (Horizontal Bar)
  const ctxMuni = document.getElementById('chartMunicipios').getContext('2d');
  const muniEntries = Object.entries(s.top_municipios).slice(0, 8);
  state.charts.municipios = new Chart(ctxMuni, {
    type: 'bar',
    data: {
      labels: muniEntries.map(([k]) => k),
      datasets: [{
        label: 'Obras Mapeadas',
        data: muniEntries.map(([, v]) => v),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      }
    }
  });

  // Chart 4: Faixas de CAPEX
  const ctxFaixas = document.getElementById('chartFaixasCapex').getContext('2d');
  state.charts.faixas = new Chart(ctxFaixas, {
    type: 'bar',
    data: {
      labels: ['Até R$ 1M', 'R$ 1M-10M', 'R$ 10M-50M', 'R$ 50M-200M', 'R$ 200M-1Bi', 'Mega (> R$ 1Bi)'],
      datasets: [{
        label: 'Obras',
        data: [2163, 2163, 768, 446, 222, 168],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// Render Top 10 Mega Obras
function renderTopMegaObras() {
  const mega = state.allObras
    .filter(o => o.capex > 0)
    .sort((a, b) => b.capex - a.capex)
    .slice(0, 10);

  elements.tbodyTopMegaObras.innerHTML = mega.map(o => `
    <tr onclick="openObraModal('${o.id}')" style="cursor: pointer;">
      <td style="font-weight: 600; max-width: 260px;">${escapeHTML(o.nome)}</td>
      <td>${formatSetorName(o.setor)}</td>
      <td>${escapeHTML(o.muni)}</td>
      <td style="color: var(--accent-emerald); font-weight: 700;">${o.capex_fmt}</td>
      <td>${getBadgeFaseHTML(o.fase_real)}</td>
      <td>${escapeHTML(o.contratante)}</td>
      <td>${o.total_decisores > 0 ? `<span class="badge badge-ouro">${o.total_decisores}</span>` : '-'}</td>
      <td>${o.score_max > 0 ? `<span class="badge badge-execucao">${o.score_max} pts</span>` : '-'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openObraModal('${o.id}')">Dossiê</button>
      </td>
    </tr>
  `).join('');
}

// Render Sweet Spot Tab
function renderSweetSpotTab() {
  const sweet = state.allObras.filter(o => o.status_b2b.startsWith('1_') || o.status_b2b.startsWith('2_'));
  const ouro = state.allObras.filter(o => o.status_b2b.startsWith('1_'));
  elements.tabCountSweetSpot.textContent = ouro.length.toLocaleString('pt-BR');
  const sweetMetric = document.querySelector('.sweetspot-metrics-grid .metric-card:nth-child(3) .metric-num');
  if (sweetMetric) sweetMetric.textContent = `${ouro.length.toLocaleString('pt-BR')} Obras`;
  const capex = ouro.reduce((sum, o) => sum + (o.capex || 0), 0);
  const demanda = ouro.reduce((sum, o) => sum + (o.demanda_insumos_mi || 0) * 1e6, 0);
  document.getElementById('sweetCapexTotal').textContent = formatCompactMoney(capex);
  document.getElementById('sweetInsumosTotal').textContent = formatCompactMoney(demanda);
  
  elements.tbodySweetSpot.innerHTML = sweet.slice(0, 50).map(o => `
    <tr onclick="openObraModal('${o.id}')" style="cursor: pointer;">
      <td>${getBadgeStatusB2BHTML(o.status_b2b)}</td>
      <td style="font-weight: 600; max-width: 250px;">${escapeHTML(o.nome)}</td>
      <td>${formatSetorName(o.setor)}</td>
      <td style="color: var(--accent-emerald); font-weight: 700;">${o.capex_fmt}</td>
      <td>
        <strong>${escapeHTML(o.dec_principal_nome)}</strong><br>
        <small style="color: var(--text-secondary);">${escapeHTML(o.dec_principal_cargo || '')}</small>
      </td>
      <td>
        ${o.dec_principal_lkd ? `<a href="${o.dec_principal_lkd}" target="_blank" class="contact-btn linkedin" onclick="event.stopPropagation();"><i data-lucide="briefcase-business"></i> LinkedIn</a>` : ''}
        ${o.dec_principal_tel ? `<span class="contact-btn" onclick="event.stopPropagation(); copyText('${o.dec_principal_tel}')"><i data-lucide="phone"></i> ${o.dec_principal_tel}</span>` : ''}
      </td>
      <td style="font-size: 0.78rem; max-width: 280px; color: var(--text-secondary);">
        ${o.matches_mdo && o.matches_mdo.length > 0 ? `🔨 <strong>MDO:</strong> ${escapeHTML(o.matches_mdo[0].split('[')[0])}` : ''}
        ${o.matches_mat && o.matches_mat.length > 0 ? `<br>📦 <strong>Insumo:</strong> ${escapeHTML(o.matches_mat[0].split('[')[0])}` : ''}
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openObraModal('${o.id}')">Dossiê</button>
      </td>
    </tr>
  `).join('');
}

// Render Regional Tab
function renderRegionalTab() {
  const polos = [
    { nome: 'São Paulo (Capital & ABC)', obras: 1767, capex: 'R$ 232,4 Bi', sup: '26.952 empresas', diag: 'Alta liquidez / Hub de Suprimentos', badge: 'badge-execucao' },
    { nome: 'Santos / Baixada Santista', obras: 51, capex: 'R$ 112,6 Bi', sup: '882 empresas', diag: 'Déficit Local / Oportunidade Capital', badge: 'badge-ouro' },
    { nome: 'Campinas & RMC', obras: 49, capex: 'R$ 36,7 Bi', sup: '2.090 empresas', diag: 'Polo Data Centers & Tecnologia', badge: 'badge-execucao' },
    { nome: 'Sorocaba', obras: 17, capex: 'R$ 28,8 Bi', sup: '1.614 empresas', diag: 'Polo Automotivo & Indústria Pesada', badge: 'badge-execucao' },
    { nome: 'Guarulhos & Alto Tietê', obras: 52, capex: 'R$ 22,6 Bi', sup: '1.440 empresas', diag: 'Polo Logístico e Aeroportuário', badge: 'badge-execucao' },
    { nome: 'Paulínia', obras: 7, capex: 'R$ 20,9 Bi', sup: '180 empresas', diag: 'Polo Petroquímico & Refinarias', badge: 'badge-ouro' },
    { nome: 'Ribeirão Preto & Franca', obras: 23, capex: 'R$ 5,4 Bi', sup: '1.223 empresas', diag: 'Polo Agroindustrial & Infraestrutura', badge: 'badge-execucao' },
    { nome: 'São José dos Campos / Vale', obras: 14, capex: 'R$ 10,2 Bi', sup: '1.404 empresas', diag: 'Polo Aeroespacial & Tecnológico', badge: 'badge-execucao' }
  ];

  elements.tbodyRegional.innerHTML = polos.map(p => `
    <tr>
      <td style="font-weight: 600;">${p.nome}</td>
      <td>${p.obras} obras</td>
      <td style="color: var(--accent-emerald); font-weight: 700;">${p.capex}</td>
      <td>${p.sup}</td>
      <td><span class="badge ${p.badge}">${p.diag}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="filterByMuni('${p.nome.split(' ')[0]}')">Ver Obras</button>
      </td>
    </tr>
  `).join('');
}

// Render Suppliers Tab
function renderSuppliersTab() {
  const categories = [
    { esp: 'Construção de Edifícios e Obras Civis', macro: 'MÃO DE OBRA & SERVIÇOS', emp: '21.283', cap: 'R$ 419,2 Bi', mat: '67.745' },
    { esp: 'Engenharia Consultiva & Gerenciamento', macro: 'MÃO DE OBRA & SERVIÇOS', emp: '12.900', cap: 'R$ 423,7 Bi', mat: '47.721' },
    { esp: 'Serviços Especializados para Construção', macro: 'MÃO DE OBRA & SERVIÇOS', emp: '8.407', cap: 'R$ 15,5 Bi', mat: '4.625' },
    { esp: 'Materiais, Insumos e Equipamentos Gerais', macro: 'INSUMOS & EQUIPAMENTOS', emp: '7.056', cap: 'R$ 4.455,0 Bi', mat: '29.511' },
    { esp: 'Instalações Elétricas (Alta e Média Tensão)', macro: 'MÃO DE OBRA & SERVIÇOS', emp: '5.453', cap: 'R$ 7,8 Bi', mat: '18.319' },
    { esp: 'Obras de Terraplanagem e Drenagem', macro: 'MÃO DE OBRA & SERVIÇOS', emp: '1.968', cap: 'R$ 2,1 Bi', mat: '6.543' },
    { esp: 'Siderurgia, Aço Estrutural e Perfis', macro: 'INSUMOS & EQUIPAMENTOS', emp: '677', cap: 'R$ 58,8 Bi', mat: 'Matches Diretos' },
    { esp: 'Cimento, Concreto e Pré-Moldados', macro: 'INSUMOS & EQUIPAMENTOS', emp: '343', cap: 'R$ 10,1 Bi', mat: 'Matches Diretos' }
  ];

  elements.tbodySuppliersCategories.innerHTML = categories.map(c => `
    <tr>
      <td style="font-weight: 600;">${c.esp}</td>
      <td><span class="badge ${c.macro.includes('INSUMOS') ? 'badge-ouro' : 'badge-pipeline'}">${c.macro}</span></td>
      <td>${c.emp} empresas</td>
      <td style="color: var(--accent-emerald); font-weight: 700;">${c.cap}</td>
      <td><span class="badge badge-execucao">${c.mat}</span></td>
    </tr>
  `).join('');
}

// Open Obra Modal (Dossiê 360°)
window.openObraModal = function(id) {
  sessionStorage.setItem('spEngenhariaReturnUrl', window.location.href);
  window.location.href = `obra.html?id=${encodeURIComponent(id)}`;
  return;
  const o = state.allObras.find(x => x.id === id);
  if (!o) return;
  state.currentModalObra = o;

  document.getElementById('modalObraNome').textContent = o.nome;
  document.getElementById('modalStatusBadge').outerHTML = getBadgeStatusB2BHTML(o.status_b2b);
  document.getElementById('modalObraMeta').innerHTML = `
    <span><i data-lucide="map-pin"></i> ${escapeHTML(o.muni)}</span>
    <span><i data-lucide="tag"></i> ${formatSetorName(o.setor)}</span>
    <span>ID: <code>${o.id.substring(0, 8)}</code></span>
  `;

  document.getElementById('modalCapex').textContent = o.capex_fmt;
  document.getElementById('modalFaseReal').textContent = formatFaseName(o.fase_real);
  document.getElementById('modalQualidade').innerHTML = getBadgeQualHTML(o.qualidade);
  document.getElementById('modalContratante').textContent = o.contratante;
  document.getElementById('modalExecutora').textContent = o.executora;
  document.getElementById('modalDescricao').textContent = o.desc || 'Descrição técnica não informada na fonte primária.';

  // Decisores Panel
  document.getElementById('modalDecisoresCount').textContent = o.total_decisores;
  const decListContainer = document.getElementById('modalDecisoresList');
  if (o.decisores_lista && o.decisores_lista.length > 0) {
    decListContainer.innerHTML = o.decisores_lista.map(decStr => {
      const parts = decStr.split('|').map(x => x.trim());
      const nome = parts[0] || 'Decisor';
      const cargo = parts[1] || 'Cargo não informado';
      const qual = decStr.includes('verde') ? 'verde' : (decStr.includes('amarelo') ? 'amarelo' : 'vermelho');
      
      const telMatch = decStr.match(/Tel:\s*([^|]+)/);
      const emailMatch = decStr.match(/Email:\s*([^|]+)/);
      const lkdMatch = decStr.match(/LinkedIn:\s*(http[^\s\]]+)/);

      const tel = telMatch ? telMatch[1].trim() : '';
      const email = emailMatch ? emailMatch[1].trim() : '';
      const lkd = lkdMatch ? lkdMatch[1].trim() : '';

      return `
        <div class="decisor-card-item">
          <div class="decisor-info-left">
            <h4>
              ${escapeHTML(nome)}
              <span class="badge ${qual === 'verde' ? 'badge-execucao' : 'badge-pipeline'}">${qual.toUpperCase()}</span>
            </h4>
            <p>${escapeHTML(cargo)}</p>
          </div>
          <div class="decisor-contacts-right">
            ${lkd && lkd.startsWith('http') ? `<a href="${lkd}" target="_blank" class="contact-btn linkedin"><i data-lucide="briefcase-business"></i> Perfil</a>` : ''}
            ${tel && tel !== 'sem tel' ? `<button class="contact-btn" onclick="copyText('${tel}')" title="Copiar telefone"><i data-lucide="phone"></i> ${tel}</button>` : ''}
            ${email && email !== 'sem email' ? `<button class="contact-btn" onclick="copyText('${email}')" title="Copiar e-mail"><i data-lucide="mail"></i> E-mail</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } else if (o.dec_principal_nome) {
    decListContainer.innerHTML = `
      <div class="decisor-card-item">
        <div class="decisor-info-left">
          <h4>${escapeHTML(o.dec_principal_nome)} <span class="badge badge-execucao">LÍDER</span></h4>
          <p>${escapeHTML(o.dec_principal_cargo)}</p>
        </div>
        <div class="decisor-contacts-right">
          ${o.dec_principal_lkd ? `<a href="${o.dec_principal_lkd}" target="_blank" class="contact-btn linkedin"><i data-lucide="briefcase-business"></i> LinkedIn</a>` : ''}
          ${o.dec_principal_tel ? `<button class="contact-btn" onclick="copyText('${o.dec_principal_tel}')"><i data-lucide="phone"></i> ${o.dec_principal_tel}</button>` : ''}
        </div>
      </div>
    `;
  } else {
    decListContainer.innerHTML = `<p style="font-size: 0.84rem; color: var(--text-muted);">Nenhum decisor mapeado diretamente para esta obra ainda. (Na fila de enriquecimento OSINT).</p>`;
  }

  // Dual Suppliers Matching Panel: Mão de Obra AND Insumos
  document.getElementById('modalMatchesCount').textContent = (o.matches_mdo ? o.matches_mdo.length : 0) + (o.matches_mat ? o.matches_mat.length : 0);
  document.getElementById('modalDemandaInsumos').textContent = o.demanda_insumos_mi > 0 ? `R$ ${o.demanda_insumos_mi.toLocaleString('pt-BR')} Milhões` : 'Calculada por CNAE';
  
  const supListContainer = document.getElementById('modalSuppliersList');
  
  let mdoHTML = '';
  if (o.matches_mdo && o.matches_mdo.length > 0) {
    mdoHTML = `
      <h4 style="font-size: 0.85rem; color: var(--accent-cyan); margin: 12px 0 6px; display: flex; align-items: center; gap: 6px;">
        <i data-lucide="hammer"></i> Fornecedores de Mão de Obra & Serviços Especializados
      </h4>
      ${o.matches_mdo.map(s => renderSupplierItem(s)).join('')}
    `;
  }

  let matHTML = '';
  if (o.matches_mat && o.matches_mat.length > 0) {
    matHTML = `
      <h4 style="font-size: 0.85rem; color: var(--accent-emerald); margin: 16px 0 6px; display: flex; align-items: center; gap: 6px;">
        <i data-lucide="package"></i> Fornecedores de Insumos, Materiais & Equipamentos
      </h4>
      ${o.matches_mat.map(s => renderSupplierItem(s)).join('')}
    `;
  }

  supListContainer.innerHTML = mdoHTML + matHTML;

  // Traceability
  document.getElementById('modalFontePrimaria').textContent = o.fonte_primaria || 'Comprasnet / Diário Oficial / BNDES';
  document.getElementById('modalDataPub').textContent = o.data_pub || o.data_anuncio || 'Data recente';
  const urlBlock = document.getElementById('modalUrlBlock');
  const urlLink = document.getElementById('modalUrlLink');
  if (o.url_fonte && o.url_fonte.startsWith('http')) {
    urlBlock.style.display = 'block';
    urlLink.href = o.url_fonte;
  } else {
    urlBlock.style.display = 'none';
  }

  elements.obraModal.classList.remove('hidden');
  lucide.createIcons();
};

function renderSupplierItem(s) {
  // Format: Razao Social [Score: 95/100 | Especialidade | Municipio | Tel: ... | Email: ...]
  const scoreMatch = s.match(/Score:\s*(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 80;
  const razao = s.split('[')[0].trim();
  const inside = s.includes('[') ? s.substring(s.indexOf('[') + 1, s.lastIndexOf(']')) : '';
  const parts = inside.split('|').map(x => x.trim());
  const spec = parts[1] || 'Engenharia';
  const muni = parts[2] || 'SP';

  const telMatch = inside.match(/Tel:\s*([^|]+)/);
  const emailMatch = inside.match(/Email:\s*([^|]+)/);
  const tel = telMatch ? telMatch[1].trim() : '';
  const email = emailMatch ? emailMatch[1].trim() : '';

  return `
    <div class="supplier-match-item">
      <div style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="color: #fff; font-size: 0.86rem;">${escapeHTML(razao)}</strong>
          <span class="sup-score-badge" style="background: rgba(99, 102, 241, 0.2); color: var(--accent-primary); border-color: rgba(99, 102, 241, 0.4);">
            Score ${score}/100
          </span>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.76rem; margin-top: 2px;">
          ${escapeHTML(spec)} • <i data-lucide="map-pin" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${escapeHTML(muni)}
        </p>
      </div>
      <div style="display: flex; gap: 6px;">
        ${tel && tel !== 'N/I' ? `<button class="contact-btn" onclick="copyText('${tel}')" title="Copiar Tel"><i data-lucide="phone"></i> ${tel}</button>` : ''}
        ${email && email !== 'N/I' ? `<button class="contact-btn" onclick="copyText('${email}')" title="Copiar E-mail"><i data-lucide="mail"></i> E-mail</button>` : ''}
      </div>
    </div>
  `;
}

function closeModal() {
  elements.obraModal.classList.add('hidden');
}

// Copy Dossier
function copyModalDossie() {
  const o = state.currentModalObra;
  if (!o) return;

  const text = `
=== DOSSIÊ DE INTELIGÊNCIA: SP ENGENHARIA 360° ===
OBRA: ${o.nome}
SETOR: ${o.setor} | MUNICÍPIO: ${o.muni}
CAPEX: ${o.capex_fmt} | FASE: ${o.fase_real}
CONTRATANTE: ${o.contratante}
EXECUTORA: ${o.executora}

DECISOR PRINCIPAL: ${o.dec_principal_nome || 'N/I'} (${o.dec_principal_cargo || 'N/I'})
TEL: ${o.dec_principal_tel || 'N/I'} | EMAIL: ${o.dec_principal_email || 'N/I'}
LINKEDIN: ${o.dec_principal_lkd || 'N/I'}

FORNECEDORES DE MÃO DE OBRA QUALIFICADOS:
${(o.matches_mdo || []).join('\n')}

FORNECEDORES DE INSUMOS & MATERIAIS QUALIFICADOS:
${(o.matches_mat || []).join('\n')}
==================================================
  `.trim();

  copyText(text);
  showToast('Dossiê completo copiado para a área de transferência!');
}

// Filter triggers from overview buttons
window.filterByMegaObras = function() {
  switchTab('explorer');
  resetFilters();
  state.filters.sort = 'capex_desc';
  elements.filterSort.value = 'capex_desc';
  applyFilters();
};

window.filterByMuni = function(muniPrefix) {
  switchTab('explorer');
  resetFilters();
  state.filters.search = muniPrefix.toLowerCase();
  elements.globalSearch.value = muniPrefix;
  applyFilters();
};

// CRM B2B local e persistente
const CRM_STAGES = ['lead_novo', 'contato_feito', 'reuniao', 'proposta', 'fechado'];

function initCrm() {
  try {
    const saved = JSON.parse(localStorage.getItem('spEngenhariaCrm') || '[]');
    state.crmPipeline = Array.isArray(saved) ? saved.filter(x => state.allObras.some(o => o.id === x.id)) : [];
  } catch (_) {
    state.crmPipeline = [];
  }
  renderCrmPipeline();
}

function persistCrm() {
  localStorage.setItem('spEngenhariaCrm', JSON.stringify(state.crmPipeline));
  renderCrmPipeline();
}

function formatCompactMoney(value) {
  if (value >= 1e9) return `R$ ${(value / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Bi`;
  return `R$ ${(value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Mi`;
}

function renderCrmPipeline() {
  if (!state.allObras.length) return;
  const allRecords = state.crmPipeline.map(item => ({ ...item, obra: state.allObras.find(o => o.id === item.id) })).filter(x => x.obra);
  const query = normalizeText(state.crmSearch);
  const records = query ? allRecords.filter(x => normalizeText(`${x.obra.nome} ${x.obra.contratante} ${x.obra.dec_principal_nome} ${x.obra.muni}`).includes(query)) : allRecords;
  CRM_STAGES.forEach(stage => {
    const container = document.getElementById(`kanban-container-${stage}`);
    if (!container) return;
    const items = records.filter(x => x.stage === stage);
    document.getElementById(`count-${stage}`).textContent = items.length;
    document.getElementById(`capex-${stage}`).textContent = formatCompactMoney(items.reduce((sum, x) => sum + (x.obra.capex || 0), 0));
    container.innerHTML = items.length ? items.map(({ obra }) => `
      <article class="kanban-card" draggable="true" ondragstart="handleDragStart(event, '${obra.id}')">
        <div class="kanban-card-top"><span class="badge badge-${obra.status_b2b.startsWith('1_') ? 'sweet-ouro' : 'ouro'}">${obra.status_b2b.startsWith('1_') ? 'OURO' : 'PRATA'}</span><button class="kanban-remove" onclick="removeCrmLead('${obra.id}')" title="Remover">&times;</button></div>
        <h5 onclick="openObraModal('${obra.id}')">${escapeHTML(obra.nome)}</h5>
        <p><i data-lucide="map-pin"></i> ${escapeHTML(obra.muni)} · ${formatSetorName(obra.setor)}</p>
        <strong>${obra.capex_fmt}</strong>
        <div class="kanban-contact"><span>${escapeHTML(obra.dec_principal_nome || 'Decisor não mapeado')}</span><button onclick="openCadenceForObra('${obra.id}')" title="Gerar cadência"><i data-lucide="message-square"></i></button></div>
        <div class="kanban-actions">
          <button onclick="moveCrmLead('${obra.id}', -1)" title="Etapa anterior"><i data-lucide="chevron-left"></i></button>
          <button onclick="openObraModal('${obra.id}')"><i data-lucide="eye"></i> Dossiê</button>
          <button onclick="moveCrmLead('${obra.id}', 1)" title="Próxima etapa">Avançar <i data-lucide="chevron-right"></i></button>
        </div>
      </article>`).join('') : '<div class="kanban-empty">Arraste oportunidades para esta etapa</div>';
  });
  const totalCapex = allRecords.reduce((sum, x) => sum + (x.obra.capex || 0), 0);
  const won = allRecords.filter(x => x.stage === 'fechado').length;
  document.getElementById('crmStatTotalLeads').textContent = allRecords.length;
  document.getElementById('crmStatTotalCapex').textContent = formatCompactMoney(totalCapex);
  document.getElementById('crmStatInProposal').textContent = allRecords.filter(x => x.stage === 'proposta').length;
  document.getElementById('crmStatWon').textContent = won;
  document.getElementById('crmStatWinRate').textContent = allRecords.length ? `${Math.round(won / allRecords.length * 100)}%` : '0%';
  const badge = document.querySelector('[data-tab="crm"] .tab-badge');
  if (badge) badge.textContent = records.length;
  lucide.createIcons();
}

function addObrasToCrm(obras) {
  let added = 0;
  obras.forEach(o => {
    if (!state.crmPipeline.some(x => x.id === o.id)) {
      state.crmPipeline.push({ id: o.id, stage: 'lead_novo', addedAt: new Date().toISOString() });
      added++;
    }
  });
  persistCrm();
  showToast(added ? `${added} oportunidade(s) adicionada(s) ao CRM.` : 'As oportunidades já estão no CRM.');
}

window.loadDefaultSweetSpotCrm = function() {
  const top = state.allObras.filter(o => o.status_b2b.startsWith('1_')).sort((a, b) => b.capex - a.capex).slice(0, 12);
  addObrasToCrm(top);
};

window.addAllSweetSpotToCrm = function() {
  addObrasToCrm(state.allObras.filter(o => o.status_b2b.startsWith('1_')).sort((a, b) => b.capex - a.capex).slice(0, 100));
  switchTab('crm');
};

window.filterCrmPipeline = function(value) {
  state.crmSearch = value || '';
  renderCrmPipeline();
};

window.moveCrmLead = function(id, direction) {
  const item = state.crmPipeline.find(x => x.id === id);
  if (!item) return;
  const current = CRM_STAGES.indexOf(item.stage);
  item.stage = CRM_STAGES[Math.max(0, Math.min(CRM_STAGES.length - 1, current + direction))];
  persistCrm();
};

window.addCurrentModalToCrm = function() {
  if (state.currentModalObra) addObrasToCrm([state.currentModalObra]);
};

window.removeCrmLead = function(id) {
  state.crmPipeline = state.crmPipeline.filter(x => x.id !== id);
  persistCrm();
};

window.handleDragStart = function(event, id) {
  state.draggedCrmId = id;
  if (event.dataTransfer) event.dataTransfer.setData('text/plain', id);
};
window.handleDragOver = function(event) { event.preventDefault(); };
window.handleDrop = function(event, stage) {
  event.preventDefault();
  const id = (event.dataTransfer && event.dataTransfer.getData('text/plain')) || state.draggedCrmId;
  const item = state.crmPipeline.find(x => x.id === id);
  if (item && CRM_STAGES.includes(stage)) { item.stage = stage; persistCrm(); }
};

window.clearCrmPipeline = function() {
  state.crmPipeline = [];
  persistCrm();
  showToast('Pipeline CRM limpo.');
};

window.exportCrmPipelineCsv = function() {
  if (!state.crmPipeline.length) return showToast('O pipeline está vazio.');
  const labels = { lead_novo: 'Novo Lead', contato_feito: 'Contato', reuniao: 'Reunião', proposta: 'Proposta/RFQ', fechado: 'Fechado' };
  const rows = state.crmPipeline.map(x => {
    const o = state.allObras.find(y => y.id === x.id);
    return [`"${escapeCsv(o.nome)}"`, `"${labels[x.stage]}"`, `"${escapeCsv(o.contratante)}"`, `"${escapeCsv(o.dec_principal_nome)}"`, o.capex].join(';');
  });
  downloadCsv(['Obra;Etapa;Contratante;Decisor;CAPEX_BRL', ...rows].join('\r\n'), 'pipeline_crm_sp_engenharia.csv');
};

// Cadências comerciais geradas a partir do dossiê
window.openCadenceForObra = function(id) {
  const obra = state.allObras.find(o => o.id === id);
  if (!obra) return;
  state.currentModalObra = obra;
  openCadenceFromModal();
};

window.openCadenceFromModal = function() {
  const o = state.currentModalObra;
  if (!o) return;
  const primeiroNome = (o.dec_principal_nome || 'Olá').split(' ')[0];
  document.getElementById('cadenceObraMeta').textContent = `${o.nome} · ${o.dec_principal_nome || 'Decisor'}`;
  document.getElementById('cadenceTextWhatsapp').value = `${primeiroNome}, tudo bem? Acompanhamos a obra “${o.nome}”, em ${o.muni}, e identificamos fornecedores homologados aderentes ao escopo. Posso compartilhar um diagnóstico objetivo de suprimentos e oportunidades para esta fase?`;
  document.getElementById('cadenceTextEmailSubject').value = `Fornecedores qualificados para ${o.nome}`;
  document.getElementById('cadenceTextEmailBody').value = `${primeiroNome},\n\nMapeamos a obra “${o.nome}” (${o.capex_fmt}) e cruzamos seu escopo com fornecedores de São Paulo qualificados por aderência técnica, capacidade e logística.\n\nGostaria de apresentar o diagnóstico e entender as próximas frentes de contratação. Podemos conversar por 20 minutos nesta semana?\n\nAtenciosamente,`;
  document.getElementById('cadenceTextLinkedin').value = `${primeiroNome}, acompanho o projeto ${o.nome} e preparei um mapa de fornecedores aderentes à fase atual. Gostaria de conectar para compartilhar os principais achados.`;
  document.getElementById('btnCadenceOpenLkd').href = o.dec_principal_lkd || '#';
  document.getElementById('cadenceModal').classList.remove('hidden');
  lucide.createIcons();
};
window.closeCadenceModal = function() { document.getElementById('cadenceModal').classList.add('hidden'); };
window.copyCadenceScript = function(id) { copyText(document.getElementById(id).value); };
window.openCadenceWhatsapp = function() {
  const o = state.currentModalObra;
  const phone = (o.dec_principal_tel || '').replace(/\D/g, '');
  if (!phone) return showToast('Telefone não disponível para este decisor.');
  window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(document.getElementById('cadenceTextWhatsapp').value)}`, '_blank');
};
window.openCadenceMailto = function() {
  const o = state.currentModalObra;
  if (!o.dec_principal_email) return showToast('E-mail não disponível para este decisor.');
  window.location.href = `mailto:${o.dec_principal_email}?subject=${encodeURIComponent(document.getElementById('cadenceTextEmailSubject').value)}&body=${encodeURIComponent(document.getElementById('cadenceTextEmailBody').value)}`;
};

// Mapa geoespacial: centroides municipais + dispersão visual determinística
const SP_CITY_COORDS = {
  'SAO PAULO': [-23.5505,-46.6333], 'SANTOS': [-23.9608,-46.3336], 'CAMPINAS': [-22.9056,-47.0608],
  'GUARULHOS': [-23.4543,-46.5337], 'SOROCABA': [-23.5015,-47.4526], 'RIBEIRAO PRETO': [-21.1775,-47.8103],
  'SAO JOSE DOS CAMPOS': [-23.1896,-45.8841], 'SAO BERNARDO DO CAMPO': [-23.6914,-46.5646], 'SANTO ANDRE': [-23.6639,-46.5383],
  'OSASCO': [-23.5325,-46.7917], 'BARUERI': [-23.5112,-46.8765], 'JUNDIAI': [-23.1857,-46.8978],
  'PIRACICABA': [-22.7338,-47.6476], 'BAURU': [-22.3145,-49.0587], 'ARARAQUARA': [-21.7845,-48.1780],
  'MARILIA': [-22.2171,-49.9501], 'SAO CARLOS': [-22.0174,-47.8860], 'HORTOLANDIA': [-22.8583,-47.2200],
  'SUMARE': [-22.8219,-47.2668], 'PAULINIA': [-22.7611,-47.1541], 'LIMEIRA': [-22.5646,-47.4017],
  'AMERICANA': [-22.7374,-47.3331], 'INDAIATUBA': [-23.0903,-47.2181], 'ITU': [-23.2642,-47.2993],
  'TAUBATE': [-23.0265,-45.5553], 'JACAREI': [-23.3053,-45.9658], 'GUARATINGUETA': [-22.8075,-45.1938],
  'UBATUBA': [-23.4332,-45.0834], 'SAO SEBASTIAO': [-23.8067,-45.4027], 'CUBATAO': [-23.8911,-46.4240],
  'SAO VICENTE': [-23.9631,-46.3919], 'PRAIA GRANDE': [-24.0089,-46.4120], 'MOGI DAS CRUZES': [-23.5213,-46.1858],
  'ITAQUAQUECETUBA': [-23.4861,-46.3488], 'SUZANO': [-23.5448,-46.3110], 'MAUA': [-23.6677,-46.4613],
  'DIADEMA': [-23.6813,-46.6205], 'FRANCA': [-20.5386,-47.4009], 'SAO JOSE DO RIO PRETO': [-20.8113,-49.3758],
  'PRESIDENTE PRUDENTE': [-22.1207,-51.3925], 'BOTUCATU': [-22.8837,-48.4437], 'REGISTRO': [-24.4979,-47.8449],
  'CAJATI': [-24.7324,-48.1223]
};
SP_CITY_COORDS['SERRA AZUL'] = [-21.3103,-47.5602];

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

function mapColor(setor) {
  const s = normalizeText(setor);
  if (s.includes('SANEAMENTO')) return '#06b6d4';
  if (s.includes('INFRAESTRUTURA')) return '#6366f1';
  if (s.includes('ENERGIA')) return '#f59e0b';
  if (s.includes('TECNOLOGIA') || s.includes('DATA CENTER')) return '#10b981';
  if (s.includes('LOGIST') || s.includes('PORTUAR')) return '#fbbf24';
  return '#a855f7';
}

function jitterFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return [((hash & 255) / 255 - .5) * .12, (((hash >>> 8) & 255) / 255 - .5) * .12];
}

window.initGeoMap = function() {
  const host = document.getElementById('leafletMap');
  if (!host) return;
  if (typeof L === 'undefined') {
    host.innerHTML = '<div class="map-error">Não foi possível carregar o mecanismo do mapa. Verifique a conexão e recarregue a página.</div>';
    return;
  }
  if (!state.geoMap) {
    state.geoMap = L.map(host, { preferCanvas: true, zoomControl: true }).setView([-22.7, -48.3], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(state.geoMap);
    state.geoLayer = L.layerGroup().addTo(state.geoMap);
    const setorSelect = document.getElementById('mapFilterSetor');
    [...new Set(state.allObras.map(o => o.setor).filter(Boolean))].sort().forEach(setor => {
      const option = document.createElement('option'); option.value = setor; option.textContent = formatSetorName(setor); setorSelect.appendChild(option);
    });
  }
  setTimeout(() => { state.geoMap.invalidateSize(); updateMapMarkers(); }, 80);
};

window.updateMapMarkers = function() {
  if (!state.geoMap || !state.geoLayer) return;
  const setor = document.getElementById('mapFilterSetor').value;
  const fase = document.getElementById('mapFilterFase').value;
  const status = document.getElementById('mapFilterStatus').value;
  const candidates = state.allObras.filter(o => {
    if (!SP_CITY_COORDS[normalizeText(o.muni)]) return false;
    if (setor && o.setor !== setor) return false;
    if (fase && o.fase_real !== fase) return false;
    if (status === 'sweet' && !o.status_b2b.startsWith('1_')) return false;
    if (status === 'mega' && o.capex < 1e9) return false;
    return true;
  }).sort((a, b) => b.capex - a.capex).slice(0, 1200);
  state.geoLayer.clearLayers();
  candidates.forEach(o => {
    const base = SP_CITY_COORDS[normalizeText(o.muni)];
    const jitter = jitterFor(o.id);
    const marker = L.circleMarker([base[0] + jitter[0], base[1] + jitter[1]], {
      radius: Math.max(5, Math.min(13, 4 + Math.log10(Math.max(o.capex, 1e6) / 1e6) * 2)),
      color: '#0f172a', weight: 1, fillColor: mapColor(o.setor), fillOpacity: .82
    });
    marker.bindPopup(`<div class="map-popup"><span>${escapeHTML(formatSetorName(o.setor))} · ${escapeHTML(formatFaseName(o.fase_real))}</span><h4>${escapeHTML(o.nome)}</h4><p>${escapeHTML(o.muni)} · ${escapeHTML(o.contratante)}</p><strong>${escapeHTML(o.capex_fmt)}</strong><button onclick="openObraModal('${o.id}')">Abrir Dossiê 360°</button></div>`);
    marker.addTo(state.geoLayer);
  });
  document.getElementById('mapCountVisible').textContent = candidates.length.toLocaleString('pt-BR');
  document.getElementById('mapCapexVisible').textContent = formatCompactMoney(candidates.reduce((sum, o) => sum + (o.capex || 0), 0));
};

window.resetMapCenter = function() {
  if (state.geoMap) state.geoMap.setView([-22.7, -48.3], 7);
};

// Export Filtered CSV
function exportFilteredCsv() {
  const items = state.filteredObras;
  if (items.length === 0) {
    showToast('Nenhum dado filtrado para exportar.');
    return;
  }

  const headers = ['ID', 'Nome_Obra', 'Setor', 'Municipio', 'CAPEX_BRL', 'CAPEX_Formatado', 'Fase_Real', 'Contratante', 'Decisor_Principal', 'Decisor_Cargo', 'Decisor_Tel', 'Decisor_LinkedIn', 'Score_Max_Match', 'Matches_Mao_De_Obra', 'Matches_Insumos_Materiais'];
  const rows = items.map(o => [
    `"${o.id}"`,
    `"${escapeCsv(o.nome)}"`,
    `"${escapeCsv(o.setor)}"`,
    `"${escapeCsv(o.muni)}"`,
    o.capex,
    `"${escapeCsv(o.capex_fmt)}"`,
    `"${escapeCsv(o.fase_real)}"`,
    `"${escapeCsv(o.contratante)}"`,
    `"${escapeCsv(o.dec_principal_nome)}"`,
    `"${escapeCsv(o.dec_principal_cargo)}"`,
    `"${escapeCsv(o.dec_principal_tel)}"`,
    `"${escapeCsv(o.dec_principal_lkd)}"`,
    o.score_max,
    `"${escapeCsv((o.matches_mdo || []).join(' | '))}"`,
    `"${escapeCsv((o.matches_mat || []).join(' | '))}"`
  ]);

  downloadCsv([headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n'), 'obras_sp_matches_completos.csv');
  showToast(`Exportadas ${items.length} obras com sucesso!`);
}

// Export Sweet Spot CSV
function exportSweetSpotCsv() {
  const items = state.allObras.filter(o => o.status_b2b.startsWith('1_') || o.status_b2b.startsWith('2_'));
  const headers = ['Nome_Obra', 'Setor', 'Municipio', 'CAPEX_Formatado', 'Fase', 'Contratante', 'Decisor_Nome', 'Decisor_Cargo', 'Telefone', 'LinkedIn', 'Matches_Mao_De_Obra', 'Matches_Insumos'];
  const rows = items.map(o => [
    `"${escapeCsv(o.nome)}"`,
    `"${escapeCsv(o.setor)}"`,
    `"${escapeCsv(o.muni)}"`,
    `"${escapeCsv(o.capex_fmt)}"`,
    `"${escapeCsv(o.fase_real)}"`,
    `"${escapeCsv(o.contratante)}"`,
    `"${escapeCsv(o.dec_principal_nome)}"`,
    `"${escapeCsv(o.dec_principal_cargo)}"`,
    `"${escapeCsv(o.dec_principal_tel)}"`,
    `"${escapeCsv(o.dec_principal_lkd)}"`,
    `"${escapeCsv((o.matches_mdo || []).join(' | '))}"`,
    `"${escapeCsv((o.matches_mat || []).join(' | '))}"`
  ]);

  downloadCsv([headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n'), 'sweet_spot_obras_sp.csv');
  showToast(`Lista Sweet Spot (${items.length} obras) exportada com sucesso!`);
}

function downloadCsv(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Clipboard Helper
window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Copiado: ${text}`);
  }).catch(() => {
    showToast('Falha ao copiar.');
  });
};

// Toast Helper
function showToast(msg) {
  elements.toastMsg.textContent = msg;
  elements.toast.classList.remove('hidden');
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// Formatters & Badges Helpers
function formatSetorName(s) {
  if (!s) return 'OUTROS';
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function formatFaseName(f) {
  if (!f) return 'Desconhecida';
  return f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function getBadgeQualHTML(q) {
  if (q === 'OURO') return '<span class="badge badge-ouro">OURO</span>';
  if (q === 'PRATA') return '<span class="badge badge-prata">PRATA</span>';
  if (q === 'BRONZE') return '<span class="badge badge-bronze">BRONZE</span>';
  return '<span class="badge badge-pipeline">PIPELINE</span>';
}

function getBadgeFaseHTML(f) {
  if (f === 'EM_EXECUCAO') return '<span class="badge badge-execucao">Em Execução</span>';
  if (f === 'LICENCIAMENTO') return '<span class="badge badge-licenciamento">Licenciamento</span>';
  if (f === 'PLANEJAMENTO') return '<span class="badge badge-planejamento">Planejamento</span>';
  if (f === 'CONTRATACAO') return '<span class="badge badge-contratacao">Contratação</span>';
  if (f === 'CONCLUIDA') return '<span class="badge badge-concluida">Concluída</span>';
  return `<span class="badge badge-pipeline">${formatFaseName(f)}</span>`;
}

function getBadgeStatusB2BHTML(s) {
  if (!s) return '';
  if (s.startsWith('1_')) return '<span class="badge badge-sweet-ouro" title="Decisor Verde + Match Homologado">★ SWEET SPOT OURO</span>';
  if (s.startsWith('2_')) return '<span class="badge badge-ouro">SWEET SPOT PRATA</span>';
  if (s.startsWith('3_')) return '<span class="badge badge-prata">PROSPECÇÃO</span>';
  if (s.startsWith('4_')) return '<span class="badge badge-planejamento">MEGA OBRA</span>';
  if (s.startsWith('5_')) return '<span class="badge badge-pipeline">BASE GERAL</span>';
  return '';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeCsv(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
}
