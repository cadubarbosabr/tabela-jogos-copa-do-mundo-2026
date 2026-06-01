import { 
    gruposClassificacao, 
    mapaMataMataCalculado, 
    getScoreInput, 
    getPenaltiesInput 
} from './engine.js';
import { getFlagTag } from './teams.js';
import { jogosGrupos, estruturaNosMataMata } from './matches.js';

export function switchTab(tab) {
    const btnGrupos = document.getElementById('btn-grupos');
    const btnMataMata = document.getElementById('btn-mata-mata');
    const sectionGrupos = document.getElementById('section-grupos');
    const sectionMataMata = document.getElementById('section-mata-mata');

    if (!btnGrupos || !btnMataMata || !sectionGrupos || !sectionMataMata) return;

    btnGrupos.className = tab === 'grupos' 
        ? "px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-b from-white to-gray-100 text-blue-950 shadow-md transition-all transform scale-105" 
        : "px-5 py-2.5 rounded-lg text-sm font-bold text-blue-200 hover:text-white transition-all";

    btnMataMata.className = tab === 'mata-mata' 
        ? "px-5 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-b from-white to-gray-100 text-blue-950 shadow-md transition-all transform scale-105" 
        : "px-5 py-2.5 rounded-lg text-sm font-bold text-blue-200 hover:text-white transition-all";
    
    sectionGrupos.classList.toggle('hidden', tab !== 'grupos');
    sectionMataMata.classList.toggle('hidden', tab !== 'mata-mata');
    
    if (tab === 'mata-mata') {
        renderKnockoutStage();
    }
}

