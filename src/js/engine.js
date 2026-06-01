import { equipesIniciais, getFlagTag } from './teams.js';
import { jogosGrupos, estruturaNosMataMata } from './matches.js';

export let gruposClassificacao = {};
export let mapaMataMataCalculado = {};

const updateListeners = [];

export function addUpdateListener(cb) {
    updateListeners.push(cb);
}

function notifyUpdate() {
    updateListeners.forEach(cb => cb());
}

export function getScoreInput(id, side) {
    return localStorage.getItem(`wc2026_score_${id}_${side}`) || '';
}

export function setScoreInput(id, side, val) {
    localStorage.setItem(`wc2026_score_${id}_${side}`, val);
    recalcularTorneioCompleto();
    notifyUpdate();
}

export function getPenaltiesInput(id, side) {
    return localStorage.getItem(`wc2026_pen_${id}_${side}`) || '';
}

export function setPenaltiesInput(id, side, val) {
    localStorage.setItem(`wc2026_pen_${id}_${side}`, val);
    recalcularTorneioCompleto();
    notifyUpdate();
}

export function recalcularTorneioCompleto() {
    // 1. Resetar Estatísticas de cada time
    let statsTimes = {};
    equipesIniciais.forEach(t => {
        statsTimes[t.name] = { name: t.name, group: t.group, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 };
    });

    // 2. Processar os 72 jogos da fase de grupos
    jogosGrupos.forEach(j => {
        const golsHome = getScoreInput(j.id, 'home');
        const golsAway = getScoreInput(j.id, 'away');

        if (golsHome !== '' && golsAway !== '') {
            const gh = parseInt(golsHome, 10);
            const ga = parseInt(golsAway, 10);

            statsTimes[j.home].J += 1;
            statsTimes[j.away].J += 1;
            statsTimes[j.home].GP += gh;
            statsTimes[j.home].GC += ga;
            statsTimes[j.away].GP += ga;
            statsTimes[j.away].GC += gh;

            if (gh > ga) {
                statsTimes[j.home].P += 3;
                statsTimes[j.home].V += 1;
                statsTimes[j.away].D += 1;
            } else if (ga > gh) {
                statsTimes[j.away].P += 3;
                statsTimes[j.away].V += 1;
                statsTimes[j.home].D += 1;
            } else {
                statsTimes[j.home].P += 1;
                statsTimes[j.away].P += 1;
                statsTimes[j.home].E += 1;
                statsTimes[j.away].E += 1;
            }
        }
    });

    // Recalcular Saldo de Gols de todos
    Object.keys(statsTimes).forEach(k => {
        statsTimes[k].SG = statsTimes[k].GP - statsTimes[k].GC;
    });

    // 3. Organizar os times dentro de cada um dos 12 Grupos (A-L)
    const letrasGrupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];
    gruposClassificacao = {};
    let todosTerceiros = [];

    letrasGrupos.forEach(g => {
        let timesDoGrupo = Object.values(statsTimes).filter(t => t.group === g);
        // Ordenação oficial: Pontos > Saldo de Gols > Gols Pró > Alfabético
        timesDoGrupo.sort((a, b) => b.P - a.P || b.SG - a.SG || b.GP - a.GP || a.name.localeCompare(b.name));
        gruposClassificacao[g] = timesDoGrupo;

        // Guardar o 3º colocado para a repescagem das vagas extras
        todosTerceiros.push(timesDoGrupo[2]);
    });

    // Helper para verificar se um grupo foi iniciado (se tem pelo menos 1 jogo com placar)
    const isGrupoIniciado = (grp) => {
        return jogosGrupos.some(jg => jg.grupo === grp && getScoreInput(jg.id, 'home') !== '' && getScoreInput(jg.id, 'away') !== '');
    };

    // 4. Calcular os 8 Melhores 3º Colocados Gerais (apenas considerando grupos já iniciados)
    let terceirosQualificados = todosTerceiros
        .filter(t => isGrupoIniciado(t.group))
        .sort((a, b) => b.P - a.P || b.SG - a.SG || b.GP - a.GP || a.name.localeCompare(b.name))
        .slice(0, 8);

    // 5. Resolver Chaveamento Dinâmico do Mata-Mata jogo por jogo
    mapaMataMataCalculado = {};

    estruturaNosMataMata.forEach(faseObj => {
        faseObj.jogos.forEach(j => {
            let timeHome = "A definir";
            let timeAway = "A definir";

            // Resolver quem é o Time da Casa
            if (j.origHome.tipo === "grupo") {
                const grp = j.origHome.grp;
                const pos = j.origHome.pos;
                if (isGrupoIniciado(grp)) {
                    timeHome = gruposClassificacao[grp][pos - 1].name;
                } else {
                    timeHome = `${pos}º Grupo ${grp}`;
                }
            } else if (j.origHome.tipo === "venc") {
                timeHome = calcularVencedorMataMata(j.origHome.j);
            } else if (j.origHome.tipo === "perd") {
                timeHome = calcularPerdedorMataMata(j.origHome.j);
            }

            // Resolver quem é o Time de Fora
            if (j.origAway.tipo === "grupo") {
                const grp = j.origAway.grp;
                const pos = j.origAway.pos;
                if (isGrupoIniciado(grp)) {
                    timeAway = gruposClassificacao[grp][pos - 1].name;
                } else {
                    timeAway = `${pos}º Grupo ${grp}`;
                }
            } else if (j.origAway.tipo === "terceiro") {
                // Filtra quais dos 8 terceiros qualificados pertencem aos grupos permitidos nesta vaga
                let elegiveis = terceirosQualificados.filter(t => j.origAway.grps.includes(t.group));
                if (elegiveis[j.origAway.idx]) {
                    timeAway = elegiveis[j.origAway.idx].name;
                } else {
                    // Fallback caso não haja dados preenchidos suficientes
                    let sobrou = terceirosQualificados.find(t => !Object.values(mapaMataMataCalculado).some(m => m.home === t.name || m.away === t.name));
                    timeAway = sobrou ? sobrou.name : `3º Grupo ${j.origAway.grps[0]}`;
                }
            } else if (j.origAway.tipo === "venc") {
                timeAway = calcularVencedorMataMata(j.origAway.j);
            } else if (j.origAway.tipo === "perd") {
                timeAway = calcularPerdedorMataMata(j.origAway.j);
            }

            mapaMataMataCalculado[j.id] = { id: j.id, home: timeHome, away: timeAway };
        });
    });

    // Atualizar o Banner do Campeão no final da esteira de dados
    atualizarPainelDoCampeao();
}

