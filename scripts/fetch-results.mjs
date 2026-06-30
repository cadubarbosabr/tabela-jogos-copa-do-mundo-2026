#!/usr/bin/env node
/**
 * scripts/fetch-results.mjs
 *
 * Busca os resultados da Copa do Mundo FIFA 2026 via ESPN API pública (gratuita,
 * sem chave de API) e atualiza o arquivo public/results.json.
 *
 * Executado automaticamente pelo GitHub Actions (`.github/workflows/update-results.yml`)
 * a cada 15 minutos durante o torneio.
 *
 * Fonte: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = resolve(__dirname, '../public/results.json');

// Data de início e fim do torneio (YYYYMMDD)
const TOURNAMENT_START = '20260611';
const TOURNAMENT_END   = '20260719';

const ESPN_SLUGS = [
  'fifa.world',
  'fifa.world.2026',
  'fifa.worldcup',
  'fifa.world.cup',
];

// ---------------------------------------------------------------------------
// Mapeamento de nomes em inglês (ESPN) → português (utilizado em matches.js)
// ---------------------------------------------------------------------------
const EN_TO_PT = {
  'Mexico': 'México',
  'South Africa': 'África do Sul',
  'South Korea': 'Coreia do Sul',
  'Korea Republic': 'Coreia do Sul',  // nome oficial FIFA usado em alguns feeds ESPN
  'Czech Republic': 'República Tcheca',
  'Czechia': 'República Tcheca',      // nome moderno retornado pela ESPN API
  'Canada': 'Canadá',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Bosnia & Herzegovina': 'Bósnia e Herzegovina',
  'Bosnia Herzegovina': 'Bósnia e Herzegovina', // variante sem "and"/"&"
  'Qatar': 'Catar',
  'Switzerland': 'Suíça',
  'Brazil': 'Brasil',
  'Morocco': 'Marrocos',
  'Haiti': 'Haiti',
  'Scotland': 'Escócia',
  'United States': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'Paraguay': 'Paraguai',
  'Australia': 'Austrália',
  'Turkey': 'Turquia',
  'Türkiye': 'Turquia',         // nome oficial adotado internacionalmente desde 2022
  'Germany': 'Alemanha',
  'Curaçao': 'Curaçao',
  'Curacao': 'Curaçao', // alias sem cedilha — usado por alguns feeds ESPN
  'Netherlands': 'Holanda',
  'Holland': 'Holanda',
  'Japan': 'Japão',
  "Ivory Coast": 'Costa do Marfim',
  "Côte d'Ivoire": 'Costa do Marfim',
  "Cote d'Ivoire": 'Costa do Marfim',
  'Ecuador': 'Equador',
  'Sweden': 'Suécia',
  'Tunisia': 'Tunísia',
  'Spain': 'Espanha',
  'Cape Verde': 'Cabo Verde',
  'Cabo Verde': 'Cabo Verde',
  'Belgium': 'Bélgica',
  'Egypt': 'Egito',
  'Saudi Arabia': 'Arábia Saudita',
  'Uruguay': 'Uruguai',
  'Iran': 'Irã',
  'IR Iran': 'Irã',                   // nome oficial FIFA
  'New Zealand': 'Nova Zelândia',
  'France': 'França',
  'Senegal': 'Senegal',
  'Iraq': 'Iraque',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argélia',
  'Austria': 'Áustria',
  'Jordan': 'Jordânia',
  'Portugal': 'Portugal',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',             // variante de ordem usada em alguns feeds
  'Democratic Republic of the Congo': 'RD Congo',
  'D.R. Congo': 'RD Congo',
  'England': 'Inglaterra',
  'Croatia': 'Croácia',
  'Ghana': 'Gana',
  'Panama': 'Panamá',
  'Uzbekistan': 'Uzbequistão',
  'Colombia': 'Colômbia',
};

// ---------------------------------------------------------------------------
// Jogos da fase de grupos — espelho de src/js/matches.js com datas YYYYMMDD
// ---------------------------------------------------------------------------
const GROUP_MATCHES = [
  { id: 1,  date: '20260611', home: 'México',             away: 'África do Sul'         },
  { id: 2,  date: '20260611', home: 'Coreia do Sul',      away: 'República Tcheca'       },
  { id: 3,  date: '20260612', home: 'Canadá',             away: 'Bósnia e Herzegovina'   },
  { id: 4,  date: '20260612', home: 'Estados Unidos',     away: 'Paraguai'               },
  { id: 5,  date: '20260613', home: 'Catar',              away: 'Suíça'                  },
  { id: 6,  date: '20260613', home: 'Brasil',             away: 'Marrocos'               },
  { id: 7,  date: '20260613', home: 'Haiti',              away: 'Escócia'                },
  { id: 8,  date: '20260614', home: 'Austrália',          away: 'Turquia'                },
  { id: 9,  date: '20260614', home: 'Alemanha',           away: 'Curaçao'               },
  { id: 10, date: '20260614', home: 'Holanda',            away: 'Japão'                  },
  { id: 11, date: '20260614', home: 'Costa do Marfim',    away: 'Equador'                },
  { id: 12, date: '20260614', home: 'Suécia',             away: 'Tunísia'                },
  { id: 13, date: '20260615', home: 'Espanha',            away: 'Cabo Verde'             },
  { id: 14, date: '20260615', home: 'Bélgica',            away: 'Egito'                  },
  { id: 15, date: '20260615', home: 'Arábia Saudita',     away: 'Uruguai'                },
  { id: 16, date: '20260615', home: 'Irã',                away: 'Nova Zelândia'          },
  { id: 17, date: '20260616', home: 'França',             away: 'Senegal'                },
  { id: 18, date: '20260616', home: 'Iraque',             away: 'Noruega'                },
  { id: 19, date: '20260616', home: 'Argentina',          away: 'Argélia'                },
  { id: 20, date: '20260617', home: 'Áustria',            away: 'Jordânia'               },
  { id: 21, date: '20260617', home: 'Portugal',           away: 'RD Congo'               },
  { id: 22, date: '20260617', home: 'Inglaterra',         away: 'Croácia'                },
  { id: 23, date: '20260617', home: 'Gana',               away: 'Panamá'                 },
  { id: 24, date: '20260617', home: 'Uzbequistão',        away: 'Colômbia'               },
  { id: 25, date: '20260618', home: 'República Tcheca',   away: 'África do Sul'          },
  { id: 26, date: '20260618', home: 'Suíça',              away: 'Bósnia e Herzegovina'   },
  { id: 27, date: '20260618', home: 'Canadá',             away: 'Catar'                  },
  { id: 28, date: '20260618', home: 'México',             away: 'Coreia do Sul'          },
  { id: 29, date: '20260619', home: 'Turquia',            away: 'Paraguai'               },
  { id: 30, date: '20260619', home: 'Estados Unidos',     away: 'Austrália'              },
  { id: 31, date: '20260619', home: 'Escócia',            away: 'Marrocos'               },
  { id: 32, date: '20260619', home: 'Brasil',             away: 'Haiti'                  },
  { id: 33, date: '20260620', home: 'Tunísia',            away: 'Japão'                  },
  { id: 34, date: '20260620', home: 'Holanda',            away: 'Suécia'                 },
  { id: 35, date: '20260620', home: 'Alemanha',           away: 'Costa do Marfim'        },
  { id: 36, date: '20260620', home: 'Equador',            away: 'Curaçao'               },
  { id: 37, date: '20260621', home: 'Espanha',            away: 'Arábia Saudita'         },
  { id: 38, date: '20260621', home: 'Bélgica',            away: 'Irã'                    },
  { id: 39, date: '20260621', home: 'Uruguai',            away: 'Cabo Verde'             },
  { id: 40, date: '20260621', home: 'Nova Zelândia',      away: 'Egito'                  },
  { id: 41, date: '20260622', home: 'Argentina',          away: 'Áustria'                },
  { id: 42, date: '20260622', home: 'França',             away: 'Iraque'                 },
  { id: 43, date: '20260622', home: 'Noruega',            away: 'Senegal'                },
  { id: 44, date: '20260623', home: 'Jordânia',           away: 'Argélia'                },
  { id: 45, date: '20260623', home: 'Portugal',           away: 'Uzbequistão'            },
  { id: 46, date: '20260623', home: 'Inglaterra',         away: 'Gana'                   },
  { id: 47, date: '20260623', home: 'Panamá',             away: 'Croácia'                },
  { id: 48, date: '20260623', home: 'Colômbia',           away: 'RD Congo'               },
  { id: 49, date: '20260624', home: 'Suíça',              away: 'Canadá'                 },
  { id: 50, date: '20260624', home: 'Bósnia e Herzegovina', away: 'Catar'                },
  { id: 51, date: '20260624', home: 'Escócia',            away: 'Brasil'                 },
  { id: 52, date: '20260624', home: 'Marrocos',           away: 'Haiti'                  },
  { id: 53, date: '20260624', home: 'República Tcheca',   away: 'México'                 },
  { id: 54, date: '20260624', home: 'África do Sul',      away: 'Coreia do Sul'          },
  { id: 55, date: '20260625', home: 'Curaçao',           away: 'Costa do Marfim'        },
  { id: 56, date: '20260625', home: 'Equador',            away: 'Alemanha'               },
  { id: 57, date: '20260625', home: 'Japão',              away: 'Suécia'                 },
  { id: 58, date: '20260625', home: 'Tunísia',            away: 'Holanda'                },
  { id: 59, date: '20260625', home: 'Turquia',            away: 'Estados Unidos'         },
  { id: 60, date: '20260625', home: 'Paraguai',           away: 'Austrália'              },
  { id: 61, date: '20260626', home: 'Noruega',            away: 'França'                 },
  { id: 62, date: '20260626', home: 'Senegal',            away: 'Iraque'                 },
  { id: 63, date: '20260626', home: 'Cabo Verde',         away: 'Arábia Saudita'         },
  { id: 64, date: '20260626', home: 'Uruguai',            away: 'Espanha'                },
  { id: 65, date: '20260627', home: 'Egito',              away: 'Irã'                    },
  { id: 66, date: '20260627', home: 'Nova Zelândia',      away: 'Bélgica'                },
  { id: 67, date: '20260627', home: 'Panamá',             away: 'Inglaterra'             },
  { id: 68, date: '20260627', home: 'Croácia',            away: 'Gana'                   },
  { id: 69, date: '20260627', home: 'Colômbia',           away: 'Portugal'               },
  { id: 70, date: '20260627', home: 'RD Congo',           away: 'Uzbequistão'            },
  { id: 71, date: '20260627', home: 'Argélia',            away: 'Áustria'                },
  { id: 72, date: '20260627', home: 'Jordânia',           away: 'Argentina'              },
];

// ---------------------------------------------------------------------------
// Jogos do mata-mata — IDs por data YYYYMMDD (mesma ordem de matches.js)
// ---------------------------------------------------------------------------
const KNOCKOUT_BY_DATE = {
  '20260628': [73],
  '20260629': [74, 75, 76],
  '20260630': [77, 78, 79],
  '20260701': [80, 81, 82],
  '20260702': [83, 84, 85],
  '20260703': [86, 87, 88],
  '20260704': [89, 90],
  '20260705': [91, 92],
  '20260706': [93, 94],
  '20260707': [95, 96],
  '20260709': [97],
  '20260710': [98],
  '20260711': [99, 100],
  '20260714': [101],
  '20260715': [102],
  '20260718': [103],
  '20260719': [104],
};

// ---------------------------------------------------------------------------
// Dados dos grupos — espelho de src/js/teams.js (equipesIniciais)
// ---------------------------------------------------------------------------
const TEAMS_BY_GROUP = {
  A: ['México', 'África do Sul', 'Coreia do Sul', 'República Tcheca'],
  B: ['Canadá', 'Bósnia e Herzegovina', 'Catar', 'Suíça'],
  C: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
  D: ['Estados Unidos', 'Paraguai', 'Austrália', 'Turquia'],
  E: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
  F: ['Holanda', 'Japão', 'Suécia', 'Tunísia'],
  G: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'],
  H: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
  I: ['França', 'Senegal', 'Iraque', 'Noruega'],
  J: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
  K: ['Portugal', 'RD Congo', 'Uzbequistão', 'Colômbia'],
  L: ['Inglaterra', 'Croácia', 'Gana', 'Panamá'],
};

/** Mapeamento time → grupo (derivado de TEAMS_BY_GROUP) */
const TEAM_TO_GROUP = {};
for (const [grp, teams] of Object.entries(TEAMS_BY_GROUP)) {
  for (const name of teams) {
    TEAM_TO_GROUP[name] = grp;
  }
}

