import React from "react";
import Loading from "../components/Loading";

export default function CadastroPontoCard({
  cidades,
  cidadeSelecionada,
  setCidadeSelecionada,
  nomePonto,
  setNomePonto,
  rua,
  setRua,
  numero,
  setNumero,
  onSubmit,
  loading,
}) {
  return (
    <div className="relative bg-white border border-slate-200 shadow-sm rounded-md p-5 md:p-7 min-h-[260px]">
      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-md z-10">
          <Loading size={70} message="" />
        </div>
      )}

      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-semibold  text-[#625B62] uppercase">
          Cadastrar ponto
        </h2>
        <p className="text-xs text-slate-500">
          Adicione novos pontos de parada com geolocalização automática.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            Cidade do ponto
          </label>
          <select
            value={cidadeSelecionada}
            onChange={(e) => setCidadeSelecionada(e.target.value)}
            className="border border-slate-300 rounded-md px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/70"
          >
            <option value="">Selecione uma cidade</option>
            {cidades.map((cidade) => (
              <option key={cidade.idCidade} value={cidade.idCidade}>
                {cidade.nome} - {cidade.uf}
              </option>
            ))}
          </select>

        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            Nome do ponto
          </label>
          <input
            className="border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/70 rounded-md px-3.5 py-2.5 text-sm"
            placeholder="Ex: Portaria Principal"
            value={nomePonto}
            onChange={(e) => setNomePonto(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col flex-1 gap-1">
            <label className="text-xs font-medium text-slate-700">Rua</label>
            <input
              className="border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-3.5 py-2.5 text-sm"
              placeholder="Ex: Rua José Roberto Mioto"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
            />
          </div>

          <div className="flex flex-col w-full md:w-32 gap-1">
            <label className="text-xs font-medium text-slate-700">
              Número
            </label>
            <input
              className="border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 rounded-md px-3.5 py-2.5 text-sm"
              placeholder="Ex: 123"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="w-full flex justify-end mt-6">
        <button
          className="
            mt-0
            bg-[#19A873] hover:bg-emerald-700 disabled:bg-emerald-400
            text-white w-full
            py-2.5
            text-sm sm:text-base font-semibold
            rounded-md
            flex items-center justify-center gap-3
            transition-colors
        "
        >
          {loading ? "Cadastrando..." : "Cadastrar ponto"}
        </button>
      </div>
    </div>
  );
}
