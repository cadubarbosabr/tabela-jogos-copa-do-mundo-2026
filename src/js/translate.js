export const translations = {
    pt: {
        title: "COPA DO MUNDO FIFA 2026",
        subtitle: "Digite os placares: as tabelas e o chaveamento são calculados automaticamente",
        loadingTable: "Carregando tabela...",
        tabGroups: "Fase de Grupos",
        tabKnockout: "Eliminatórias",
        tabStats: "Estatísticas",
        filterLabel: "Visualizar Grupo:",
        filterAll: "Todos os Grupos (A ao L)",
        groupInfo: "ℹ️ Os 2 melhores de cada grupo + os 8 melhores 3º colocados avançam dinamicamente.",
        tablePos: "Pos",
        tableTeam: "Seleção",
        tablePts: "P",
        tablePl: "J",
        tableGd: "SG",
        tableGf: "GP",
        groupTitle: "Grupo",
        liveClass: "Classificação Live",
        fixturesTitle: "Jogos e Calendário da Fase de Grupos",
        fixturesCount: "72 PARTIDAS",
        tableMatch: "Jogo",
        tableDateTime: "Data / Hora (BRT)",
        tableGroup: "Grupo",
        tableVs: "Confronto & Placar",
        tableStadium: "Estádio / Sede",
        championTitle: "🏆 Campeão do Mundo 🏆",
        championSubtitle: "VENCEDOR DA COPA DO MUNDO FIFA 2026",
        confrontation: "CONFRONTO",
        penalties: "Pênaltis:",
        tbd: "A definir",
        winnerOf: "Vencedor #",
        loserOf: "Perdedor #",
        thirdPlaceTitle: "Disputa do 3º Lugar",
        finalTitle: "Final",
        contribPix: "Contribuir via PIX",
        pixCopied: "Chave PIX copiada! Finalize no app do seu banco. Obrigado pelo apoio! 🏆",
        resetPredictions: "🗑️ Resetar Palpites",
        resetConfirm: "Tem certeza que deseja resetar todos os palpites salvos?",
        resetDone: "Palpites resetados com sucesso.",
        round32: "Dezesseis-avos de Final (Rodada de 32)",
        round16: "Oitavas de Final",
        quarterFinals: "Quartas de Final",
        semiFinals: "Semifinais",
        thirdPlace: "Disputa do 3º Lugar",
        final: "Final",
        knockoutViewLabel: "Modo de visualização das eliminatórias",
        knockoutBracketMode: "Bracket",
        knockoutListMode: "Lista",
        knockoutUpperBracket: "Chave Superior",
        knockoutLowerBracket: "Chave Inferior",
        statsQualified: "Seleções Classificadas",
        statsEliminated: "Seleções Eliminadas",
        statsQualifiedFrom: "Classificado como",
        statsEliminatedIn: "Eliminado na",
        statsGroupStage: "Fase de Grupos",
        statsRound32: "32-avos",
        statsRound16: "Oitavas",
        statsQuarters: "Quartas",
        statsSemis: "Semifinal",
        statsNoData: "Preencha os placares para ver as estatísticas.",
        bracketR32: "R32",
        bracketR16: "R16",
        bracketQF: "QF",
        bracketSF: "SF"
    },
    en: {
        title: "FIFA WORLD CUP 2026",
        subtitle: "Enter the scores: standings and brackets are calculated automatically",
        loadingTable: "Loading table...",
        tabGroups: "Standings",
        tabKnockout: "Knockout Bracket",
        tabStats: "Statistics",
        filterLabel: "View Group:",
        filterAll: "All Groups (A to L)",
        groupInfo: "ℹ️ The top 2 of each group + the 8 best 3rd placed teams advance dynamically.",
        tablePos: "Pos",
        tableTeam: "Team",
        tablePts: "PTS",
        tablePl: "PL",
        tableGd: "GD",
        tableGf: "GF",
        groupTitle: "Group",
        liveClass: "Live Standings",
        fixturesTitle: "Group Stage Fixtures & Schedule",
        fixturesCount: "72 MATCHES",
        tableMatch: "Match",
        tableDateTime: "Date / Time (EST)",
        tableGroup: "Group",
        tableVs: "Fixture & Score",
        tableStadium: "Stadium / Host City",
        championTitle: "🏆 World Champion 🏆",
        championSubtitle: "WINNER OF THE FIFA WORLD CUP 2026",
        confrontation: "MATCH",
        penalties: "Penalties:",
        tbd: "TBD",
        winnerOf: "Winner #",
        loserOf: "Loser #",
        thirdPlaceTitle: "Third Place Play-off",
        finalTitle: "Final",
        round32: "Round of 32",
        round16: "Round of 16",
        quarterFinals: "Quarter-finals",
        semiFinals: "Semi-finals",
        thirdPlace: "Third Place Play-off",
        final: "Final",
        knockoutViewLabel: "Knockout view mode",
        knockoutBracketMode: "Bracket",
        knockoutListMode: "List",
        knockoutUpperBracket: "Upper Bracket",
        knockoutLowerBracket: "Lower Bracket",
        contribPix: "Support via PIX",
        pixCopied: "PIX Key copied! Finish in your bank app. Thanks for the support! 🏆",
        resetPredictions: "🗑️ Reset Predictions",
        resetConfirm: "Are you sure you want to reset all saved predictions?",
        resetDone: "Predictions reset successfully.",
        statsQualified: "Qualified Teams",
        statsEliminated: "Eliminated Teams",
        statsQualifiedFrom: "Qualified as",
        statsEliminatedIn: "Eliminated in",
        statsGroupStage: "Group Stage",
        statsRound32: "Round of 32",
        statsRound16: "Round of 16",
        statsQuarters: "Quarter-finals",
        statsSemis: "Semi-finals",
        statsNoData: "Fill in scores to view statistics.",
        bracketR32: "R32",
        bracketR16: "R16",
        bracketQF: "QF",
        bracketSF: "SF"
    }
};

