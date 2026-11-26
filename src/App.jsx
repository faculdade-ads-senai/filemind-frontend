import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronRight, File, FileText, FolderOpen, Home, LogOut, Menu, Plus, Search, Send, Sparkles, Trash2, X } from 'lucide-react'
import { apagarArquivo, criarConta, entrar, enviarArquivo, listarArquivos, obterConteudo, perguntar } from './api.js'

const chaveSessao = 'filemind.sessao'
const statusArquivos = {
  ENVIADO: { rotulo: 'Na fila', cor: 'bg-[#eee9ff] text-[#7561bd]' },
  PROCESSANDO: { rotulo: 'Indexando', cor: 'bg-[#e6f0ff] text-[#5781c0]' },
  PROCESSADO: { rotulo: 'Pronto', cor: 'bg-[#e7f3ea] text-[#527d63]' },
  ERRO: { rotulo: 'Erro', cor: 'bg-[#fff0e5] text-[#a45a32]' },
}
const coresArquivos = Object.values(statusArquivos).map(status => status.cor)

function emProcessamento(arquivo) {
  return arquivo.statusRag === 'ENVIADO' || arquivo.statusRag === 'PROCESSANDO'
}

function Marca({ aoClicar }) {
  const conteudo = <><span className="brand-mark"><span /><span /><span /><span /></span><span className="font-heading text-[19px] font-extrabold tracking-[-.7px] text-[#232520]">filemind</span></>
  const classe = 'flex items-center gap-2.5 text-left'
  return aoClicar ? <button onClick={aoClicar} className={classe}>{conteudo}</button> : <div className={classe}>{conteudo}</div>
}

function Avatar({ nome }) {
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map(parte => Array.from(parte)[0]).join('').toUpperCase()
  return <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8e8db] text-[11px] font-semibold text-[#5c654f]" aria-hidden="true">{iniciais}</div>
}

