import { 
    gruposClassificacao, 
    mapaMataMataCalculado, 
    getScoreInput, 
    getPenaltiesInput 
} from './engine.js';
import { hasOfficialResult } from './officialResults.js';
import { countryCodes, getFlagTag } from './teams.js';
import { jogosGrupos, estruturaNosMataMata } from './matches.js';
import { translations, translateTeam, translatePlaceholder } from './translate.js';
import { sortThirdPlacedTeams } from './standings.js';

// Estado global de Tema e Idioma
export let currentLang = localStorage.getItem('wc2026_lang') || 'pt';
export let currentTheme = localStorage.getItem('wc2026_theme') || 'dark';

function getMatchLockState(matchId) {
    const isLocked = hasOfficialResult(matchId);

    return {
        isLocked,
        lockedAttrs: isLocked ? 'disabled' : '',
        lockedClasses: isLocked ? ' cursor-not-allowed !bg-slate-100 dark:!bg-slate-900' : ''
    };
}

export function initToggles() {
    const btnLang = document.getElementById('btn-lang');
    const btnTheme = document.getElementById('btn-theme');

    if (btnLang) {
        btnLang.addEventListener('click', () => {
            currentLang = currentLang === 'pt' ? 'en' : 'pt';
            localStorage.setItem('wc2026_lang', currentLang);
            applyLanguage();
            renderTablesGrid();
            renderGroupStage();
            renderKnockoutStage();
            renderStatistics();
        });
    }

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('wc2026_theme', currentTheme);
            applyTheme();
        });
    }

    // Aplicação inicial
    applyLanguage();
    applyTheme();
}

export function applyTheme() {
    const htmlEl = document.documentElement;
    const lblBtnTheme = document.getElementById('lbl-btn-theme');
    
    if (currentTheme === 'dark') {
        htmlEl.classList.add('dark');
        if (lblBtnTheme) lblBtnTheme.textContent = currentLang === 'pt' ? 'Modo Claro' : 'Light Mode';
    } else {
        htmlEl.classList.remove('dark');
        if (lblBtnTheme) lblBtnTheme.textContent = currentLang === 'pt' ? 'Modo Escuro' : 'Dark Mode';
    }
}

export function applyLanguage() {
    const t = translations[currentLang];
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'pt-BR';
    
    // Header
    const titleApp = document.getElementById('title-app');
    const subtitleApp = document.getElementById('subtitle-app');
    const loadingOverlayText = document.getElementById('loading-overlay-text');
    if (titleApp) titleApp.textContent = t.title;
    if (subtitleApp) subtitleApp.textContent = t.subtitle;
    if (loadingOverlayText) loadingOverlayText.textContent = t.loadingTable;

    // Tabs
    const btnGrupos = document.getElementById('btn-grupos');
    const btnMataMata = document.getElementById('btn-mata-mata');
    const btnEstatisticas = document.getElementById('btn-estatisticas');
    const lblBtnGruposMobile = document.getElementById('lbl-btn-grupos-mobile');
    const lblBtnMataMataMobile = document.getElementById('lbl-btn-mata-mata-mobile');
    const lblBtnEstatisticasMobile = document.getElementById('lbl-btn-estatisticas-mobile');
    
    if (btnGrupos) btnGrupos.textContent = t.tabGroups;
    if (btnMataMata) btnMataMata.textContent = t.tabKnockout;
    if (btnEstatisticas) btnEstatisticas.textContent = t.tabStats;
    if (lblBtnGruposMobile) lblBtnGruposMobile.textContent = t.tabGroups;
    if (lblBtnMataMataMobile) lblBtnMataMataMobile.textContent = t.tabKnockout;
    if (lblBtnEstatisticasMobile) lblBtnEstatisticasMobile.textContent = t.tabStats;

    // Botão de idioma
    const lblBtnLang = document.getElementById('lbl-btn-lang');
    if (lblBtnLang) lblBtnLang.textContent = currentLang === 'pt' ? 'English' : 'Português';

    // Botão de Tema
    applyTheme();

    // Filtros
    const lblFilter = document.getElementById('lbl-filter-grupo');
    const optAll = document.getElementById('opt-all-groups');
    const lblGroupInfo = document.getElementById('lbl-group-info');
    if (lblFilter) lblFilter.textContent = t.filterLabel;
    if (optAll) optAll.textContent = t.filterAll;
    if (lblGroupInfo) lblGroupInfo.textContent = t.groupInfo;

    // Tabela calendário
    const lblFixturesTitle = document.getElementById('lbl-fixtures-title');
    const lblFixturesCount = document.getElementById('lbl-fixtures-count');
    if (lblFixturesTitle) lblFixturesTitle.textContent = t.fixturesTitle;
    if (lblFixturesCount) lblFixturesCount.textContent = t.fixturesCount;

    const thMatch = document.getElementById('th-match');
    const thDateTime = document.getElementById('th-datetime');
    const thGroup = document.getElementById('th-group');
    const thConfront = document.getElementById('th-confront');
    const thStadium = document.getElementById('th-stadium');
    
    if (thMatch) thMatch.textContent = t.tableMatch;
    if (thDateTime) thDateTime.textContent = t.tableDateTime;
    if (thGroup) thGroup.textContent = t.tableGroup;
    if (thConfront) thConfront.textContent = t.tableVs;
    if (thStadium) thStadium.textContent = t.tableStadium;

    // Banner do Campeão
    const lblChampTitle = document.getElementById('lbl-champion-title');
    const lblChampSub = document.getElementById('lbl-champion-subtitle');
    if (lblChampTitle) lblChampTitle.textContent = t.championTitle;
    if (lblChampSub) lblChampSub.textContent = t.championSubtitle;

    // Footer
    const lblFooterTitle = document.getElementById('lbl-footer-title');
    const lblFooterSub = document.getElementById('lbl-footer-sub');
    const lblBtnPix = document.getElementById('lbl-btn-pix');
    const lblBtnReset = document.getElementById('lbl-btn-reset');
    if (lblFooterTitle) lblFooterTitle.textContent = `© 2026 ${t.title}`;
    if (lblFooterSub) lblFooterSub.textContent = currentLang === 'pt' 
        ? "Desenvolvido por Cadu Barbosa • Dados Públicos • FIFA World Cup 2026"
        : "Developed by Cadu Barbosa • Public Data • FIFA World Cup 2026";
    if (lblBtnPix) lblBtnPix.textContent = t.contribPix;
    if (lblBtnReset) lblBtnReset.textContent = t.resetPredictions;
}

