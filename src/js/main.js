import { 
    recalcularTorneioCompleto, 
    setScoreInput, 
    setPenaltiesInput,
    addUpdateListener 
} from './engine.js';
import { loadOfficialResults } from './officialResults.js';
import { 
    renderTablesGrid, 
    renderGroupStage, 
    renderKnockoutStage,
    renderStatistics,
    switchTab,
    showToast,
    initToggles,
    currentLang
} from './ui.js';
import { translations } from './translate.js';

function updateLastUpdateLabel() {
    const lastUpdateEl = document.getElementById('last-update');
    if (!lastUpdateEl) return;

    const rawTimestamp = localStorage.getItem('wc2026_lastUpdate');
    if (!rawTimestamp) {
        lastUpdateEl.textContent = '';
        return;
    }

    const date = new Date(rawTimestamp);
    if (Number.isNaN(date.getTime())) {
        lastUpdateEl.textContent = '';
        return;
    }

    const locale = currentLang === 'pt' ? 'pt-BR' : 'en-US';
    const datePart = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    const timePart = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    lastUpdateEl.textContent = currentLang === 'pt'
        ? `Atualizado: ${datePart} às ${timePart}`
        : `Updated: ${datePart} at ${timePart}`;
}

// Bind para as chamadas inline oninput presentes nas strings de templates HTML dinâmicos
window.setScoreInput = (id, side, val) => {
    setScoreInput(id, side, val);
};

window.setPenaltiesInput = (id, side, val) => {
    setPenaltiesInput(id, side, val);
};

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Inicializa os alternadores de Idioma e Tema
    initToggles();

    // 1. Carrega resultados oficiais versionados; se falhar, segue só com o LocalStorage.
    await loadOfficialResults();
    updateLastUpdateLabel();

    // 2. Roda a engine de cálculo lendo resultados oficiais e o LocalStorage do navegador
    recalcularTorneioCompleto();

    // 3. Renderização Inicial do DOM
    renderTablesGrid();
    renderGroupStage();
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.remove();

    // 4. Escuta atualizações da Engine de Dados e redesenha as tabelas em tempo real
    addUpdateListener(() => {
        renderTablesGrid();
        
        // Redesenha o mata-mata para manter a consistência se ele estiver visível
        const sectionMataMata = document.getElementById('section-mata-mata');
        if (sectionMataMata && !sectionMataMata.classList.contains('hidden')) {
            renderKnockoutStage();
        }

        const sectionEstatisticas = document.getElementById('section-estatisticas');
        if (sectionEstatisticas && !sectionEstatisticas.classList.contains('hidden')) {
            renderStatistics();
        }
    });

    // 5. Associar cliques nos botões de controle de Abas
    const btnGrupos = document.getElementById('btn-grupos');
    const btnMataMata = document.getElementById('btn-mata-mata');
    const btnEstatisticas = document.getElementById('btn-estatisticas');
    const btnGruposMobile = document.getElementById('btn-grupos-mobile');
    const btnMataMataMobile = document.getElementById('btn-mata-mata-mobile');
    const btnEstatisticasMobile = document.getElementById('btn-estatisticas-mobile');
    const btnLang = document.getElementById('btn-lang');
    const btnResetPredictions = document.getElementById('btn-reset-predictions');
    
    if (btnGrupos) {
        btnGrupos.addEventListener('click', () => switchTab('grupos'));
    }
    
    if (btnMataMata) {
        btnMataMata.addEventListener('click', () => switchTab('mata-mata'));
    }

    if (btnEstatisticas) {
        btnEstatisticas.addEventListener('click', () => switchTab('estatisticas'));
    }

    if (btnGruposMobile) {
        btnGruposMobile.addEventListener('click', () => switchTab('grupos'));
    }

    if (btnMataMataMobile) {
        btnMataMataMobile.addEventListener('click', () => switchTab('mata-mata'));
    }

    if (btnEstatisticasMobile) {
        btnEstatisticasMobile.addEventListener('click', () => switchTab('estatisticas'));
    }

    if (btnLang) {
        btnLang.addEventListener('click', () => {
            updateLastUpdateLabel();
        });
    }

    if (btnResetPredictions) {
        btnResetPredictions.addEventListener('click', () => {
            const t = translations[currentLang];
            if (!confirm(t.resetConfirm)) return;

            const predictionKeys = Object.keys(localStorage).filter((key) =>
                key.startsWith('wc2026_score_') || key.startsWith('wc2026_pen_')
            );
            predictionKeys.forEach((key) => {
                localStorage.removeItem(key);
            });

            recalcularTorneioCompleto();
            renderTablesGrid();
            renderGroupStage();

            const sectionMataMata = document.getElementById('section-mata-mata');
            if (sectionMataMata && !sectionMataMata.classList.contains('hidden')) {
                renderKnockoutStage();
            }

            const sectionEstatisticas = document.getElementById('section-estatisticas');
            if (sectionEstatisticas && !sectionEstatisticas.classList.contains('hidden')) {
                renderStatistics();
            }

            showToast(t.resetDone);
        });
    }

    // 6. Associar evento de mudança no Filtro de Grupos
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

        if (btnPrevGroup) {
            btnPrevGroup.addEventListener('click', () => navegarGrupo(-1));
        }

        if (btnNextGroup) {
            btnNextGroup.addEventListener('click', () => navegarGrupo(1));
        }
    }

    // 7. Associar evento de clique ao botão inteligente de doações via PIX
    const btnPix = document.getElementById('btn-pix');
    if (btnPix) {
        btnPix.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText('sicwnb@outlook.com');
            showToast(translations[currentLang].pixCopied);
        });
    }

    // 8. Botão Scroll to Top
    const btnScrollTop = document.getElementById('btn-scroll-top');
    if (btnScrollTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btnScrollTop.classList.add('visible');
            } else {
                btnScrollTop.classList.remove('visible');
            }
        }, { passive: true });

        btnScrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