// ---------------------------------------------------------------------------
// Descritores de origem dos times em cada jogo do mata-mata
// Espelho de estruturaNosMataMata (src/js/matches.js)
// ---------------------------------------------------------------------------
const KNOCKOUT_MATCHES = [
  // Dezesseis-avos de Final (Rodada de 32)
  { id: 73,  origHome: { tipo: 'grupo',    pos: 2, grp: 'A' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'B' } },
  { id: 74,  origHome: { tipo: 'grupo',    pos: 1, grp: 'E' },            origAway: { tipo: 'terceiro', idx: 0, grps: ['A','B','C','D','F'] } },
  { id: 75,  origHome: { tipo: 'grupo',    pos: 1, grp: 'F' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'C' } },
  { id: 76,  origHome: { tipo: 'grupo',    pos: 1, grp: 'C' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'F' } },
  { id: 77,  origHome: { tipo: 'grupo',    pos: 1, grp: 'I' },            origAway: { tipo: 'terceiro', idx: 1, grps: ['C','D','F','G','H'] } },
  { id: 78,  origHome: { tipo: 'grupo',    pos: 2, grp: 'E' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'I' } },
  { id: 79,  origHome: { tipo: 'grupo',    pos: 1, grp: 'A' },            origAway: { tipo: 'terceiro', idx: 2, grps: ['C','E','F','H','I'] } },
  { id: 80,  origHome: { tipo: 'grupo',    pos: 1, grp: 'L' },            origAway: { tipo: 'terceiro', idx: 3, grps: ['E','H','I','J','K'] } },
  { id: 81,  origHome: { tipo: 'grupo',    pos: 1, grp: 'D' },            origAway: { tipo: 'terceiro', idx: 4, grps: ['B','E','F','I','J'] } },
  { id: 82,  origHome: { tipo: 'grupo',    pos: 1, grp: 'G' },            origAway: { tipo: 'terceiro', idx: 5, grps: ['A','E','H','I','J'] } },
  { id: 83,  origHome: { tipo: 'grupo',    pos: 2, grp: 'K' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'L' } },
  { id: 84,  origHome: { tipo: 'grupo',    pos: 1, grp: 'H' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'J' } },
  { id: 85,  origHome: { tipo: 'grupo',    pos: 1, grp: 'B' },            origAway: { tipo: 'terceiro', idx: 6, grps: ['E','F','G','I','J'] } },
  { id: 86,  origHome: { tipo: 'grupo',    pos: 1, grp: 'J' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'H' } },
  { id: 87,  origHome: { tipo: 'grupo',    pos: 1, grp: 'K' },            origAway: { tipo: 'terceiro', idx: 7, grps: ['D','E','I','J','L'] } },
  { id: 88,  origHome: { tipo: 'grupo',    pos: 2, grp: 'D' },            origAway: { tipo: 'grupo',    pos: 2, grp: 'G' } },
  // Oitavas de Final
  { id: 89,  origHome: { tipo: 'venc', j: 73 },  origAway: { tipo: 'venc', j: 75 } },
  { id: 90,  origHome: { tipo: 'venc', j: 74 },  origAway: { tipo: 'venc', j: 77 } },
  { id: 91,  origHome: { tipo: 'venc', j: 76 },  origAway: { tipo: 'venc', j: 78 } },
  { id: 92,  origHome: { tipo: 'venc', j: 79 },  origAway: { tipo: 'venc', j: 80 } },
  { id: 93,  origHome: { tipo: 'venc', j: 81 },  origAway: { tipo: 'venc', j: 82 } },
  { id: 94,  origHome: { tipo: 'venc', j: 83 },  origAway: { tipo: 'venc', j: 84 } },
  { id: 95,  origHome: { tipo: 'venc', j: 85 },  origAway: { tipo: 'venc', j: 87 } },
  { id: 96,  origHome: { tipo: 'venc', j: 86 },  origAway: { tipo: 'venc', j: 88 } },
  // Quartas de Final
  { id: 97,  origHome: { tipo: 'venc', j: 89 },  origAway: { tipo: 'venc', j: 90 } },
  { id: 98,  origHome: { tipo: 'venc', j: 91 },  origAway: { tipo: 'venc', j: 92 } },
  { id: 99,  origHome: { tipo: 'venc', j: 93 },  origAway: { tipo: 'venc', j: 94 } },
  { id: 100, origHome: { tipo: 'venc', j: 95 },  origAway: { tipo: 'venc', j: 96 } },
  // Semifinais
  { id: 101, origHome: { tipo: 'venc', j: 97 },  origAway: { tipo: 'venc', j: 99 } },
  { id: 102, origHome: { tipo: 'venc', j: 98 },  origAway: { tipo: 'venc', j: 100 } },
  // Finais
  { id: 103, origHome: { tipo: 'perd', j: 101 }, origAway: { tipo: 'perd', j: 102 } },
  { id: 104, origHome: { tipo: 'venc', j: 101 }, origAway: { tipo: 'venc', j: 102 } },
];

