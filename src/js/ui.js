import { 
    gruposClassificacao, 
    mapaMataMataCalculado, 
    getScoreInput, 
    getPenaltiesInput 
} from './engine.js';
import { hasOfficialResult } from './officialResults.js';
import { getFlagTag } from './teams.js';
import { jogosGrupos, estruturaNosMataMata } from './matches.js';
import { translations, translateTeam, translatePlaceholder } from './translate.js';

export const currentLang = 'pt';
export let currentTheme = localStorage.getItem('wc2026_theme') || 'dark';

function getMatchLockState(matchId) {
    const isLocked = hasOfficialResult(matchId);

    return {
        isLocked,
        lockedAttrs: isLocked ? 'disabled' : '',
        lockedClasses: isLocked ? ' official-score-locked' : '',
        badgeLabel: isLocked ? translations.pt.officialBadge : translations.pt.editableBadge,
        badgeClass: isLocked ? 'is-official' : 'is-editable'
    };
}

export function initToggles() {
    const btnTheme = document.getElementById('btn-theme');

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
        if (lblBtnTheme) lblBtnTheme.textContent = 'Modo Claro';
    } else {
        htmlEl.classList.remove('dark');
        if (lblBtnTheme) lblBtnTheme.textContent = 'Modo Escuro';
    }
}

export function applyLanguage() {
    const t = translations.pt;
    document.documentElement.lang = 'pt-BR';
    
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
    const lblBtnGruposMobile = document.getElementById('lbl-btn-grupos-mobile');
    const lblBtnMataMataMobile = document.getElementById('lbl-btn-mata-mata-mobile');
    
    if (btnGrupos) btnGrupos.textContent = t.tabGroups;
    if (btnMataMata) btnMataMata.textContent = t.tabKnockout;
    if (lblBtnGruposMobile) lblBtnGruposMobile.textContent = t.tabGroups;
    if (lblBtnMataMataMobile) lblBtnMataMataMobile.textContent = t.tabKnockout;

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
    if (lblFooterSub) lblFooterSub.textContent = "Desenvolvido por Cadu Barbosa • Dados públicos • Copa do Mundo FIFA 2026";
    if (lblBtnPix) lblBtnPix.textContent = t.contribPix;
    if (lblBtnReset) lblBtnReset.textContent = t.resetPredictions;
}

function getTabButtonClassName(isActive) {
    return `header-tab-btn${isActive ? ' is-active' : ''}`;
}

