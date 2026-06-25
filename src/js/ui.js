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
    
    if (btnGrupos) btnGrupos.textContent = t.tabGroups;
    if (btnMataMata) btnMataMata.textContent = t.tabKnockout;
    if (btnEstatisticas) btnEstatisticas.textContent = t.tabStats;

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
    
    if (tab === 'mata-mata') {
        renderKnockoutStage();
    } else if (tab === 'estatisticas') {
        renderStatistics();
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

export function renderKnockoutStage() {
    const container = document.getElementById('container-mata-mata');
    if (!container) return;
    container.innerHTML = '';

    const t = translations[currentLang];

    estruturaNosMataMata.forEach(fase => {
        const divFase = document.createElement('div');
        divFase.className = "space-y-4";

        let localizedFase = fase.fase;
        if (currentLang === 'en') {
            if (fase.fase.includes('Dezesseis-avos')) localizedFase = t.round32;
            else if (fase.fase.includes('Oitavas')) localizedFase = t.round16;
            else if (fase.fase.includes('Quartas')) localizedFase = t.quarterFinals;
            else if (fase.fase.includes('Semifinais')) localizedFase = t.semiFinals;
            else if (fase.fase.includes('Disputa')) localizedFase = t.thirdPlace;
            else if (fase.fase.includes('Final')) localizedFase = t.final;
        }

        divFase.innerHTML = `
            <h3 class="text-xl font-extrabold text-slate-800 dark:text-slate-200 tracking-tight flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 transition-colors">
                <span>${localizedFase}</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${fase.jogos.map(j => {
                    const dadosCalculados = mapaMataMataCalculado[j.id] || { home: "A definir", away: "A definir" };
                    const sh = getScoreInput(j.id, 'home');
                    const sa = getScoreInput(j.id, 'away');
                    const { lockedAttrs, lockedClasses } = getMatchLockState(j.id);
                    
                    const isEmpate = (sh !== '' && sa !== '' && parseInt(sh,10) === parseInt(sa,10));
                    const penH = getPenaltiesInput(j.id, 'home');
                    const penA = getPenaltiesInput(j.id, 'away');

                    const homeDisplayName = translateTeam(translatePlaceholder(dadosCalculados.home, currentLang), currentLang);
                    const awayDisplayName = translateTeam(translatePlaceholder(dadosCalculados.away, currentLang), currentLang);

                    let cardStyle = j.destaque 
                        ? "bg-gradient-to-br from-amber-50 via-white to-amber-50/20 dark:from-amber-950/10 dark:via-slate-900 dark:to-amber-950/5 border-amber-300 dark:border-amber-900/50 shadow-lg" 
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 shadow-md";

                    let matchDate = j.data;
                    if (currentLang === 'en') {
                        matchDate = matchDate
                            .replace('(Qui)', '(Thu)').replace('(Sex)', '(Fri)').replace('(Sáb)', '(Sat)')
                            .replace('(Dom)', '(Sun)').replace('(Seg)', '(Mon)').replace('(Ter)', '(Tue)')
                            .replace('(Qua)', '(Wed)');
                    }

                    return `
                        <div class="p-5 rounded-2xl border ${cardStyle} transition-all flex flex-col justify-between space-y-4 transition-colors duration-300">
                            <div class="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                <span>${t.confrontation} #${j.id}</span>
                                <span class="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">${matchDate} - ${j.hora}</span>
                            </div>
                            
                            <div class="space-y-3 py-1">
                                <!-- Time Casa -->
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 max-w-[65%] md:max-w-[75%]">
                                        ${getFlagTag(dadosCalculados.home)}
                                        <span class="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap truncate">${homeDisplayName}</span>
                                    </div>
                                    <input type="number" min="0" placeholder="-" value="${sh}"
                                        oninput="window.setScoreInput(${j.id}, 'home', this.value)"
                                        aria-label="${t.tableVs} ${homeDisplayName}"
                                        ${lockedAttrs}
                                        class="w-12 h-11 md:w-11 md:h-9 min-h-[44px] md:min-h-0 text-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-black text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all${lockedClasses}">
                                </div>
                                <!-- Time Fora -->
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 max-w-[65%] md:max-w-[75%]">
                                        ${getFlagTag(dadosCalculados.away)}
                                        <span class="text-sm font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap truncate">${awayDisplayName}</span>
                                    </div>
                                    <input type="number" min="0" placeholder="-" value="${sa}"
                                        oninput="window.setScoreInput(${j.id}, 'away', this.value)"
                                        aria-label="${t.tableVs} ${awayDisplayName}"
                                        ${lockedAttrs}
                                        class="w-12 h-11 md:w-11 md:h-9 min-h-[44px] md:min-h-0 text-center bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg font-black text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all${lockedClasses}">
                                </div>

                                <!-- Sub-painel de Desempate por Pênaltis se houver empate técnico -->
                                ${isEmpate ? `
                                    <div class="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between mt-2 animate-fade-in">
                                        <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">${t.penalties}</span>
                                        <div class="flex items-center gap-1">
                                            <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${j.id}, 'home', this.value)" aria-label="${t.penalties} ${homeDisplayName}" ${lockedAttrs} class="w-8 h-6 text-center border dark:border-slate-800 text-xs font-bold rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100${lockedClasses}">
                                            <span class="text-[9px] text-slate-400 dark:text-slate-600">x</span>
                                            <input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${j.id}, 'away', this.value)" aria-label="${t.penalties} ${awayDisplayName}" ${lockedAttrs} class="w-8 h-6 text-center border dark:border-slate-800 text-xs font-bold rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100${lockedClasses}">
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">${j.local}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(divFase);
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