/** Mapa id → descritor do jogo do mata-mata */
const KNOCKOUT_BY_ID = new Map(KNOCKOUT_MATCHES.map(m => [m.id, m]));

// ---------------------------------------------------------------------------
// Utilitários de normalização de nomes
// ---------------------------------------------------------------------------

/**
 * Normaliza um nome de seleção para comparação tolerante a variações.
 *
 * Aplica (em ordem):
 *  1. Decomposição Unicode NFD + remoção de marcas diacríticas (acentos).
 *  2. Conversão para minúsculas.
 *  3. Substituição de "&" por "and" (ex.: "Bosnia & Herzegovina" → "bosnia and herzegovina").
 *  4. Remoção de apóstrofos: ASCII (U+0027), aspas simples abertas/fechadas (U+2018/U+2019)
 *     e modificador de letra (U+02BC). Ex.: "Côte d'Ivoire" → "cote divoire".
 *  5. Substituição de hífens e pontos por espaço (ex.: "D.R. Congo" → "dr  congo").
 *  6. Colapso de espaços múltiplos e trim.
 *
 * @param {string} str
 * @returns {string}
 */
function normalizeName(str) {
  return str
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['\u2018\u2019\u02bc]/g, '')  // apóstrofos: ' (U+0027), ' (U+2018), ' (U+2019), ʼ (U+02BC)
    .replace(/[.\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapa auxiliar: chaves em minúsculas → fallback insensível a maiúsculas
const EN_TO_PT_LOWER = Object.fromEntries(
  Object.entries(EN_TO_PT).map(([k, v]) => [k.toLowerCase(), v])
);

// Mapa auxiliar: chaves normalizadas → fallback tolerante a diacríticos/pontuação
const EN_TO_PT_NORM = Object.fromEntries(
  Object.entries(EN_TO_PT).map(([k, v]) => [normalizeName(k), v])
);

/**
 * Converte um nome de seleção do inglês (ESPN) para o português (matches.js).
 *
 * Tenta três estratégias em ordem crescente de tolerância:
 *  1. Correspondência exata contra EN_TO_PT.
 *  2. Insensível a maiúsculas/minúsculas (EN_TO_PT_LOWER).
 *  3. Tolerante a diacríticos, "&"/"and", hífens, apóstrofos e espaços (EN_TO_PT_NORM).
 *
 * Se nenhuma estratégia produzir resultado, retorna o nome original sem conversão.
 *
 * @param {string} enName - Nome da seleção em inglês (conforme retornado pela ESPN API)
 * @returns {string} Nome em português ou o próprio enName se não houver mapeamento
 */
function toPt(enName) {
  return (
    EN_TO_PT[enName] ||
    EN_TO_PT_LOWER[enName.toLowerCase()] ||
    EN_TO_PT_NORM[normalizeName(enName)] ||
    enName
  );
}

/** Retorna a data de hoje no formato YYYYMMDD (UTC). */
function todayUtc() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

// ---------------------------------------------------------------------------
// Funções de classificação dos grupos (espelho de src/js/standings.js)
// Usadas para resolver os times esperados em cada jogo do mata-mata.
// ---------------------------------------------------------------------------

/**
 * Ordena os times de um grupo considerando desempate por confronto direto (head-to-head).
 * Espelho de sortGroupTeams em src/js/standings.js.
 */
function sortGroupTeams(teams, groupMatches, results) {
  const byPoints = new Map();
  for (const t of teams) {
    if (!byPoints.has(t.P)) byPoints.set(t.P, []);
    byPoints.get(t.P).push(t);
  }

  return [...byPoints.entries()]
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, tied]) => {
      if (tied.length < 2) return tied;

      // Calcular estatísticas do confronto direto (head-to-head) entre os empatados
      const h2h = Object.fromEntries(
        tied.map(t => [t.name, { name: t.name, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 }])
      );
      const tiedNames = new Set(tied.map(t => t.name));
      for (const m of groupMatches) {
        if (!tiedNames.has(m.home) || !tiedNames.has(m.away)) continue;
        const r = results[String(m.id)];
        if (!r || r.home == null || r.away == null) continue;
        const hg = parseInt(r.home, 10);
        const ag = parseInt(r.away, 10);
        if (isNaN(hg) || isNaN(ag)) continue;
        const homeStats = h2h[m.home];
        const awayStats = h2h[m.away];
        homeStats.J++; awayStats.J++;
        homeStats.GP += hg; homeStats.GC += ag; awayStats.GP += ag; awayStats.GC += hg;
        if (hg > ag) { homeStats.P += 3; homeStats.V++; awayStats.D++; }
        else if (ag > hg) { awayStats.P += 3; awayStats.V++; homeStats.D++; }
        else { homeStats.P++; awayStats.P++; homeStats.E++; awayStats.E++; }
      }
      for (const s of Object.values(h2h)) s.SG = s.GP - s.GC;

      return [...tied].sort((a, b) => {
        const ha = h2h[a.name];
        const hb = h2h[b.name];
        return (hb.P - ha.P) || (hb.SG - ha.SG) || (hb.GP - ha.GP) ||
               (b.SG - a.SG) || (b.GP - a.GP) || (b.V - a.V) ||
               a.name.localeCompare(b.name);
      });
    });
}

/**
 * Ordena os 3ºs colocados dos grupos pelo critério de desempate global.
 * Espelho de sortThirdPlacedTeams em src/js/standings.js.
 */
function sortThirdPlacedTeams(teams) {
  return [...teams].sort((a, b) =>
    b.P - a.P || b.SG - a.SG || b.GP - a.GP || b.V - a.V || a.name.localeCompare(b.name)
  );
}

/**
 * Calcula a classificação de todos os grupos a partir dos resultados já processados.
 * Espelho simplificado de calculateStandings em src/js/standings.js.
 * Retorna { gruposClassificacao, terceirosColocados }.
 */
function computeGroupStandings(results) {
  const stats = {};
  for (const [grp, teams] of Object.entries(TEAMS_BY_GROUP)) {
    for (const name of teams) {
      stats[name] = { name, group: grp, P: 0, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, SG: 0 };
    }
  }

  for (const m of GROUP_MATCHES) {
    const r = results[String(m.id)];
    if (!r || r.home == null || r.away == null) continue;
    const hg = parseInt(r.home, 10);
    const ag = parseInt(r.away, 10);
    if (isNaN(hg) || isNaN(ag)) continue;

    const homeStats = stats[m.home];
    const awayStats = stats[m.away];
    homeStats.J++; awayStats.J++;
    homeStats.GP += hg; homeStats.GC += ag; awayStats.GP += ag; awayStats.GC += hg;
    if (hg > ag) { homeStats.P += 3; homeStats.V++; awayStats.D++; }
    else if (ag > hg) { awayStats.P += 3; awayStats.V++; homeStats.D++; }
    else { homeStats.P++; awayStats.P++; homeStats.E++; awayStats.E++; }
  }
  for (const s of Object.values(stats)) s.SG = s.GP - s.GC;

  const gruposClassificacao = {};
  const terceirosColocados = [];

  for (const grp of Object.keys(TEAMS_BY_GROUP)) {
    const groupMatchesForGrp = GROUP_MATCHES.filter(m => TEAM_TO_GROUP[m.home] === grp);
    const teams = Object.values(stats).filter(t => t.group === grp);
    const sorted = sortGroupTeams(teams, groupMatchesForGrp, results);
    gruposClassificacao[grp] = sorted;
    if (sorted[2]) terceirosColocados.push(sorted[2]);
  }

  return { gruposClassificacao, terceirosColocados };
}

/**
 * Resolve o nome do time esperado para um lado de um jogo do mata-mata.
 * Retorna null se não for possível resolver (dados insuficientes).
 * Espelho de recalcularTorneioCompleto em src/js/engine.js.
 *
 * @param {object} orig - Descritor de origem (tipo, pos, grp, idx, grps, j)
 * @param {object} gruposClassificacao - Classificação dos grupos calculada
 * @param {Array}  terceirosQualificados - 8 melhores 3ºs colocados já ordenados
 * @param {object} results - Resultados dos jogos já processados
 * @param {Set}    allocated - Nomes de times já alocados a vagas de 3ºs colocados
 * @returns {string|null}
 */
function resolveKnockoutTeam(orig, gruposClassificacao, terceirosQualificados, results, allocated) {
  if (orig.tipo === 'grupo') {
    const sorted = gruposClassificacao[orig.grp];
    if (!sorted) return null;
    return sorted[orig.pos - 1]?.name ?? null;
  }

  if (orig.tipo === 'terceiro') {
    const eligible = terceirosQualificados.filter(t => orig.grps.includes(t.group));
    if (eligible[orig.idx]) return eligible[orig.idx].name;
    // Fallback: pegar o próximo 3º ainda não alocado
    const remaining = terceirosQualificados.find(t => !allocated.has(t.name));
    return remaining?.name ?? null;
  }

  if (orig.tipo === 'venc' || orig.tipo === 'perd') {
    const r = results[String(orig.j)];
    if (!r || r.home == null || r.away == null) return null;
    const ko = KNOCKOUT_BY_ID.get(orig.j);
    if (!ko) return null;
    const homeTeam = resolveKnockoutTeam(ko.origHome, gruposClassificacao, terceirosQualificados, results, allocated);
    const awayTeam = resolveKnockoutTeam(ko.origAway, gruposClassificacao, terceirosQualificados, results, allocated);
    if (!homeTeam || !awayTeam) return null;
    const h = parseInt(r.home, 10);
    const a = parseInt(r.away, 10);
    let homeWins;
    if (!isNaN(h) && !isNaN(a) && h !== a) {
      homeWins = h > a;
    } else if (r.penHome != null && r.penAway != null) {
      homeWins = r.penHome > r.penAway;
    } else {
      return null;
    }
    if (orig.tipo === 'venc') return homeWins ? homeTeam : awayTeam;
    return homeWins ? awayTeam : homeTeam;
  }

  return null;
}

/**
 * Constrói um mapa de busca dos jogos do mata-mata por nomes dos times esperados.
 * Usa os resultados da fase de grupos já processados para resolver os times.
 *
 * Chave: normalizeName("HomePt|AwayPt") → { id, swapped }
 * Apenas inclui jogos onde ambos os times conseguem ser resolvidos.
 *
 * @param {number[]} knockoutIds - IDs dos jogos do mata-mata neste dia
 * @param {object}   results     - Resultados já processados (fase de grupos + mata-mata anteriores)
 * @returns {Map}
 */
function buildKnockoutLookup(knockoutIds, results) {
  const lookup = new Map();
  const allocated = new Set();

  const { gruposClassificacao, terceirosColocados } = computeGroupStandings(results);

  // Determinar grupos já iniciados (para filtrar 3ºs colocados parciais)
  const startedGroups = new Set();
  for (const m of GROUP_MATCHES) {
    const r = results[String(m.id)];
    if (r && r.home != null && r.away != null) {
      startedGroups.add(TEAM_TO_GROUP[m.home]);
    }
  }
  const terceirosQualificados = sortThirdPlacedTeams(
    terceirosColocados.filter(t => t && startedGroups.has(t.group))
  ).slice(0, 8);

  for (const id of knockoutIds) {
    const ko = KNOCKOUT_BY_ID.get(id);
    if (!ko) continue;

    const homeTeam = resolveKnockoutTeam(ko.origHome, gruposClassificacao, terceirosQualificados, results, allocated);
    const awayTeam = resolveKnockoutTeam(ko.origAway, gruposClassificacao, terceirosQualificados, results, allocated);
    if (!homeTeam || !awayTeam) continue;

    // Registrar times de terceiro como alocados para evitar duplicações no fallback
    if (ko.origHome.tipo === 'terceiro') allocated.add(homeTeam);
    if (ko.origAway.tipo === 'terceiro') allocated.add(awayTeam);

    // Inserir as duas orientações para tolerar home/away invertido pela ESPN
    lookup.set(normalizeName(`${homeTeam}|${awayTeam}`), { id, swapped: false });
    lookup.set(normalizeName(`${awayTeam}|${homeTeam}`), { id, swapped: true });
  }

  return lookup;
}

/** Gera todas as datas YYYYMMDD entre start e end (inclusive). */
function dateRange(start, end) {
  const dates = [];
  let cur = new Date(`${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)}T00:00:00Z`);
  const last = new Date(`${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}T00:00:00Z`);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10).replace(/-/g, ''));
    cur = new Date(cur.getTime() + 86_400_000);
  }
  return dates;
}