export function switchTab(tab) {
    const btnGrupos = document.getElementById('btn-grupos');
    const btnMataMata = document.getElementById('btn-mata-mata');
    const sectionGrupos = document.getElementById('section-grupos');
    const sectionMataMata = document.getElementById('section-mata-mata');

    if (!btnGrupos || !btnMataMata || !sectionGrupos || !sectionMataMata) return;

    const t = translations.pt;
    const normalizedTab = tab === 'mata-mata' ? 'mata-mata' : 'grupos';

    btnGrupos.className = getTabButtonClassName(normalizedTab === 'grupos');
    btnMataMata.className = getTabButtonClassName(normalizedTab === 'mata-mata');
    btnGrupos.textContent = t.tabGroups;
    btnMataMata.textContent = t.tabKnockout;
    
    sectionGrupos.classList.toggle('hidden', normalizedTab !== 'grupos');
    sectionMataMata.classList.toggle('hidden', normalizedTab !== 'mata-mata');

    document.querySelectorAll('.mobile-tab-btn').forEach((btn) => {
        const isActive = btn.getAttribute('data-tab') === normalizedTab;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    if (normalizedTab === 'mata-mata') {
        renderKnockoutStage();
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
    const t = translations.pt;

    gruposParaMostrar.forEach(g => {
        const div = document.createElement('div');
        div.className = "group-standings-card";

        let rowsHtml = gruposClassificacao[g].map((teamObj, idx) => {
            let rowBg = "text-slate-700 dark:text-slate-300";
            if (idx < 2) rowBg = "standings-row-highlight text-emerald-900 dark:text-emerald-300 font-bold";
            
            const localizedTeamName = translateTeam(teamObj.name, currentLang);
            
            return `
                <tr class="text-sm ${rowBg} border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td class="py-3 font-bold text-center w-8">${idx + 1}º</td>
                    <td class="py-3 font-semibold flex items-center gap-2 min-w-0">
                        ${getFlagTag(teamObj.name)} <span class="whitespace-nowrap text-sm truncate">${localizedTeamName}</span>
                    </td>
                    <td class="py-3 font-bold text-center">${teamObj.P}</td>
                    <td class="py-3 text-center text-slate-400 dark:text-slate-500">${teamObj.J}</td>
                    <td class="py-3 text-center font-medium">${teamObj.SG > 0 ? '+' + teamObj.SG : teamObj.SG}</td>
                    <td class="py-3 text-center text-slate-400 dark:text-slate-500">${teamObj.GP}</td>
                </tr>
            `;
        }).join('');

        div.innerHTML = `
            <h3 class="text-base font-extrabold text-slate-950 dark:text-slate-100 uppercase tracking-[0.24em] mb-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 flex justify-between items-center gap-3">
                <span>${t.groupTitle} ${g}</span>
            </h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] border-b border-slate-200/80 dark:border-slate-800/80">
                        <th class="pb-2 text-center">${t.tablePos}</th>
                        <th class="pb-2">${t.tableTeam}</th>
                        <th class="pb-2 text-center">${t.tablePts}</th>
                        <th class="pb-2 text-center">${t.tablePl}</th>
                        <th class="pb-2 text-center">${t.tableGd}</th>
                        <th class="pb-2 text-center">${t.tableGf}</th>
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
    const t = translations.pt;

    jogosFiltrados.forEach(j => {
        const tr = document.createElement('tr');
        tr.className = j.destaque 
            ? "fixture-row fixture-row-highlight" 
            : "fixture-row";

        const sh = getScoreInput(j.id, 'home');
        const sa = getScoreInput(j.id, 'away');
        const { lockedAttrs, lockedClasses, badgeLabel, badgeClass } = getMatchLockState(j.id);

        const homeName = translateTeam(j.home, currentLang);
        const awayName = translateTeam(j.away, currentLang);

        tr.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                    <span class="font-bold text-slate-500 dark:text-slate-400 text-xs">#${j.id}</span>
                    <span class="match-badge ${badgeClass}">${badgeLabel}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium text-sm whitespace-nowrap">${j.data}</td>
            <td class="px-6 py-3.5">
                <span class="match-group-pill">${t.groupTitle} ${j.grupo}</span>
            </td>
            <td class="px-6 py-3.5">
                <div class="fixture-versus">
                <div class="flex items-center justify-end gap-2 w-36 md:w-44 text-right">
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">${homeName}</span>
                        ${getFlagTag(j.home)}
                    </div>
                    <input type="number" min="0" placeholder="- " value="${sh}" 
                        oninput="window.setScoreInput(${j.id}, 'home', this.value)"
                        aria-label="${t.tableVs} ${homeName}"
                        ${lockedAttrs}
                    class="score-input-lg${lockedClasses}">
                    <span class="text-slate-300 dark:text-slate-700 font-bold text-sm">✕</span>
                    <input type="number" min="0" placeholder="- " value="${sa}" 
                        oninput="window.setScoreInput(${j.id}, 'away', this.value)"
                        aria-label="${t.tableVs} ${awayName}"
                        ${lockedAttrs}
                    class="score-input-lg${lockedClasses}">
                <div class="flex items-center justify-start gap-2 w-36 md:w-44 text-left">
                        ${getFlagTag(j.away)}
                    <span class="font-semibold text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">${awayName}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm max-w-[240px] truncate">${j.local}</td>
        `;
        tbody.appendChild(tr);

        const card = document.createElement('article');
        card.className = j.destaque
            ? "fixture-card fixture-card-highlight"
            : "fixture-card";

        card.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="font-bold text-xs text-slate-500 dark:text-slate-400">${j.data}</span>
                <span class="match-group-pill">${t.groupTitle} ${j.grupo}</span>
            </div>
            <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-xs text-slate-400 dark:text-slate-500">Jogo #${j.id}</span>
                <span class="match-badge ${badgeClass}">${badgeLabel}</span>
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
                    class="score-input-lg${lockedClasses}">
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
                    class="score-input-lg${lockedClasses}">
                </div>
            </div>
            <div class="text-[11px] text-slate-400 dark:text-slate-500 truncate">${j.local}</div>
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

function normalizeMatchDate(matchDate) {
    return matchDate;
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

    const t = translations.pt;
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

    const { badgeLabel, badgeClass } = getMatchLockState(match.id);
    const matchDate = normalizeMatchDate(match.data);
    const penaltiesInline = isEmpate
        ? `<span class="knockout-penalties-inline">${t.penalties} <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${match.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="knockout-penalty-input${lockedClasses}">-<input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${match.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="knockout-penalty-input${lockedClasses}"></span>`
        : '';

    return `
        <article class="${cardClass}">
            <header class="knockout-match-header">
                <span>${t.confrontation} #${match.id}</span>
                <span>${matchDate} · ${match.hora}</span>
            </header>
            <div class="knockout-badge-row">
                <span class="match-badge ${badgeClass}">${badgeLabel}</span>
            </div>

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
    const t = translations.pt;
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
                <span class="kob-mini-date">${matchShortDate} · ${match.hora}</span>
                <span class="kob-mini-local">${match.local || ''}</span>
            </div>
            <div class="kob-mini-teams">
                <div class="kob-mini-team ${homeWinner ? 'kob-mini-winner' : awayWinner ? 'kob-mini-loser' : ''}">
                    <div class="kob-mini-team-info">
                        ${getFlagTag(dadosCalculados.home)}
                        <span class="kob-mini-name">${homeDisplayName}</span>
                    </div>
                    <div class="kob-mini-score-wrap">
                        <input type="number" min="0" placeholder="–" value="${sh}"
                            oninput="window.setScoreInput(${match.id}, 'home', this.value)"
                            aria-label="${t.tableVs} ${homeDisplayName}"
                            ${lockedAttrs}
                            class="kob-mini-score${lockedClasses}">
                    </div>
                </div>
                <div class="kob-mini-team ${awayWinner ? 'kob-mini-winner' : homeWinner ? 'kob-mini-loser' : ''}">
                    <div class="kob-mini-team-info">
                        ${getFlagTag(dadosCalculados.away)}
                        <span class="kob-mini-name">${awayDisplayName}</span>
                    </div>
                    <div class="kob-mini-score-wrap">
                        <input type="number" min="0" placeholder="–" value="${sa}"
                            oninput="window.setScoreInput(${match.id}, 'away', this.value)"
                            aria-label="${t.tableVs} ${awayDisplayName}"
                            ${lockedAttrs}
                            class="kob-mini-score${lockedClasses}">
                    </div>
                </div>
            </div>
            ${penaltiesHtml}
        </article>
    `;
}


function ensureKnockoutViewMode() {
    if (knockoutViewMode === 'bracket' || knockoutViewMode === 'list') return;
    // Default to list on narrow screens for better readability
    knockoutViewMode = window.innerWidth < 640 ? 'list' : 'bracket';
    localStorage.setItem('wc2026_knockout_view', knockoutViewMode);
}

function renderKnockoutListView() {
    const t = translations.pt;

    const phaseAccents = {
        round32: 'rgb(59 130 246)',
        round16: 'rgb(139 92 246)',
        quarterFinals: 'rgb(236 72 153)',
        semiFinals: 'rgb(245 158 11)',
        thirdPlace: 'rgb(100 116 139)',
        final: 'rgb(212 175 55)',
    };

    const phaseShortLabels = {
        round32: '16 avos',
        round16: 'Oitavas',
        quarterFinals: 'Quartas',
        semiFinals: 'Semi',
        thirdPlace: '3º Lugar',
        final: 'Final',
    };

    return `
        <div class="bk-cascade">
            ${estruturaNosMataMata.map((fase) => {
                const phaseKey = getKnockoutPhaseKey(fase.fase);
                const localizedFase = getLocalizedKnockoutPhaseLabel(fase.fase, t);
                const accent = phaseAccents[phaseKey] || 'rgb(59 130 246)';
                const count = fase.jogos.length;
                return `
                    <div class="bk-phase" data-phase-key="${phaseKey}" style="--bk-accent: ${accent}">
                        <div class="bk-phase-header">
                            <span class="bk-phase-badge">${phaseShortLabels[phaseKey] || localizedFase}</span>
                            <h4 class="bk-phase-title">${localizedFase}</h4>
                            <span class="bk-phase-count">${count} jogo${count > 1 ? 's' : ''}</span>
                        </div>
                        <div class="bk-phase-grid" style="--bk-cols: ${Math.min(count, 4)}">
                            ${fase.jogos.map((match) => buildMiniMatchCard(match, { phaseKey, compact: true })).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderKnockoutBracketView() {
    const t = translations.pt;
    const allMatchesById = new Map(estruturaNosMataMata.flatMap((fase) => fase.jogos.map((jogo) => [jogo.id, jogo])));
    const m = (id) => allMatchesById.get(id);
    const card = (id, phaseKey, side) => {
        const match = m(id);
        return match ? buildMiniMatchCard(match, { phaseKey, side }) : '';
    };

    // Left bracket (→ SF 101)
    // R32 pairs feeding R16: (73,75)→89, (74,77)→90, (81,82)→93, (83,84)→94
    // R16 pairs feeding QF: (89,90)→97, (93,94)→99
    // QF pair feeding SF: (97,99)→101

    // Right bracket (→ SF 102)
    // R32 pairs feeding R16: (76,78)→91, (79,80)→92, (85,87)→95, (86,88)→96
    // R16 pairs feeding QF: (91,92)→98, (95,96)→100
    // QF pair feeding SF: (98,100)→102

    return `
        <div class="wcb-scroll">
            <div class="wcb-phase-bar">
                <span class="wcb-phase-label">${t.round32}</span>
                <span class="wcb-phase-label">${t.round16}</span>
                <span class="wcb-phase-label">${t.quarterFinals}</span>
                <span class="wcb-phase-label">${t.semiFinals}</span>
                <span class="wcb-phase-label wcb-phase-label-center">🏆 ${t.final}</span>
                <span class="wcb-phase-label">${t.semiFinals}</span>
                <span class="wcb-phase-label">${t.quarterFinals}</span>
                <span class="wcb-phase-label">${t.round16}</span>
                <span class="wcb-phase-label">${t.round32}</span>
            </div>
            <div class="wcb-bracket">

                <!-- LEFT: Round of 32 (8 matches in 4 pairs) -->
                <div class="wcb-col" data-side="left" data-phase="round32">
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(73, 'round32', 'A')}</div>
                        <div class="wcb-slot">${card(75, 'round32', 'A')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(74, 'round32', 'A')}</div>
                        <div class="wcb-slot">${card(77, 'round32', 'A')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(81, 'round32', 'A')}</div>
                        <div class="wcb-slot">${card(82, 'round32', 'A')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(83, 'round32', 'A')}</div>
                        <div class="wcb-slot">${card(84, 'round32', 'A')}</div>
                    </div>
                </div>

                <!-- LEFT: Round of 16 (4 matches in 2 pairs) -->
                <div class="wcb-col" data-side="left" data-phase="round16">
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(89, 'round16', 'A')}</div>
                        <div class="wcb-slot">${card(90, 'round16', 'A')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(93, 'round16', 'A')}</div>
                        <div class="wcb-slot">${card(94, 'round16', 'A')}</div>
                    </div>
                </div>

                <!-- LEFT: Quarter-finals (2 matches as a pair) -->
                <div class="wcb-col" data-side="left" data-phase="quarterFinals">
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(97, 'quarterFinals', 'A')}</div>
                        <div class="wcb-slot">${card(99, 'quarterFinals', 'A')}</div>
                    </div>
                </div>

                <!-- LEFT: Semi-final (1 match) -->
                <div class="wcb-col" data-side="left" data-phase="semiFinals">
                    <div class="wcb-slot">${card(101, 'semiFinals', 'A')}</div>
                </div>

                <!-- CENTER: Final + Third Place -->
                <div class="wcb-col wcb-center-col" data-side="center">
                    <div class="wcb-center-final">
                        <span class="wcb-center-label">🏆 ${t.final}</span>
                        ${card(104, 'final', 'final')}
                    </div>
                    <div class="wcb-center-third">
                        <span class="wcb-center-label">🥉 ${t.thirdPlace}</span>
                        ${card(103, 'thirdPlace', 'final')}
                    </div>
                </div>

                <!-- RIGHT: Semi-final (1 match) -->
                <div class="wcb-col" data-side="right" data-phase="semiFinals">
                    <div class="wcb-slot">${card(102, 'semiFinals', 'B')}</div>
                </div>

                <!-- RIGHT: Quarter-finals (2 matches as a pair) -->
                <div class="wcb-col" data-side="right" data-phase="quarterFinals">
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(98, 'quarterFinals', 'B')}</div>
                        <div class="wcb-slot">${card(100, 'quarterFinals', 'B')}</div>
                    </div>
                </div>

                <!-- RIGHT: Round of 16 (4 matches in 2 pairs) -->
                <div class="wcb-col" data-side="right" data-phase="round16">
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(91, 'round16', 'B')}</div>
                        <div class="wcb-slot">${card(92, 'round16', 'B')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(95, 'round16', 'B')}</div>
                        <div class="wcb-slot">${card(96, 'round16', 'B')}</div>
                    </div>
                </div>

                <!-- RIGHT: Round of 32 (8 matches in 4 pairs) -->
                <div class="wcb-col" data-side="right" data-phase="round32">
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(76, 'round32', 'B')}</div>
                        <div class="wcb-slot">${card(78, 'round32', 'B')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(79, 'round32', 'B')}</div>
                        <div class="wcb-slot">${card(80, 'round32', 'B')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(85, 'round32', 'B')}</div>
                        <div class="wcb-slot">${card(87, 'round32', 'B')}</div>
                    </div>
                    <div class="wcb-bracket-pair">
                        <div class="wcb-slot">${card(86, 'round32', 'B')}</div>
                        <div class="wcb-slot">${card(88, 'round32', 'B')}</div>
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

    const t = translations.pt;
    container.innerHTML = `
        <div class="knockout-shell">
            <div class="knockout-header-copy">
                <div>
                    <p class="knockout-kicker">Mata-Mata · Copa do Mundo FIFA 2026</p>
                    <h3 class="knockout-headline">Chave eliminatória</h3>
                    <p class="knockout-subheadline">Acompanhe todos os confrontos oficiais, progresso de fases, pênaltis e o caminho até a grande final.</p>
                </div>
                <div class="knockout-controls">
                    <div class="knockout-view-toggle" role="tablist" aria-label="${t.knockoutViewLabel}">
                        <button class="knockout-view-btn ${knockoutViewMode === 'bracket' ? 'is-active' : ''}" data-knockout-view="bracket">🏆 ${t.knockoutBracketMode}</button>
                        <button class="knockout-view-btn ${knockoutViewMode === 'list' ? 'is-active' : ''}" data-knockout-view="list">📋 ${t.knockoutListMode}</button>
                    </div>
                </div>
            </div>
            <div class="knockout-content">
                ${knockoutViewMode === 'bracket' ? renderKnockoutBracketView() : renderKnockoutListView()}
            </div>
        </div>
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

function isResolvedTeamName(teamName) {
    return teamName &&
        !teamName.includes('Vencedor #') &&
        !teamName.includes('Perdedor #') &&
        !teamName.includes('Grupo ') &&
        teamName !== 'A definir';
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
