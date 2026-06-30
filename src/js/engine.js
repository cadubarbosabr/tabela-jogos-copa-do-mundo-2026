import { getFlagTag } from './teams.js';
import { jogosGrupos, estruturaNosMataMata } from './matches.js';
import { calculateStandings, isGroupStarted, sortThirdPlacedTeams } from './standings.js';
import { translateTeam } from './translate.js';
import { ANNEX_C } from './annexC.js';
import {
    getOfficialScoreInput,
    getOfficialPenaltiesInput,
    hasOfficialResult
} from './officialResults.js';

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
    const officialScore = getOfficialScoreInput(id, side);
    if (officialScore !== '') return officialScore;

    return localStorage.getItem(`wc2026_score_${id}_${side}`) || '';
}

export function setScoreInput(id, side, val) {
    if (hasOfficialResult(id)) return;

    localStorage.setItem(`wc2026_score_${id}_${side}`, val);
    recalcularTorneioCompleto();
    notifyUpdate();
}

export function getPenaltiesInput(id, side) {
    const officialPenalties = getOfficialPenaltiesInput(id, side);
    if (officialPenalties !== '') return officialPenalties;

    return localStorage.getItem(`wc2026_pen_${id}_${side}`) || '';
}

export function setPenaltiesInput(id, side, val) {
    if (hasOfficialResult(id)) return;

    localStorage.setItem(`wc2026_pen_${id}_${side}`, val);
    recalcularTorneioCompleto();
    notifyUpdate();
}

export function recalcularTorneioCompleto() {
    const resultadosFaseDeGrupos = {};

    jogosGrupos.forEach(jogo => {
        const golsHome = getScoreInput(jogo.id, 'home');
        const golsAway = getScoreInput(jogo.id, 'away');

        if (golsHome === '' || golsAway === '') return;

        resultadosFaseDeGrupos[String(jogo.id)] = {
            home: golsHome,
            away: golsAway
        };
    });

    const { gruposClassificacao: classificacaoPorGrupo, terceirosColocados } = calculateStandings(resultadosFaseDeGrupos);
    gruposClassificacao = classificacaoPorGrupo;

    // Helper para verificar se um grupo foi iniciado (se tem pelo menos 1 jogo com placar)
    const isGrupoIniciado = (grp) => {
        return isGroupStarted(grp, resultadosFaseDeGrupos);
    };

    // 4. Calcular os 8 Melhores 3º Colocados Gerais (apenas considerando grupos já iniciados)
    let terceirosQualificados = sortThirdPlacedTeams(
        terceirosColocados.filter(t => isGrupoIniciado(t.group))
    )
        .slice(0, 8);

    // 5. Resolver Chaveamento Dinâmico do Mata-Mata jogo por jogo
    mapaMataMataCalculado = {};

    // Rastreia os 3ºs colocados já alocados a um confronto, evitando duplicações.
    const terceirosAlocados = new Set();

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
                if (terceirosQualificados.length === 8) {
                    // Usar tabela oficial do Anexo C da FIFA para garantir
                    // que o 3º do grupo correto seja pareado com cada líder.
                    const key = terceirosQualificados.map(t => t.group).sort().join('');
                    const slot = `1${j.origHome.grp}`;
                    const assignedGroup = ANNEX_C[key]?.[slot];
                    if (assignedGroup) {
                        const team = terceirosQualificados.find(t => t.group === assignedGroup);
                        timeAway = team ? team.name : `3º Grupo ${assignedGroup}`;
                        if (team) terceirosAlocados.add(team.name);
                    } else {
                        // Fallback: qualquer 3º ainda não alocado
                        const sobrou = terceirosQualificados.find(t => !terceirosAlocados.has(t.name));
                        if (sobrou) {
                            timeAway = sobrou.name;
                            terceirosAlocados.add(sobrou.name);
                        } else {
                            timeAway = `3º Grupo ${j.origAway.grps[0]}`;
                        }
                    }
                } else {
                    // Grupos ainda não finalizados – alocação gulosa com restrição de grupo
                    const elegiveis = terceirosQualificados.filter(t =>
                        j.origAway.grps.includes(t.group) && !terceirosAlocados.has(t.name)
                    );
                    if (elegiveis.length > 0) {
                        timeAway = elegiveis[0].name;
                        terceirosAlocados.add(elegiveis[0].name);
                    } else {
                        const sobrou = terceirosQualificados.find(t => !terceirosAlocados.has(t.name));
                        if (sobrou) {
                            timeAway = sobrou.name;
                            terceirosAlocados.add(sobrou.name);
                        } else {
                            timeAway = `3º Grupo ${j.origAway.grps[0]}`;
                        }
                    }
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
        const localizedWinner = translateTeam(finalVencedor, 'pt');
        textCamp.innerHTML = `${getFlagTag(finalVencedor)} ${localizedWinner}`;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}
