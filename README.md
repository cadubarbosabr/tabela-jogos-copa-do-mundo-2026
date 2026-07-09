# Tabela Copa do Mundo FIFA 2026

Tabela interativa com classificação, chaveamento e jogos do dia.

**Demo:** [tabela-jogos-copa-do-mundo-2026.vercel.app](https://tabela-jogos-copa-do-mundo-2026.vercel.app/)

## Funcionalidades

- Fase de grupos com classificação dinâmica (top 2 + 8 melhores 3ºs)
- Mata-mata com seletor de fases e chaveamento automático
- Aba **Hoje** com jogos do dia (fuso BRT)
- Resultados oficiais via ESPN (atualização automática a cada 15 min)
- Palpites locais editáveis (placares oficiais ficam travados)

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Resultados

```
ESPN API → GitHub Actions → public/results.json → Vercel
```

- Cron a cada 15 minutos (`.github/workflows/update-results.yml`)
- Atualização manual: **Actions → Atualizar Resultados Copa 2026 → Run workflow**
- Fallback: editar `public/results.json` à mão

## Stack

Vite · Tailwind CSS · Vanilla JS · Vercel
