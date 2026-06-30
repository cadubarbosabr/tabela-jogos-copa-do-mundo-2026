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
            let qualifierMark = '';
            if (idx < 2) {
                rowBg = "standings-row-highlight text-emerald-900 dark:text-emerald-300 font-bold";
                qualifierMark = '<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ml-1 flex-shrink-0"></span>';
            }
            
            const localizedTeamName = translateTeam(teamObj.name, currentLang);
            
            return `
                <tr class="text-sm ${rowBg} border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td class="py-3 font-bold text-center w-8">${idx + 1}º</td>
                    <td class="py-3 font-semibold">
                        <div class="flex items-center gap-2 min-w-0">
                            ${getFlagTag(teamObj.name)} <span class="whitespace-nowrap text-sm truncate">${localizedTeamName}</span>${qualifierMark}
                        </div>
                    </td>
                    <td class="py-3 font-bold text-center">${teamObj.P}</td>
                    <td class="py-3 text-center text-slate-400 dark:text-slate-500">${teamObj.J}</td>
                    <td class="py-3 text-center font-semibold">${teamObj.V}-${teamObj.E}-${teamObj.D}</td>
                </tr>
            `;
        }).join('');

        div.innerHTML = `
            <h3 class="text-base font-extrabold text-slate-950 dark:text-slate-100 uppercase tracking-[0.22em] mb-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 flex justify-between items-center gap-3">
                <span>${t.groupTitle} ${g}</span>
                <span class="standings-live-badge">${t.liveClass}</span>
            </h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] border-b border-slate-200/80 dark:border-slate-800/80">
                        <th class="pb-2 text-center">${t.tablePos}</th>
                        <th class="pb-2">${t.tableTeam}</th>
                        <th class="pb-2 text-center">${t.tablePts}</th>
                        <th class="pb-2 text-center">${t.tablePl}</th>
                        <th class="pb-2 text-center">V-E-D</th>
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

function getPhaseIcon(phaseKey) {
    if (phaseKey === 'round32') return '⚽';
    if (phaseKey === 'round16') return '⚡';
    if (phaseKey === 'quarterFinals') return '🔥';
    if (phaseKey === 'semiFinals') return '⭐';
    if (phaseKey === 'thirdPlace') return '🥉';
    return '🏆';
}

function buildKoMatchCard(match, phaseKey) {
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

    const homeRowClass = homeWinner ? 'ko-winner' : awayWinner ? 'ko-loser' : '';
    const awayRowClass = awayWinner ? 'ko-winner' : homeWinner ? 'ko-loser' : '';

    const cardExtraClass = phaseKey === 'final' ? ' ko-card-final'
        : phaseKey === 'thirdPlace' ? ' ko-card-third'
        : '';

    const penaltiesHtml = isEmpate
        ? `<div class="ko-card-penalties">
            ${t.penalties}
            <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${match.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="ko-pen-input${lockedClasses}">
            –
            <input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${match.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="ko-pen-input${lockedClasses}">
           </div>`
        : '';

    const penDecidedHtml = winnerInfo.decidedByPenalties
        ? `<div class="ko-pen-decided">Decidido nos pênaltis</div>`
        : '';

    const homeWinnerIndicator = homeWinner
        ? `<span class="ko-winner-indicator" aria-label="Classificado">✓</span>`
        : '';
    const awayWinnerIndicator = awayWinner
        ? `<span class="ko-winner-indicator" aria-label="Classificado">✓</span>`
        : '';

    return `
        <article class="ko-card${cardExtraClass}">
            <div class="ko-card-meta">
                <span class="ko-card-number">Jogo #${match.id}</span>
                <span class="ko-card-date">${match.data} · ${match.hora}</span>
                <span class="match-badge ${badgeClass}">${badgeLabel}</span>
            </div>

            <div class="ko-card-teams">
                <div class="ko-team-row ${homeRowClass}">
                    <div class="ko-team-identity">
                        ${getFlagTag(dadosCalculados.home)}
                        <span class="ko-team-name">${homeDisplayName}</span>
                    </div>
                    <div class="ko-score-area">
                        ${homeWinnerIndicator}
                        <input type="number" min="0" placeholder="–" value="${sh}"
                            oninput="window.setScoreInput(${match.id}, 'home', this.value)"
                            aria-label="${t.tableVs} ${homeDisplayName}"
                            ${lockedAttrs}
                            class="ko-score${lockedClasses}">
                    </div>
                </div>

                <div class="ko-team-row ${awayRowClass}">
                    <div class="ko-team-identity">
                        ${getFlagTag(dadosCalculados.away)}
                        <span class="ko-team-name">${awayDisplayName}</span>
                    </div>
                    <div class="ko-score-area">
                        ${awayWinnerIndicator}
                        <input type="number" min="0" placeholder="–" value="${sa}"
                            oninput="window.setScoreInput(${match.id}, 'away', this.value)"
                            aria-label="${t.tableVs} ${awayDisplayName}"
                            ${lockedAttrs}
                            class="ko-score${lockedClasses}">
                    </div>
                </div>
            </div>

            ${penaltiesHtml}
            ${penDecidedHtml}

            <div class="ko-card-venue">📍 ${match.local}</div>
        </article>
    `;
}

export function renderKnockoutStage() {
    const container = document.getElementById('container-mata-mata');
    if (!container) return;

    const t = translations.pt;

    const phasesHtml = estruturaNosMataMata.map((fase) => {
        const phaseKey = getKnockoutPhaseKey(fase.fase);
        const localizedFase = getLocalizedKnockoutPhaseLabel(fase.fase, t);
        const icon = getPhaseIcon(phaseKey);
        const count = fase.jogos.length;
        const countLabel = count === 1 ? '1 jogo' : `${count} jogos`;

        const matchCards = fase.jogos
            .map((match) => buildKoMatchCard(match, phaseKey))
            .join('');

        return `
            <section class="ko-phase" data-phase="${phaseKey}">
                <div class="ko-phase-header" data-phase="${phaseKey}">
                    <span class="ko-phase-icon">${icon}</span>
                    <h3 class="ko-phase-title">${localizedFase}</h3>
                    <span class="ko-phase-count">${countLabel}</span>
                </div>
                <div class="ko-phase-grid" data-phase="${phaseKey}">
                    ${matchCards}
                </div>
            </section>
        `;
    }).join('');

    container.innerHTML = `
        <div class="knockout-shell">
            <div class="knockout-header-copy">
                <div>
                    <p class="knockout-kicker">Chave eliminatória</p>
                    <h3 class="knockout-headline">Fase Eliminatória 2026</h3>
                    <p class="knockout-subheadline">Confira cada confronto, registre seus palpites e acompanhe o caminho até o campeão.</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-5xl" role="img" aria-label="Troféu">🏆</span>
                </div>
            </div>
            <div class="knockout-content space-y-0">
                ${phasesHtml}
            </div>
        </div>
    `;
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

