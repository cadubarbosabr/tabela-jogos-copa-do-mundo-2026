import { 
    gruposClassificacao, 
    mapaMataMataCalculado, 
    getScoreInput, 
    getPenaltiesInput,
    calcularVencedorMataMata
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
    const iconBtnTheme = document.getElementById('icon-btn-theme');
    const t = translations.pt;

    if (currentTheme === 'dark') {
        htmlEl.classList.add('dark');
        if (lblBtnTheme) lblBtnTheme.textContent = t.themeLight;
        if (iconBtnTheme) iconBtnTheme.textContent = '🌙';
    } else {
        htmlEl.classList.remove('dark');
        if (lblBtnTheme) lblBtnTheme.textContent = t.themeDark;
        if (iconBtnTheme) iconBtnTheme.textContent = '☀️';
    }
}

export function applyLanguage() {
    const t = translations.pt;
    document.documentElement.lang = 'pt-BR';

    const titleApp = document.getElementById('title-app');
    const subtitleApp = document.getElementById('subtitle-app');
    const loadingOverlayText = document.getElementById('loading-overlay-text');
    if (titleApp) titleApp.textContent = t.brandTitle || 'WC26 Table';
    if (subtitleApp) subtitleApp.textContent = t.brandSubtitle || t.subtitle;
    if (loadingOverlayText) loadingOverlayText.textContent = t.loadingTable;

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el && value != null) el.textContent = value;
    };

    setText('btn-grupos', t.tabGroupsShort || t.tabGroups);
    setText('btn-mata-mata', t.tabKnockoutShort || t.tabKnockout);
    setText('btn-hoje', t.tabToday || t.tabTodayShort || 'Hoje');
    setText('lbl-btn-grupos-mobile', t.tabGroupsShort || 'Grupos');
    setText('lbl-btn-mata-mata-mobile', t.tabBracketShort || 'Chave');
    setText('lbl-btn-hoje-mobile', t.tabTodayShort || 'Hoje');

    applyTheme();

    setText('lbl-filter-grupo', t.filterLabel);
    setText('opt-all-groups', t.filterAllShort || t.filterAll);
    setText('lbl-group-info', t.groupInfo);
    setText('lbl-legend-qualified', t.legendQualified);
    setText('lbl-legend-third', t.legendThird);
    setText('lbl-legend-out', t.legendOut);
    setText('lbl-fixtures-title', t.fixturesTitle);
    setText('lbl-fixtures-count', t.fixturesCount);
    setText('th-match', t.tableMatch);
    setText('th-datetime', t.tableDateTime);
    setText('th-group', t.tableGroup);
    setText('th-confront', t.tableVs);
    setText('th-stadium', t.tableStadium);
    setText('lbl-champion-title', t.championTitle);
    setText('lbl-champion-subtitle', t.championSubtitle);
    setText('lbl-hoje-title', t.tabToday || 'Hoje');
    setText('lbl-hoje-sub', t.calendarSub || '');
    setText('lbl-footer-title', `© 2026 ${t.brandTitle || 'WC26 Table'}`);
    setText('lbl-footer-sub', 'Desenvolvido por Cadu Barbosa · Dados públicos ESPN');
    setText('lbl-btn-pix', t.contribPix);
    setText('lbl-btn-reset', t.resetPredictions);
}

const VALID_TABS = ['grupos', 'mata-mata', 'hoje'];