export function renderTablesGrid() {
    const filtroEl = document.getElementById('filter-grupo');
    const container = document.getElementById('grid-tabelas-classificacao');
    if (!filtroEl || !container) return;

    const filtro = filtroEl.value;
    container.innerHTML = '';

    const gruposParaMostrar = filtro === 'Todos' ? Object.keys(gruposClassificacao) : [filtro];

    gruposParaMostrar.forEach(g => {
        const div = document.createElement('div');
        div.className = "bg-white rounded-2xl shadow-md border border-slate-200/80 p-4 transition-all hover:shadow-lg";

        let rowsHtml = gruposClassificacao[g].map((t, idx) => {
            let rowBg = "text-slate-700";
            if (idx < 2) rowBg = "bg-emerald-50/40 text-emerald-900 font-bold";
            
            return `
                <tr class="text-xs ${rowBg} border-b border-slate-100 last:border-0">
                    <td class="py-2.5 font-bold text-center w-6">${idx + 1}º</td>
                    <td class="py-2.5 font-semibold flex items-center gap-2 truncate max-w-[120px]">
                        ${getFlagTag(t.name)} <span class="truncate">${t.name}</span>
                    </td>
                    <td class="py-2.5 font-bold text-center">${t.P}</td>
                    <td class="py-2.5 text-center text-slate-400">${t.J}</td>
                    <td class="py-2.5 text-center font-medium">${t.SG > 0 ? '+' + t.SG : t.SG}</td>
                    <td class="py-2.5 text-center text-slate-400">${t.GP}</td>
                </tr>
            `;
        }).join('');

        div.innerHTML = `
            <h3 class="text-sm font-extrabold text-blue-950 uppercase tracking-wider mb-3 border-b pb-2 flex justify-between">
                <span>Grupo ${g}</span>
                <span class="text-[10px] text-slate-400 font-normal">Classificação Live</span>
            </h3>
            <table class="w-full text-left">
                <thead>
                    <tr class="text-[10px] font-bold text-slate-400 uppercase border-b">
                        <th class="pb-1 text-center">Pos</th>
                        <th class="pb-1">Seleção</th>
                        <th class="pb-1 text-center">P</th>
                        <th class="pb-1 text-center">J</th>
                        <th class="pb-1 text-center">SG</th>
                        <th class="pb-1 text-center">GP</th>
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
    if (!filtroEl || !tbody) return;

    const filtro = filtroEl.value;
    tbody.innerHTML = '';

    const jogosFiltrados = filtro === 'Todos' ? jogosGrupos : jogosGrupos.filter(j => j.grupo === filtro);

    jogosFiltrados.forEach(j => {
        const tr = document.createElement('tr');
        tr.className = j.destaque ? "bg-amber-50/30 hover:bg-amber-50 transition-colors" : "hover:bg-slate-50/80 transition-colors";

        const sh = getScoreInput(j.id, 'home');
        const sa = getScoreInput(j.id, 'away');

        tr.innerHTML = `
            <td class="px-6 py-3.5 font-bold text-slate-400 text-xs">#${j.id}</td>
            <td class="px-6 py-3.5 text-slate-600 font-medium text-xs">${j.data}</td>
            <td class="px-6 py-3.5">
                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 border rounded-md text-[11px] font-bold">Grupo ${j.grupo}</span>
            </td>
            <td class="px-6 py-3.5">
                <div class="flex items-center justify-center gap-3">
                    <div class="flex items-center justify-end gap-2 w-36 text-right">
                        <span class="truncate font-semibold text-slate-800 text-sm">${j.home}</span>
                        ${getFlagTag(j.home)}
                    </div>
                    <input type="number" min="0" placeholder="- " value="${sh}" 
                        oninput="window.setScoreInput(${j.id}, 'home', this.value)"
                        aria-label="Placar do time mandante, ${j.home}"
                        class="w-11 h-9 text-center bg-white border border-slate-300 rounded-lg font-black text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all">
                    <span class="text-slate-300 font-bold text-xs">✕</span>
                    <input type="number" min="0" placeholder="- " value="${sa}" 
                        oninput="window.setScoreInput(${j.id}, 'away', this.value)"
                        aria-label="Placar do time visitante, ${j.away}"
                        class="w-11 h-9 text-center bg-white border border-slate-300 rounded-lg font-black text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all">
                    <div class="flex items-center justify-start gap-2 w-36 text-left">
                        ${getFlagTag(j.away)}
                        <span class="truncate font-semibold text-slate-800 text-sm">${j.away}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-3.5 text-slate-400 text-xs max-w-[160px] truncate">${j.local}</td>
        `;
        tbody.appendChild(tr);
    });
}

export function renderKnockoutStage() {
    const container = document.getElementById('container-mata-mata');
    if (!container) return;
    container.innerHTML = '';

    estruturaNosMataMata.forEach(fase => {
        const divFase = document.createElement('div');
        divFase.className = "space-y-4";

        divFase.innerHTML = `
            <h3 class="text-xl font-extrabold text-slate-800 tracking-tight flex items-center justify-between border-b border-slate-200 pb-3">
                <span>${fase.fase}</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${fase.jogos.map(j => {
                    const dadosCalculados = mapaMataMataCalculado[j.id] || { home: "A definir", away: "A definir" };
                    const sh = getScoreInput(j.id, 'home');
                    const sa = getScoreInput(j.id, 'away');
                    
                    const isEmpate = (sh !== '' && sa !== '' && parseInt(sh,10) === parseInt(sa,10));
                    const penH = getPenaltiesInput(j.id, 'home');
                    const penA = getPenaltiesInput(j.id, 'away');

                    let cardStyle = j.destaque ? "bg-gradient-to-br from-amber-50 via-white to-amber-50/20 border-amber-300 shadow-lg" : "bg-white border-slate-200 shadow-md";

                    return `
                        <div class="p-5 rounded-2xl border ${cardStyle} transition-all flex flex-col justify-between space-y-4">
                            <div class="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span>CONFRONTO #${j.id}</span>
                                <span class="bg-slate-100 px-2 py-0.5 rounded text-slate-500">${j.data}</span>
                            </div>
                            
                            <div class="space-y-3 py-1">
                                <!-- Time Casa -->
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 max-w-[70%]">
                                        ${getFlagTag(dadosCalculados.home)}
                                        <span class="text-sm font-bold text-slate-700 truncate">${dadosCalculados.home}</span>
                                    </div>
                                    <input type="number" min="0" placeholder="-" value="${sh}"
                                        oninput="window.setScoreInput(${j.id}, 'home', this.value)"
                                        aria-label="Placar do time mandante, ${dadosCalculados.home}"
                                        class="w-11 h-9 text-center bg-slate-50 border border-slate-300 rounded-lg font-black text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all">
                                </div>
                                <!-- Time Fora -->
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 max-w-[70%]">
                                        ${getFlagTag(dadosCalculados.away)}
                                        <span class="text-sm font-bold text-slate-700 truncate">${dadosCalculados.away}</span>
                                    </div>
                                    <input type="number" min="0" placeholder="-" value="${sa}"
                                        oninput="window.setScoreInput(${j.id}, 'away', this.value)"
                                        aria-label="Placar do time visitante, ${dadosCalculados.away}"
                                        class="w-11 h-9 text-center bg-slate-50 border border-slate-300 rounded-lg font-black text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm transition-all">
                                </div>

                                <!-- Sub-painel de Desempate por Pênaltis se houver empate técnico -->
                                ${isEmpate ? `
                                    <div class="bg-slate-50 p-2 rounded-xl border border-dashed border-slate-200 flex items-center justify-between mt-2 animate-fade-in">
                                        <span class="text-[10px] font-bold text-amber-600 uppercase">Pênaltis:</span>
                                        <div class="flex items-center gap-1">
                                            <input type="number" placeholder="P" value="${penH}" oninput="window.setPenaltiesInput(${j.id}, 'home', this.value)" aria-label="Pênaltis convertidos por ${dadosCalculados.home}" class="w-8 h-6 text-center border text-xs font-bold rounded">
                                            <span class="text-[9px] text-slate-400">x</span>
                                            <input type="number" placeholder="P" value="${penA}" oninput="window.setPenaltiesInput(${j.id}, 'away', this.value)" aria-label="Pênaltis convertidos por ${dadosCalculados.away}" class="w-8 h-6 text-center border text-xs font-bold rounded">
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <div class="text-[10px] font-semibold text-slate-400 truncate">${j.local}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(divFase);
    });
}

export function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `bg-slate-900 border border-slate-800 text-slate-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-auto transform translate-y-10 opacity-0 transition-all duration-300 ease-out`;
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
