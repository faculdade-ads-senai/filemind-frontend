async function requisitar(caminho, opcoes, formato = 'json') {
  let resposta
  try {
    resposta = await fetch(caminho, opcoes)
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro
    throw new Error('Não foi possível conectar ao serviço. Tente novamente.')
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const validacoes = Object.values(corpo?.errors ?? {}).join('\n')
    throw new Error(validacoes || corpo?.mensagem || corpo?.message || corpo?.erro || `Não foi possível concluir a operação (HTTP ${resposta.status}).`)
  }

  if (resposta.status === 204) return
  return formato === 'texto' ? resposta.text() : resposta.json()
}

function postarJson(caminho, dados, sinal) {
  return requisitar(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
    signal: sinal,
  })
}

export function entrar(usuario, senha) {
  return postarJson('/api/auth/login', { usuario, senha })
}

export function criarConta(usuario, nome, senha) {
  return postarJson('/api/usuarios', { usuario, nome, senha })
}

export function listarArquivos(idUsuario, sinal) {
  return requisitar(`/api/arquivos/usuarios/${encodeURIComponent(idUsuario)}`, { signal: sinal })
}

export function enviarArquivo(idUsuario, arquivo) {
  const dados = new FormData()
  dados.append('idUsuario', idUsuario)
  dados.append('arquivo', arquivo)
  return requisitar('/api/arquivos', { method: 'POST', body: dados })
}

export function obterConteudo(idUsuario, idArquivo, sinal) {
  return requisitar(
    `/api/arquivos/${encodeURIComponent(idArquivo)}/conteudo?idUsuario=${encodeURIComponent(idUsuario)}`,
    { signal: sinal },
    'texto',
  )
}

export function apagarArquivo(idUsuario, idArquivo) {
  return requisitar(
    `/api/arquivos/${encodeURIComponent(idArquivo)}?idUsuario=${encodeURIComponent(idUsuario)}`,
    { method: 'DELETE' },
  )
}

export function perguntar(usuarioId, pergunta, arquivoId, sinal) {
  const dados = { usuarioId, pergunta }
  if (arquivoId != null) dados.arquivoId = arquivoId
  return postarJson('/rag/perguntar', dados, sinal)
}
