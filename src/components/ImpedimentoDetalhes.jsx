// src/components/ImpedimentoDetalhes.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Loading from "./Loading";
import {
  AlertTriangle,
  Bus,
  User,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ImpedimentoDetalhes({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showColaboradores, setShowColaboradores] = useState(false);

  async function loadDetalhe() {
    if (!id) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/impedimentos/${id}/detalhado`);
      setData(res.data);
      setShowColaboradores(false); // reseta ao trocar de impedimento
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
        <AlertTriangle className="w-4 h-4 text-amber-500" />
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

  const badgeSeveridade = {
    ALTA: "bg-red-50 text-red-700 border-red-200",
    MÉDIA: "bg-amber-50 text-amber-700 border-amber-200",
    MEDIA: "bg-amber-50 text-amber-700 border-amber-200",
    BAIXA: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const motivoFmt = data.motivo?.replace(/_/g, " ");
  const temColaboradores =
    Array.isArray(data.colaboradores) && data.colaboradores.length > 0;

  return (
    <div className="space-y-4 text-[13px] text-slate-800">
      {/* BANNER SUPERIOR */}
      <div className="rounded-xl border border-gray-300  px-3.5 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-gray-600">
              Impedimento selecionado
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {motivoFmt || "Motivo não informado"}
            </span>
            {data.ocorridoEm && (
              <span className="flex items-center gap-1 text-[11px] text-slate-600 mt-1">
                <Clock size={13} className="text-slate-500" />
                {new Date(data.ocorridoEm).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </div>

        <span
          className={`
            inline-flex items-center justify-center
            px-3 py-1 text-[11px] font-semibold rounded-full border
            ${badgeSeveridade[data.severidade] || "bg-slate-50 text-slate-700 border-slate-200"}
          `}
        >
          {data.severidade ? `Severidade ${data.severidade}` : "Severidade —"}
        </span>
      </div>

      {/* BLOCO DE INFORMAÇÕES PRINCIPAIS */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">Rota</span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <Bus size={15} className="text-slate-500" />
              {data.rotaNome || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] text-slate-500">Motorista</span>
            <span className="font-medium text-slate-800">
              {data.motoristaNome || "—"}
            </span>
          </div>

         

          {data.status && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-slate-500">Status</span>
              <span className="inline-flex w-max px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white border border-slate-200 text-slate-700">
                {data.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* DESCRIÇÃO */}
      {data.descricao && (
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
          <span className="text-[11px] text-slate-500">Descrição</span>
          <p className="text-slate-700 mt-1.5 leading-relaxed text-[13px]">
            {data.descricao}
          </p>
        </div>
      )}

      {/* COLABORADORES - COM BOTÃO PARA VER LISTA */}
      <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <Users size={16} className="text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">
                Colaboradores afetados
              </span>
              <span className="text-[11px] text-slate-500">
                {temColaboradores
                  ? `${data.colaboradores.length} colaborador(es) vinculados à rota`
                  : "Nenhum colaborador vinculado a este impedimento."}
              </span>
            </div>
          </div>

          {temColaboradores && (
            <button
              type="button"
              onClick={() => setShowColaboradores((prev) => !prev)}
              className="
                inline-flex items-center gap-1.5
                px-3 py-1 rounded-full text-[11px] font-medium
                border border-slate-200 bg-slate-50 text-slate-700
                hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50
                transition-colors
              "
            >
              {showColaboradores ? "Ocultar lista" : "Ver lista"}
              {showColaboradores ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
          )}
        </div>

        {temColaboradores && showColaboradores && (
          <ul className="space-y-2 mt-3">
            {data.colaboradores.map((c) => (
              <li
                key={c.idColaborador || c.id}
                className="
                  bg-slate-50 border border-slate-200 rounded-lg
                  px-3 py-2 flex justify-between items-center
                "
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-slate-800">
                      {c.nome}
                    </span>
                    {c.matricula && (
                      <span className="text-[11px] text-slate-500">
                        Matrícula: {c.matricula}
                      </span>
                    )}
                  </div>
                </div>

                {c.cargo && (
                  <span className="text-[11px] text-slate-500">{c.cargo}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
