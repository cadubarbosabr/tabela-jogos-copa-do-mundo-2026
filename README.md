### Tabela interativa dos jogos da Copa do Mundo FIFA 2026 🏆🥅⚽
[Tabela da Copa do Mundo 2026](https://tabela-jogos-copa-do-mundo-2026.vercel.app/)

## Atualização automática de resultados

Os resultados são atualizados **automaticamente** a cada 15 minutos via **GitHub Actions** usando a **ESPN API pública** (gratuita, sem chave de API necessária).

### Como funciona

```
ESPN API pública  →  scripts/fetch-results.mjs  →  public/results.json  →  Vercel (auto-deploy)
```

1. O workflow `.github/workflows/update-results.yml` é disparado pelo cron do GitHub Actions (`*/15 * * * *`).
2. O script `scripts/fetch-results.mjs` busca os placares do dia via `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard`.
3. Os nomes das seleções são convertidos do inglês (ESPN) para o português utilizado na aplicação.
4. Se houver alterações, o arquivo `public/results.json` é atualizado e comitado (`[skip ci]`).
5. O Vercel detecta o novo commit e faz o deploy automático em segundos.

### Frequência e limitações

| Item | Valor |
|------|-------|
| Frequência de atualização | A cada **15 minutos** |
| Custo | **Gratuito** (ESPN API pública + GitHub Actions em repo público) |
| Chave de API necessária | **Não** |
| Atrasos possíveis | ~15 min após o apito final + tempo de deploy (~1 min) |
| Pênaltis (mata-mata) | Capturados automaticamente quando disponíveis na API; pode ser inserido manualmente como fallback |

### Execução manual

Para forçar uma atualização imediata, acesse **Actions → Atualizar Resultados Copa 2026 → Run workflow** no painel do GitHub.

### Manutenção

- **O workflow para sozinho** após `2026-07-19` (data da final).
- Para reativar ou ajustar a frequência, edite o `cron` em `.github/workflows/update-results.yml`.
- Para adicionar ou corrigir um mapeamento de nome de seleção, edite o objeto `EN_TO_PT` em `scripts/fetch-results.mjs`.

---

## Resultados oficiais (formato manual)

Os resultados também podem ser publicados **manualmente** editando o arquivo `public/results.json`:

```json
{
  "1": { "home": 2, "away": 1 },
  "73": { "home": 1, "away": 1, "penHome": 4, "penAway": 3 }
}
```

Quando um jogo existe nesse arquivo com `home` e `away`, o app usa esse placar com prioridade sobre o `localStorage` e bloqueia a edição dos inputs correspondentes.

---

## Desenvolvimento local

```bash
npm install
npm run dev    # servidor de desenvolvimento
npm run build  # build de produção
```