export const translateTeam = (name, lang) => {
    if (lang === 'pt') return name;
    const teamMap = {
        "México": "Mexico", "África do Sul": "South Africa", "Coreia do Sul": "South Korea", "República Tcheca": "Czech Republic",
        "Canadá": "Canada", "Bósnia e Herzegovina": "Bosnia and Herzegovina", "Catar": "Qatar", "Suíça": "Switzerland",
        "Brasil": "Brazil", "Marrocos": "Morocco", "Haiti": "Haiti", "Escócia": "Scotland", "Estados Unidos": "United States",
        "Paraguai": "Paraguay", "Austrália": "Australia", "Turquia": "Turkey", "Alemanha": "Germany", "Curaçao": "Curaçao",
        "Holanda": "Netherlands", "Japão": "Japan", "Costa do Marfim": "Ivory Coast", "Equador": "Ecuador", "Suécia": "Sweden",
        "Tunísia": "Tunisia", "Espanha": "Spain", "Cabo Verde": "Cape Verde", "Bélgica": "Belgium", "Egito": "Egypt",
        "Arábia Saudita": "Saudi Arabia", "Uruguai": "Uruguay", "Irã": "Iran", "Nova Zelândia": "New Zealand", "França": "France",
        "Senegal": "Senegal", "Iraque": "Iraq", "Noruega": "Norway", "Argentina": "Argentina", "Argélia": "Algeria",
        "Áustria": "Austria", "Jordânia": "Jordan", "Portugal": "Portugal", "RD Congo": "DR Congo", "Inglaterra": "England",
        "Croácia": "Croatia", "Gana": "Ghana", "Panamá": "Panama", "Uzbequistão": "Uzbekistan", "Colômbia": "Colombia"
    };
    return teamMap[name] || name;
};

export const translatePlaceholder = (text, lang) => {
    if (lang === 'pt') return text;
    if (text.includes('º Grupo ')) {
        const parts = text.split('º Grupo ');
        const num = parts[0];
        const grp = parts[1];
        const suffix = num === '1' ? 'st' : num === '2' ? 'nd' : num === '3' ? 'rd' : 'th';
        return `${num}${suffix} Place Group ${grp}`;
    }
    if (text.includes('Vencedor #')) {
        return text.replace('Vencedor #', 'Winner #');
    }
    if (text.includes('Perdedor #')) {
        return text.replace('Perdedor #', 'Loser #');
    }
    if (text === 'A definir') return 'TBD';
    return text;
};
