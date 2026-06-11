// Resultados oficiais vivem em arquivo versionado; palpites locais continuam no localStorage.
let officialResults = {};
const baseUrl = import.meta.env.BASE_URL || '/';
const RESULTS_URL = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}results.json`;

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
        const response = await fetch(RESULTS_URL);

        if (!response.ok) {
            officialResults = {};
            return officialResults;
        }

        const data = await response.json();
        officialResults = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
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
