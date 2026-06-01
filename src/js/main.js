import { 
    recalcularTorneioCompleto, 
    setScoreInput, 
    setPenaltiesInput,
    addUpdateListener 
} from './engine.js';
import { 
    renderTablesGrid, 
    renderGroupStage, 
    renderKnockoutStage,
    switchTab,
    showToast,
    initToggles,
    currentLang
} from './ui.js';
import { translations } from './translate.js';

// Bind para as chamadas inline oninput presentes nas strings de templates HTML dinâmicos
window.setScoreInput = (id, side, val) => {
    setScoreInput(id, side, val);
};

window.setPenaltiesInput = (id, side, val) => {
    setPenaltiesInput(id, side, val);
};

document.addEventListener('DOMContentLoaded', () => {
    // 0. Inicializa os alternadores de Idioma e Tema
    initToggles();

    // 1. Roda a engine de cálculo lendo o LocalStorage do navegador
    recalcularTorneioCompleto();

    // 2. Renderização Inicial do DOM
    renderTablesGrid();
    renderGroupStage();

    // 3. Escuta atualizações da Engine de Dados e redesenha as tabelas em tempo real
    addUpdateListener(() => {
        renderTablesGrid();
        
        // Redesenha o mata-mata para manter a consistência se ele estiver visível
        const sectionMataMata = document.getElementById('section-mata-mata');
        if (sectionMataMata && !sectionMataMata.classList.contains('hidden')) {
            renderKnockoutStage();
        }
    });

    // 4. Associar cliques nos botões de controle de Abas
    const btnGrupos = document.getElementById('btn-grupos');
    const btnMataMata = document.getElementById('btn-mata-mata');
    
    if (btnGrupos) {
        btnGrupos.addEventListener('click', () => switchTab('grupos'));
    }
    
    if (btnMataMata) {
        btnMataMata.addEventListener('click', () => switchTab('mata-mata'));
    }

    // 5. Associar evento de mudança no Filtro de Grupos
    const filterGrupo = document.getElementById('filter-grupo');
    if (filterGrupo) {
        filterGrupo.addEventListener('change', () => {
            renderTablesGrid();
            renderGroupStage();
        });
    }

    // 6. Associar evento de clique ao botão inteligente de doações via PIX
    const btnPix = document.getElementById('btn-pix');
    if (btnPix) {
        btnPix.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText('sicwnb@outlook.com');
            showToast(translations[currentLang].pixCopied);
        });
    }
});
