export const countryCodes = {
    // Portuguese Mappings
    "México": "mx", "África do Sul": "za", "Coreia do Sul": "kr", "República Tcheca": "cz",
    "Canadá": "ca", "Bósnia e Herzegovina": "ba", "Catar": "qa", "Suíça": "ch", "Brasil": "br", "Marrocos": "ma", "Haiti": "ht",
    "Escócia": "gb-sct", "Austrália": "au", "Turquia": "tr", "Alemanha": "de", "Curaçao": "cw", "Holanda": "nl", "Japão": "jp", "Costa do Marfim": "ci",
    "Equador": "ec", "Suécia": "se", "Tunísia": "tn", "Espanha": "es", "Cabo Verde": "cv", "Bélgica": "be", "Egito": "eg", "Arábia Saudita": "sa", "Uruguai": "uy",
    "Irã": "ir", "Nova Zelândia": "nz", "França": "fr", "Senegal": "sn", "Iraque": "iq", "Noruega": "no", "Argentina": "ar", "Argélia": "dz", "Áustria": "at", "Jordânia": "jo",
    "Portugal": "pt", "RD Congo": "cd", "Inglaterra": "gb-eng", "Croácia": "hr", "Gana": "gh", "Panamá": "pa", "Uzbequistão": "uz", "Colômbia": "co",
    "Estados Unidos": "us", "Paraguai": "py",

    // English Mappings
    "Mexico": "mx", "South Africa": "za", "South Korea": "kr", "Czech Republic": "cz",
    "Canada": "ca", "Bosnia and Herzegovina": "ba", "Qatar": "qa", "Switzerland": "ch", "Brazil": "br", "Morocco": "ma", "Haiti": "ht",
    "Scotland": "gb-sct", "Australia": "au", "Turkey": "tr", "Germany": "de", "Curaçao": "cw", "Netherlands": "nl", "Japan": "jp", "Ivory Coast": "ci",
    "Ecuador": "ec", "Sweden": "se", "Tunisia": "tn", "Spain": "es", "Cape Verde": "cv", "Belgium": "be", "Egypt": "eg", "Saudi Arabia": "sa", "Uruguay": "uy",
    "Iran": "ir", "New Zealand": "nz", "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no", "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
    "Portugal": "pt", "DR Congo": "cd", "England": "gb-eng", "Croatia": "hr", "Ghana": "gh", "Panama": "pa", "Uzbekistan": "uz", "Colombia": "co",
    "United States": "us", "Paraguay": "py"
};

export function getFlagTag(country) {
    const code = countryCodes[country];
    if (code) return `<img src="https://flagcdn.com/w40/${code}.png" alt="${country}" loading="lazy" class="w-6 h-4 object-cover rounded shadow-sm border border-slate-200 inline-block flex-shrink-0">`;
    return `<span class="w-6 h-4 bg-slate-200 border border-slate-300 rounded text-[9px] font-bold text-slate-500 inline-flex items-center justify-center flex-shrink-0">FIFA</span>`;
}

export const equipesIniciais = [
    { name: "México", group: "A" }, { name: "África do Sul", group: "A" }, { name: "Coreia do Sul", group: "A" }, { name: "República Tcheca", group: "A" },
    { name: "Canadá", group: "B" }, { name: "Bósnia e Herzegovina", group: "B" }, { name: "Catar", group: "B" }, { name: "Suíça", group: "B" },
    { name: "Brasil", group: "C" }, { name: "Marrocos", group: "C" }, { name: "Haiti", group: "C" }, { name: "Escócia", group: "C" },
    { name: "Estados Unidos", group: "D" }, { name: "Paraguai", group: "D" }, { name: "Austrália", group: "D" }, { name: "Turquia", group: "D" },
    { name: "Alemanha", group: "E" }, { name: "Curaçao", group: "E" }, { name: "Costa do Marfim", group: "E" }, { name: "Equador", group: "E" },
    { name: "Holanda", group: "F" }, { name: "Japão", group: "F" }, { name: "Suécia", group: "F" }, { name: "Tunísia", group: "F" },
    { name: "Bélgica", group: "G" }, { name: "Egito", group: "G" }, { name: "Irã", group: "G" }, { name: "Nova Zelândia", group: "G" },
    { name: "Espanha", group: "H" }, { name: "Cabo Verde", group: "H" }, { name: "Arábia Saudita", group: "H" }, { name: "Uruguai", group: "H" },
    { name: "França", group: "I" }, { name: "Senegal", group: "I" }, { name: "Iraque", group: "I" }, { name: "Noruega", group: "I" },
    { name: "Argentina", group: "J" }, { name: "Argélia", group: "J" }, { name: "Áustria", group: "J" }, { name: "Jordânia", group: "J" },
    { name: "Portugal", group: "K" }, { name: "RD Congo", group: "K" }, { name: "Uzbequistão", group: "K" }, { name: "Colômbia", group: "K" },
    { name: "Inglaterra", group: "L" }, { name: "Croácia", group: "L" }, { name: "Gana", group: "L" }, { name: "Panamá", group: "L" }
];
