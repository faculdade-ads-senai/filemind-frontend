# FileMind Frontend

Interface web do FileMind: o usuario entra na conta, envia arquivos Markdown, acompanha a indexacao e pergunta sobre o conteudo, recebendo a resposta com as fontes.

Stack: React 19, Vite 7, Tailwind CSS 4 e lucide-react.

## Rodar localmente

Pre-requisitos: Node 20+, backend rodando em `http://localhost:8080` e RAG em `http://localhost:8001` (ver os READMEs de `filemind-backend` e `filemind-rag`).

```powershell
npm install
npm run dev
```

Abra `http://localhost:5173`.

O `vite.config.js` faz proxy para evitar CORS no desenvolvimento:

| Prefixo no front | Destino |
| --- | --- |
| `/api/...` | backend `http://localhost:8080/...` |
| `/rag/...` | RAG `http://localhost:8001/...` |

## Telas

| Tela | O que faz | Chamadas |
| --- | --- | --- |
| Login / Criar conta | Entra ou cadastra (e-mail, nome, senha forte). Mostra as mensagens de validacao do backend. | `POST /api/auth/login`, `POST /api/usuarios` |
| Inicio | Lista os arquivos do usuario com status (Na fila, Indexando, Pronto, Erro), busca por nome, contadores, visao em grade ou lista, envio de `.md` e exclusao com confirmacao. Enquanto houver arquivo na fila, a lista se atualiza sozinha a cada 3 s. | `GET /api/arquivos/usuarios/{id}`, `POST /api/arquivos`, `DELETE /api/arquivos/{id}` |
| Arquivo | Mostra o conteudo Markdown e o painel de chat. O chat pergunta sobre "Este arquivo" ou "Todos os arquivos" e fica bloqueado ate o arquivo ficar Pronto. | `GET /api/arquivos/{id}/conteudo`, `POST /rag/perguntar` |
| Perguntar | Chat sobre todos os arquivos do usuario. | `POST /rag/perguntar` |

Todas as chamadas ficam em `src/api.js`. A sessao (id, e-mail e nome do usuario) fica no `localStorage`, entao F5 mantem o login, e "Sair da conta" a apaga.

## Origem e mudancas em relacao ao prototipo

O prototipo visual (primeiro commit) usava dados ficticios de `src/data/mockData.json`. Na integracao com a API:

- os dados ficticios sairam e todas as telas passaram a usar o backend e o RAG;
- pastas, "Configuracoes" e "Biblioteca" sairam do menu, porque o backend do MVP nao tem pastas nem configuracoes (ficam como trabalho futuro);
- o visual (cores, componentes, layout) foi mantido;
- o renderizador de Markdown deixou de usar `dangerouslySetInnerHTML`, o que fechava uma brecha de XSS com arquivo malicioso.

## Limitacoes conhecidas do MVP

- O Markdown e renderizado de forma simples: titulos `#`, `##`, `###`, listas `- `, citacoes `> ` e negrito. Tabelas e blocos de codigo aparecem como texto.
- Nao ha token de autenticacao: o front envia o `idUsuario` nas chamadas. Em producao o backend deve emitir um token (por exemplo JWT) e derivar o usuario dele.
- As respostas do chat vem de um modelo local (Ollama) e levam cerca de 50 s na CPU.
- A pasta `dist/` esta versionada desde o primeiro commit e nao reflete esta versao. Para gerar o build atual: `npm run build`.