function yyyymmddToIso(date) {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00Z`;
}

/** Busca o scoreboard da ESPN para uma data específica (YYYYMMDD), com fallback de slugs. */
async function fetchScoreboard(date) {
  for (const slug of ESPN_SLUGS) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${date}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'tabela-copa-2026-bot/1.0' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.warn(`ESPN API retornou ${res.status} para ${date} no slug ${slug}`);
        continue;
      }
      const data = await res.json();
      if (!data?.events?.length) {
        console.warn(`Nenhum evento encontrado para ${date} no slug ${slug}`);
        continue;
      }
      return { data, slug };
    } catch (err) {
      console.warn(`Falha ao buscar ${date} no slug ${slug}:`, err.message);
    }
  }

  return { data: null, slug: null };
}

/**
 * Tenta extrair o placar de pênaltis de um objeto competition da ESPN.
 * Retorna { penHome, penAway } se encontrar, ou null.
 */
function extractPenalties(competition) {
  const homeComp = competition.competitors?.find(c => c.homeAway === 'home');
  const awayComp = competition.competitors?.find(c => c.homeAway === 'away');
  if (!homeComp || !awayComp) return null;

  // Tenta nos linescores: ESPN costuma ter um período "Penalty" com value separado
  const penPeriodKeywords = ['pen', 'penalty', 'penalties'];
  const isPenPeriod = (l) =>
    penPeriodKeywords.some(k =>
      String(l?.period?.displayValue ?? '').toLowerCase().includes(k)
    );

  const homePenLS = homeComp.linescores?.find(isPenPeriod);
  const awayPenLS = awayComp.linescores?.find(isPenPeriod);
  if (homePenLS && awayPenLS) {
    const penHome = parseInt(homePenLS.value, 10);
    const penAway = parseInt(awayPenLS.value, 10);
    if (!isNaN(penHome) && !isNaN(penAway)) return { penHome, penAway };
  }

  // Tenta nas notes — padrão "X wins Y-Z on penalties" (suporta hífen, en-dash e em-dash)
  const noteTexts = (competition.notes ?? []).map(n => n.text ?? n.headline ?? '');
  for (const text of noteTexts) {
    const m = text.match(/(\d+)\s*[-–—]\s*(\d+)\s+on\s+pen/i);
    if (m) {
      const homeWins = homeComp.winner === true;
      const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
      if (homeWins) return { penHome: Math.max(a, b), penAway: Math.min(a, b) };
      return { penHome: Math.min(a, b), penAway: Math.max(a, b) };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const today = todayUtc();

  if (today < TOURNAMENT_START || today > TOURNAMENT_END) {
    console.log(`Fora do período do torneio (${TOURNAMENT_START}–${TOURNAMENT_END}). Nada a fazer.`);
    return;
  }

  // Lê o arquivo atual para comparação posterior
  let previousContent = '';
  try {
    previousContent = readFileSync(RESULTS_PATH, 'utf8');
  } catch {
    previousContent = '{}';
  }

  const results = {};
  let lastSuccessfulSlug = null;
  let lastSuccessfulDate = null;

  // Eventos retornados pela ESPN que não foram associados a nenhum jogo cadastrado
  /** @type {Array<{date: string, homeEn: string, awayEn: string, homePt: string, awayPt: string, statusName: string}>} */
  const unmatchedEvents = [];

  // Mapa de busca para fase de grupos: normalizeName("HomePT|AwayPT") → { id, swapped }
  // Usar chaves normalizadas torna a busca tolerante a variações de acentuação,
  // capitalização e pontuação nos nomes retornados pelo mapeamento EN → PT.
  const groupLookup = new Map(
    GROUP_MATCHES.flatMap(m => [
      [normalizeName(`${m.home}|${m.away}`), { id: m.id, swapped: false }],
      [normalizeName(`${m.away}|${m.home}`), { id: m.id, swapped: true }],
    ])
  );

  const dates = dateRange(TOURNAMENT_START, today);
  console.log(`Buscando resultados para ${dates.length} data(s)...`);

  for (const date of dates) {
    const { data, slug } = await fetchScoreboard(date);
    if (!data?.events?.length) continue;
    lastSuccessfulSlug = slug;
    lastSuccessfulDate = date;

    // IDs de mata-mata esperados nesta data (em ordem de horário)
    const knockoutQueue = [...(KNOCKOUT_BY_DATE[date] ?? [])];
    let knockoutCursor = 0;

    // Lookup por nomes dos times para jogos do mata-mata (mais confiável que cursor cronológico)
    // É construído APÓS a fase de grupos já ter sido processada para as datas anteriores.
    const knockoutLookup = knockoutQueue.length > 0
      ? buildKnockoutLookup(knockoutQueue, results)
      : new Map();

    for (const event of data.events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const homeComp = competition.competitors?.find(c => c.homeAway === 'home');
      const awayComp = competition.competitors?.find(c => c.homeAway === 'away');
      if (!homeComp || !awayComp) continue;

      const status = competition.status?.type;
      const isCompleted = status?.completed === true;
      const isInProgress =
        status?.state === 'in' ||
        String(status?.name ?? '').toLowerCase().includes('progress') ||
        String(status?.name ?? '').toLowerCase().includes('halftime');

      if (!isCompleted && !isInProgress) continue;

      const homeScore = parseInt(homeComp.score, 10);
      const awayScore = parseInt(awayComp.score, 10);
      if (isNaN(homeScore) || isNaN(awayScore)) continue;

      // Converter nomes EN → PT e normalizar para identificar o jogo
      const homeEn = homeComp.team?.displayName ?? '';
      const awayEn = awayComp.team?.displayName ?? '';
      const homePt = toPt(homeEn);
      const awayPt = toPt(awayEn);

      // Tentar localizar na fase de grupos primeiro (busca por chave normalizada)
      const groupMatch = groupLookup.get(normalizeName(`${homePt}|${awayPt}`));

      if (groupMatch !== undefined) {
        const { id: groupId, swapped } = groupMatch;
        // Se ESPN retornou home/away invertido vs matches.js, corrigir o placar
        results[String(groupId)] = swapped
          ? { home: awayScore, away: homeScore }
          : { home: homeScore, away: awayScore };
        const [dHome, dAway, dScH, dScA] = swapped
          ? [awayPt, homePt, awayScore, homeScore]
          : [homePt, awayPt, homeScore, awayScore];
        const suffix = (isCompleted ? '' : ' (em curso)') + (swapped ? ' (home/away invertido)' : '');
        console.log(`  #${groupId} ${dHome} ${dScH}–${dScA} ${dAway}${suffix}`);
      } else {
        // Mata-mata: tentar associar por nome dos times (mais confiável que ordem cronológica)
        const knockoutNameMatch = knockoutLookup.get(normalizeName(`${homePt}|${awayPt}`));
        let knockoutId;
        let swappedKnockout = false;

        if (knockoutNameMatch !== undefined) {
          // Correspondência por times esperados — remover do queue para não reutilizar no fallback
          knockoutId = knockoutNameMatch.id;
          swappedKnockout = knockoutNameMatch.swapped;
          const qi = knockoutQueue.indexOf(knockoutId);
          if (qi !== -1) knockoutQueue.splice(qi, 1);
        } else if (knockoutQueue[knockoutCursor] !== undefined) {
          // Fallback cronológico — pode ser impreciso se ESPN retornar fora de ordem
          knockoutId = knockoutQueue[knockoutCursor++];
          console.warn(
            `  ⚠ Mata-mata #${knockoutId}: associado por ordem cronológica` +
            ` (times não resolvidos para "${homePt}" vs "${awayPt}"). Verificar.`
          );
        } else {
          console.warn(
            `  ⚠ Jogo não identificado: "${homeEn}" vs "${awayEn}" (${date})` +
            `\n    → PT: "${homePt}" vs "${awayPt}"` +
            `\n    → Normalizado: "${normalizeName(homePt)}" vs "${normalizeName(awayPt)}"`
          );
          unmatchedEvents.push({
            date,
            homeEn,
            awayEn,
            homePt,
            awayPt,
            statusName: String(status?.name ?? status?.state ?? ''),
          });
        }

        if (knockoutId !== undefined) {
          // Se ESPN retornou home/away invertido vs matches.js, corrigir o placar
          const result = swappedKnockout
            ? { home: awayScore, away: homeScore }
            : { home: homeScore, away: awayScore };
          const [dHome, dAway, dScH, dScA] = swappedKnockout
            ? [awayPt, homePt, awayScore, homeScore]
            : [homePt, awayPt, homeScore, awayScore];

          if (isCompleted) {
            const statusName = String(status?.name ?? '');
            const wentToPenalties =
              statusName.includes('PEN') ||
              statusName.includes('PENALTY') ||
              statusName.includes('SHOOTOUT');

            if (wentToPenalties) {
              const pen = extractPenalties(competition);
              if (pen) {
                result.penHome = swappedKnockout ? pen.penAway : pen.penHome;
                result.penAway = swappedKnockout ? pen.penHome : pen.penAway;
              }
            }
            const penSuffix = result.penHome !== undefined ? ` (pen ${result.penHome}–${result.penAway})` : '';
            const swapSuffix = swappedKnockout ? ' (home/away invertido)' : '';
            console.log(`  #${knockoutId} ${dHome} ${dScH}–${dScA} ${dAway}${penSuffix}${swapSuffix}`);
          } else {
            const swapSuffix = swappedKnockout ? ' (home/away invertido)' : '';
            console.log(`  #${knockoutId} ${dHome} ${dScH}–${dScA} ${dAway} (em curso)${swapSuffix}`);
          }

          results[String(knockoutId)] = result;
        }
      }
    }
  }

  results._meta = {
    lastFetch: lastSuccessfulDate ? yyyymmddToIso(lastSuccessfulDate) : null,
    source: 'espn',
    slug: lastSuccessfulSlug,
  };

  // ---------------------------------------------------------------------------
  // Verificação de consistência: detectar jogos da fase de grupos e do mata-mata
  // de datas já passadas que não receberam resultado (falha parcial silenciosa).
  // Apenas datas estritamente anteriores a hoje são verificadas, evitando
  // falsos positivos para jogos de hoje ainda não iniciados.
  // ---------------------------------------------------------------------------
  const validationCutoff = lastSuccessfulDate || today;

  const pastGroupGaps = GROUP_MATCHES.filter(
    m => m.date < validationCutoff && results[String(m.id)] === undefined
  );

  const pastKnockoutGaps = KNOCKOUT_MATCHES.filter(
    m => m.date < validationCutoff && results[String(m.id)] === undefined
  );

  if (pastGroupGaps.length > 0 || pastKnockoutGaps.length > 0) {
    if (pastGroupGaps.length > 0) {
      console.error(`\n❌ ${pastGroupGaps.length} jogo(s) da fase de grupos sem resultado (datas já encerradas):`);
      for (const m of pastGroupGaps) {
        console.error(`  #${m.id} ${m.home} × ${m.away} [${m.date}]`);
      }
    }

    if (pastKnockoutGaps.length > 0) {
      console.error(`\n❌ ${pastKnockoutGaps.length} jogo(s) da eliminatória sem resultado (datas já encerradas):`);
      for (const m of pastKnockoutGaps) {
        console.error(`  #${m.id} [${m.date}]`);
      }
    }

    if (unmatchedEvents.length > 0) {
      console.error('\n  Eventos não identificados retornados pela ESPN:');
      for (const e of unmatchedEvents) {
        console.error(
          `    "${e.homeEn}" vs "${e.awayEn}" (${e.date})` +
          ` → PT: "${e.homePt}" vs "${e.awayPt}"` +
          ` [status: ${e.statusName || 'desconhecido'}]`
        );
      }
    } else {
      console.error('\n  Nenhum evento não identificado — jogo pode não ter sido retornado pela ESPN como concluído.');
    }

    console.error('\nVerifique os logs acima e, se necessário, ajuste o mapeamento de nomes em EN_TO_PT.');
    console.error('A publicação foi abortada para não sobrescrever public/results.json com dados incompletos.');
    process.exit(1);
  }

  const resultCount = Object.keys(results).filter(key => key !== '_meta').length;
  const newContent = JSON.stringify(results, null, 2) + '\n';
  if (newContent === previousContent) {
    console.log('Nenhuma alteração nos resultados.');
  } else {
    writeFileSync(RESULTS_PATH, newContent, 'utf8');
    console.log(`✅ public/results.json atualizado com ${resultCount} resultado(s).`);
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
