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
      } else if (knockoutQueue[knockoutCursor] !== undefined) {
        // Mata-mata: associar positivamente pelo índice cronológico do dia
        const knockoutId = knockoutQueue[knockoutCursor++];
        const result = { home: homeScore, away: awayScore };

        if (isCompleted) {
          const statusName = String(status?.name ?? '');
          const wentToPenalties =
            statusName.includes('PEN') ||
            statusName.includes('PENALTY') ||
            statusName.includes('SHOOTOUT');

          if (wentToPenalties) {
            const pen = extractPenalties(competition);
            if (pen) {
              result.penHome = pen.penHome;
              result.penAway = pen.penAway;
            }
          }
          const penSuffix = result.penHome !== undefined ? ` (pen ${result.penHome}–${result.penAway})` : '';
          console.log(`  #${knockoutId} ${homePt} ${homeScore}–${awayScore} ${awayPt}${penSuffix}`);
        } else {
          console.log(`  #${knockoutId} ${homePt} ${homeScore}–${awayScore} ${awayPt} (em curso)`);
        }

        results[String(knockoutId)] = result;
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
    }
  }

  const resultKeys = Object.keys(results);
  const resultCount = resultKeys.length;
  results._meta = {
    lastFetch: lastSuccessfulDate ? yyyymmddToIso(lastSuccessfulDate) : null,
    source: 'espn',
    slug: lastSuccessfulSlug,
  };

  const newContent = JSON.stringify(results, null, 2) + '\n';
  if (newContent === previousContent) {
    console.log('Nenhuma alteração nos resultados.');
  } else {
    writeFileSync(RESULTS_PATH, newContent, 'utf8');
    console.log(`✅ public/results.json atualizado com ${resultCount} resultado(s).`);
  }

  // ---------------------------------------------------------------------------
  // Verificação de consistência: detectar jogos da fase de grupos de datas já
  // passadas que não receberam resultado (falha parcial silenciosa).
  // Apenas datas estritamente anteriores a hoje são verificadas, evitando
  // falsos positivos para jogos de hoje ainda não iniciados.
  // ---------------------------------------------------------------------------
  const pastGroupGapsIds = GROUP_MATCHES
    .filter(m => m.date < today && results[String(m.id)] === undefined)
    .map(m => m.id);

  if (pastGroupGapsIds.length > 0) {
    const missing = GROUP_MATCHES.filter(m => pastGroupGapsIds.includes(m.id));
    console.error(`\n❌ ${missing.length} jogo(s) da fase de grupos sem resultado (datas já encerradas):`);
    for (const m of missing) {
      console.error(`  #${m.id} ${m.home} × ${m.away} [${m.date}]`);
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
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