export function calcularVencedorMataMata(idJogo) {
    const h = getScoreInput(idJogo, 'home');
    const a = getScoreInput(idJogo, 'away');
    if (h === '' || a === '') return `Vencedor #${idJogo}`;

    const gh = parseInt(h, 10);
    const ga = parseInt(a, 10);
    const times = mapaMataMataCalculado[idJogo] || { home: `Vencedor #${idJogo}`, away: `Vencedor #${idJogo}` };

    if (gh > ga) return times.home;
    if (ga > gh) return times.away;

    // Tratamento de empate no mata-mata: checa os pênaltis
    const penH = getPenaltiesInput(idJogo, 'home');
    const penA = getPenaltiesInput(idJogo, 'away');
    if (penH !== '' && penA !== '') {
        const ph = parseInt(penH, 10);
        const pa = parseInt(penA, 10);
        if (ph !== pa) {
            return ph > pa ? times.home : times.away;
        }
    }
    // Evita propagação de strings híbridas que quebram as bandeiras.
    return `Vencedor #${idJogo}`;
}

export function calcularPerdedorMataMata(idJogo) {
    const h = getScoreInput(idJogo, 'home');
    const a = getScoreInput(idJogo, 'away');
    if (h === '' || a === '') return `Perdedor #${idJogo}`;

    const gh = parseInt(h, 10);
    const ga = parseInt(a, 10);
    const times = mapaMataMataCalculado[idJogo] || { home: `Perdedor #${idJogo}`, away: `Perdedor #${idJogo}` };

    if (gh > ga) return times.away;
    if (ga > gh) return times.home;

    const penH = getPenaltiesInput(idJogo, 'home');
    const penA = getPenaltiesInput(idJogo, 'away');
    if (penH !== '' && penA !== '') {
        const ph = parseInt(penH, 10);
        const pa = parseInt(penA, 10);
        if (ph !== pa) {
            return ph > pa ? times.away : times.home;
        }
    }
    return `Perdedor #${idJogo}`;
}

export function atualizarPainelDoCampeao() {
    const banner = document.getElementById('banner-campeao');
    const textCamp = document.getElementById('nome-campeao');
    if (!banner || !textCamp) return;

    const finalVencedor = calcularVencedorMataMata(104);

    if (finalVencedor && !finalVencedor.includes('Vencedor') && !finalVencedor.includes('/')) {
        textCamp.innerHTML = `${getFlagTag(finalVencedor)} ${finalVencedor}`;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}
