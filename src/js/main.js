import {
    recalcularTorneioCompleto,
    setScoreInput,
    setPenaltiesInput,
    addUpdateListener
} from './engine.js';
import { loadOfficialResults, getOfficialResultsStatus } from './officialResults.js';
import {
    renderTablesGrid,
    renderGroupStage,
    renderKnockoutStage,
    renderSidePanel,
    renderCalendarView,
    setCalendarFilter,
    switchTab,
    showToast,
    initToggles
} from './ui.js';
import { translations } from './translate.js';

function formatStatusDate(rawTimestamp) {
    if (!rawTimestamp) return '';

    const date = new Date(rawTimestamp);
    if (Number.isNaN(date.getTime())) return '';

    const datePart = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const timePart = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} às ${timePart}`;
}

function updateOfficialStatusLabel() {
    const footerUpdate = document.getElementById('last-update');
    const status = getOfficialResultsStatus();
    const formattedDate = formatStatusDate(status.lastFetch);
    const hasOfficialData = status.entryCount > 0;

    if (!footerUpdate) return;

    if (formattedDate) {
        const mode = status.hasError && hasOfficialData ? 'cache' : 'atualizado';
        footerUpdate.textContent = `Resultados ESPN ${mode} · ${formattedDate}`;
    } else if (status.hasError) {
        footerUpdate.textContent = 'Resultados oficiais indisponíveis.';
    } else {
        footerUpdate.textContent = 'Aguardando primeira atualização oficial.';
    }
}

function refreshVisibleViews() {
    renderTablesGrid();
    renderGroupStage();
    renderSidePanel();

    const sectionMataMata = document.getElementById('section-mata-mata');
    if (sectionMataMata && !sectionMataMata.classList.contains('hidden')) {
        renderKnockoutStage();
    }

    const sectionHoje = document.getElementById('section-hoje');
    if (sectionHoje && !sectionHoje.classList.contains('hidden')) {
        renderCalendarView();
    }
}

window.setScoreInput = (id, side, val) => {
    setScoreInput(id, side, val);
};

window.setPenaltiesInput = (id, side, val) => {
    setPenaltiesInput(id, side, val);
};

document.addEventListener('DOMContentLoaded', async () => {
    initToggles();

    await loadOfficialResults();
    updateOfficialStatusLabel();

    recalcularTorneioCompleto();
    renderTablesGrid();
    renderGroupStage();
    renderSidePanel();
    switchTab('grupos');

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.remove();

    addUpdateListener(() => {
        refreshVisibleViews();
    });

    document.querySelectorAll('[data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            if (tab) switchTab(tab);
        });
    });

    document.querySelectorAll('#hoje-filters .arena-chip-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            setCalendarFilter(btn.getAttribute('data-filter') || 'today');
        });
    });

    const btnResetPredictions = document.getElementById('btn-reset-predictions');
    if (btnResetPredictions) {
        btnResetPredictions.addEventListener('click', () => {
            const t = translations.pt;
            if (!confirm(t.resetConfirm)) return;

            const predictionKeys = Object.keys(localStorage).filter((key) =>
                key.startsWith('wc2026_score_') || key.startsWith('wc2026_pen_')
            );
            predictionKeys.forEach((key) => {
                localStorage.removeItem(key);
            });

            recalcularTorneioCompleto();
            refreshVisibleViews();
            showToast(t.resetDone);
        });
    }

    const filterGrupo = document.getElementById('filter-grupo');
    const btnPrevGroup = document.getElementById('btn-prev-group');
    const btnNextGroup = document.getElementById('btn-next-group');
    if (filterGrupo) {
        filterGrupo.addEventListener('change', () => {
            renderTablesGrid();
            renderGroupStage();
        });

        const gruposEmOrdem = ['Todos', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        const navegarGrupo = (direcao) => {
            const atual = filterGrupo.value;
            const idxAtual = gruposEmOrdem.indexOf(atual);
            const idxBase = idxAtual === -1 ? 0 : idxAtual;
            const proximoIdx = (idxBase + direcao + gruposEmOrdem.length) % gruposEmOrdem.length;
            filterGrupo.value = gruposEmOrdem[proximoIdx];
            renderTablesGrid();
            renderGroupStage();
        };

        if (btnPrevGroup) btnPrevGroup.addEventListener('click', () => navegarGrupo(-1));
        if (btnNextGroup) btnNextGroup.addEventListener('click', () => navegarGrupo(1));
    }

    const btnPix = document.getElementById('btn-pix');
    if (btnPix) {
        btnPix.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText('sicwnb@outlook.com');
            showToast(translations.pt.pixCopied);
        });
    }

    const btnScrollTop = document.getElementById('btn-scroll-top');
    if (btnScrollTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) btnScrollTop.classList.add('visible');
            else btnScrollTop.classList.remove('visible');
        }, { passive: true });

        btnScrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
