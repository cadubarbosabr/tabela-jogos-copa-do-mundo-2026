import { jogosGrupos, estruturaNosMataMata } from './matches.js';

const RESULTS_CACHE_KEY = 'wc2026_results_cache';
const RESULTS_STATUS_KEY = 'wc2026_results_status';
const baseUrl = import.meta.env.BASE_URL || '/';

const validMatchIds = new Set([
    ...jogosGrupos.map((match) => String(match.id)),
    ...estruturaNosMataMata.flatMap((fase) => fase.jogos.map((match) => String(match.id)))
]);

let officialResults = {};
let officialResultsStatus = {
    source: 'espn',
    slug: '',
    lastFetch: '',
    entryCount: 0,
    droppedEntries: 0,
    usingFallback: false,
    hasError: false
};

function getResultsUrl() {
    return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}results.json?t=${Date.now()}`;
}

function normalizeInteger(value) {
    if (value === undefined || value === null || value === '') return null;

    const parsedValue = Number.parseInt(value, 10);
    if (Number.isNaN(parsedValue) || parsedValue < 0) return null;

    return parsedValue;
}

function normalizeScoreValue(value) {
    const normalizedValue = normalizeInteger(value);
    return normalizedValue === null ? '' : String(normalizedValue);
}

function hasOfficialScore(result) {
    return !!result && normalizeScoreValue(result.home) !== '' && normalizeScoreValue(result.away) !== '';
}

function normalizeMeta(meta, resultsCount, droppedEntries) {
    const normalizedLastFetch = typeof meta?.lastFetch === 'string' && !Number.isNaN(new Date(meta.lastFetch).getTime())
        ? meta.lastFetch
        : '';

    return {
        source: typeof meta?.source === 'string' && meta.source.trim() ? meta.source.trim().toLowerCase() : 'espn',
        slug: typeof meta?.slug === 'string' ? meta.slug : '',
        lastFetch: normalizedLastFetch,
        entryCount: resultsCount,
        droppedEntries
    };
}

function normalizeResultEntry(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

    const home = normalizeInteger(entry.home);
    const away = normalizeInteger(entry.away);
    if (home === null || away === null) return null;

    const normalizedEntry = { home, away };

    const penHome = normalizeInteger(entry.penHome);
    const penAway = normalizeInteger(entry.penAway);
    if (home === away && penHome !== null && penAway !== null && penHome !== penAway) {
        normalizedEntry.penHome = penHome;
        normalizedEntry.penAway = penAway;
    }

    return normalizedEntry;
}

function parseResultsPayload(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {
            results: {},
            meta: normalizeMeta(null, 0, 0),
            isUsable: false
        };
    }

    const results = {};
    let droppedEntries = 0;

    Object.entries(data).forEach(([matchId, entry]) => {
        if (matchId === '_meta') return;

        if (!validMatchIds.has(matchId)) {
            droppedEntries += 1;
            return;
        }

        const normalizedEntry = normalizeResultEntry(entry);
        if (!normalizedEntry) {
            droppedEntries += 1;
            return;
        }

        results[matchId] = normalizedEntry;
    });

    return {
        results,
        meta: normalizeMeta(data._meta, Object.keys(results).length, droppedEntries),
        isUsable: Object.keys(results).length > 0 || Boolean(data._meta)
    };
}

function persistSnapshot(results, status) {
    localStorage.setItem(RESULTS_CACHE_KEY, JSON.stringify(results));
    localStorage.setItem(RESULTS_STATUS_KEY, JSON.stringify(status));
}

function readSnapshot() {
    try {
        const cachedResults = JSON.parse(localStorage.getItem(RESULTS_CACHE_KEY) || '{}');
        const cachedStatus = JSON.parse(localStorage.getItem(RESULTS_STATUS_KEY) || '{}');
        const parsed = parseResultsPayload({ ...cachedResults, _meta: cachedStatus });

        if (!parsed.isUsable) return null;

        return {
            results: parsed.results,
            status: {
                ...parsed.meta,
                usingFallback: true,
                hasError: false
            }
        };
    } catch (error) {
        console.warn('Falha ao restaurar snapshot local de resultados oficiais.', error);
        return null;
    }
}

export async function loadOfficialResults() {
    const cachedSnapshot = readSnapshot();

    try {
        const response = await fetch(getResultsUrl(), { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`Resposta inválida da ESPN: ${response.status}`);
        }

        const data = await response.json();
        const parsedPayload = parseResultsPayload(data);

        if (!parsedPayload.isUsable) {
            throw new Error('Payload de resultados oficiais inválido.');
        }

        officialResults = parsedPayload.results;
        officialResultsStatus = {
            ...parsedPayload.meta,
            usingFallback: false,
            hasError: false
        };

        persistSnapshot(officialResults, officialResultsStatus);
    } catch (error) {
        console.warn('Falha ao carregar resultados oficiais da ESPN.', error);

        if (cachedSnapshot) {
            officialResults = cachedSnapshot.results;
            officialResultsStatus = {
                ...cachedSnapshot.status,
                hasError: true,
                usingFallback: true
            };
        } else {
            officialResults = {};
            officialResultsStatus = {
                source: 'espn',
                slug: '',
                lastFetch: '',
                entryCount: 0,
                droppedEntries: 0,
                usingFallback: true,
                hasError: true
            };
        }
    }

    return officialResults;
}

export function getOfficialResultsStatus() {
    return officialResultsStatus;
}

export function getOfficialResult(id) {
    return officialResults[String(id)] || null;
}

export function hasOfficialResult(id) {
    return hasOfficialScore(getOfficialResult(id));
}

export function getOfficialScoreInput(id, side) {
    const result = getOfficialResult(id);
    if (!hasOfficialScore(result)) return '';

    return normalizeScoreValue(result[side]);
}

export function getOfficialPenaltiesInput(id, side) {
    const result = getOfficialResult(id);
    if (!hasOfficialScore(result)) return '';

    const penaltyKey = side === 'home' ? 'penHome' : 'penAway';
    return normalizeScoreValue(result[penaltyKey]);
}
