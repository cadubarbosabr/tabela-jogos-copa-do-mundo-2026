### Tabela interativa dos jogos da Copa do Mundo FIFA 2026 🏆🥅⚽
[Tabela da Copa do Mundo 2026](https://tabela-jogos-copa-do-mundo-2026.vercel.app/)

## Resultados oficiais

Os resultados oficiais podem ser publicados editando o arquivo `public/results.json`.

Exemplo:

```json
{
  "1": { "home": 2, "away": 1 },
  "73": { "home": 1, "away": 1, "penHome": 4, "penAway": 3 }
}
```

Quando um jogo existe nesse arquivo com `home` e `away`, o app usa esse placar com prioridade sobre o `localStorage` e bloqueia a edição dos inputs correspondentes.
