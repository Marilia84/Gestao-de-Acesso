// src/pages/Home.jsx
import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Send, Copy, Check, User, MessageCircle } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import botIcon from "../assets/bot.jpg";

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
    <User size={20} />
  </div>
);

const AiAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 overflow-hidden border border-emerald-100">
    <img
      src={botIcon}
      alt="Buzzy"
      className="w-8 h-8 rounded-full object-cover"
    />
  </div>
);

export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text:
        "Olá! 👋 Eu sou o Buzzy, assistente inteligente do TrackPass.\n\n" +
        "Posso te ajudar com rotas, pontos de embarque, embarques do dia e dúvidas sobre o sistema. O que você gostaria de fazer agora?",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const [creatingPointMode, setCreatingPointMode] = useState(false);
  const [creatingRouteMode, setCreatingRouteMode] = useState(false);
  const [assigningPointToRouteMode, setAssigningPointToRouteMode] =
    useState(false);
  const [askingNaoEmbarcouMode, setAskingNaoEmbarcouMode] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const resetModes = () => {
    setCreatingPointMode(false);
    setCreatingRouteMode(false);
    setAssigningPointToRouteMode(false);
    setAskingNaoEmbarcouMode(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isAiThinking) return;

    const newUserMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedInput,
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText("");
    setIsAiThinking(true);

    let mensagemParaApi = trimmedInput;

    if (creatingPointMode) {
      mensagemParaApi = `Criar ponto chamado ${trimmedInput}`;
    } else if (creatingRouteMode) {
      mensagemParaApi = `Quero criar uma rota ${trimmedInput}`;
    } else if (assigningPointToRouteMode) {
      mensagemParaApi = `Coloca o ponto ${trimmedInput}`;
    } 

    resetModes();

    try {
      const response = await api.get("/chat", {
        params: {
          mensagem: mensagemParaApi,
        },
      });

      const aiText = response.data;

      if (!aiText) {
        throw new Error(
          "A API retornou uma resposta, mas sem o texto esperado."
        );
      }

      const aiResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: aiText,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error("Erro ao comunicar com o Buzzy:", error);
      const errorResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text:
          "Desculpe, tive um problema para processar sua solicitação agora. 😥\n\n" +
          "Tente novamente em alguns instantes ou ajuste um pouco a pergunta.",
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
      toast.error(
        "Desculpe, o Buzzy não conseguiu responder agora. Tente novamente."
      );
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleCopy = (text, messageId) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setCopiedMessageId(messageId);
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      toast.success("Resposta copiada com sucesso!");
    } catch (err) {
      console.error("Falha ao copiar texto:", err);
      toast.error("Não foi possível copiar o texto.");
    }
    document.body.removeChild(textArea);
  };

  const dispararSugestao = (texto) => {
    setInputText(texto);
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      handleSendMessage(fakeEvent);
    }, 0);
  };

  const iniciarFluxoCriarPonto = () => {
    resetModes();
    setCreatingPointMode(true);
    const msg = {
      id: Date.now(),
      sender: "ai",
      text:
        "Perfeito, vamos criar um ponto de embarque com o Buzzy. ✨\n\n" +
        "Digite agora apenas o nome do ponto e o endereço completo em uma única frase, seguindo este modelo:\n\n" +
        "Portaria Principal na Rua São José, 250, São Joaquim da Barra - SP, Brasil.\n\n" +
        "Depois é só enviar que eu tento criar o ponto pra você. 😊",
    };
    setMessages((prev) => [...prev, msg]);
  };

  const iniciarFluxoCriarRota = () => {
    resetModes();
    setCreatingRouteMode(true);
    const msg = {
      id: Date.now(),
      sender: "ai",
      text:
        "Ótimo! Vamos criar uma rota com o Buzzy. 🚌\n\n" +
        'Digite agora os dados em uma única frase, completando depois de "rota", seguindo este modelo:\n\n' +
        "em São Joaquim da Barra chamada Rota T, no período da manhã, rota ativa, saindo às 07:10 e chegando às 08:00, com 44 lugares.\n\n" +
        "Você pode trocar cidade, nome, período, horários e capacidade. Depois de enviar, eu tento criar a rota pra você. 😊",
    };
    setMessages((prev) => [...prev, msg]);
  };

  const iniciarFluxoAtribuirPontoRota = () => {
    resetModes();
    setAssigningPointToRouteMode(true);
    const msg = {
      id: Date.now(),
      sender: "ai",
      text:
        "Vamos atribuir um ponto a uma rota. 🔗\n\n" +
        'Digite agora apenas o que vem depois de "ponto", em uma frase, seguindo este modelo:\n\n' +
        "Portaria Principal na rota Rota 01 Matutina como primeira parada.\n\n" +
        "Você pode trocar o nome do ponto, o nome da rota e a ordem (primeira, segunda, terceira, etc.).",
    };
    setMessages((prev) => [...prev, msg]);
  };

  const iniciarFluxoNaoEmbarcou = () => {
    resetModes();
    setAskingNaoEmbarcouMode(true);
    const msg = {
      id: Date.now(),
      sender: "ai",
      text:
        "Vamos consultar quem ainda não embarcou nessa rota hoje. ✅\n\n" +
        "Digite agora a rota, o período e a cidade com o código, seguindo este modelo:\n\n" +
        "rota A do período da manhã em São Joaquim da Barra (3)\n\n" +
        "Depois de enviar, eu retorno a lista de colaboradores que ainda não embarcaram nessa rota hoje.",
    };
    setMessages((prev) => [...prev, msg]);
  };

  const placeholderInput = creatingPointMode
    ? "Digite o nome do ponto e o endereço completo nesse formato..."
    : creatingRouteMode
    ? 'Descreva a rota para o Buzzy, ex: "em São Joaquim..., chamada..., período..., horários..."'
    : assigningPointToRouteMode
    ? 'Informe ponto, rota e ordem, ex: "Portaria Principal na rota..., como primeira parada"'
    : askingNaoEmbarcouMode
    ? 'Exemplo: "rota A do período da manhã em São Joaquim da Barra (3)"'
    : "Digite sua pergunta ou peça algo para o Buzzy...";

  return (
    <main
      className="
        flex-1 h-screen bg-slate-50
        px-3 sm:px-4 lg:px-28
        py-4
        ml-16
        flex flex-col
      "
    >
      <div className="w-full flex-1 flex flex-col space-y-6 overflow-hidden">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-600">
                Buzzy • Assistente do Sistema
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Converse com o Buzzy sobre rotas, pontos de embarque, embarques
                do dia e uso do TrackPass em uma linguagem natural.
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex items-center gap-2
              bg-white border border-emerald-100
              rounded-full px-3 py-1.5
              shadow-sm
            "
          >
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] sm:text-xs font-medium text-emerald-700">
              Buzzy online • resposta automática
            </span>
          </div>
        </header>

        <section
          className="
            flex-1 min-h-0
            grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]
            gap-5 lg:gap-6
            items-stretch
          "
        >
          {/* CARD DO CHAT */}
          <div
            className="
              bg-white border border-slate-200 shadow-sm rounded-2xl
    flex flex-col
    h-[calc(100vh-180px)]    
    min-h-[520px]           
    overflow-hidden          
  "
          >
            {/* ÁREA QUE ROLA: HEADER + MENSAGENS */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
              {/* Header do chat (vai rolar junto com as mensagens) */}
              <div className=" px-4 sm:px-6 py-4
    border-b border-slate-100
    flex items-center justify-between
    bg-white
    sticky top-0 z-20">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Chat com o Buzzy
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Faça perguntas, peça ações ou siga os fluxos guiados para o
                    Buzzy executar no TrackPass.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-100">
                    <img
                      src={botIcon}
                      alt="Buzzy"
                      className="w-7 h-7 object-cover rounded-full"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Buzzy • Assistente IA
                  </span>
                </div>
              </div>

              {/* Mensagens (parte de baixo da área que rola) */}
              <div className="px-3 sm:px-5 py-4 space-y-4 bg-slate-50/70 flex-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3.5 ${
                      msg.sender === "user" ? "justify-end" : ""
                    }`}
                  >
                    {msg.sender === "ai" && <AiAvatar />}

                    <div
                      className={`
                        max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm
                        text-sm leading-relaxed whitespace-pre-wrap break-words
                        ${
                          msg.sender === "user"
                            ? "bg-emerald-600 text-white ml-auto rounded-br-md"
                            : "bg-white text-slate-800 rounded-bl-md border border-slate-200"
                        }
                      `}
                    >
                      <p>{msg.text}</p>

                      {msg.sender === "ai" && (
                        <div className="flex justify-end gap-3 mt-2 text-[11px] text-slate-500">
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="flex items-center gap-1 hover:text-slate-800 transition-colors"
                            title="Copiar resposta do Buzzy"
                            disabled={copiedMessageId === msg.id}
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check size={14} /> Copiado
                              </>
                            ) : (
                              <>
                                <Copy size={14} /> Copiar
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.sender === "user" && <UserAvatar />}
                  </div>
                ))}

                {isAiThinking && (
                  <div className="flex items-start gap-3.5">
                    <AiAvatar />
                    <div className="max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-sm bg-white text-slate-500 rounded-bl-md border border-slate-200 animate-pulse text-sm">
                      Buzzy está pensando...
                    </div>
                  </div>
                )}

                {/* REF PARA SCROLL AUTOMÁTICO (DENTRO DA ÁREA QUE ROLA) */}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* INPUT FIXO NO RODAPÉ DO CARD (NÃO ROLA) */}
            <div className="border-t border-slate-100 px-3 sm:px-5 py-3 sm:py-4 bg-white rounded-b-2xl">
              <form
                onSubmit={handleSendMessage}
                className="
                  flex items-end gap-3
                  bg-slate-50 border border-slate-300
                  rounded-xl px-3 py-2
                  focus-within:bg-white
                  focus-within:ring-2 focus-within:ring-emerald-500/70
                  focus-within:border-emerald-500
                "
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={placeholderInput}
                  rows={1}
                  className="
                    flex-1 px-1.5 py-1 border-none resize-none
                    focus:ring-0 outline-none text-sm bg-transparent
                    max-h-28
                  "
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={isAiThinking}
                />
                <button
                  type="submit"
                  className="
                    inline-flex items-center justify-center
                    bg-emerald-600 text-white
                    px-3.5 py-2.5 rounded-xl
                    hover:bg-emerald-700
                    disabled:bg-emerald-300 disabled:cursor-not-allowed
                    transition-colors
                    text-sm font-semibold
                  "
                  disabled={!inputText.trim() || isAiThinking}
                  title="Enviar mensagem para o Buzzy"
                >
                  <Send size={18} className="mr-1.5" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
              <p className="mt-1 text-[10px] text-slate-400">
                Pressione <span className="font-semibold">Enter</span> para
                enviar ou <span className="font-semibold">Shift + Enter</span>{" "}
                para quebrar linha.
              </p>
            </div>
          </div>

          {/* ASIDE DE SUGESTÕES */}
          <aside
            className="
              bg-white border border-slate-200 shadow-sm rounded-2xl
              p-4 sm:p-5 flex flex-col gap-4
              h-full overflow-hidden
            "
          >
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                Sugestões do Buzzy
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                Use atalhos prontos ou fluxos guiados para o Buzzy executar
                ações no TrackPass sem você precisar escrever tudo.
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Fluxos guiados
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={iniciarFluxoCriarPonto}
                    className="
                      text-left text-xs sm:text-sm
                      px-3 py-2
                      rounded-xl
                      bg-emerald-50 hover:bg-emerald-100
                      border border-emerald-100
                      text-emerald-800
                      transition-colors
                      font-semibold
                    "
                  >
                    Criar ponto de embarque
                  </button>
                  <button
                    type="button"
                    onClick={iniciarFluxoCriarRota}
                    className="
                      text-left text-xs sm:text-sm
                      px-3 py-2
                      rounded-xl
                      bg-emerald-50 hover:bg-emerald-100
                      border border-emerald-100
                      text-emerald-800
                      transition-colors
                      font-semibold
                    "
                  >
                    Criar rota
                  </button>
                  <button
                    type="button"
                    onClick={iniciarFluxoAtribuirPontoRota}
                    className="
                      text-left text-xs sm:text-sm
                      px-3 py-2
                      rounded-xl
                      bg-emerald-50 hover:bg-emerald-100
                      border border-emerald-100
                      text-emerald-800
                      transition-colors
                      font-semibold
                    "
                  >
                    Atribuir ponto à rota
                  </button>
                 
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Rotas
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    "Quantas rotas ativas tenho hoje?",
                    "Quantas rotas cadastradas tenho no total?",
                    "Qual rota tem mais colaboradores?",
                    "Qual rota tem mais embarques hoje?",
                    "Quantos colaboradores estão na rota A de manhã?",
                  ].map((texto) => (
                    <button
                      key={texto}
                      type="button"
                      onClick={() => dispararSugestao(texto)}
                      className="
                        text-left text-xs sm:text-sm
                        px-3 py-2
                        rounded-xl
                        bg-slate-50 hover:bg-slate-100
                        border border-slate-100
                        text-slate-700
                        transition-colors
                      "
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Pontos de embarque
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    "Como criar um ponto de embarque?",
                    "Como atribuir um ponto a uma rota?",
                  ].map((texto) => (
                    <button
                      key={texto}
                      type="button"
                      onClick={() => dispararSugestao(texto)}
                      className="
                        text-left text-xs sm:text-sm
                        px-3 py-2
                        rounded-xl
                        bg-slate-50 hover:bg-slate-100
                        border border-slate-100
                        text-slate-700
                        transition-colors
                      "
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
