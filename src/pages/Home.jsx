import React, { useState } from "react";
import Navbar from "../components/Navbar"; // Seu componente Navbar

// --- Ícones (Exemplos, use SVGs ou biblioteca de ícones) ---
const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
    U {/* Ou use uma imagem/ícone */}
  </div>
);

const AiAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
    AI {/* Ou use o logo da sua IA */}
  </div>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
// --- Fim dos Ícones ---

export default function Home() {
  // Estado para guardar as mensagens do chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Olá! 👋 Em que posso ajudar hoje com a gestão de transportes ou acesso?",
    },
    // Exemplo de como adicionar mais mensagens:
    // { id: 2, sender: 'user', text: 'Preciso gerar um relatório de acessos da portaria principal de ontem.' },
    // { id: 3, sender: 'ai', text: 'Claro! Gerando o relatório de acessos da Portaria Principal para ontem...' },
  ]);
  // Estado para o input do usuário
  const [inputText, setInputText] = useState("");
  // Estado para indicar se a IA está "pensando"
  const [isAiThinking, setIsAiThinking] = useState(false);

  const handleSendMessage = async (e) => {
    // Tornando a função async
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    const newUserMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedInput,
    };

    // Adiciona a mensagem do usuário imediatamente
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText(""); // Limpa o input
    setIsAiThinking(true); // Mostra que a IA está processando

    // --- SIMULAÇÃO DA CHAMADA À API DA IA ---
    try {
      // Substitua isso pela sua chamada real:
      // const response = await api.post('/chatbot', { message: trimmedInput });
      // const aiText = response.data.reply;

      // Simulação:
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Espera 1.5 segundos
      const aiText = `Entendido! Você pediu para: "${trimmedInput}". Executando a tarefa... (Resposta simulada 🤖)`;
      // Fim da Simulação

      const aiResponse = {
        id: Date.now() + 1, // Garante ID único
        sender: "ai",
        text: aiText,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      console.error("Erro ao comunicar com a IA:", error);
      const errorResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Desculpe, não consegui processar sua solicitação no momento. 😥 Tente novamente mais tarde.",
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsAiThinking(false); // IA terminou de processar
    }
    // --- Fim da Lógica ---
  };

  const handleCopy = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Texto copiado para a área de transferência!"))
      .catch((err) => console.error("Erro ao copiar texto:", err));
  };

  return (
    // Layout principal: Navbar à esquerda, Chat ocupa o restante
    <div className="flex bg-[#F4F7F6] min-h-screen">
      {" "}
      {/* Cor de fundo consistente */}
      {/* Área do Chat (ocupa o espaço restante) */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {" "}
        {/* Previne scroll da página inteira */}
        {/* Histórico de Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {" "}
          {/* Scroll apenas aqui */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.sender === "user" ? "justify-end" : ""
              }`}
            >
              {/* Avatar da IA (à esquerda) */}
              {msg.sender === "ai" && <AiAvatar />}

              {/* Balão de Mensagem */}
              <div
                className={`max-w-xl lg:max-w-2xl p-4 rounded-xl shadow-md ${
                  msg.sender === "user"
                    ? "bg-[#038C4C] text-white ml-auto rounded-br-none" // Estilo User (verde escuro, canto ajustado)
                    : "bg-white text-gray-800 rounded-bl-none" // Estilo AI (branco, canto ajustado)
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {/* Botões de Ação para IA */}
                {msg.sender === "ai" && (
                  <div className="flex justify-end gap-3 mt-2 text-xs text-gray-500">
                    <button
                      onClick={() => handleCopy(msg.text)}
                      className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                      title="Copiar texto"
                    >
                      <CopyIcon /> Copiar
                    </button>
                    {/* Outros botões podem ser adicionados aqui */}
                  </div>
                )}
              </div>

              {/* Avatar do Usuário (à direita) */}
              {msg.sender === "user" && <UserAvatar />}
            </div>
          ))}
          {/* Indicador de "pensando" */}
          {isAiThinking && (
            <div className="flex items-start gap-3.5">
              <AiAvatar />
              <div className="max-w-xl lg:max-w-2xl p-4 rounded-xl shadow-md bg-white text-gray-500 rounded-bl-none animate-pulse">
                <p className="text-sm italic">Digitando...</p>
              </div>
            </div>
          )}
          {/* Espaço no final para não colar no input */}
          <div className="h-4"></div>
        </div>
        {/* Área de Input Fixa na Base */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-[#36A293]"
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte ou peça algo..."
              rows="1"
              className="flex-1 px-2 py-1 border-none resize-none focus:ring-0 outline-none text-sm bg-transparent" // Estilo mais limpo
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={isAiThinking} // Desabilita input enquanto a IA pensa
            />
            <button
              type="submit"
              className="bg-[#038C4C] text-white p-2.5 rounded-lg hover:bg-[#036f4c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputText.trim() || isAiThinking}
              title="Enviar mensagem"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