export function switchTab(tab) {
    const normalizedTab = VALID_TABS.includes(tab) ? tab : 'grupos';

    const sectionMap = {
        grupos: 'section-grupos',
        'mata-mata': 'section-mata-mata',
        hoje: 'section-hoje'
    };

    Object.entries(sectionMap).forEach(([key, sectionId]) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.toggle('hidden', key !== normalizedTab);
    });

    document.querySelectorAll('.arena-nav-item, .arena-bottom-item').forEach((btn) => {
        const isActive = btn.getAttribute('data-tab') === normalizedTab;
        btn.classList.toggle('is-active', isActive);
        if (btn.getAttribute('role') === 'tab') {
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        }
        btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    if (normalizedTab === 'mata-mata') renderKnockoutStage();
    if (normalizedTab === 'hoje') renderCalendarView();
    if (normalizedTab === 'grupos') {
        renderTablesGrid();
        renderSidePanel();
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

const GROUP_ACCENT_VARS = {
    A: 'var(--group-a)',
    B: 'var(--group-b)',
    C: 'var(--group-c)',
    D: 'var(--group-d)',
    E: 'var(--group-e)',
    F: 'var(--group-f)',
    G: 'var(--group-g)',
    H: 'var(--group-h)',
    I: 'var(--group-i)',
    J: 'var(--group-j)',
    K: 'var(--group-k)',
    L: 'var(--group-l)'
};

function getStandingsRowClass(index) {
    if (index < 2) return 'standings-row-qualified';
    if (index === 2) return 'standings-row-third';
    return 'standings-row-out';
}

export function renderTablesGrid() {
    const filtroEl = document.getElementById('filter-grupo');
    const container = document.getElementById('grid-tabelas-classificacao');
    if (!filtroEl || !container) return;

    const filtro = filtroEl.value;
    container.innerHTML = '';

    const gruposParaMostrar = filtro === 'Todos' ? Object.keys(gruposClassificacao) : [filtro];
    const t = translations.pt;

    gruposParaMostrar.forEach((g) => {
        const teams = gruposClassificacao[g] || [];
        const leadTeam = teams[0];
        const div = document.createElement('div');
        div.className = 'group-standings-card';
        div.style.setProperty('--group-accent', GROUP_ACCENT_VARS[g] || 'var(--wc-blue)');

        const rowsHtml = teams.map((teamObj, idx) => {
            const zoneClass = getStandingsRowClass(idx);
            const localizedTeamName = translateTeam(teamObj.name, currentLang);
            const gdDisplay = teamObj.SG > 0 ? `+${teamObj.SG}` : String(teamObj.SG);

            return `
                <tr class="${zoneClass}">
                    <td class="standings-pos">
                        <span class="standings-rank-badge">${idx + 1}</span>
                    </td>
                    <td>
                        <div class="standings-team">
                            ${getFlagTag(teamObj.name)}
                            <span class="standings-team-name">${localizedTeamName}</span>
                        </div>
                    </td>
                    <td class="standings-stat">${teamObj.J}</td>
                    <td class="standings-stat">${teamObj.V}</td>
                    <td class="standings-stat">${teamObj.E}</td>
                    <td class="standings-stat">${teamObj.D}</td>
                    <td class="standings-stat is-gd">${gdDisplay}</td>
                    <td class="standings-stat is-pts">${teamObj.P}</td>
                </tr>
            `;
        }).join('');

        div.innerHTML = `
            <div class="group-standings-accent" aria-hidden="true"></div>
            <div class="group-standings-body">
                <div class="group-standings-header">
                    <h3 class="group-standings-title">
                        ${t.groupTitle.toUpperCase()} ${g}
                        ${leadTeam ? getFlagTag(leadTeam.name) : ''}
                    </h3>
                </div>
                <table class="group-standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>${t.tableTeam}</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>SG</th>
                            <th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
        container.appendChild(div);
    });

    renderSidePanel();
}

function getMatchTimeLabel(dataStr) {
    const m = String(dataStr || '').match(/(\d{1,2}h\d{2})/);
    return m ? m[1] : '';
}

export function renderSidePanel() {
    const card = document.getElementById('side-next-match');
    const upcoming = document.getElementById('side-upcoming');
    if (!card) return;

    const t = translations.pt;

    // Prefer first match without full score; else last played with score
    const openMatch = jogosGrupos.find((j) => {
        const sh = getScoreInput(j.id, 'home');
        const sa = getScoreInput(j.id, 'away');
        return sh === '' || sa === '';
    });
    const featured = openMatch || jogosGrupos[jogosGrupos.length - 1];
    if (!featured) {
        card.innerHTML = `<p class="side-kicker">🔥 ${t.nextMatchTitle || 'Próximo jogo'}</p><p class="side-venue">Sem partidas.</p>`;
        return;
    }

    const sh = getScoreInput(featured.id, 'home');
    const sa = getScoreInput(featured.id, 'away');
    const { lockedAttrs, lockedClasses, badgeLabel, badgeClass } = getMatchLockState(featured.id);
    const homeName = translateTeam(featured.home, currentLang);
    const awayName = translateTeam(featured.away, currentLang);
    const scoreDisplay = sh !== '' && sa !== '' ? `${sh} – ${sa}` : '– : –';
    const statusLabel = openMatch ? (t.nextMatchTitle || 'Próximo jogo do dia') : (t.lastMatchTitle || 'Último jogo em destaque');

    card.innerHTML = `
        <p class="side-kicker">🔥 ${statusLabel}</p>
        <p class="side-venue">📍 ${featured.local}<br><span>${featured.data}</span></p>
        <div class="side-matchup">
            <div class="side-team">
                ${getFlagTag(featured.home)}
                <span class="side-team-name">${homeName}</span>
            </div>
            <div class="side-scoreboard">
                <span class="side-score-line">${scoreDisplay}</span>
                <span class="side-score-meta">${t.groupTitle} ${featured.grupo}</span>
            </div>
            <div class="side-team">
                ${getFlagTag(featured.away)}
                <span class="side-team-name">${awayName}</span>
            </div>
        </div>
        <div class="side-inputs">
            <input type="number" min="0" placeholder="-" value="${sh}"
                oninput="window.setScoreInput(${featured.id}, 'home', this.value)"
                aria-label="${homeName}"
                ${lockedAttrs}
                class="side-score-input${lockedClasses}">
            <input type="number" min="0" placeholder="-" value="${sa}"
                oninput="window.setScoreInput(${featured.id}, 'away', this.value)"
                aria-label="${awayName}"
                ${lockedAttrs}
                class="side-score-input${lockedClasses}">
        </div>
        <div class="side-meta-row">
            <span class="side-badge ${badgeClass}">${badgeLabel}</span>
            <span>#${featured.id}</span>
        </div>
    `;

    if (upcoming) {
        const list = jogosGrupos
            .filter((j) => j.id !== featured.id)
            .filter((j) => {
                const a = getScoreInput(j.id, 'home');
                const b = getScoreInput(j.id, 'away');
                return a === '' || b === '';
            })
            .slice(0, 4);

        upcoming.innerHTML = `
            <p class="upcoming-title">${t.upcomingTitle || 'A seguir'}</p>
            ${list.length === 0
                ? `<div class="upcoming-item"><span>${t.noUpcoming || 'Nenhum jogo pendente'}</span></div>`
                : list.map((j) => `
                    <div class="upcoming-item">
                        <span>${translateTeam(j.home, currentLang)} × ${translateTeam(j.away, currentLang)}</span>
                        <span class="upcoming-time">${getMatchTimeLabel(j.data) || j.data.slice(0, 5)}</span>
                    </div>
                `).join('')}
        `;
    }
}

let calendarFilter = 'today';

/** Data de referência no fuso BRT (America/Sao_Paulo) */
function getBrazilNowParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const get = (type) => parts.find((p) => p.type === type)?.value;
    return {
        year: Number(get('year')),
        month: Number(get('month')),
        day: Number(get('day'))
    };
}

function formatBrazilDateLong(date = new Date()) {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

/** Extrai dia/mês de strings como "11/06 (Qui) - 16h00" ou "28/06 (Dom)" */
function parseMatchDayMonth(dataStr) {
    const m = String(dataStr || '').match(/(\d{1,2})\/(\d{1,2})/);
    if (!m) return null;
    return { day: Number(m[1]), month: Number(m[2]) };
}

function isMatchOnBrazilDay(dataStr, refDate = new Date()) {
    const parsed = parseMatchDayMonth(dataStr);
    if (!parsed) return false;
    const now = getBrazilNowParts(refDate);
    // Copa 2026: datas do calendário usam ano 2026
    return parsed.day === now.day && parsed.month === now.month && now.year === 2026;
}

function getChampionTeamName() {
    const winner = calcularVencedorMataMata(104);
    if (winner && isResolvedTeamName(winner)) return winner;
    return null;
}

function isWorldCupFinished(refDate = new Date()) {
    if (getChampionTeamName()) return true;

    // Após o dia da final (19/07/2026) em BRT
    const now = getBrazilNowParts(refDate);
    if (now.year > 2026) return true;
    if (now.year < 2026) return false;
    if (now.month > 7) return true;
    if (now.month < 7) return false;
    return now.day > 19;
}

function getAllTournamentMatchesForToday() {
    const groupMatches = jogosGrupos
        .filter((j) => isMatchOnBrazilDay(j.data))
        .map((j) => ({
            ...j,
            kind: 'group',
            homeDisplay: j.home,
            awayDisplay: j.away,
            pill: `${translations.pt.groupTitle} ${j.grupo}`
        }));

    const knockoutMatches = estruturaNosMataMata.flatMap((fase) => {
        const phaseKey = getKnockoutPhaseKey(fase.fase);
        return fase.jogos
            .filter((j) => isMatchOnBrazilDay(j.data))
            .map((j) => {
                const calc = mapaMataMataCalculado[j.id] || { home: 'A definir', away: 'A definir' };
                const timeLabel = j.hora ? `${j.data} - ${j.hora}` : j.data;
                return {
                    id: j.id,
                    data: timeLabel,
                    local: j.local,
                    destaque: j.destaque,
                    kind: 'knockout',
                    home: calc.home,
                    away: calc.away,
                    homeDisplay: calc.home,
                    awayDisplay: calc.away,
                    grupo: null,
                    pill: getPhaseLabelByKey(phaseKey, translations.pt),
                    phaseKey
                };
            });
    });

    return [...groupMatches, ...knockoutMatches].sort((a, b) => {
        const ta = getMatchTimeLabel(a.data) || a.data;
        const tb = getMatchTimeLabel(b.data) || b.data;
        return String(ta).localeCompare(String(tb), 'pt-BR');
    });
}

export function setCalendarFilter(filter) {
    calendarFilter = filter || 'today';
    document.querySelectorAll('#hoje-filters .arena-chip-btn').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-filter') === calendarFilter);
    });
    renderCalendarView();
}

function matchPassesFilter(match, filter) {
    if (filter === 'today' || filter === 'all') return true;

    const sh = getScoreInput(match.id, 'home');
    const sa = getScoreInput(match.id, 'away');
    const filled = sh !== '' && sa !== '';
    const official = hasOfficialResult(match.id);
    const hasLocalPrediction =
        localStorage.getItem(`wc2026_score_${match.id}_home`) != null ||
        localStorage.getItem(`wc2026_score_${match.id}_away`) != null;

    if (filter === 'open') return !filled;
    if (filter === 'official') return official;
    if (filter === 'prediction') return hasLocalPrediction && !official;
    return true;
}

function renderMatchCardCompact(match) {
    const t = translations.pt;
    const sh = getScoreInput(match.id, 'home');
    const sa = getScoreInput(match.id, 'away');
    const { lockedAttrs, lockedClasses, badgeLabel, badgeClass } = getMatchLockState(match.id);
    const homeRaw = match.homeDisplay || match.home;
    const awayRaw = match.awayDisplay || match.away;
    const homeName = translateTeam(translatePlaceholder(homeRaw, currentLang), currentLang);
    const awayName = translateTeam(translatePlaceholder(awayRaw, currentLang), currentLang);
    const pill = match.pill
        || (match.grupo ? `${t.groupTitle} ${match.grupo}` : t.tabKnockoutShort || 'Mata-mata');

    return `
        <article class="arena-match-card${match.destaque ? ' is-highlight' : ''}">
            <div class="flex items-center justify-between gap-2 text-xs font-bold text-slate-400">
                <span>${match.data}</span>
                <span class="match-group-pill">${pill}</span>
            </div>
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-500">#${match.id}</span>
                <span class="match-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        ${getFlagTag(homeRaw)}
                        <span class="font-semibold text-sm truncate">${homeName}</span>
                    </div>
                    <input type="number" min="0" placeholder="-" value="${sh}"
                        oninput="window.setScoreInput(${match.id}, 'home', this.value)"
                        ${lockedAttrs}
                        class="score-input-lg${lockedClasses}">
                </div>
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        ${getFlagTag(awayRaw)}
                        <span class="font-semibold text-sm truncate">${awayName}</span>
                    </div>
                    <input type="number" min="0" placeholder="-" value="${sa}"
                        oninput="window.setScoreInput(${match.id}, 'away', this.value)"
                        ${lockedAttrs}
                        class="score-input-lg${lockedClasses}">
                </div>
            </div>
            <div class="text-[11px] text-slate-500 truncate">${match.local || ''}</div>
        </article>
    `;
}

export function renderCalendarView() {
    const list = document.getElementById('hoje-list');
    const titleEl = document.getElementById('lbl-hoje-title');
    const subEl = document.getElementById('lbl-hoje-sub');
    const filtersEl = document.getElementById('hoje-filters');
    if (!list) return;

    const t = translations.pt;
    const todayLabel = formatBrazilDateLong();

    if (titleEl) titleEl.textContent = t.tabToday || t.tabTodayShort || 'Hoje';

    // Copa encerrada: mensagem de campeão
    if (isWorldCupFinished()) {
        const champion = getChampionTeamName();
        const championLabel = champion
            ? translateTeam(champion, currentLang)
            : (t.championUnknown || 'campeã');

        if (filtersEl) filtersEl.classList.add('hidden');
        if (subEl) subEl.textContent = t.cupFinishedSub || 'Obrigado por acompanhar a Copa do Mundo FIFA 2026.';

        list.innerHTML = `
            <div class="hoje-empty-state hoje-champion-state">
                <div class="hoje-empty-icon" aria-hidden="true">🏆</div>
                <p class="hoje-empty-title">${t.cupSuccessTitle || 'A Copa foi um sucesso'}</p>
                <p class="hoje-empty-text">
                    ${champion
                        ? (t.cupChampionMessage || 'A Copa foi um sucesso e a seleção da {team} sagrou-se campeã.')
                            .replace('{team}', championLabel)
                        : (t.cupFinishedGeneric || 'A Copa do Mundo FIFA 2026 chegou ao fim.')}
                </p>
                ${champion ? `<div class="hoje-champion-flag">${getFlagTag(champion)} <strong>${championLabel}</strong></div>` : ''}
            </div>
        `;
        return;
    }

    if (filtersEl) filtersEl.classList.remove('hidden');
    if (subEl) {
        subEl.textContent = `${t.todaySub || 'Jogos de hoje'} · ${todayLabel}`;
    }

    const todayMatches = getAllTournamentMatchesForToday()
        .filter((m) => matchPassesFilter(m, calendarFilter));

    if (!todayMatches.length) {
        list.innerHTML = `
            <div class="hoje-empty-state">
                <div class="hoje-empty-icon" aria-hidden="true">📅</div>
                <p class="hoje-empty-title">${t.noGamesToday || 'Sem jogos hoje'}</p>
                <p class="hoje-empty-text">${t.noGamesTodayHint || 'Não há partidas programadas para esta data no calendário da Copa 2026.'}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = `
        <p class="hoje-count-label">${todayMatches.length} jogo${todayMatches.length > 1 ? 's' : ''} hoje</p>
        ${todayMatches.map(renderMatchCardCompact).join('')}
    `;
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
let selectedKnockoutPhase = localStorage.getItem('wc2026_knockout_phase') || '';

/** Fases no estilo Apple Sports (seletor horizontal ativo) */
const KNOCKOUT_PHASE_NAV = [
    { key: 'round32', short: '16º', pill: '16-avos' },
    { key: 'round16', short: 'Oitavas', pill: 'Oitavas' },
    { key: 'quarterFinals', short: 'Quartas', pill: 'Quartas' },
    { key: 'semiFinals', short: 'Semi', pill: 'Semis' },
    { key: 'thirdPlace', short: '3º', pill: '3º lugar' },
    { key: 'final', short: 'Final', pill: 'Final' }
];

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
    return getPhaseLabelByKey(key, t);
}

function getPhaseLabelByKey(key, t) {
    if (key === 'round32') return t.round32;
    if (key === 'round16') return t.round16;
    if (key === 'quarterFinals') return t.quarterFinals;
    if (key === 'semiFinals') return t.semiFinals;
    if (key === 'thirdPlace') return t.thirdPlace;
    return t.final;
}

function getMatchesForPhaseKey(phaseKey) {
    if (phaseKey === 'thirdPlace') {
        return estruturaNosMataMata.flatMap((f) => f.jogos).filter((j) => j.id === 103);
    }
    if (phaseKey === 'final') {
        return estruturaNosMataMata.flatMap((f) => f.jogos).filter((j) => j.id === 104);
    }

    // Fases “normais” — exclui o bloco Finais (ids 103/104)
    return estruturaNosMataMata
        .filter((f) => getKnockoutPhaseKey(f.fase) === phaseKey && !/^Finais$/i.test(f.fase.trim()))
        .flatMap((f) => f.jogos);
}

function isMatchDecided(match) {
    const dados = mapaMataMataCalculado[match.id] || { home: 'A definir', away: 'A definir' };
    return Boolean(getWinnerInfo(match, dados).winner);
}

function getPhaseProgress(phaseKey) {
    const matches = getMatchesForPhaseKey(phaseKey);
    if (!matches.length) return { total: 0, decided: 0, started: 0, complete: false, inProgress: false };

    let decided = 0;
    let started = 0;
    matches.forEach((match) => {
        const sh = getScoreInput(match.id, 'home');
        const sa = getScoreInput(match.id, 'away');
        if (sh !== '' || sa !== '') started += 1;
        if (isMatchDecided(match)) decided += 1;
    });

    return {
        total: matches.length,
        decided,
        started,
        complete: decided === matches.length && matches.length > 0,
        inProgress: started > 0 && decided < matches.length
    };
}

function ensureSelectedKnockoutPhase() {
    const validKeys = KNOCKOUT_PHASE_NAV.map((p) => p.key);
    if (validKeys.includes(selectedKnockoutPhase)) return;

    // Apple Sports: foca a primeira fase incompleta (ou a final se tudo ok)
    const firstOpen = KNOCKOUT_PHASE_NAV.find((p) => !getPhaseProgress(p.key).complete);
    selectedKnockoutPhase = firstOpen ? firstOpen.key : 'final';
    localStorage.setItem('wc2026_knockout_phase', selectedKnockoutPhase);
}

function renderKnockoutPhasePicker(t) {
    ensureSelectedKnockoutPhase();

    const items = KNOCKOUT_PHASE_NAV.map((phase, index) => {
        const progress = getPhaseProgress(phase.key);
        const isActive = selectedKnockoutPhase === phase.key;
        const stateClass = [
            isActive ? 'is-active' : '',
            progress.complete ? 'is-complete' : '',
            progress.inProgress ? 'is-live' : ''
        ].filter(Boolean).join(' ');

        const fullLabel = getPhaseLabelByKey(phase.key, t);
        const countLabel = progress.total
            ? `${progress.decided}/${progress.total}`
            : '';

        return `
            <button
                type="button"
                class="ko-phase-btn ${stateClass}"
                data-knockout-phase="${phase.key}"
                aria-pressed="${isActive ? 'true' : 'false'}"
                title="${fullLabel}"
            >
                <span class="ko-phase-btn-index" aria-hidden="true">${index + 1}</span>
                <span class="ko-phase-btn-label">${phase.pill}</span>
                <span class="ko-phase-btn-meta">
                    ${progress.complete
                        ? '<span class="ko-phase-check" aria-hidden="true">✓</span>'
                        : `<span class="ko-phase-count">${countLabel}</span>`}
                </span>
            </button>
        `;
    }).join('');

    return `
        <div class="ko-phase-picker-wrap">
            <div class="ko-phase-picker" role="tablist" aria-label="${t.knockoutPhasePickerLabel || 'Fases do mata-mata'}">
                ${items}
            </div>
        </div>
    `;
}

function bindKnockoutPhasePicker(container) {
    container.querySelectorAll('[data-knockout-phase]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const phase = btn.getAttribute('data-knockout-phase');
            if (!phase || phase === selectedKnockoutPhase) {
                // Re-clique: recentra a fase no modo chave
                if (knockoutViewMode === 'bracket') centerBracketPhase(phase);
                return;
            }
            selectedKnockoutPhase = phase;
            localStorage.setItem('wc2026_knockout_phase', selectedKnockoutPhase);
            renderKnockoutStage();
        });
    });

    // Mantém o botão ativo visível no scroll horizontal (Apple-like)
    const activeBtn = container.querySelector('.ko-phase-btn.is-active');
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
        requestAnimationFrame(() => {
            activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    }
}

function scrollBracketToPhase(phaseKey, behavior = 'smooth') {
    const scroller = document.querySelector('.wcb-scroll');
    if (!scroller) return;

    let targets = [];
    if (phaseKey === 'final') {
        targets = [...scroller.querySelectorAll('[data-focus-phase="final"], .wcb-center-final')];
    } else if (phaseKey === 'thirdPlace') {
        targets = [...scroller.querySelectorAll('[data-focus-phase="thirdPlace"], .wcb-center-third')];
    } else {
        // Preferir o lado esquerdo (primeiro na ordem DOM) para fases bilaterais
        targets = [...scroller.querySelectorAll(`.wcb-col[data-phase="${phaseKey}"]`)];
    }

    if (!targets.length) {
        const center = scroller.querySelector('.wcb-center-col');
        if (center) targets = [center];
    }
    if (!targets.length) return;

    const scrollerRect = scroller.getBoundingClientRect();

    // Se as colunas da fase estão distantes (esquerda + direita da chave),
    // centraliza a primeira (esquerda) para o conteúdo ficar legível no viewport.
    let focusTargets = targets;
    if (targets.length > 1) {
        const first = targets[0].getBoundingClientRect();
        const last = targets[targets.length - 1].getBoundingClientRect();
        const span = last.right - first.left;
        if (span > scrollerRect.width * 0.75) {
            focusTargets = [targets[0]];
        }
    }

    let minLeft = Infinity;
    let maxRight = -Infinity;
    focusTargets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (!rect.width && !rect.height) return;
        minLeft = Math.min(minLeft, rect.left);
        maxRight = Math.max(maxRight, rect.right);
    });

    if (!Number.isFinite(minLeft) || !Number.isFinite(maxRight)) return;

    const targetMid = (minLeft + maxRight) / 2;
    const scrollerMid = scrollerRect.left + scrollerRect.width / 2;
    const delta = targetMid - scrollerMid;
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    const nextLeft = Math.min(maxScroll, Math.max(0, scroller.scrollLeft + delta));

    scroller.scrollTo({ left: nextLeft, behavior });
}

function centerBracketPhase(phaseKey) {
    // Duplo frame + timeout curto: layout do grid e imagens de bandeira
    requestAnimationFrame(() => {
        scrollBracketToPhase(phaseKey, 'auto');
        requestAnimationFrame(() => {
            scrollBracketToPhase(phaseKey, 'smooth');
            setTimeout(() => scrollBracketToPhase(phaseKey, 'smooth'), 120);
        });
    });
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

function renderScoreBadge(options = {}) {
    const {
        variant = 'mini',
        matchId,
        team = 'home',
        value = '',
        lockedAttrs = '',
        lockedClasses = '',
        ariaLabel = '',
        winner = false
    } = options;

    if (variant === 'full') {
        return `
            <div class="knockout-score-wrap">
                ${winner ? '<span class="knockout-qualified">➜</span>' : ''}
                <input type="number" min="0" placeholder="-" value="${value}"
                    oninput="window.setScoreInput(${matchId}, '${team}', this.value)"
                    aria-label="${ariaLabel}"
                    ${lockedAttrs}
                    class="knockout-score-input${lockedClasses}">
            </div>
        `;
    }

    return `
        <div class="kob-mini-score-wrap">
            <input type="number" min="0" placeholder="–" value="${value}"
                oninput="window.setScoreInput(${matchId}, '${team}', this.value)"
                aria-label="${ariaLabel}"
                ${lockedAttrs}
                class="kob-mini-score${lockedClasses}">
        </div>
    `;
}

function renderTeamRow(options = {}) {
    const {
        variant = 'mini',
        matchId,
        teamKey = 'home',
        teamName = '',
        teamRawName = '',
        scoreValue = '',
        winner = false,
        loser = false,
        advanced = false,
        lockedAttrs = '',
        lockedClasses = '',
        ariaLabel = ''
    } = options;

    const flagTag = getFlagTag(teamRawName);

    if (variant === 'full') {
        return `
            <div class="knockout-team-row ${winner ? 'team-winner' : ''} ${advanced ? 'team-advanced' : ''}">
                ${flagTag}
                <span class="knockout-team-name">${teamName}</span>
                ${renderScoreBadge({
                    variant: 'full',
                    matchId,
                    team: teamKey,
                    value: scoreValue,
                    lockedAttrs,
                    lockedClasses,
                    ariaLabel,
                    winner
                })}
            </div>
        `;
    }

    return `
        <div class="kob-mini-team ${winner ? 'kob-mini-winner' : loser ? 'kob-mini-loser' : ''}">
            <div class="kob-mini-team-grid">
                ${flagTag}
                <span class="kob-mini-name">${teamName}</span>
                ${renderScoreBadge({
                    variant: 'mini',
                    matchId,
                    team: teamKey,
                    value: scoreValue,
                    lockedAttrs,
                    lockedClasses,
                    ariaLabel
                })}
            </div>
        </div>
    `;
}

function getMiniCardPhaseAccentClass(phaseKey) {
    if (phaseKey === 'semiFinals') return ' kob-mini-semi';
    if (phaseKey === 'final') return ' kob-mini-final';
    if (phaseKey === 'thirdPlace') return ' kob-mini-third';
    if (phaseKey === 'quarterFinals') return ' kob-mini-qf';
    return '';
}

function renderKnockoutMatchCard(match, options = {}) {
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
    const { lockedAttrs, lockedClasses, badgeLabel, badgeClass } = getMatchLockState(match.id);
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

    const penaltiesInline = isEmpate
        ? `<span class="knockout-penalties-inline">${t.penalties} <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${match.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="knockout-penalty-input${lockedClasses}">-<input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${match.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="knockout-penalty-input${lockedClasses}"></span>`
        : '';

    return `
        <article class="${cardClass}">
            <header class="knockout-match-header">
                <span>${t.confrontation} #${match.id}</span>
                <span>${normalizeMatchDate(match.data)} · ${match.hora}</span>
            </header>
            <div class="knockout-badge-row">
                <span class="match-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="knockout-match-teams">
                ${renderTeamRow({
                    variant: 'full',
                    matchId: match.id,
                    teamKey: 'home',
                    teamName: homeDisplayName,
                    teamRawName: dadosCalculados.home,
                    scoreValue: sh,
                    winner: homeWinner,
                    advanced: hasAdvancedHome,
                    lockedAttrs,
                    lockedClasses,
                    ariaLabel: `${t.tableVs} ${homeDisplayName}`
                })}
                ${renderTeamRow({
                    variant: 'full',
                    matchId: match.id,
                    teamKey: 'away',
                    teamName: awayDisplayName,
                    teamRawName: dadosCalculados.away,
                    scoreValue: sa,
                    winner: awayWinner,
                    advanced: hasAdvancedAway,
                    lockedAttrs,
                    lockedClasses,
                    ariaLabel: `${t.tableVs} ${awayDisplayName}`
                })}
            </div>
            <footer class="knockout-match-footer">
                <span class="truncate">${match.local}</span>
                <span class="knockout-footer-right">${winnerInfo.decidedByPenalties ? '<span class="knockout-pen-badge">P</span>' : ''}${penaltiesInline}</span>
            </footer>
        </article>
    `;
}

function renderMatchCard(match, options = {}) {
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
    const penaltiesHtml = isEmpate
        ? `<div class="kob-mini-pen">${t.penalties.replace(':', '')} <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${match.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="kob-mini-pen-input${lockedClasses}">-<input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${match.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="kob-mini-pen-input${lockedClasses}"></div>`
        : '';
    const sideClass = side === 'B' ? ' kob-mini-side-b' : side === 'final' ? ' kob-mini-side-final' : '';
    const matchShortDate = match.data ? match.data.slice(0, 5) + '/26' : '';
    const cardClass = [
        'kob-mini-card',
        winnerInfo.winner ? 'kob-mini-resolved' : '',
        getMiniCardPhaseAccentClass(phaseKey).trim(),
        sideClass.trim()
    ].filter(Boolean).join(' ');

    return `
        <article class="${cardClass}">
            <div class="kob-mini-header">
                <span class="kob-mini-date">${matchShortDate} · ${match.hora}</span>
                <span class="kob-mini-local">${match.local || ''}</span>
            </div>
            <div class="kob-mini-teams">
                ${renderTeamRow({
                    matchId: match.id,
                    teamKey: 'home',
                    teamName: homeDisplayName,
                    teamRawName: dadosCalculados.home,
                    scoreValue: sh,
                    winner: homeWinner,
                    loser: awayWinner,
                    lockedAttrs,
                    lockedClasses,
                    ariaLabel: `${t.tableVs} ${homeDisplayName}`
                })}
                ${renderTeamRow({
                    matchId: match.id,
                    teamKey: 'away',
                    teamName: awayDisplayName,
                    teamRawName: dadosCalculados.away,
                    scoreValue: sa,
                    winner: awayWinner,
                    loser: homeWinner,
                    lockedAttrs,
                    lockedClasses,
                    ariaLabel: `${t.tableVs} ${awayDisplayName}`
                })}
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
    ensureSelectedKnockoutPhase();

    const phaseAccents = {
        round32: 'rgb(59 130 246)',
        round16: 'rgb(139 92 246)',
        quarterFinals: 'rgb(236 72 153)',
        semiFinals: 'rgb(245 158 11)',
        thirdPlace: 'rgb(100 116 139)',
        final: 'rgb(212 175 55)',
    };

    const phaseKey = selectedKnockoutPhase;
    const matches = getMatchesForPhaseKey(phaseKey);
    const localizedFase = getPhaseLabelByKey(phaseKey, t);
    const accent = phaseAccents[phaseKey] || 'rgb(59 130 246)';
    const progress = getPhaseProgress(phaseKey);
    const count = matches.length;

    return `
        <div class="bk-cascade ko-phase-focus">
            <div class="bk-phase" data-phase-key="${phaseKey}" style="--bk-accent: ${accent}">
                <div class="bk-phase-header">
                    <span class="bk-phase-badge">${localizedFase}</span>
                    <h4 class="bk-phase-title">${localizedFase}</h4>
                    <span class="bk-phase-count">
                        ${progress.decided}/${count} definido${count === 1 ? '' : 's'}
                        · ${count} jogo${count > 1 ? 's' : ''}
                    </span>
                </div>
                <div class="bk-phase-grid" style="--bk-cols: ${Math.min(Math.max(count, 1), 4)}">
                    ${matches.map((match) => renderMatchCard(match, { phaseKey, compact: true })).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderBracketColumn(options = {}) {
    const {
        side = 'left',
        phaseKey = '',
        slotGroups = [],
        cardRenderer,
        centerContent = '',
        focusClass = ''
    } = options;
    const baseClass = side === 'center' ? 'wcb-col wcb-center-col' : 'wcb-col';
    if (side === 'center') {
        return `<div class="${baseClass}${focusClass}" data-side="center">${centerContent}</div>`;
    }

    const groupsHtml = slotGroups.map((group) => {
        if (group.length <= 1) {
            return `<div class="wcb-slot">${cardRenderer(group[0], phaseKey, side === 'right' ? 'B' : 'A')}</div>`;
        }

        return `
            <div class="wcb-bracket-pair">
                ${group.map((matchId) => `<div class="wcb-slot">${cardRenderer(matchId, phaseKey, side === 'right' ? 'B' : 'A')}</div>`).join('')}
            </div>
        `;
    }).join('');

    return `<div class="${baseClass}${focusClass}" data-side="${side}" data-phase="${phaseKey}">${groupsHtml}</div>`;
}

function renderKnockoutBracketView() {
    const CENTER_COLUMN_INDEX = 4;
    const t = translations.pt;
    ensureSelectedKnockoutPhase();

    const allMatchesById = new Map(estruturaNosMataMata.flatMap((fase) => fase.jogos.map((jogo) => [jogo.id, jogo])));
    const m = (id) => allMatchesById.get(id);
    const card = (id, phaseKey, side) => {
        const match = m(id);
        return match ? renderMatchCard(match, { phaseKey, side }) : '';
    };

    const phaseLabels = [
        t.round32,
        t.round16,
        t.quarterFinals,
        t.semiFinals,
        `🏆 ${t.final}`,
        t.semiFinals,
        t.quarterFinals,
        t.round16,
        t.round32
    ];

    const focusKey = selectedKnockoutPhase;
    const colFocus = (phaseKey) => (phaseKey === focusKey ? ' is-phase-focus' : ' is-phase-dim');

    const columns = [
        { side: 'left', phaseKey: 'round32', slotGroups: [[73, 75], [74, 77], [81, 82], [83, 84]] },
        { side: 'left', phaseKey: 'round16', slotGroups: [[89, 90], [93, 94]] },
        { side: 'left', phaseKey: 'quarterFinals', slotGroups: [[97, 99]] },
        { side: 'left', phaseKey: 'semiFinals', slotGroups: [[101]] },
        {
            side: 'center',
            phaseKey: focusKey === 'thirdPlace' ? 'thirdPlace' : 'final',
            centerContent: `
                <div class="wcb-center-final${focusKey === 'final' ? ' is-phase-focus' : ' is-phase-dim'}" data-focus-phase="final">
                    <span class="wcb-center-label">🏆 ${t.final}</span>
                    ${card(104, 'final', 'final')}
                </div>
                <div class="wcb-center-third${focusKey === 'thirdPlace' ? ' is-phase-focus' : ' is-phase-dim'}" data-focus-phase="thirdPlace">
                    <span class="wcb-center-label">🥉 ${t.thirdPlace}</span>
                    ${card(103, 'thirdPlace', 'final')}
                </div>
            `
        },
        { side: 'right', phaseKey: 'semiFinals', slotGroups: [[102]] },
        { side: 'right', phaseKey: 'quarterFinals', slotGroups: [[98, 100]] },
        { side: 'right', phaseKey: 'round16', slotGroups: [[91, 92], [95, 96]] },
        { side: 'right', phaseKey: 'round32', slotGroups: [[76, 78], [79, 80], [85, 87], [86, 88]] }
    ];

    return `
        <div class="wcb-scroll">
            <div class="wcb-phase-bar">
                ${phaseLabels.map((label, index) => {
                    const colPhase = columns[index]?.phaseKey;
                    const isFocus = colPhase === focusKey
                        || (index === CENTER_COLUMN_INDEX && (focusKey === 'final' || focusKey === 'thirdPlace'));
                    return `<span class="wcb-phase-label ${index === CENTER_COLUMN_INDEX ? 'wcb-phase-label-center' : ''} ${isFocus ? 'is-focus' : ''}">${label}</span>`;
                }).join('')}
            </div>
            <div class="wcb-bracket" data-focus-phase="${focusKey}">
                ${columns.map((column) => {
                    if (column.side === 'center') {
                        return `<div class="wcb-col wcb-center-col" data-side="center" data-focus-phase="${column.phaseKey}">${column.centerContent}</div>`;
                    }
                    return renderBracketColumn({
                        ...column,
                        cardRenderer: card,
                        focusClass: colFocus(column.phaseKey)
                    });
                }).join('')}
            </div>
        </div>
    `;
}

export function renderKnockoutStage() {
    const container = document.getElementById('container-mata-mata');
    if (!container) return;

    ensureKnockoutViewMode();
    ensureSelectedKnockoutPhase();

    const t = translations.pt;
    const activeLabel = getPhaseLabelByKey(selectedKnockoutPhase, t);

    container.innerHTML = `
        <div class="knockout-header-copy">
            <div>
                <p class="knockout-kicker">Mata-Mata · Copa do Mundo FIFA 2026</p>
                <h3 class="knockout-headline">${activeLabel}</h3>
                <p class="knockout-subheadline">${t.knockoutPhaseHint || 'Toque em uma fase para focar os jogos — no estilo Apple Sports.'}</p>
            </div>
            <div class="knockout-controls">
                <div class="knockout-view-toggle" role="tablist" aria-label="${t.knockoutViewLabel}">
                    <button class="knockout-view-btn ${knockoutViewMode === 'list' ? 'is-active' : ''}" data-knockout-view="list">📋 ${t.knockoutListMode}</button>
                    <button class="knockout-view-btn ${knockoutViewMode === 'bracket' ? 'is-active' : ''}" data-knockout-view="bracket">🏆 ${t.knockoutBracketMode}</button>
                </div>
            </div>
        </div>
        ${renderKnockoutPhasePicker(t)}
        <div class="knockout-content">
            ${knockoutViewMode === 'bracket' ? renderKnockoutBracketView() : renderKnockoutListView()}
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

    bindKnockoutPhasePicker(container);

    if (knockoutViewMode === 'bracket') {
        centerBracketPhase(selectedKnockoutPhase);
    }
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