function MenuLateral({ pagina, navegar, menuAberto, fecharMenu, selecionarArquivo, operacao, sair }) {
  const rotas = [['inicio', 'Início', Home], ['perguntar', 'Perguntar', Sparkles]]

  return <>
    {menuAberto && <button aria-label="Fechar menu" onClick={fecharMenu} className="fixed inset-0 z-30 bg-black/25 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#ecece7] bg-[#fbfbf9] px-5 transition-transform lg:static lg:z-auto lg:translate-x-0 ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[76px] items-center justify-between">
        <Marca aoClicar={() => navegar('inicio')} />
        <button aria-label="Fechar menu" onClick={fecharMenu} className="icon-button lg:hidden"><X size={18} /></button>
      </div>
      <button className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#454c3c] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#343a2d] disabled:opacity-50" onClick={() => { fecharMenu(); selecionarArquivo() }} disabled={Boolean(operacao)}>
        <Plus size={17} strokeWidth={2.2} /> Novo arquivo
      </button>
      <div className="mt-8">
        <p className="eyebrow px-3">ESPAÇO DE TRABALHO</p>
        <nav className="mt-2 space-y-1">
          {rotas.map(([destino, rotulo, Icone]) => (
            <button key={destino} onClick={() => navegar(destino)} aria-current={pagina === destino ? 'page' : undefined} className={`nav-link ${pagina === destino ? 'nav-active' : ''}`}>
              <Icone size={17} strokeWidth={1.8} /> {rotulo}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto pb-4">
        <button onClick={sair} className="nav-link"><LogOut size={17} /> Sair da conta</button>
      </div>
    </aside>
  </>
}

function Cabecalho({ usuario, abrirMenu, busca, setBusca, mostrarBusca }) {
  return <header className="flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-[#ecece7] bg-[#fbfbf9]/90 px-5 sm:px-8 lg:px-10">
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <button aria-label="Abrir menu" onClick={abrirMenu} className="icon-button shrink-0 lg:hidden"><Menu size={19} /></button>
      {mostrarBusca && <div className="relative w-full max-w-[340px]">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9b94]" />
        <input type="search" aria-label="Buscar arquivos pelo nome" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder="Buscar arquivos..." className="h-10 w-full rounded-xl border border-[#e8e8e2] bg-white pl-10 pr-3 text-[12px] text-[#34362f] outline-none placeholder:text-[#a3a49d] focus:border-[#c9cdbb]" />
      </div>}
    </div>
    <div className="flex min-w-0 items-center gap-2.5" title={usuario.nome}>
      <Avatar nome={usuario.nome} />
      <div className="hidden min-w-0 text-left sm:block">
        <span className="block max-w-44 truncate text-[12px] font-semibold text-[#373931]">{usuario.nome}</span>
        <span className="block max-w-44 truncate text-[10px] text-[#96978f]">{usuario.usuario}</span>
      </div>
    </div>
  </header>
}

function IconeArquivo({ cor = coresArquivos[0], grande = false }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-[11px] ${cor} ${grande ? 'h-12 w-12' : 'h-10 w-10'}`}>
    <FileText size={grande ? 22 : 18} strokeWidth={1.7} />
  </span>
}

function SeloStatus({ status }) {
  const { rotulo, cor } = statusArquivos[status] ?? { rotulo: 'Desconhecido', cor: 'bg-[#f0f0eb] text-[#66685f]' }
  return <span className={`inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium ${cor}`}>{rotulo}</span>
}

function CartaoResumo({ rotulo, total, cor, icone: Icone }) {
  return <div className="folder-card">
    <span className={`flex h-10 w-10 items-center justify-center rounded-[11px] ${cor}`}><Icone size={19} strokeWidth={1.8} /></span>
    <span className="mt-4 block text-[13px] font-semibold text-[#383a34]">{rotulo}</span>
    <span className="mt-1 block text-[11px] text-[#85877e]">{total}</span>
  </div>
}

function LinhaArquivo({ arquivo, cor, abrir, apagar, operacao }) {
  return <div className="file-row">
    <button onClick={abrir} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left" title={arquivo.nomeArquivo}>
      <IconeArquivo cor={cor} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-[#41433c]">{arquivo.nomeArquivo}</span>
        <span className="mt-1 block"><SeloStatus status={arquivo.statusRag} /></span>
      </span>
    </button>
    <button onClick={apagar} aria-label={'Apagar ' + arquivo.nomeArquivo} title="Apagar arquivo" disabled={Boolean(operacao)} className="icon-button shrink-0 disabled:opacity-40">
      <Trash2 size={16} />
    </button>
  </div>
}

function AvisoErro({ mensagem }) {
  return <p role="alert" className="whitespace-pre-line rounded-lg bg-[#fff0e5] px-3 py-2 text-[12px] text-[#9b4d2c]">{mensagem}</p>
}

function PaginaInicio({ usuario, arquivos, busca, abrirArquivo, apagar, selecionarArquivo, operacao, erroLista }) {
  const [visualizacao, setVisualizacao] = useState('grade')
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const filtrados = arquivos?.filter(arquivo => arquivo.nomeArquivo.toLocaleLowerCase('pt-BR').includes(termo))
  const prontos = arquivos?.filter(arquivo => arquivo.statusRag === 'PROCESSADO').length

  return <main className="mx-auto w-full max-w-[1280px] px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pt-10">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-2 text-[11px] text-[#9b9c94]"><span>Meu espaço</span><ChevronRight size={13} /><span className="text-[#5e6157]">Arquivos</span></div>
        <h1 className="font-heading mt-3 text-[28px] font-bold tracking-[-1px] text-[#282a24] sm:text-[32px]">Olá, {usuario.nome.trim().split(/\s+/)[0]}<span className="text-[#a0a487]">.</span></h1>
      </div>
      <button onClick={selecionarArquivo} disabled={Boolean(operacao)} className="flex h-10 w-fit items-center gap-2 rounded-xl border border-[#e7e7e0] bg-white px-3.5 text-[12px] font-medium text-[#56584f] hover:bg-[#f7f7f4] disabled:opacity-50">
        <Plus size={14} /> {operacao === 'envio' ? 'Enviando...' : 'Enviar Markdown'}
      </button>
    </div>

    <section className="mt-9">
      <h2 className="mb-3 text-[14px] font-semibold text-[#3b3d37]">Resumo dos arquivos</h2>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <CartaoResumo rotulo="Total de arquivos" total={arquivos?.length ?? '—'} cor="bg-[#f0ecff] text-[#7868b4]" icone={FolderOpen} />
        <CartaoResumo rotulo="Prontos para perguntas" total={prontos ?? '—'} cor="bg-[#eaf4eb] text-[#69947a]" icone={Sparkles} />
      </div>
    </section>

    <section className="mt-9">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-[#3b3d37]">Meus arquivos</h2>
        <div className="flex rounded-lg border border-[#e7e7e0] bg-white p-0.5">
          {[['grade', 'Visualização em grade', FolderOpen], ['lista', 'Visualização em lista', File]].map(([modo, rotulo, Icone]) => (
            <button key={modo} aria-label={rotulo} aria-pressed={visualizacao === modo} onClick={() => setVisualizacao(modo)} className={`rounded-md p-1.5 ${visualizacao === modo ? 'bg-[#f0f0ea] text-[#55594b]' : 'text-[#a1a199]'}`}>
              <Icone size={14} />
            </button>
          ))}
        </div>
      </div>

      {!arquivos ? !erroLista && <p role="status" className="mt-4 text-[12px] text-[#85877e]">Carregando arquivos...</p> : (
        filtrados.length ? <div className={`mt-4 ${visualizacao === 'grade' ? 'grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4' : 'space-y-1'}`}>
          {filtrados.map((arquivo, indice) => <LinhaArquivo key={arquivo.idArquivo} arquivo={arquivo} cor={coresArquivos[indice % coresArquivos.length]} abrir={() => abrirArquivo(arquivo.idArquivo)} apagar={() => apagar(arquivo)} operacao={operacao} />)}
        </div> : <div className="mt-4 rounded-2xl border border-dashed border-[#dedfd6] px-6 py-12 text-center">
          <Search size={20} className="mx-auto text-[#aaa99f]" />
          <p className="mt-3 text-[13px] font-semibold text-[#505249]">{termo ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo enviado'}</p>
          <p className="mt-1 text-[11px] text-[#85877e]">{termo ? 'Tente outro nome.' : 'Envie um arquivo Markdown para começar.'}</p>
        </div>
      )}
    </section>
  </main>
}

function formatarNegrito(texto) {
  return texto.split(/\*\*(.*?)\*\*/g).map((parte, indice) => indice % 2 ? <strong key={indice}>{parte}</strong> : parte)
}

function Markdown({ conteudo }) {
  return <div className="markdown-content break-words">{conteudo.split(/\r?\n/).map((linha, indice) => {
    if (!linha.trim()) return <div key={indice} className="h-2" />
    if (linha.startsWith('# ')) return <h1 key={indice}>{linha.slice(2)}</h1>
    if (linha.startsWith('## ')) return <h2 key={indice}>{linha.slice(3)}</h2>
    if (linha.startsWith('### ')) return <h3 key={indice}>{linha.slice(4)}</h3>
    if (linha.startsWith('- ')) return <div key={indice} className="flex gap-2.5 pl-1"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#a3a78d]" /><p className="min-w-0">{formatarNegrito(linha.slice(2))}</p></div>
    if (linha.startsWith('> ')) return <blockquote key={indice}>{linha.slice(2)}</blockquote>
    return <p key={indice}>{formatarNegrito(linha)}</p>
  })}</div>
}

function ChatPanel({ idUsuario, arquivo }) {
  const [escopo, setEscopo] = useState(arquivo ? 'arquivo' : 'todos')
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [erro, setErro] = useState('')
  const pedido = useRef(null)
  const fim = useRef(null)
  const sobreArquivo = escopo === 'arquivo'
  const bloqueado = sobreArquivo && arquivo.statusRag !== 'PROCESSADO'

  useEffect(() => () => pedido.current?.abort(), [])

  useEffect(() => {
    if (mensagens.length) fim.current?.scrollIntoView({ block: 'nearest' })
  }, [mensagens, pensando, erro])

  async function enviarPergunta(evento) {
    evento.preventDefault()
    const pergunta = texto.trim()
    if (!pergunta || pedido.current || bloqueado) return
    const controlador = new AbortController()
    pedido.current = controlador
    setPensando(true)
    setErro('')
    setMensagens(anteriores => [...anteriores, { autor: 'usuario', texto: pergunta }])
    setTexto('')
    try {
      const resultado = await perguntar(idUsuario, pergunta, sobreArquivo ? arquivo.idArquivo : undefined, controlador.signal)
      setMensagens(anteriores => [...anteriores, { autor: 'assistente', texto: resultado.resposta, fontes: resultado.fontes }])
    } catch (falha) {
      if (!controlador.signal.aborted) {
        setErro(falha.message)
        setTexto(atual => atual || pergunta)
      }
    } finally {
      pedido.current = null
      if (!controlador.signal.aborted) setPensando(false)
    }
  }

  return <aside aria-label="Chat do FileMind" className="flex min-h-[500px] min-w-0 flex-col border-t border-[#ecece7] bg-[#fbfbf9] lg:min-h-0 lg:border-l lg:border-t-0">
    <div className="flex min-h-[65px] shrink-0 items-center justify-between gap-2 border-b border-[#ecece7] px-5 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eceee3] text-[#687054]"><Sparkles size={16} /></span>
        <span className="text-[12px] font-semibold text-[#41433b]">Converse com seus arquivos</span>
      </div>
      {arquivo && <select aria-label="Escopo da pergunta" value={escopo} onChange={evento => setEscopo(evento.target.value)} disabled={pensando} className="min-w-0 rounded-lg border border-[#e7e7e0] bg-white px-2 py-1.5 text-[11px] text-[#66685f] disabled:opacity-50">
        <option value="arquivo">Este arquivo</option>
        <option value="todos">Todos os arquivos</option>
      </select>}
    </div>

    <div className="flex-1 overflow-y-auto px-5 py-5">
      {mensagens.length === 0 ? <>
        <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6e7dc] bg-white text-[#858c6c]"><Sparkles size={17} /></div>
        <h3 className="mt-4 font-heading text-[17px] font-bold tracking-[-.4px] text-[#3d4037]">Vamos pensar juntos?</h3>
        <p className="mt-2 text-[11px] leading-[1.7] text-[#73756c]">{sobreArquivo ? 'Pergunte sobre o conteúdo deste arquivo.' : 'Pergunte sobre o conteúdo dos seus arquivos.'}</p>
      </> : <div className="space-y-4" aria-live="polite">
        {mensagens.map((mensagem, indice) => (
          <div key={indice} className={mensagem.autor === 'usuario' ? 'ml-8 rounded-2xl rounded-br-sm bg-[#464d3e] px-3.5 py-3 text-[11px] leading-[1.7] text-white' : 'mr-3 rounded-2xl rounded-bl-sm border border-[#e9e9e3] bg-white px-3.5 py-3 text-[11px] leading-[1.7] text-[#62645d]'}>
            {mensagem.autor === 'assistente' && <span className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold text-[#858c6c]"><Sparkles size={11} /> FILEMIND</span>}
            <p className="whitespace-pre-wrap break-words">{mensagem.texto}</p>
            {mensagem.fontes?.length > 0 && <ul aria-label="Fontes" className="mt-2 flex flex-wrap gap-1.5">
              {mensagem.fontes.map((fonte, posicao) => <li key={posicao} title={fonte.trecho} className="max-w-full truncate rounded-md bg-[#eceee3] px-2 py-0.5 text-[10px] font-medium text-[#61694f]">{fonte.nomeArquivo}</li>)}
            </ul>}
          </div>
        ))}
      </div>}
      {pensando && <p role="status" className="mt-4 text-[11px] text-[#73756c]">Pensando...</p>}
      {erro && <div className="mt-4"><AvisoErro mensagem={erro} /></div>}
      <div ref={fim} />
    </div>

    <form onSubmit={enviarPergunta} className="border-t border-[#ecece7] p-4">
      {bloqueado && <p role="status" className="mb-2 text-[11px] text-[#73756c]">O arquivo precisa estar Pronto para receber perguntas.</p>}
      <div className="rounded-xl border border-[#e4e5de] bg-white p-2 focus-within:border-[#c8cbbb]">
        <textarea rows="2" aria-label="Pergunta" value={texto} onChange={evento => setTexto(evento.target.value)} onKeyDown={evento => {
          if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
            evento.preventDefault()
            evento.currentTarget.form.requestSubmit()
          }
        }} placeholder={sobreArquivo ? 'Pergunte sobre este arquivo...' : 'Pergunte sobre seus arquivos...'} disabled={bloqueado || pensando} className="w-full resize-none px-1.5 py-1 text-[11px] leading-5 text-[#46483f] outline-none placeholder:text-[#adaea7] disabled:opacity-60" />
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] text-[#77796f]">Enter para enviar <span className="mx-1">·</span> Shift + Enter para nova linha</span>
          <button type="submit" aria-label="Enviar pergunta" disabled={!texto.trim() || bloqueado || pensando} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#464d3e] text-white transition hover:bg-[#343a2d] disabled:cursor-not-allowed disabled:opacity-40"><Send size={13} /></button>
        </div>
      </div>
    </form>
  </aside>
}

function PaginaArquivo({ idUsuario, arquivo, voltar }) {
  const { idArquivo, nomeArquivo, statusRag } = arquivo
  const [conteudo, setConteudo] = useState(null)
  const [erro, setErro] = useState('')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()
    obterConteudo(idUsuario, idArquivo, controlador.signal)
      .then(setConteudo)
      .catch(falha => {
        if (!controlador.signal.aborted) setErro(falha.message)
      })
    return () => controlador.abort()
  }, [idUsuario, idArquivo, tentativa])

  return <main className="grid min-h-[calc(100vh-76px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] xl:grid-cols-[minmax(0,1fr)_370px]">
    <section className="min-w-0 px-5 pb-12 pt-6 sm:px-9 lg:px-12">
      <div className="flex items-center gap-2 text-[11px] text-[#9b9c94]">
        <button onClick={voltar} className="hover:text-[#4c5043]">Arquivos</button><ChevronRight size={13} /><span className="max-w-[180px] truncate text-[#5e6157]">{nomeArquivo}</span>
      </div>
      <div className="mt-7 flex min-w-0 items-center gap-3">
        <IconeArquivo grande />
        <div className="min-w-0">
          <h1 className="font-heading truncate text-[20px] font-bold tracking-[-.5px] text-[#30322b] sm:text-[23px]" title={nomeArquivo}>{nomeArquivo}</h1>
          <div className="mt-1"><SeloStatus status={statusRag} /></div>
        </div>
      </div>
      <div className="mt-7 flex items-center gap-2 border-b border-[#e9e9e3] pb-3">
        <span className="rounded-lg bg-[#eceee5] px-2.5 py-1.5 text-[10px] font-medium text-[#656b56]">Visualização</span>
        <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] text-[#9a9b94]"><FileText size={12} /> Markdown</span>
      </div>
      <article className="mx-auto mt-7 max-w-[690px]">
        {erro ? <>
          <AvisoErro mensagem={erro} />
          <button onClick={() => { setErro(''); setTentativa(atual => atual + 1) }} className="mt-2 text-[12px] font-semibold text-[#687054] hover:underline">Tentar novamente</button>
        </> : conteudo === null ? <p role="status" className="text-[12px] text-[#85877e]">Carregando conteúdo...</p> : <Markdown conteudo={conteudo} />}
      </article>
    </section>
    <ChatPanel idUsuario={idUsuario} arquivo={arquivo} />
  </main>
}

function PaginaPerguntar({ idUsuario }) {
  return <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pt-10">
    <h1 className="font-heading text-[28px] font-bold tracking-[-1px] text-[#282a24] sm:text-[32px]">Perguntar</h1>
    <p className="mt-1.5 text-[13px] text-[#85877e]">Todos os arquivos</p>
    <div className="mt-7 grid min-h-[500px] flex-1 overflow-hidden rounded-2xl border border-[#ecece7]"><ChatPanel idUsuario={idUsuario} /></div>
  </main>
}

function PaginaLogin({ iniciarSessao }) {
  const [cadastro, setCadastro] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const classeCampo = 'h-11 w-full rounded-xl border border-[#e6e6df] bg-white px-3.5 text-[12px] text-[#3f4139] outline-none placeholder:text-[#b3b4ac] focus:border-[#adb39a]'

  function alternarModo() {
    setCadastro(atual => !atual)
    setSenha('')
    setErro('')
    setSucesso('')
  }

  async function autenticar(evento) {
    evento.preventDefault()
    if (enviando) return
    setEnviando(true)
    setErro('')
    setSucesso('')
    try {
      if (cadastro) {
        await criarConta(email.trim(), nome.trim(), senha)
        alternarModo()
        setSucesso('Conta criada. Entre com seu e-mail e senha.')
      } else {
        const usuario = await entrar(email.trim(), senha)
        iniciarSessao(usuario)
      }
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setEnviando(false)
    }
  }

  return <main className="login-bg flex min-h-screen">
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-[#424b3c] p-12 text-white lg:flex xl:p-16">
      <div className="absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full border border-white/[.08]" />
      <div className="absolute -right-16 -top-16 h-[400px] w-[400px] rounded-full border border-white/[.08]" />
      <div className="absolute bottom-[-170px] left-[-130px] h-[500px] w-[500px] rounded-full border border-white/[.07]" />
      <div className="relative"><Marca /></div>
      <div className="relative max-w-[520px] pb-7">
        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[.08]"><Sparkles size={20} /></span>
        <h1 className="font-heading text-[42px] font-semibold leading-[1.17] tracking-[-1.6px] xl:text-[49px]">Suas ideias merecem<br />um lugar para <span className="text-[#c9d0ae]">crescer.</span></h1>
        <p className="mt-5 max-w-[390px] text-[14px] leading-7 text-white/65">Guarde seus arquivos. Conecte seus pensamentos. Encontre o que você já sabe.</p>
      </div>
      <div className="relative text-[10px] text-white/45">© 2025 FileMind</div>
    </div>

    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px]">
        <div className="mb-12 lg:hidden"><Marca /></div>
        <div className="mb-9">
          <h2 className="font-heading text-[29px] font-bold tracking-[-1px] text-[#30322c]">{cadastro ? 'Crie sua conta.' : 'Entre no seu espaço.'}</h2>
          <p className="mt-2 text-[13px] text-[#898b83]">{cadastro ? 'Preencha seus dados para começar.' : 'Acesse seus arquivos e continue de onde parou.'}</p>
        </div>
        <form onSubmit={autenticar} className="space-y-5">
          {cadastro && <label className="block">
            <span className="mb-2 block text-[11px] font-semibold text-[#56584f]">Nome</span>
            <input required autoComplete="name" value={nome} onChange={evento => setNome(evento.target.value)} disabled={enviando} className={classeCampo} />
          </label>}
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold text-[#56584f]">E-mail</span>
            <input required type="email" autoComplete="username" value={email} onChange={evento => setEmail(evento.target.value)} disabled={enviando} className={classeCampo} />
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold text-[#56584f]">Senha</span>
            <input required type="password" autoComplete={cadastro ? 'new-password' : 'current-password'} value={senha} onChange={evento => setSenha(evento.target.value)} placeholder="Sua senha" disabled={enviando} aria-describedby={cadastro ? 'regra-senha' : undefined} className={classeCampo} />
            {cadastro && <span id="regra-senha" className="mt-2 block text-[11px] leading-relaxed text-[#73756c]">Use de 8 a 72 caracteres, com maiúscula, minúscula, número e um caractere especial (@#$%^&amp;+=!).</span>}
          </label>
          {erro && <AvisoErro mensagem={erro} />}
          {sucesso && <p role="status" className="rounded-lg bg-[#e7f3ea] px-3 py-2 text-[12px] text-[#527d63]">{sucesso}</p>}
          <button type="submit" disabled={enviando} className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#454c3c] text-[12px] font-semibold text-white transition hover:bg-[#343a2d] disabled:opacity-50">
            {enviando ? 'Aguarde...' : cadastro ? 'Criar conta' : 'Entrar'} <ArrowRight size={15} />
          </button>
        </form>
        <p className="mt-8 text-center text-[11px] text-[#96978f]">
          {cadastro ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
          <button onClick={alternarModo} disabled={enviando} className="font-semibold text-[#687054] hover:underline disabled:opacity-50">{cadastro ? 'Voltar para o login' : 'Criar conta'}</button>
        </p>
      </div>
    </div>
  </main>
}

function AreaLogada({ usuario, sair }) {
  const { idUsuario } = usuario
  const [pagina, setPagina] = useState('inicio')
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null)
  const [arquivos, setArquivos] = useState(null)
  const [versaoLista, setVersaoLista] = useState(0)
  const [erroLista, setErroLista] = useState('')
  const [erroOperacao, setErroOperacao] = useState('')
  const [operacao, setOperacao] = useState('')
  const [busca, setBusca] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const campoArquivo = useRef(null)
  const pedidoLista = useRef(null)
  const temFila = useRef(false)
  const arquivoAberto = arquivos?.find(arquivo => arquivo.idArquivo === arquivoSelecionado)
  const paginaAtual = pagina === 'arquivo' && !arquivoAberto ? 'inicio' : pagina

  useEffect(() => {
    const controlador = new AbortController()
    pedidoLista.current = controlador
    let temporizador
    async function atualizar() {
      try {
        const lista = await listarArquivos(idUsuario, controlador.signal)
        if (controlador.signal.aborted) return
        temFila.current = lista.some(emProcessamento)
        setArquivos(lista)
        setErroLista('')
      } catch (falha) {
        if (controlador.signal.aborted) return
        setErroLista(falha.message)
      }
      if (temFila.current) temporizador = setTimeout(atualizar, 3000)
    }

    atualizar()
    return () => {
      controlador.abort()
      clearTimeout(temporizador)
    }
  }, [idUsuario, versaoLista])

  function recarregarLista() {
    pedidoLista.current?.abort()
    setErroLista('')
    setVersaoLista(atual => atual + 1)
  }

  function navegar(destino) {
    setPagina(destino)
    setMenuAberto(false)
  }

  async function enviar(evento) {
    const arquivo = evento.target.files[0]
    evento.target.value = ''
    if (!arquivo || operacao) return
    navegar('inicio')
    setErroOperacao('')
    if (!/\.md$/i.test(arquivo.name)) {
      setErroOperacao('Selecione um arquivo com extensão .md.')
      return
    }
    setOperacao('envio')
    try {
      const enviado = await enviarArquivo(idUsuario, arquivo)
      if (emProcessamento(enviado)) temFila.current = true
      setBusca('')
      recarregarLista()
      setArquivos(lista => lista && [enviado, ...lista.filter(item => item.idArquivo !== enviado.idArquivo)])
    } catch (falha) {
      setErroOperacao(falha.message)
    } finally {
      setOperacao('')
    }
  }

  async function apagar(arquivo) {
    if (operacao || !window.confirm('Apagar “' + arquivo.nomeArquivo + '”?')) return
    setOperacao('exclusao')
    setErroOperacao('')
    try {
      await apagarArquivo(idUsuario, arquivo.idArquivo)
      recarregarLista()
      setArquivos(lista => lista.filter(item => item.idArquivo !== arquivo.idArquivo))
    } catch (falha) {
      setErroOperacao(falha.message)
    } finally {
      setOperacao('')
    }
  }

  const selecionarArquivo = () => campoArquivo.current.click()

  return <div className="min-h-screen bg-[#f7f7f4] text-[#30322c]">
    <input ref={campoArquivo} type="file" accept=".md" onChange={enviar} hidden />
    <div className="flex min-h-screen">
      <MenuLateral pagina={paginaAtual} navegar={navegar} menuAberto={menuAberto} fecharMenu={() => setMenuAberto(false)} selecionarArquivo={selecionarArquivo} operacao={operacao} sair={sair} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Cabecalho usuario={usuario} abrirMenu={() => setMenuAberto(true)} busca={busca} setBusca={setBusca} mostrarBusca={paginaAtual === 'inicio'} />
        {(erroLista || erroOperacao) && <div className="mx-auto mt-4 w-full max-w-[1280px] space-y-2 px-5 sm:px-8 lg:px-10">
          {erroOperacao && <AvisoErro mensagem={erroOperacao} />}
          {erroLista && <>
            <AvisoErro mensagem={erroLista} />
            <button onClick={recarregarLista} className="text-[12px] font-semibold text-[#687054] hover:underline">Atualizar arquivos</button>
          </>}
        </div>}
        {paginaAtual === 'arquivo' ? <PaginaArquivo key={arquivoAberto.idArquivo} idUsuario={idUsuario} arquivo={arquivoAberto} voltar={() => navegar('inicio')} />
          : paginaAtual === 'perguntar' ? <PaginaPerguntar idUsuario={idUsuario} />
          : <PaginaInicio usuario={usuario} arquivos={arquivos} busca={busca} abrirArquivo={idArquivo => { setArquivoSelecionado(idArquivo); navegar('arquivo') }} apagar={apagar} selecionarArquivo={selecionarArquivo} operacao={operacao} erroLista={erroLista} />}
      </div>
    </div>
  </div>
}

function lerSessao() {
  try {
    const usuario = JSON.parse(localStorage.getItem(chaveSessao))
    if (usuario?.idUsuario != null && typeof usuario.usuario === 'string' && typeof usuario.nome === 'string') return usuario
  } catch {
    return null
  }
  return null
}

export default function App() {
  const [usuario, setUsuario] = useState(lerSessao)

  function iniciarSessao(sessao) {
    const { idUsuario, usuario, nome } = sessao
    const dados = { idUsuario, usuario, nome }
    localStorage.setItem(chaveSessao, JSON.stringify(dados))
    setUsuario(dados)
  }

  function sair() {
    localStorage.removeItem(chaveSessao)
    setUsuario(null)
  }

  return usuario ? <AreaLogada key={usuario.idUsuario} usuario={usuario} sair={sair} /> : <PaginaLogin iniciarSessao={iniciarSessao} />
}
