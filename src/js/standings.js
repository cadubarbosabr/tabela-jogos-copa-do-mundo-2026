import { equipesIniciais } from './teams.js';
import { jogosGrupos } from './matches.js';

const LETRAS_GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function normalizeScore(value) {
    if (value === undefined || value === null || value === '') return null;

    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? null : parsedValue;
}

function hasResult(result) {
    return !!result && normalizeScore(result.home) !== null && normalizeScore(result.away) !== null;
}

function createEmptyStats(team) {
    return {
        name: team.name,
        group: team.group,
        P: 0,
        J: 0,
        V: 0,
        E: 0,
        D: 0,
        GP: 0,
        GC: 0,
        SG: 0
    };
}

function applyMatchStats(homeStats, awayStats, homeGoals, awayGoals) {
    homeStats.J += 1;
    awayStats.J += 1;
    homeStats.GP += homeGoals;
    homeStats.GC += awayGoals;
    awayStats.GP += awayGoals;
    awayStats.GC += homeGoals;

    if (homeGoals > awayGoals) {
        homeStats.P += 3;
        homeStats.V += 1;
        awayStats.D += 1;
    } else if (awayGoals > homeGoals) {
        awayStats.P += 3;
        awayStats.V += 1;
        homeStats.D += 1;
    } else {
        homeStats.P += 1;
        awayStats.P += 1;
        homeStats.E += 1;
        awayStats.E += 1;
    }
}

function compareByOverallStats(a, b) {
    return b.SG - a.SG || b.GP - a.GP || b.V - a.V || a.name.localeCompare(b.name);
}

function buildHeadToHeadStats(teams, groupMatches, resultsByMatchId) {
    const teamNames = new Set(teams.map(team => team.name));
    const headToHeadStats = Object.fromEntries(
        teams.map(team => [
            team.name,
            { name: team.name, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 }
        ])
    );

    groupMatches.forEach(match => {
        if (!teamNames.has(match.home) || !teamNames.has(match.away)) return;

        const result = resultsByMatchId[String(match.id)];
        if (!hasResult(result)) return;

        const homeGoals = normalizeScore(result.home);
        const awayGoals = normalizeScore(result.away);

        applyMatchStats(headToHeadStats[match.home], headToHeadStats[match.away], homeGoals, awayGoals);
    });

    Object.values(headToHeadStats).forEach(team => {
        team.SG = team.GP - team.GC;
    });

    return headToHeadStats;
}

function sortGroupTeams(teams, groupMatches, resultsByMatchId) {
    const groupedByPoints = new Map();

    teams.forEach(team => {
        if (!groupedByPoints.has(team.P)) groupedByPoints.set(team.P, []);
        groupedByPoints.get(team.P).push(team);
    });

    return [...groupedByPoints.entries()]
        .sort((a, b) => b[0] - a[0])
        .flatMap(([, tiedTeams]) => {
            if (tiedTeams.length < 2) return tiedTeams;

            const headToHeadStats = buildHeadToHeadStats(tiedTeams, groupMatches, resultsByMatchId);

            return [...tiedTeams].sort((a, b) => {
                const headToHeadDiff =
                    headToHeadStats[b.name].P - headToHeadStats[a.name].P ||
                    headToHeadStats[b.name].SG - headToHeadStats[a.name].SG ||
                    headToHeadStats[b.name].GP - headToHeadStats[a.name].GP;

                return headToHeadDiff || compareByOverallStats(a, b);
            });
        });
}

export function sortThirdPlacedTeams(teams) {
    return [...teams].sort((a, b) =>
        b.P - a.P ||
        b.SG - a.SG ||
        b.GP - a.GP ||
        b.V - a.V ||
        a.name.localeCompare(b.name)
    );
}

export function isGroupStarted(group, resultsByMatchId) {
    return jogosGrupos.some(match => {
        if (match.grupo !== group) return false;
        return hasResult(resultsByMatchId[String(match.id)]);
    });
}

export function calculateStandings(resultsByMatchId = {}) {
    const statsTimes = {};

    equipesIniciais.forEach(team => {
        statsTimes[team.name] = createEmptyStats(team);
    });

    jogosGrupos.forEach(match => {
        const result = resultsByMatchId[String(match.id)];
        if (!hasResult(result)) return;

        const homeGoals = normalizeScore(result.home);
        const awayGoals = normalizeScore(result.away);

        applyMatchStats(statsTimes[match.home], statsTimes[match.away], homeGoals, awayGoals);
    });

    Object.values(statsTimes).forEach(team => {
        team.SG = team.GP - team.GC;
    });

    const gruposClassificacao = {};
    const terceirosColocados = [];

    LETRAS_GRUPOS.forEach(group => {
        const groupMatches = jogosGrupos.filter(match => match.grupo === group);
        const teams = Object.values(statsTimes).filter(team => team.group === group);
        const orderedTeams = sortGroupTeams(teams, groupMatches, resultsByMatchId);

        gruposClassificacao[group] = orderedTeams;
        terceirosColocados.push(orderedTeams[2]);
    });

    return { statsTimes, gruposClassificacao, terceirosColocados };
}
