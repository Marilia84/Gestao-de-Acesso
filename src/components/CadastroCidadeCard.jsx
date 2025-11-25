import React from "react";
import Loading from "../components/Loading";

export default function CadastroCidadeCard({
  novaCidade,
  setNovaCidade,
  novaUf,
  setNovaUf,
  onSubmit,
  loading,
}) {
  return (
    <div className="relative bg-white border border-slate-200 shadow-sm rounded-md p-5 md:p-7 min-h-[190px]">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md z-10">
          <Loading size={70} message="" />
        </div>
      )}

      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-semibold text-[#625B62] uppercase">
          Cadastrar cidade
        </h2>
        <p className="text-xs text-slate-500">
          Adicione novas cidades para vincular aos pontos e rotas.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-slate-700">
            Nome da cidade
          </label>
          <input
            type="text"
            placeholder="Ex: São Joaquim da Barra"
            value={novaCidade}
            onChange={(e) => setNovaCidade(e.target.value)}
            className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-md px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-20">
            <label className="text-xs font-medium text-slate-700">UF</label>
            <input
              type="text"
              placeholder="SP"
              maxLength={2}
              value={novaUf}
              onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
              className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-md px-3 py-2 text-sm text-center uppercase text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={loading}
            className="mt-6 md:mt-auto bg-[#19A873] hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold w-full md:w-40 px-4 py-2.5 rounded-md flex items-center justify-center gap-2 transition"
          >
            {loading ? "Salvando..." : "Adicionar cidade"}
          </button>
        </div>
      </div>
    </div>
  );
}
