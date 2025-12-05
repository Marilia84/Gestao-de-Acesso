// src/components/ImpedimentoDetalhes.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Loading from "./Loading";
import { AlertTriangle } from "lucide-react";

export default function ImpedimentoDetalhes({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadDetalhe() {
    if (!id) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/impedimentos/${id}/detalhado`);
      setData(res.data);
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetalhe();
  }, [id]);

  if (!id) {
    return (
      <div className="p-4 text-xs text-slate-500 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-slate-500" />
        Selecione um impedimento para visualizar os detalhes.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loading size={70} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-xs text-slate-500">
        Não foi possível carregar os detalhes.
      </div>
    );
  }

  const motivoFmt = data.motivo?.replace(/_/g, " ");

  const badgeSeveridade = {
    ALTA: "bg-rose-100 text-rose-800 border-rose-200",
    MÉDIA: "bg-amber-100 text-amber-800 border-amber-200",
    MEDIA: "bg-amber-100 text-amber-800 border-amber-200",
    BAIXA: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const temColaboradores =
    Array.isArray(data.colaboradores) && data.colaboradores.length > 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-[13px] text-slate-800">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex flex-col">
          <span className="text-[11px] tracking-[0.08em] uppercase text-slate-500">
            Detalhes do impedimento
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {motivoFmt || "Motivo não informado"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {data.severidade && (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md border text-[11px] font-semibold ${
                badgeSeveridade[data.severidade] ||
                "bg-slate-100 text-slate-800 border-slate-200"
              }`}
            >
              Severidade {data.severidade}
            </span>
          )}
          {data.status && (
            <span className="inline-flex items-center px-3 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-700">
              {data.status}
            </span>
          )}
        </div>
      </div>

      {/* BLOCO PRINCIPAL – CAMPOS */}
      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
              Rota
            </span>
            <span className="text-[13px] font-medium text-slate-900">
              {data.rotaNome || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
              Motorista
            </span>
            <span className="text-[13px] font-medium text-slate-900">
              {data.motoristaNome || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
              Data / hora do ocorrido
            </span>
            <span className="text-[13px] text-slate-800">
              {data.ocorridoEm
                ? new Date(data.ocorridoEm).toLocaleString("pt-BR")
                : "—"}
            </span>
          </div>
        </div>

        {/* DESCRIÇÃO */}
        {data.descricao && (
          <div className="border border-slate-200 rounded-lg bg-slate-50 px-3 py-2.5">
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
              Descrição
            </span>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-800">
              {data.descricao}
            </p>
          </div>
        )}

        {/* COLABORADORES – TABELA ESTILO INVOICE */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">
                Colaboradores afetados
              </span>
              <span className="text-[12px] text-slate-600">
                {temColaboradores
                  ? `${data.colaboradores.length} colaborador(es) vinculados à rota`
                  : "Nenhum colaborador vinculado a este impedimento."}
              </span>
            </div>
          </div>

          {temColaboradores && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-[75px,1.6fr,1fr,1.2fr] bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-500">
                <span>CL</span>
                <span>Colaborador</span>
                <span>Matrícula</span>
              </div>

              {/* Linhas */}
              <div className="bg-white">
                {data.colaboradores.map((c, index) => (
                  <div
                    key={c.idColaborador || c.id || index}
                    className={`grid grid-cols-[75px,1.6fr,1fr,1.2fr] px-4 py-2.5 text-[13px] text-slate-800 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    } hover:bg-slate-100 transition-colors`}
                  >
                    <span className="text-[12px] text-slate-500">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium truncate">
                      {c.nome || "—"}
                    </span>
                    <span className="text-[12px] text-slate-700">
                      {c.matricula || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
