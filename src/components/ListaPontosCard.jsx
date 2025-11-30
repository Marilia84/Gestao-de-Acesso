// src/components/ListaPontosCard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { toast } from "react-toastify";
import { Pencil, Trash2, X, Check } from "lucide-react";
import PinIcon from "../assets/icon1.png";
import api from "../api/axios";

export default function ListaPontosCard({ pontos, loadingListaPontos }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("az"); // az | za
  const [cidadeFiltro, setCidadeFiltro] = useState(""); // idCidade selecionada

  const [cidades, setCidades] = useState([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // cópia local para manipular após editar / deletar
  const [pontosLocais, setPontosLocais] = useState([]);

  // modal de edição
  const [editModalAberto, setEditModalAberto] = useState(false);
  const [pontoEditando, setPontoEditando] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editEndereco, setEditEndereco] = useState("");
  const [editCidadeId, setEditCidadeId] = useState("");
  const [salvando, setSalvando] = useState(false);

  // modal de delete
  const [deleteModalAberto, setDeleteModalAberto] = useState(false);
  const [pontoDeletando, setPontoDeletando] = useState(null);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    if (Array.isArray(pontos)) {
      setPontosLocais(pontos);
    } else {
      setPontosLocais([]);
    }
  }, [pontos]);

  useEffect(() => {
    const fetchCidades = async () => {
      try {
        setLoadingCidades(true);
        const response = await api.get("/cidades");
        setCidades(response.data || []);
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
      } finally {
        setLoadingCidades(false);
      }
    };

    fetchCidades();
  }, []);

  const cidadesMap = useMemo(() => {
    if (!Array.isArray(cidades)) return new Map();
    return new Map(cidades.map((c) => [c.idCidade, c]));
  }, [cidades]);

  const getCidadeIdFromPonto = (ponto) =>
    ponto.idCidade ??
    ponto.id_cidade ??
    ponto.cidade?.idCidade ??
    ponto.cidade_id;

  const getPontoId = (ponto) =>
    ponto.idPonto ?? ponto.id_ponto ?? ponto.id ?? ponto.id_pontos;

  const filteredPontos = useMemo(() => {
    if (!Array.isArray(pontosLocais)) return [];

    let lista = [...pontosLocais];

    if (cidadeFiltro) {
      lista = lista.filter((p) => {
        const idCidade = getCidadeIdFromPonto(p);
        if (idCidade == null) return false;
        return String(idCidade) === cidadeFiltro;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome?.toLowerCase().includes(term) ||
          p.endereco?.toLowerCase().includes(term)
      );
    }

    lista.sort((a, b) => {
      const nomeA = (a.nome || "").toLowerCase();
      const nomeB = (b.nome || "").toLowerCase();

      if (order === "za") return nomeB.localeCompare(nomeA);
      return nomeA.localeCompare(nomeB);
    });

    return lista;
  }, [pontosLocais, searchTerm, order, cidadeFiltro]);

  const getCidadeLabel = (ponto) => {
    const idCidade = getCidadeIdFromPonto(ponto);
    const cidade = cidadesMap.get(idCidade);

    if (!cidade) return "Cidade não localizada";
    return `${cidade.nome} - ${cidade.uf}`;
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCidadeFiltro("");
    setOrder("az");
  };

  const hasActiveFilters =
    searchTerm.trim() || cidadeFiltro || order !== "az";

  // ==== EDIÇÃO ====

  const abrirModalEdicao = (ponto) => {
    const idCidade = getCidadeIdFromPonto(ponto);

    setPontoEditando(ponto);
    setEditNome(ponto.nome || "");
    setEditEndereco(ponto.endereco || "");
    setEditCidadeId(idCidade ? String(idCidade) : "");
    setEditModalAberto(true);
  };

  const fecharModalEdicao = () => {
    if (salvando) return;
    setEditModalAberto(false);
    setPontoEditando(null);
    setEditNome("");
    setEditEndereco("");
    setEditCidadeId("");
  };

  const handleSalvarEdicao = async () => {
    if (!pontoEditando) return;

    const id = getPontoId(pontoEditando);
    if (!id) {
      toast.error("ID do ponto não encontrado.");
      return;
    }

    if (!editNome.trim()) {
      toast.warn("Informe o nome do ponto.");
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        nome: editNome.trim(),
        endereco: editEndereco.trim(),
      };

      if (editCidadeId) {
        payload.idCidade = Number(editCidadeId);
      }

      await api.put(`/pontos/${id}`, payload);

      // atualiza lista local
      setPontosLocais((prev) =>
        prev.map((p) =>
          getPontoId(p) === id
            ? {
                ...p,
                nome: payload.nome,
                endereco: payload.endereco,
                idCidade: payload.idCidade ?? getCidadeIdFromPonto(p),
              }
            : p
        )
      );

      toast.success("Ponto atualizado com sucesso.");
      fecharModalEdicao();
    } catch (error) {
      console.error("Erro ao atualizar ponto:", error);
      toast.error("Erro ao atualizar ponto. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  // ==== DELETE ====

  const abrirModalDelete = (ponto) => {
    setPontoDeletando(ponto);
    setDeleteModalAberto(true);
  };

  const fecharModalDelete = () => {
    if (deletando) return;
    setDeleteModalAberto(false);
    setPontoDeletando(null);
  };

  const handleConfirmarDelete = async () => {
    if (!pontoDeletando) return;
    const id = getPontoId(pontoDeletando);
    if (!id) {
      toast.error("ID do ponto não encontrado.");
      return;
    }

    try {
      setDeletando(true);
      await api.delete(`/pontos/${id}`);

      setPontosLocais((prev) => prev.filter((p) => getPontoId(p) !== id));

      toast.success("Ponto excluído com sucesso.");
      fecharModalDelete();
    } catch (error) {
      console.error("Erro ao excluir ponto:", error);
      toast.error("Erro ao excluir ponto. Tente novamente.");
    } finally {
      setDeletando(false);
    }
  };

  return (
    <div className="relative bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 md:p-6 flex flex-col h-full min-h-[500px]">
      {loadingListaPontos && (!pontosLocais || pontosLocais.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-2xl">
          <DotLottieReact
            src="https://lottie.host/92a335e7-724d-44df-a65e-30c7025c8516/xC1YOtonin.lottie"
            loop
            autoplay
            style={{ width: 220, height: 220 }}
          />
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-semibold text-slate-900">
            Pontos cadastrados
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Visualize e filtre os pontos por cidade, nome e endereço.
          </p>
        </div>
      </header>

      {/* FILTROS */}
      <section className="mb-4">
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl px-3 py-3 md:px-4 md:py-3 flex flex-col gap-3">
          {/* Linha 1: busca + ordenação */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            {/* Busca */}
            <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)] focus-within:ring-2 focus-within:ring-emerald-500/60 focus-within:border-emerald-500/70 transition">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-slate-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou endereço..."
                className="w-full bg-transparent outline-none text-xs md:text-sm text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Ordenação como “segmented control” */}
            <div className="flex md:w-52 bg-white rounded-xl border border-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.03)] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setOrder("az")}
                className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 transition ${
                  order === "az"
                    ? "bg-emerald-500 text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="hidden sm:inline">A → Z</span>
                <span className="sm:hidden">A-Z</span>
              </button>
              <button
                type="button"
                onClick={() => setOrder("za")}
                className={`flex-1 px-3 py-2 flex items-center justify-center gap-1 border-l border-slate-200 transition ${
                  order === "za"
                    ? "bg-emerald-500 text-white"
                    : "bg-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="hidden sm:inline">Z → A</span>
                <span className="sm:hidden">Z-A</span>
              </button>
            </div>
          </div>

          {/* Linha 2: filtro de cidade + limpar filtros */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {/* Filtro de cidade simples / normal */}
            <div className="flex-1">
              <label className="block mb-1 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Cidade
              </label>
              <select
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
                disabled={loadingCidades}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
              >
                <option value="">
                  {loadingCidades
                    ? "Carregando cidades..."
                    : "Todas as cidades"}
                </option>
                {cidades.map((cidade) => (
                  <option key={cidade.idCidade} value={String(cidade.idCidade)}>
                    {cidade.nome} - {cidade.uf}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3.5 py-1.5 text-[11px] md:text-xs font-medium text-emerald-700 shadow-sm hover:bg-emerald-100 hover:border-emerald-200 hover:text-emerald-800 transition"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5 text-emerald-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M3 4a1 1 0 0 1 1-1h12a1 1 0 0 1 .8 1.6L13 10v4.382a1 1 0 0 1-1.447.894l-2-1A1 1 0 0 1 9 13.382V10L3.2 4.6A1 1 0 0 1 3 4z" />
                  </svg>
                </span>
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* LISTA */}
      <div className="flex-1 flex flex-col max-h-[500px] overflow-y-auto pr-1 space-y-2">
        {filteredPontos.map((ponto) => (
          <div
            key={getPontoId(ponto)}
            className="border border-slate-200 rounded-xl px-3.5 py-2.5 hover:bg-slate-50 transition flex items-start gap-3"
          >
            <img src={PinIcon} alt="Pin" className="w-10 h-10 flex-shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">
                {ponto.nome}
              </p>
              <p className="text-xs text-slate-500 break-words">
                {ponto.endereco}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {loadingCidades ? "Carregando cidade..." : getCidadeLabel(ponto)}
              </p>
            </div>

            {/* AÇÕES - ÍCONES À DIREITA */}
            <div className="flex flex-col items-end gap-1 ml-2">
              <button
                type="button"
                onClick={() => abrirModalEdicao(ponto)}
                className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-transparent hover:border-emerald-100 transition"
                title="Editar ponto"
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => abrirModalDelete(ponto)}
                className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-transparent hover:border-rose-100 transition"
                title="Excluir ponto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {!filteredPontos.length && !loadingListaPontos && (
          <p className="text-sm text-slate-400 text-center py-6">
            Nenhum ponto encontrado com os filtros atuais.
          </p>
        )}
      </div>

      {/* MODAL EDIÇÃO */}
      {editModalAberto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900">
                  Editar ponto
                </h3>
                <p className="text-xs md:text-sm text-slate-500">
                  Atualize as informações do ponto selecionado.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalEdicao}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome do ponto
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Endereço
                </label>
                <textarea
                  value={editEndereco}
                  onChange={(e) => setEditEndereco(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Cidade
                </label>
                <select
                  value={editCidadeId}
                  onChange={(e) => setEditCidadeId(e.target.value)}
                  disabled={loadingCidades}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                >
                  <option value="">
                    {loadingCidades
                      ? "Carregando cidades..."
                      : "Selecione uma cidade"}
                  </option>
                  {cidades.map((cidade) => (
                    <option
                      key={cidade.idCidade}
                      value={String(cidade.idCidade)}
                    >
                      {cidade.nome} - {cidade.uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={fecharModalEdicao}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs md:text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarEdicao}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs md:text-sm font-medium hover:bg-emerald-700 disabled:opacity-70"
              >
                <Check className="w-4 h-4" />
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteModalAberto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900">
                  Excluir ponto
                </h3>
                <p className="text-xs md:text-sm text-slate-500">
                  Tem certeza que deseja excluir este ponto? Essa ação não pode
                  ser desfeita.
                </p>
              </div>
              <button
                type="button"
                onClick={fecharModalDelete}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
              {pontoDeletando?.nome && (
                <p>
                  Ponto:{" "}
                  <span className="font-semibold">{pontoDeletando.nome}</span>
                </p>
              )}
              {pontoDeletando?.endereco && (
                <p className="truncate">
                  Endereço: {pontoDeletando.endereco}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={fecharModalDelete}
                disabled={deletando}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs md:text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarDelete}
                disabled={deletando}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 text-white px-4 py-1.5 text-xs md:text-sm font-medium hover:bg-rose-700 disabled:opacity-70"
              >
                <Trash2 className="w-4 h-4" />
                {deletando ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
