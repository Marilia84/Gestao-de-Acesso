import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import api from "../api/axios";
 
export default function GerenciarLinhas() {
  const [cidades, setCidades] = useState([]);
  const [novaCidade, setNovaCidade] = useState("");
  const [novaUf, setNovaUf] = useState("");
  const [pontos, setPontos] = useState([]);
  const [nomePonto, setNomePonto] = useState("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState(""); 
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");

  
  useEffect(() => {

    api
      .get("/cidades") 
      .then((res) => {
        setCidades(res.data); 
      })
      .catch((err) => {
        console.error("Erro ao buscar cidades:", err);
      });
  }, []);

   // Cadastrar cidade
  const handleAdicionarCidade = async () => {
    if (!novaCidade.trim() || !novaUf.trim()) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await api.post("/cidades", {
        nome: novaCidade,
        uf: novaUf.toUpperCase(),
      });

      // Atualiza a lista de cidades sem precisar recarregar
      setCidades([...cidades, response.data]);
      setNovaCidade("");
      setNovaUf("");
      alert("Cidade adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar cidade:", error);
      alert("Erro ao cadastrar cidade.");
    }
  };
   useEffect(() => {
    api
      .get("/pontos")
      .then((res) => setPontos(res.data))
      .catch((err) => console.error("Erro ao buscar pontos:", err));
  }, []);

    const getCoordenadas = async (enderecoCompleto) => {
    const apiKey = "AIzaSyCrNiQt-qPLaFQRKrLJtAeGYMx8eZLB-4U"; // 🔴 troque pela sua chave
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      enderecoCompleto
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      throw new Error("Endereço não encontrado.");
    }
  };

  // Cadastrar ponto
  const handleCadastrarPonto = async () => {
    if (!cidadeSelecionada || !nomePonto.trim() || !rua.trim() || !numero.trim()) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      // Pega nome da cidade pelo ID selecionado
      const cidadeObj = cidades.find((c) => c.idCidade === Number(cidadeSelecionada));
      const enderecoCompleto = `${rua}, ${numero}, ${cidadeObj.nome} - ${cidadeObj.uf}`;

      // Converte o endereço em latitude e longitude
      const { lat, lng } = await getCoordenadas(enderecoCompleto);

      // Cadastra ponto com coordenadas
      const response = await api.post("/pontos", {
        nome: nomePonto,
        endereco: `${rua}, ${numero}`,
        latitude: lat,
        longitude: lng,
        idCidade: cidadeSelecionada,
      });

      setPontos([...pontos, response.data]);
      setNomePonto("");
      setRua("");
      setNumero("");
      alert("Ponto cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar ponto:", error);
      alert("Erro ao cadastrar ponto.");
    }
  };
  
 

  return (
    <div className="bg-[#E5EDE9] min-h-screen flex flex-col lg:flex-row items-start gap-4">
      <Navbar />
      <div className="flex flex-1 flex-col justify-center items-center mr-[10px] w-full">
        <div className="bg-white/10 shadow-md shadow-white rounded-[50px] min-h-[1000px] w-[95%] mb-10 mt-10 p-10">
          <h1 className="text-3xl font-bold mb-10 text-black text-center">
            GERENCIAMENTO DE LINHAS
          </h1>
 
          {/* GRID DE CADASTRO DE PONTOS E ROTAS */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            {/* CADASTRAR PONTO */}
            <div className="bg-white shadow-md rounded-lg p-10 w-[600px] h-[615px]">
              <h1 className="text-xl font-semibold mb-4">Cadastrar ponto</h1>
              <p className="text-sm text-gray-600 mb-4">
                Adicione novos pontos de parada com geolocalização automática
              </p>
 
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Nova cidade"
                  value={novaCidade}
                  onChange={(e) => setNovaCidade(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-3 w-full text-base"
                />
                <input
                  type="text"
                  placeholder="UF"
                  maxLength={2}
                  value={novaUf}
                  onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
                  className="border border-gray-500 rounded-lg px-4 py-3 w-24 text-base text-center uppercase"
                />
                <button
                  onClick={handleAdicionarCidade}
                  className="bg-[#038C3E] text-white w-40 px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#027a36] transition"
                >
                  Adicionar
                </button>
              </div>
 
              <div className="flex flex-col mb-4">
                <label htmlFor="cidade" className="text-sm font-semibold text-gray-800 mb-1">
                  Cidade
                </label>

                <select
                  id="cidade"
                  className="border border-gray-500 rounded-md px-3 py-2 text-sm text-gray-600"
                   onChange={(e) => setCidadeSelecionada(e.target.value)}
                 
                >
                  <option value="">Selecione</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.idCidade} value={cidade.idCidade}>
                      {cidade.nome} - {cidade.uf}
                   </option>
                  ))}
                </select>
              </div>
 
              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-gray-800 mb-1">Nome do Ponto</label>
                <input
                  className="border border-gray-500 rounded-lg p-2 mb-3 w-full text-sm"
                  placeholder="Nome do ponto"
                  value={nomePonto}
                  onChange={(e) => setNomePonto(e.target.value)}
                />
              </div>
 
              <div className="flex flex-col mb-4">
                <div className="flex gap-4">
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-semibold text-gray-800 mb-1">Rua</label>
                    <input className="border border-gray-500 rounded-lg p-2 w-full text-sm" placeholder="Rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)} />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-semibold text-gray-800 mb-1">Número</label>
                    <input className="border border-gray-500 rounded-lg p-2 w-full text-sm" placeholder="Número" 
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)} />
                  </div>
                </div>
              </div>
 
             
 
              <button className="bg-[#038C3E] text-white w-full py-4 text-lg rounded-lg flex items-center justify-center gap-3 hover:bg-[#027a36] transition
              "onClick={handleCadastrarPonto}>
                <img src="src/assets/map-pin.svg" alt="location" className="w-6 h-6" />
                Cadastrar Ponto
              </button>
            </div>
 
            {/* PONTOS CADASTRADOS */}
            <div className="bg-white shadow-md rounded-lg p-10 w-[600px] h-[615px]">
              <h1 className="text-xl font-semibold mb-4">Pontos cadastrados</h1>
              <p className="text-sm text-gray-600 mb-4">Lista de todos os pontos</p>
              <div className="flex flex-col gap-3">
                 {pontos.map((ponto, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <img src="src/assets/map-pin.svg" alt="ponto" className="w-5 h-5" />
                      <span>{ponto.nome}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-yellow-400 p-1 rounded">
                        <img src="src/assets/editar.svg" alt="editar" className="w-4 h-4" />
                      </button>
                      <button className="bg-red-500 text-white p-1 rounded">
                        <img src="src/assets/deletar.svg" alt="deletar" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
       
        </div>
      </div>
    </div>
  );
}