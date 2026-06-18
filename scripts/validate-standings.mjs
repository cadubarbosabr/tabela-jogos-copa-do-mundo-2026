#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateStandings } from '../src/js/standings.js';
import { countryCodes, equipesIniciais } from '../src/js/teams.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = resolve(__dirname, '../public/results.json');

const TOURNAMENT_START = '20260611';
const TOURNAMENT_END = '20260719';
const GROUP_NAME_REGEX = /^Group ([A-L])$/;

const ESPN_STANDINGS_URLS = [
  process.env.ESPN_STANDINGS_URL,
  'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings',
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/standings?season=2026',
  'https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026'
].filter(Boolean);

const NAME_ALIASES = {
  'bosnia & herzegovina': 'Bosnia and Herzegovina',
  'bosnia herzegovina': 'Bosnia and Herzegovina',
  'czechia': 'Czech Republic',
  'curacao': 'Curaçao',
  'cote d ivoire': "Ivory Coast",
  'côte d ivoire': "Ivory Coast",
  'democratic republic of the congo': 'DR Congo',
  'd r congo': 'DR Congo',
  'holland': 'Netherlands',
  'ir iran': 'Iran',
  'korea republic': 'South Korea',
  'turkiye': 'Turkey',
  'usa': 'United States'
};

const TEAM_NAME_BY_NORMALIZED = Object.fromEntries(
  equipesIniciais.map(team => [normalizeText(team.name), team.name])
);

const CODE_TO_TEAM_NAME = new Map(
  equipesIniciais.map(team => [countryCodes[team.name], team.name])
);

function todayUtc() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function roundStatValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
}

function loadResults() {
  const raw = JSON.parse(readFileSync(RESULTS_PATH, 'utf8'));
  delete raw._meta;
  return raw;
}

function mapEspnTeamName(teamName) {
  if (TEAM_NAME_BY_NORMALIZED[normalizeText(teamName)]) {
    return TEAM_NAME_BY_NORMALIZED[normalizeText(teamName)];
  }

  const aliasedName = NAME_ALIASES[normalizeText(teamName)] || teamName;
  const code = countryCodes[aliasedName];

  if (code && CODE_TO_TEAM_NAME.has(code)) {
    return CODE_TO_TEAM_NAME.get(code);
  }

  throw new Error(`Time da ESPN não reconhecido: ${teamName}`);
}

function getStatValue(statsMap, keys) {
  for (const key of keys) {
    if (statsMap.has(key)) return statsMap.get(key);
  }

  return 0;
}

function indexStats(stats = []) {
  const statsMap = new Map();

  stats.forEach(stat => {
    const value = roundStatValue(stat?.value);
    if (stat?.name) statsMap.set(String(stat.name), value);
    if (stat?.abbreviation) statsMap.set(String(stat.abbreviation), value);
  });

  return statsMap;
}

