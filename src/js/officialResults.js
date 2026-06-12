// Resultados oficiais vivem em arquivo versionado; palpites locais continuam no localStorage.
let officialResults = {};
const baseUrl = import.meta.env.BASE_URL || '/';

function getResultsUrl() {
    return `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}results.json?t=${Date.now()}`;
}

function normalizeScoreValue(value) {
    if (value === undefined || value === null || value === '') return '';

    const parsedValue = parseInt(value, 10);
    return Number.isNaN(parsedValue) ? '' : String(parsedValue);
}

function hasOfficialScore(result) {
    return !!result && normalizeScoreValue(result.home) !== '' && normalizeScoreValue(result.away) !== '';
}

export async function loadOfficialResults() {
    try {
        const response = await fetch(getResultsUrl());

        if (!response.ok) {
            officialResults = {};
            return officialResults;
        }

        const data = await response.json();
        officialResults = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
        delete officialResults._meta;
        localStorage.setItem('wc2026_lastUpdate', new Date().toISOString());
    } catch (error) {
        console.warn('Falha ao carregar resultados oficiais.', error);
        officialResults = {};
    }

    return officialResults;
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