export function switchTab(tab) {
    const btnGrupos = document.getElementById('btn-grupos');
    const btnMataMata = document.getElementById('btn-mata-mata');
    const btnEstatisticas = document.getElementById('btn-estatisticas');
    const sectionGrupos = document.getElementById('section-grupos');
    const sectionMataMata = document.getElementById('section-mata-mata');
    const sectionEstatisticas = document.getElementById('section-estatisticas');

    if (!btnGrupos || !btnMataMata || !btnEstatisticas || !sectionGrupos || !sectionMataMata || !sectionEstatisticas) return;

    const t = translations[currentLang];

    if (tab === 'grupos') {
        btnGrupos.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-gradient-to-b from-white to-gray-100 text-blue-950 shadow-md transition-all transform scale-105 select-none";
        btnGrupos.textContent = t.tabGroups;
        btnMataMata.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnMataMata.textContent = t.tabKnockout;
        btnEstatisticas.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnEstatisticas.textContent = t.tabStats;
    } else if (tab === 'mata-mata') {
        btnGrupos.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnGrupos.textContent = t.tabGroups;
        btnMataMata.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-gradient-to-b from-white to-gray-100 text-blue-950 shadow-md transition-all transform scale-105 select-none";
        btnMataMata.textContent = t.tabKnockout;
        btnEstatisticas.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnEstatisticas.textContent = t.tabStats;
    } else if (tab === 'estatisticas') {
        btnGrupos.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnGrupos.textContent = t.tabGroups;
        btnMataMata.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnMataMata.textContent = t.tabKnockout;
        btnEstatisticas.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-gradient-to-b from-white to-gray-100 text-blue-950 shadow-md transition-all transform scale-105 select-none";
        btnEstatisticas.textContent = t.tabStats;
    } else {
        btnGrupos.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-gradient-to-b from-white to-gray-100 text-blue-950 shadow-md transition-all transform scale-105 select-none";
        btnGrupos.textContent = t.tabGroups;
        btnMataMata.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnMataMata.textContent = t.tabKnockout;
        btnEstatisticas.className = "px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold text-blue-200 hover:text-white transition-all select-none";
        btnEstatisticas.textContent = t.tabStats;
        tab = 'grupos';
    }
    
    sectionGrupos.classList.toggle('hidden', tab !== 'grupos');
    sectionMataMata.classList.toggle('hidden', tab !== 'mata-mata');
    sectionEstatisticas.classList.toggle('hidden', tab !== 'estatisticas');

    document.querySelectorAll('.mobile-tab-btn').forEach((btn) => {
        const isActive = btn.getAttribute('data-tab') === tab;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    if (tab === 'mata-mata') {
        renderKnockoutStage();
    } else if (tab === 'estatisticas') {
        renderStatistics();
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

export function renderTablesGrid() {
    const filtroEl = document.getElementById('filter-grupo');
    const container = document.getElementById('grid-tabelas-classificacao');
    if (!filtroEl || !container) return;

    const filtro = filtroEl.value;
    container.innerHTML = '';

    const gruposParaMostrar = filtro === 'Todos' ? Object.keys(gruposClassificacao) : [filtro];
    const t = translations[currentLang];

    gruposParaMostrar.forEach(g => {
        const div = document.createElement('div');
        div.className = "bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200/80 dark:border-slate-800/80 p-4 transition-all hover:shadow-lg transition-colors duration-300";

        let rowsHtml = gruposClassificacao[g].map((teamObj, idx) => {
            let rowBg = "text-slate-700 dark:text-slate-300";
            if (idx < 2) rowBg = "bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-bold";
            
            const localizedTeamName = translateTeam(teamObj.name, currentLang);
            
            return `
                <tr class="text-sm md:text-xs ${rowBg} border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td class="py-2.5 font-bold text-center w-6">${idx + 1}º</td>
                    <td class="py-2.5 font-semibold flex items-center gap-2">
                        ${getFlagTag(teamObj.name)} <span class="whitespace-nowrap text-sm md:text-xs">${localizedTeamName}</span>
                    </td>
                    <td class="py-2.5 font-bold text-center">${teamObj.P}</td>
                    <td class="py-2.5 text-center text-slate-400 dark:text-slate-500">${teamObj.J}</td>
                    <td class="py-2.5 text-center font-medium">${teamObj.SG > 0 ? '+' + teamObj.SG : teamObj.SG}</td>
                    <td class="py-2.5 text-center text-slate-400 dark:text-slate-500">${teamObj.GP}</td>
                </tr>
            `;
        }).join('');

        div.innerHTML = `
            <h3 class="text-base md:text-sm font-extrabold text-blue-950 dark:text-blue-200 uppercase tracking-wider mb-3 border-b dark:border-slate-800/80 pb-2 flex justify-between">
                <span>${t.groupTitle} ${g}</span>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 font-normal">${t.liveClass}</span>
            </h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase border-b dark:border-slate-800/80">
                        <th class="pb-1 text-center">${t.tablePos}</th>
                        <th class="pb-1">${t.tableTeam}</th>
                        <th class="pb-1 text-center">${t.tablePts}</th>
                        <th class="pb-1 text-center">${t.tablePl}</th>
                        <th class="pb-1 text-center">${t.tableGd}</th>
                        <th class="pb-1 text-center">${t.tableGf}</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
        container.appendChild(div);
    });
}

export function renderGroupStage() {
    const filtroEl = document.getElementById('filter-grupo');
    const tbody = document.getElementById('table-body-grupos');
    const cardsContainer = document.getElementById('cards-body-grupos');
    if (!filtroEl || !tbody || !cardsContainer) {
        console.warn('Elementos de renderização da fase de grupos não encontrados.');
        return;
    }

    const filtro = filtroEl.value;
    tbody.innerHTML = '';
    cardsContainer.innerHTML = '';

    const jogosFiltrados = filtro === 'Todos' ? jogosGrupos : jogosGrupos.filter(j => j.grupo === filtro);
    const t = translations[currentLang];

    jogosFiltrados.forEach(j => {
        const tr = document.createElement('tr');
        tr.className = j.destaque 
            ? "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors" 
            : "hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0";

        const sh = getScoreInput(j.id, 'home');
        const sa = getScoreInput(j.id, 'away');
        const { lockedAttrs, lockedClasses } = getMatchLockState(j.id);

        const homeName = translateTeam(j.home, currentLang);
        const awayName = translateTeam(j.away, currentLang);

        let localizedDate = j.data;
        if (currentLang === 'en') {
            localizedDate = localizedDate
                .replace('(Qui)', '(Thu)').replace('(Sex)', '(Fri)').replace('(Sáb)', '(Sat)')
                .replace('(Dom)', '(Sun)').replace('(Seg)', '(Mon)').replace('(Ter)', '(Tue)')
                .replace('(Qua)', '(Wed)');
        }

        let localizedVenue = j.local;
        if (currentLang === 'en') {
            localizedVenue = localizedVenue
                .replace('Cidade do México', 'Mexico City')
                .replace('Nova York', 'New York')
                .replace('Filadélfia', 'Philadelphia');
        }

        tr.innerHTML = `
            <td class="px-6 py-3.5 font-bold text-slate-400 dark:text-slate-500 text-xs">#${j.id}</td>
            <td class="px-6 py-3.5 text-slate-600 dark:text-slate-400 font-medium text-xs whitespace-nowrap">${localizedDate}</td>
            <td class="px-6 py-3.5">
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-bold">${t.groupTitle} ${j.grupo}</span>
            </td>
            <td class="px-6 py-3.5">
                <div class="flex items-center justify-center gap-3">
                <div class="flex items-center justify-end gap-2 w-36 md:w-44 text-right">
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs md:text-sm whitespace-nowrap">${homeName}</span>
                        ${getFlagTag(j.home)}
                    </div>
                    <input type="number" min="0" placeholder="- " value="${sh}" 
                        oninput="window.setScoreInput(${j.id}, 'home', this.value)"
                        aria-label="${t.tableVs} ${homeName}"
                        ${lockedAttrs}
                    class="w-12 h-11 md:w-11 md:h-9 min-h-[44px] md:min-h-0 text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-black text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all${lockedClasses}">
                    <span class="text-slate-300 dark:text-slate-700 font-bold text-xs">✕</span>
                    <input type="number" min="0" placeholder="- " value="${sa}" 
                        oninput="window.setScoreInput(${j.id}, 'away', this.value)"
                        aria-label="${t.tableVs} ${awayName}"
                        ${lockedAttrs}
                    class="w-12 h-11 md:w-11 md:h-9 min-h-[44px] md:min-h-0 text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-black text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all${lockedClasses}">
                <div class="flex items-center justify-start gap-2 w-36 md:w-44 text-left">
                        ${getFlagTag(j.away)}
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-xs md:text-sm whitespace-nowrap">${awayName}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3.5 text-slate-400 dark:text-slate-500 text-xs max-w-[200px] truncate">${localizedVenue}</td>
        `;
        tbody.appendChild(tr);

        const card = document.createElement('article');
        card.className = j.destaque
            ? "bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4 space-y-3"
            : "bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl p-4 space-y-3";

        card.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-xs text-slate-500 dark:text-slate-400">${localizedDate}</span>
                <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-bold">${t.groupTitle} ${j.grupo}</span>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    ${getFlagTag(j.home)}
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">${homeName}</span>
                </div>
                <input type="number" min="0" placeholder="- " value="${sh}"
                    oninput="window.setScoreInput(${j.id}, 'home', this.value)"
                    aria-label="${t.tableVs} ${homeName}"
                    ${lockedAttrs}
                    class="w-12 h-11 min-h-[44px] text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-black text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all${lockedClasses}">
                </div>
                <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    ${getFlagTag(j.away)}
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">${awayName}</span>
                </div>
                <input type="number" min="0" placeholder="- " value="${sa}"
                    oninput="window.setScoreInput(${j.id}, 'away', this.value)"
                    aria-label="${t.tableVs} ${awayName}"
                    ${lockedAttrs}
                    class="w-12 h-11 min-h-[44px] text-center bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-black text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all${lockedClasses}">
                </div>
            </div>
            <div class="text-[11px] text-slate-400 dark:text-slate-500 truncate">${localizedVenue}</div>
        `;
        cardsContainer.appendChild(card);
    });
}

const fifaWorldCupTrophyImageUrl = 'https://www.edigitalagency.com.au/wp-content/uploads/new-FIFA-World-Cup-2026-logo-white-PNG-small-size.png';

let knockoutViewMode = localStorage.getItem('wc2026_knockout_view');

function getKnockoutPhaseKey(faseNome) {
    if (faseNome.includes('Dezesseis-avos')) return 'round32';
    if (faseNome.includes('Oitavas')) return 'round16';
    if (faseNome.includes('Quartas')) return 'quarterFinals';
    if (faseNome.includes('Semifinais')) return 'semiFinals';
    if (faseNome.includes('Disputa')) return 'thirdPlace';
    if (faseNome.includes('Final')) return 'final';
    return 'round32';
}

function getLocalizedKnockoutPhaseLabel(faseNome, t) {
    const key = getKnockoutPhaseKey(faseNome);
    if (key === 'round32') return t.round32;
    if (key === 'round16') return t.round16;
    if (key === 'quarterFinals') return t.quarterFinals;
    if (key === 'semiFinals') return t.semiFinals;
    if (key === 'thirdPlace') return t.thirdPlace;
    return t.final;
}

function normalizeMatchDate(matchDate, lang) {
    if (lang !== 'en') return matchDate;
    return matchDate
        .replace('(Qui)', '(Thu)').replace('(Sex)', '(Fri)').replace('(Sáb)', '(Sat)')
        .replace('(Dom)', '(Sun)').replace('(Seg)', '(Mon)').replace('(Ter)', '(Tue)')
        .replace('(Qua)', '(Wed)');
}

function getWinnerInfo(match, dadosCalculados) {
    const sh = getScoreInput(match.id, 'home');
    const sa = getScoreInput(match.id, 'away');
    if (sh === '' || sa === '') return { winner: null, decidedByPenalties: false };

    const gh = parseInt(sh, 10);
    const ga = parseInt(sa, 10);
    if (Number.isNaN(gh) || Number.isNaN(ga)) return { winner: null, decidedByPenalties: false };

    if (gh > ga) return { winner: 'home', decidedByPenalties: false };
    if (ga > gh) return { winner: 'away', decidedByPenalties: false };

    const penH = getPenaltiesInput(match.id, 'home');
    const penA = getPenaltiesInput(match.id, 'away');
    if (penH !== '' && penA !== '') {
        const ph = parseInt(penH, 10);
        const pa = parseInt(penA, 10);
        if (!Number.isNaN(ph) && !Number.isNaN(pa) && ph !== pa) {
            return { winner: ph > pa ? 'home' : 'away', decidedByPenalties: true };
        }
    }

    if (isResolvedTeamName(dadosCalculados.home) && !isResolvedTeamName(dadosCalculados.away)) {
        return { winner: 'home', decidedByPenalties: false };
    }
    if (isResolvedTeamName(dadosCalculados.away) && !isResolvedTeamName(dadosCalculados.home)) {
        return { winner: 'away', decidedByPenalties: false };
    }

    return { winner: null, decidedByPenalties: false };
}

function getCardStageClasses(phaseKey) {
    if (phaseKey === 'round16') return 'knockout-card-stage-round16';
    if (phaseKey === 'quarterFinals') return 'knockout-card-stage-quarterfinals';
    if (phaseKey === 'semiFinals') return 'knockout-card-stage-semifinals';
    if (phaseKey === 'final') return 'knockout-card-stage-final';
    return 'knockout-card-stage-round32';
}

function getToneClasses(side) {
    if (side === 'B') return 'knockout-tone-b';
    if (side === 'final') return 'knockout-tone-final';
    return 'knockout-tone-a';
}

function shouldAnimateAdvancedTeam(origin, teamName) {
    if (!origin || (origin.tipo !== 'venc' && origin.tipo !== 'perd')) return false;
    return isResolvedTeamName(teamName);
}

function buildKnockoutMatchCard(match, options = {}) {
    const {
        phaseKey = 'round32',
        side = 'A',
        showConnector = false,
        connectorClass = '',
        compact = true
    } = options;

    const t = translations[currentLang];
    const dadosCalculados = mapaMataMataCalculado[match.id] || { home: 'A definir', away: 'A definir' };
    const sh = getScoreInput(match.id, 'home');
    const sa = getScoreInput(match.id, 'away');
    const penH = getPenaltiesInput(match.id, 'home');
    const penA = getPenaltiesInput(match.id, 'away');
    const { lockedAttrs, lockedClasses } = getMatchLockState(match.id);

    const homeDisplayName = translateTeam(translatePlaceholder(dadosCalculados.home, currentLang), currentLang);
    const awayDisplayName = translateTeam(translatePlaceholder(dadosCalculados.away, currentLang), currentLang);

    const winnerInfo = getWinnerInfo(match, dadosCalculados);
    const isEmpate = sh !== '' && sa !== '' && parseInt(sh, 10) === parseInt(sa, 10);
    const homeWinner = winnerInfo.winner === 'home';
    const awayWinner = winnerInfo.winner === 'away';
    const hasAdvancedHome = shouldAnimateAdvancedTeam(match.origHome, dadosCalculados.home);
    const hasAdvancedAway = shouldAnimateAdvancedTeam(match.origAway, dadosCalculados.away);

    const cardClass = [
        'knockout-match-card',
        getCardStageClasses(phaseKey),
        getToneClasses(side),
        compact ? 'knockout-match-card-compact' : '',
        match.destaque ? 'knockout-match-highlight' : '',
        showConnector ? 'connector-right' : '',
        connectorClass,
        (hasAdvancedHome || hasAdvancedAway) ? 'knockout-card-progressed' : ''
    ].filter(Boolean).join(' ');

    const matchDate = normalizeMatchDate(match.data, currentLang);
    const penaltiesInline = isEmpate
        ? `<span class="knockout-penalties-inline">${t.penalties} <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${match.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="knockout-penalty-input${lockedClasses}">-<input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${match.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="knockout-penalty-input${lockedClasses}"></span>`
        : '';

    return `
        <article class="${cardClass}">
            <header class="knockout-match-header">
                <span>${t.confrontation} #${match.id}</span>
                <span>${matchDate} - ${match.hora}</span>
            </header>

            <div class="knockout-match-teams">
                <div class="knockout-team-row ${homeWinner ? 'team-winner' : ''} ${hasAdvancedHome ? 'team-advanced' : ''}">
                    <div class="knockout-team-label">
                        ${getFlagTag(dadosCalculados.home)}
                        <span class="truncate">${homeDisplayName}</span>
                    </div>
                    <div class="knockout-score-wrap">
                        ${homeWinner ? '<span class="knockout-qualified">➜</span>' : ''}
                        <input type="number" min="0" placeholder="-" value="${sh}"
                            oninput="window.setScoreInput(${match.id}, 'home', this.value)"
                            aria-label="${t.tableVs} ${homeDisplayName}"
                            ${lockedAttrs}
                            class="knockout-score-input${lockedClasses}">
                    </div>
                </div>

                <div class="knockout-team-row ${awayWinner ? 'team-winner' : ''} ${hasAdvancedAway ? 'team-advanced' : ''}">
                    <div class="knockout-team-label">
                        ${getFlagTag(dadosCalculados.away)}
                        <span class="truncate">${awayDisplayName}</span>
                    </div>
                    <div class="knockout-score-wrap">
                        ${awayWinner ? '<span class="knockout-qualified">➜</span>' : ''}
                        <input type="number" min="0" placeholder="-" value="${sa}"
                            oninput="window.setScoreInput(${match.id}, 'away', this.value)"
                            aria-label="${t.tableVs} ${awayDisplayName}"
                            ${lockedAttrs}
                            class="knockout-score-input${lockedClasses}">
                    </div>
                </div>
            </div>

            <footer class="knockout-match-footer">
                <span class="truncate">${match.local}</span>
                <span class="knockout-footer-right">${winnerInfo.decidedByPenalties ? '<span class="knockout-pen-badge">P</span>' : ''}${penaltiesInline}</span>
            </footer>
        </article>
    `;
}

function buildMiniMatchCard(match, options = {}) {
    const { phaseKey = 'round32', side = 'A' } = options;
    const t = translations[currentLang];
    const dadosCalculados = mapaMataMataCalculado[match.id] || { home: 'A definir', away: 'A definir' };
    const sh = getScoreInput(match.id, 'home');
    const sa = getScoreInput(match.id, 'away');
    const penH = getPenaltiesInput(match.id, 'home');
    const penA = getPenaltiesInput(match.id, 'away');
    const { lockedAttrs, lockedClasses } = getMatchLockState(match.id);

    const homeDisplayName = translateTeam(translatePlaceholder(dadosCalculados.home, currentLang), currentLang);
    const awayDisplayName = translateTeam(translatePlaceholder(dadosCalculados.away, currentLang), currentLang);

    const winnerInfo = getWinnerInfo(match, dadosCalculados);
    const isEmpate = sh !== '' && sa !== '' && parseInt(sh, 10) === parseInt(sa, 10);
    const homeWinner = winnerInfo.winner === 'home';
    const awayWinner = winnerInfo.winner === 'away';

    const resolvedClass = winnerInfo.winner ? ' kob-mini-resolved' : '';
    const phaseAccentClass = phaseKey === 'semiFinals' ? ' kob-mini-semi'
        : phaseKey === 'final' ? ' kob-mini-final'
        : phaseKey === 'thirdPlace' ? ' kob-mini-third'
        : phaseKey === 'quarterFinals' ? ' kob-mini-qf'
        : '';
    const sideClass = side === 'B' ? ' kob-mini-side-b' : side === 'final' ? ' kob-mini-side-final' : '';

    const penaltiesHtml = isEmpate
        ? `<div class="kob-mini-pen">${t.penalties.replace(':', '')} <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${match.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="kob-mini-pen-input${lockedClasses}">-<input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${match.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="kob-mini-pen-input${lockedClasses}"></div>`
        : '';

    const matchShortDate = match.data ? match.data.slice(0, 5) + '/26' : '';

    return `
        <article class="kob-mini-card${resolvedClass}${phaseAccentClass}${sideClass}">
            <div class="kob-mini-header">
                <span>${matchShortDate} · ${match.hora}</span>
                <span class="kob-mini-local">${match.local || ''}</span>
            </div>
            <div class="kob-mini-team ${homeWinner ? 'kob-mini-winner' : ''}">
                ${getFlagTag(dadosCalculados.home)}
                <span class="kob-mini-name">${homeDisplayName}</span>
                <input type="number" min="0" placeholder="–" value="${sh}"
                    oninput="window.setScoreInput(${match.id}, 'home', this.value)"
                    aria-label="${t.tableVs} ${homeDisplayName}"
                    ${lockedAttrs}
                    class="kob-mini-score${lockedClasses}">
            </div>
            <div class="kob-mini-team ${awayWinner ? 'kob-mini-winner' : ''}">
                ${getFlagTag(dadosCalculados.away)}
                <span class="kob-mini-name">${awayDisplayName}</span>
                <input type="number" min="0" placeholder="–" value="${sa}"
                    oninput="window.setScoreInput(${match.id}, 'away', this.value)"
                    aria-label="${t.tableVs} ${awayDisplayName}"
                    ${lockedAttrs}
                    class="kob-mini-score${lockedClasses}">
            </div>
            ${penaltiesHtml}
        </article>
    `;
}


function ensureKnockoutViewMode() {
    if (knockoutViewMode === 'bracket' || knockoutViewMode === 'list') return;

    const prefersList = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    knockoutViewMode = prefersList ? 'list' : 'bracket';
    localStorage.setItem('wc2026_knockout_view', knockoutViewMode);
}

function renderKnockoutListView() {
    const t = translations[currentLang];

    return `
        <div class="space-y-8">
            ${estruturaNosMataMata.map((fase) => {
                const phaseKey = getKnockoutPhaseKey(fase.fase);
                const localizedFase = getLocalizedKnockoutPhaseLabel(fase.fase, t);
                return `
                    <section class="space-y-4" data-phase-key="${phaseKey}">
                        <h3 class="text-lg md:text-xl font-extrabold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800/80 pb-2">${localizedFase}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            ${fase.jogos.map((match) => buildKnockoutMatchCard(match, { phaseKey, compact: true })).join('')}
                        </div>
                    </section>
                `;
            }).join('')}
        </div>
    `;
}

function renderKnockoutBracketView() {
    const t = translations[currentLang];
    const allMatchesById = new Map(estruturaNosMataMata.flatMap((fase) => fase.jogos.map((jogo) => [jogo.id, jogo])));
    const getMatch = (id) => allMatchesById.get(id);

    const renderMiniCards = (ids, phaseKey, side) =>
        ids.map((id) => getMatch(id)).filter(Boolean)
            .map((m) => buildMiniMatchCard(m, { phaseKey, side })).join('');

    const r32Short = t.bracketR32;
    const r16Short = t.bracketR16;
    const qfShort  = t.bracketQF;
    const sfShort  = t.bracketSF;

    const finalMatch      = getMatch(104);
    const thirdPlaceMatch = getMatch(103);

    return `
        <div class="kob-wrap" id="knockout-bracket-scroll">
            <div class="kob-track">

                <!-- LEFT SIDE: R32 | R16 | QF | SF (columns 1-4, flows left→center) -->
                <div class="kob-side kob-side-left">
                    <div class="kob-label">${r32Short}</div>
                    <div class="kob-label">${r16Short}</div>
                    <div class="kob-label">${qfShort}</div>
                    <div class="kob-label">${sfShort}</div>

                    <div class="kob-cell kob-left-r32-upper kob-conn-right" data-phase="round32">
                        ${renderMiniCards([73, 74, 75, 76, 77], 'round32', 'A')}
                    </div>
                    <div class="kob-cell kob-left-r16-upper kob-conn-right" data-phase="round16">
                        ${renderMiniCards([89, 90], 'round16', 'A')}
                    </div>
                    <div class="kob-cell kob-left-qf-upper kob-conn-right" data-phase="quarterFinals">
                        ${renderMiniCards([97], 'quarterFinals', 'A')}
                    </div>
                    <div class="kob-cell kob-left-sf" data-phase="semiFinals">
                        ${renderMiniCards([101], 'semiFinals', 'A')}
                    </div>

                    <div class="kob-cell kob-left-r32-lower kob-conn-right" data-phase="round32">
                        ${renderMiniCards([78, 79, 80, 81, 82], 'round32', 'A')}
                    </div>
                    <div class="kob-cell kob-left-r16-lower kob-conn-right" data-phase="round16">
                        ${renderMiniCards([91, 92], 'round16', 'A')}
                    </div>
                    <div class="kob-cell kob-left-qf-lower kob-conn-right" data-phase="quarterFinals">
                        ${renderMiniCards([99], 'quarterFinals', 'A')}
                    </div>
                </div>

                <!-- CENTER: Trophy + Final + 3rd Place -->
                <div class="kob-center">
                    <div class="kob-trophy-wrap">
                        <img class="kob-trophy-img" src="${fifaWorldCupTrophyImageUrl}" alt="FIFA World Cup Trophy">
                        <p class="kob-trophy-label">FIFA World Cup 2026</p>
                    </div>
                    <div class="kob-center-games">
                        <p class="kob-center-phase-label">${t.final}</p>
                        ${finalMatch ? buildMiniMatchCard(finalMatch, { phaseKey: 'final', side: 'final' }) : ''}
                        <p class="kob-center-phase-label kob-third-label">${t.thirdPlace}</p>
                        ${thirdPlaceMatch ? buildMiniMatchCard(thirdPlaceMatch, { phaseKey: 'thirdPlace', side: 'final' }) : ''}
                    </div>
                </div>

                <!-- RIGHT SIDE: SF | QF | R16 | R32 (columns 1-4, matches flow center→right) -->
                <!-- Note: right side has 3 R32 matches per half (vs 5 on left), per the 48-team bracket spec -->
                <div class="kob-side kob-side-right">
                    <div class="kob-label">${sfShort}</div>
                    <div class="kob-label">${qfShort}</div>
                    <div class="kob-label">${r16Short}</div>
                    <div class="kob-label">${r32Short}</div>

                    <div class="kob-cell kob-right-sf" data-phase="semiFinals">
                        ${renderMiniCards([102], 'semiFinals', 'B')}
                    </div>
                    <div class="kob-cell kob-right-qf-upper kob-conn-left" data-phase="quarterFinals">
                        ${renderMiniCards([98], 'quarterFinals', 'B')}
                    </div>
                    <div class="kob-cell kob-right-r16-upper kob-conn-left" data-phase="round16">
                        ${renderMiniCards([93, 94], 'round16', 'B')}
                    </div>
                    <div class="kob-cell kob-right-r32-upper kob-conn-left" data-phase="round32">
                        ${renderMiniCards([83, 84, 85], 'round32', 'B')}
                    </div>

                    <div class="kob-cell kob-right-qf-lower kob-conn-left" data-phase="quarterFinals">
                        ${renderMiniCards([100], 'quarterFinals', 'B')}
                    </div>
                    <div class="kob-cell kob-right-r16-lower kob-conn-left" data-phase="round16">
                        ${renderMiniCards([95, 96], 'round16', 'B')}
                    </div>
                    <div class="kob-cell kob-right-r32-lower kob-conn-left" data-phase="round32">
                        ${renderMiniCards([86, 87, 88], 'round32', 'B')}
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function renderKnockoutStage() {
    const container = document.getElementById('container-mata-mata');
    if (!container) return;

    ensureKnockoutViewMode();

    const t = translations[currentLang];
    container.innerHTML = `
        <div class="knockout-controls">
            <div class="knockout-view-toggle" role="tablist" aria-label="${t.knockoutViewLabel}">
                <button class="knockout-view-btn ${knockoutViewMode === 'bracket' ? 'is-active' : ''}" data-knockout-view="bracket">🌳 ${t.knockoutBracketMode}</button>
                <button class="knockout-view-btn ${knockoutViewMode === 'list' ? 'is-active' : ''}" data-knockout-view="list">📋 ${t.knockoutListMode}</button>
            </div>
        </div>
        ${knockoutViewMode === 'bracket' ? renderKnockoutBracketView() : renderKnockoutListView()}
    `;

    container.querySelectorAll('[data-knockout-view]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const nextMode = btn.getAttribute('data-knockout-view');
            if (!nextMode || nextMode === knockoutViewMode) return;
            knockoutViewMode = nextMode;
            localStorage.setItem('wc2026_knockout_view', knockoutViewMode);
            renderKnockoutStage();
        });
    });

}

function getStatsPhaseLabel(fase, t) {
    if (fase.includes('Dezesseis-avos')) return t.statsRound32;
    if (fase.includes('Oitavas')) return t.statsRound16;
    if (fase.includes('Quartas')) return t.statsQuarters;
    if (fase.includes('Semifinais')) return t.statsSemis;
    return t.tabKnockout;
}

function isResolvedTeamName(teamName) {
    return teamName &&
        !teamName.includes('Vencedor #') &&
        !teamName.includes('Winner #') &&
        !teamName.includes('Perdedor #') &&
        !teamName.includes('Loser #') &&
        !teamName.includes('Grupo ') &&
        teamName !== 'A definir' &&
        teamName !== 'TBD';
}

export function renderStatistics() {
    const container = document.getElementById('section-estatisticas');
    if (!container) return;
    container.innerHTML = '';

    const t = translations[currentLang];
    const gruposIniciados = Object.keys(gruposClassificacao).filter((grupo) =>
        jogosGrupos.some((jogo) =>
            jogo.grupo === grupo &&
            getScoreInput(jogo.id, 'home') !== '' &&
            getScoreInput(jogo.id, 'away') !== ''
        )
    );

    if (gruposIniciados.length === 0) {
        container.innerHTML = `<p class="text-sm font-semibold text-slate-500 dark:text-slate-400">${t.statsNoData}</p>`;
        return;
    }

    const classificados = [];
    const eliminadosPorNome = new Map();
    const terceiros = [];

    gruposIniciados.forEach((grupo) => {
        const classificacao = gruposClassificacao[grupo] || [];
        if (classificacao[0]) classificados.push({ name: classificacao[0].name, source: `1º Grupo ${grupo}` });
        if (classificacao[1]) classificados.push({ name: classificacao[1].name, source: `2º Grupo ${grupo}` });
        if (classificacao[2]) terceiros.push(classificacao[2]);
        if (classificacao[3]) eliminadosPorNome.set(classificacao[3].name, { name: classificacao[3].name, phase: t.statsGroupStage });
    });

    const terceirosOrdenados = sortThirdPlacedTeams(terceiros);
    const terceirosClassificados = terceirosOrdenados.slice(0, 8);
    const terceirosEliminados = terceirosOrdenados.slice(8);

    terceirosClassificados.forEach((team) => {
        classificados.push({ name: team.name, source: `3º Grupo ${team.group}` });
    });
    terceirosEliminados.forEach((team) => {
        eliminadosPorNome.set(team.name, { name: team.name, phase: t.statsGroupStage });
    });

    estruturaNosMataMata.forEach((fase) => {
        fase.jogos.forEach((jogo) => {
            const sh = getScoreInput(jogo.id, 'home');
            const sa = getScoreInput(jogo.id, 'away');
            if (sh === '' || sa === '') return;

            const gh = parseInt(sh, 10);
            const ga = parseInt(sa, 10);
            if (Number.isNaN(gh) || Number.isNaN(ga)) return;

            const dados = mapaMataMataCalculado[jogo.id] || {};
            const home = dados.home;
            const away = dados.away;

            if (!isResolvedTeamName(home) || !isResolvedTeamName(away)) return;

            let perdedor = null;
            if (gh > ga) perdedor = away;
            else if (ga > gh) perdedor = home;
            else {
                const penH = getPenaltiesInput(jogo.id, 'home');
                const penA = getPenaltiesInput(jogo.id, 'away');
                if (penH === '' || penA === '') return;
                const ph = parseInt(penH, 10);
                const pa = parseInt(penA, 10);
                if (Number.isNaN(ph) || Number.isNaN(pa) || ph === pa) return;
                perdedor = ph > pa ? away : home;
            }

            if (!perdedor) return;
            eliminadosPorNome.set(perdedor, {
                name: perdedor,
                phase: getStatsPhaseLabel(fase.fase, t)
            });
        });
    });

    const classificadosHtml = classificados.map((team) => {
        const nome = translateTeam(team.name, currentLang);
        const origem = translatePlaceholder(team.source, currentLang);
        return `
            <div class="bg-white/70 dark:bg-slate-900/70 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl p-4">
                <div class="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    ${getFlagTag(team.name)}
                    <span>${nome}</span>
                </div>
                <p class="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">${t.statsQualifiedFrom}: ${origem}</p>
            </div>
        `;
    }).join('');

    const eliminadosHtml = Array.from(eliminadosPorNome.values()).map((team) => {
        const nome = translateTeam(team.name, currentLang);
        return `
            <div class="bg-white/70 dark:bg-slate-900/70 border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-4">
                <div class="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    ${getFlagTag(team.name)}
                    <span>${nome}</span>
                </div>
                <p class="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">${t.statsEliminatedIn}: ${team.phase}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <section class="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 md:p-6 space-y-4">
            <h3 class="text-lg font-extrabold text-emerald-900 dark:text-emerald-300">${t.statsQualified}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">${classificadosHtml}</div>
        </section>
        <section class="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl p-5 md:p-6 space-y-4">
            <h3 class="text-lg font-extrabold text-rose-900 dark:text-rose-300">${t.statsEliminated}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">${eliminadosHtml}</div>
        </section>
    `;
}

export function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `bg-slate-900 dark:bg-slate-850 border border-slate-800 dark:border-slate-700 text-slate-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 ease-out`;
    toast.innerHTML = `
        <span class="text-emerald-400 font-bold text-sm">🏆</span>
        <span class="text-xs font-semibold">${message}</span>
    `;

    container.appendChild(toast);

    // Entrada suave
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    // Saída suave após 3 segundos
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
