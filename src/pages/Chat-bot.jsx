import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Send, Copy, Check, User, Bot } from "lucide-react"; 
import api from "../api/axios";
import botIcon from "../assets/bot.jpg";

const UserAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 shrink-0">
    <User size={20} />
  </div>
);

const AiAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 shrink-0">
    <img src={botIcon} alt="AI Bot" className="w-8 h-8 rounded-full" />
  </div>
);

export default function Home() {
 
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Olá! 👋 Em que posso ajudar hoje com a gestão de transportes ou acesso?",
    },
  ]);
  
  const [inputText, setInputText] = useState("");
  
  const [isAiThinking, setIsAiThinking] = useState(false);
 
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  
  const chatEndRef = useRef(null);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    const newUserMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedInput,
    };

   
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputText("");
    setIsAiThinking(true);

   
    try {
      const response = await api.get("/chat", {
        params: {
          mensagem: trimmedInput,
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
      console.error("Erro ao comunicar com a IA:", error);
      const errorResponse = {
        id: Date.now() + 1,
        sender: "ai",
        text: "Desculpe, não consegui processar sua solicitação no momento. 😥 Tente novamente mais tarde.",
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);

     
      toast.error("Desculpe, não consegui processar sua solicitação. 😥");
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

      
      toast.success("Texto copiado!");
    } catch (err) {
      console.error("Falha ao copiar texto:", err);
      
      toast.error("Falha ao copiar o texto.");
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="flex bg-[#F4F7F6] min-h-screen ml-20">
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 ${
                msg.sender === "user" ? "justify-end" : ""
              }`}
            >
              {msg.sender === "ai" && <AiAvatar />}

              <div
                className={`max-w-xl lg:max-w-2xl p-4 rounded-xl shadow-md ${
                  msg.sender === "user"
                    ? "bg-[#038C4C] text-white ml-auto rounded-br-none" 
                    : "bg-white text-gray-800 rounded-bl-none" 
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
                {msg.sender === "ai" && (
                  <div className="flex justify-end gap-3 mt-2 text-xs text-gray-500">
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                      title="Copiar texto"
                      disabled={copiedMessageId === msg.id} 
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check size={16} /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copiar
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
              <div className="max-w-xl lg:max-w-2xl p-4 rounded-xl shadow-md bg-white text-gray-500 rounded-bl-none animate-pulse">
                <p className="text-sm italic">Digitando...</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

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
              className="flex-1 px-2 py-1 border-none resize-none focus:ring-0 outline-none text-sm bg-transparent"
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
              className="bg-[#038C4C] text-white p-2.5 rounded-lg hover:bg-[#036f4c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputText.trim() || isAiThinking}
              title="Enviar mensagem"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