async function fetchStandingsPayload() {
  if (process.env.ESPN_STANDINGS_PATH) {
    return JSON.parse(readFileSync(process.env.ESPN_STANDINGS_PATH, 'utf8'));
  }

  let lastError = null;

  for (const url of ESPN_STANDINGS_URLS) {
    try {
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'user-agent': 'tabela-copa-2026-standings-validator'
        }
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} ao buscar ${url}`);
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Não foi possível buscar as classificações da ESPN.');
}

function parseOfficialStandings(payload) {
  const groups = Array.isArray(payload?.children)
    ? payload.children.filter(group => GROUP_NAME_REGEX.test(group?.name || ''))
    : [];

  if (!groups.length) {
    throw new Error('A resposta da ESPN não contém grupos válidos em payload.children.');
  }

  return Object.fromEntries(
    groups.map(group => {
      const groupLetter = group.abbreviation || group.name.match(GROUP_NAME_REGEX)?.[1];
      const entries = Array.isArray(group.standings?.entries) ? group.standings.entries : [];

      const teams = entries
        .map(entry => {
          const statsMap = indexStats(entry.stats);

          return {
            name: mapEspnTeamName(entry.team?.displayName || entry.team?.shortDisplayName || entry.team?.name || ''),
            position: getStatValue(statsMap, ['rank', 'R']),
            J: getStatValue(statsMap, ['gamesPlayed', 'GP']),
            V: getStatValue(statsMap, ['wins', 'W']),
            E: getStatValue(statsMap, ['ties', 'draws', 'D']),
            D: getStatValue(statsMap, ['losses', 'L']),
            GP: getStatValue(statsMap, ['pointsFor', 'goalsFor', 'F', 'GF']),
            GC: getStatValue(statsMap, ['pointsAgainst', 'goalsAgainst', 'A', 'GA']),
            SG: getStatValue(statsMap, ['pointDifferential', 'goalDifference', 'GD']),
            P: getStatValue(statsMap, ['points', 'PTS', 'P'])
          };
        })
        .sort((a, b) =>
          a.position - b.position ||
          b.P - a.P ||
          b.SG - a.SG ||
          b.GP - a.GP ||
          b.V - a.V ||
          a.name.localeCompare(b.name)
        )
        .map((team, index) => ({ ...team, position: index + 1 }));

      return [groupLetter, teams];
    })
  );
}

function compareStandings(calculatedGroups, officialGroups) {
  const discrepancies = [];

  Object.entries(officialGroups).forEach(([group, officialTeams]) => {
    const calculatedTeams = calculatedGroups[group] || [];

    if (calculatedTeams.length !== officialTeams.length) {
      discrepancies.push(
        `Grupo ${group}: quantidade de times diferente (app=${calculatedTeams.length}, espn=${officialTeams.length})`
      );
      return;
    }

    const calculatedOrder = calculatedTeams.map(team => team.name);
    const officialOrder = officialTeams.map(team => team.name);

    if (calculatedOrder.join(' | ') !== officialOrder.join(' | ')) {
      discrepancies.push(
        `Grupo ${group}: ordem diferente (app=${calculatedOrder.join(' > ')}, espn=${officialOrder.join(' > ')})`
      );
    }

    officialTeams.forEach((officialTeam, index) => {
      const calculatedTeam = calculatedTeams.find(team => team.name === officialTeam.name);

      if (!calculatedTeam) {
        discrepancies.push(`Grupo ${group}: time ausente no app (${officialTeam.name})`);
        return;
      }

      const calculatedPosition = calculatedOrder.indexOf(officialTeam.name) + 1;
      const officialPosition = index + 1;

      if (calculatedPosition !== officialPosition) {
        discrepancies.push(
          `Grupo ${group}: posição de ${officialTeam.name} diferente (app=${calculatedPosition}, espn=${officialPosition})`
        );
      }

      ['P', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'].forEach(stat => {
        if (calculatedTeam[stat] !== officialTeam[stat]) {
          discrepancies.push(
            `Grupo ${group}: ${officialTeam.name} com ${stat} diferente (app=${calculatedTeam[stat]}, espn=${officialTeam[stat]})`
          );
        }
      });
    });
  });

  return discrepancies;
}

async function main() {
  const today = todayUtc();

  if (today < TOURNAMENT_START || today > TOURNAMENT_END) {
    console.log(`Fora do período do torneio (${TOURNAMENT_START}–${TOURNAMENT_END}). Nada a validar.`);
    return;
  }

  const results = loadResults();
  const { gruposClassificacao } = calculateStandings(results);
  const officialPayload = await fetchStandingsPayload();
  const officialGroups = parseOfficialStandings(officialPayload);
  const discrepancies = compareStandings(gruposClassificacao, officialGroups);

  if (!discrepancies.length) {
    console.log('✅ Classificações calculadas conferem com a ESPN.');
    return;
  }

  console.error('❌ Discrepâncias encontradas entre o app e a ESPN:');
  discrepancies.forEach(message => console.error(`- ${message}`));
  process.exitCode = 1;
}

main().catch(error => {
  console.error('Erro ao validar classificações:', error);
  process.exit(1);
});
