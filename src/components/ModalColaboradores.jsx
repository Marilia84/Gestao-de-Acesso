// src/components/ModalColaboradores.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ModalColaboradores({ open, onClose, rota }) {
  const [tab, setTab] = useState("colabs"); // "colabs" | "add"
  const [loading, setLoading] = useState(false);

  // dados base
  const [pontos, setPontos] = useState([]); // [{idPonto, nome, ordem}]
  const [colabs, setColabs] = useState([]); // [{idColaborador, nome, matricula, idPonto, role?}]

  // líderes ativos (idColaborador[])
  const [lideres, setLideres] = useState([]);

  // filtros aba 1
  const [q, setQ] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // todos | lideres | colaboradores
  const [filtroPontoId, setFiltroPontoId] = useState("todos"); // "todos" | id

  // adicionar aba 2
  const [buscaAdd, setBuscaAdd] = useState("");
  const [resultAdd, setResultAdd] = useState([]);
  const [pontoAddId, setPontoAddId] = useState("");

  useEffect(() => {
    if (!open || !rota?.idRota) return;
    (async () => {
      setLoading(true);
      try {
        // pontos (trajeto), colaboradores e líderes
        const [traj, cols, lids] = await Promise.all([
          api.get(`/rotas/${rota.idRota}/trajeto`),
          api.get(`/rotas/${rota.idRota}/colaboradores`),
          api.get(`/rotas/${rota.idRota}/lideres`),
        ]);

        const pontosNorm = (traj.data || [])
          .map(p => ({
            idPonto: p.idPonto ?? p.id_ponto,
            nome: p.nomePonto ?? p.nome ?? p.nome_ponto ?? "",
            ordem: Number(p.ordem),
          }))
          .sort((a,b)=> (a.ordem ?? 0) - (b.ordem ?? 0));

        const lideresIds = (lids.data || []).map(l => l.idColaborador ?? l.id_colaborador);

        const colabsNorm = (cols.data || []).map(c => ({
          idColaborador: c.idColaborador ?? c.id_colaborador,
          nome: c.nome,
          matricula: c.matricula,
          idPonto: c.idPonto ?? c.id_ponto ?? null,
          isLider: lideresIds.includes(c.idColaborador ?? c.id_colaborador) || c.role === "LIDER",
          role: c.role, // se vier do back
        }));

        setPontos(pontosNorm);
        setColabs(colabsNorm);
        setLideres(lideresIds);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, rota?.idRota]);

  const pontosById = useMemo(() => {
    const m = new Map();
    pontos.forEach(pt => m.set(pt.idPonto, pt));
    return m;
  }, [pontos]);

  // ordenação: primeiro os alocados no ponto de ordem 1, depois por ordem do ponto, depois por nome
  const colabsFiltrados = useMemo(() => {
    const norm = s => (s || "").normalize?.("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const qn = norm(q);

    let arr = colabs.filter(c => {
      if (qn) {
        const hay = norm(c.nome) + " " + norm(c.matricula || "");
        if (!hay.includes(qn)) return false;
      }
      if (filtroTipo === "lideres" && !c.isLider) return false;
      if (filtroTipo === "colaboradores" && c.isLider) return false;
      if (filtroPontoId !== "todos" && String(c.idPonto || "") !== String(filtroPontoId)) return false;
      return true;
    });

    const ordemPonto = id => {
      if (!id) return 999;
      return pontosById.get(id)?.ordem ?? 999;
    };

    arr.sort((a,b) => {
      const oa = ordemPonto(a.idPonto);
      const ob = ordemPonto(b.idPonto);

      // prioridade p/ quem está no ponto ordem 1
      if (oa === 1 && ob !== 1) return -1;
      if (ob === 1 && oa !== 1) return 1;

      if (oa !== ob) return oa - ob;
      return (a.nome || "").localeCompare(b.nome || "");
    });

    return arr;
  }, [colabs, q, filtroTipo, filtroPontoId, pontosById]);

  // ações
  const refreshColabs = async () => {
    const [cols, lids] = await Promise.all([
      api.get(`/rotas/${rota.idRota}/colaboradores`),
      api.get(`/rotas/${rota.idRota}/lideres`),
    ]);
    const lideresIds = (lids.data || []).map(l => l.idColaborador ?? l.id_colaborador);
    setLideres(lideresIds);
    setColabs((cols.data || []).map(c => ({
      idColaborador: c.idColaborador ?? c.id_colaborador,
      nome: c.nome,
      matricula: c.matricula,
      idPonto: c.idPonto ?? c.id_ponto ?? null,
      isLider: lideresIds.includes(c.idColaborador ?? c.id_colaborador) || c.role === "LIDER",
      role: c.role,
    })));
  };

  const handleToggleLeader = async (c) => {
    // optimistic
    setColabs(prev => prev.map(x => x.idColaborador === c.idColaborador ? { ...x, isLider: !x.isLider, role: !x.isLider ? "LIDER" : "COLABORADOR" } : x));
    try {
      if (!c.isLider) {
        await api.put(`/rotas/${rota.idRota}/lideres/${c.idColaborador}`);
      } else {
        await api.delete(`/rotas/${rota.idRota}/lideres/${c.idColaborador}`);
      }
      await refreshColabs();
    } catch (e) {
      // rollback, se falhar
      setColabs(prev => prev.map(x => x.idColaborador === c.idColaborador ? { ...x, isLider: c.isLider, role: c.role } : x));
      console.error(e);
      alert("Não foi possível atualizar a liderança.");
    }
  };

  const handleMoveColab = async (c, novoPontoId) => {
    const prev = [...colabs];
    setColabs(prev.map(x => x.idColaborador === c.idColaborador ? { ...x, idPonto: novoPontoId || null } : x));
    try {
      await api.put(`/rotas/${rota.idRota}/colaboradores/${c.idColaborador}`, { idPonto: Number(novoPontoId) });
      await refreshColabs();
    } catch (e) {
      setColabs(prev);
      console.error(e);
      alert("Não foi possível mover o colaborador para o ponto selecionado.");
    }
  };

  const handleRemoveColab = async (c) => {
    const ok = confirm(`Desvincular ${c.nome} desta rota?`);
    if (!ok) return;
    const prev = [...colabs];
    setColabs(prev.filter(x => x.idColaborador !== c.idColaborador));
    try {
      await api.delete(`/rotas/${rota.idRota}/colaboradores/${c.idColaborador}`);
      await refreshColabs();
    } catch (e) {
      setColabs(prev);
      console.error(e);
      alert("Não foi possível desvincular.");
    }
  };

  const handleSearchGlobais = async (txt) => {
    setBuscaAdd(txt);
    if (!txt.trim()) {
      setResultAdd([]);
      return;
    }
    try {
      const r = await api.get(`/colaboradores?query=${encodeURIComponent(txt)}`);
      setResultAdd(r.data || []);
    } catch (e) {
      console.error(e);
      setResultAdd([]);
    }
  };

  const handleAddColab = async (idColaborador) => {
    if (!pontoAddId) {
      alert("Escolha um ponto da rota para adicionar.");
      return;
    }
    try {
      await api.put(`/rotas/${rota.idRota}/colaboradores/${idColaborador}`, { idPonto: Number(pontoAddId) });
      setBuscaAdd("");
      setResultAdd([]);
      setPontoAddId("");
      setTab("colabs");
      await refreshColabs();
    } catch (e) {
      console.error(e);
      alert("Não foi possível adicionar o colaborador.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#3B7258]">
              Colaboradores — {rota?.nome}
            </h2>
            <p className="text-xs text-gray-500">
              {rota?.cidade?.nome ? `${rota.cidade.nome} • ` : ""}
              {(rota?.periodo || "").toLowerCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              className={classNames(
                "px-4 py-2 text-sm rounded-lg",
                tab === "colabs" ? "bg-white shadow font-semibold text-[#246b4b]" : "text-gray-600"
              )}
              onClick={() => setTab("colabs")}
            >
              Colaboradores
            </button>
            <button
              className={classNames(
                "px-4 py-2 text-sm rounded-lg",
                tab === "add" ? "bg-white shadow font-semibold text-[#246b4b]" : "text-gray-600"
              )}
              onClick={() => setTab("add")}
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {tab === "colabs" ? (
            loading ? (
              <div className="text-sm text-gray-500">Carregando…</div>
            ) : (
              <div className="grid grid-cols-12 gap-6">
                {/* Coluna esquerda: Pontos */}
                <aside className="col-span-12 md:col-span-4">
                  <h4 className="text-sm font-semibold mb-3 text-[#3B7258]">Pontos da rota</h4>
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => setFiltroPontoId("todos")}
                        className={classNames(
                          "w-full rounded-xl px-3 py-2 border text-left",
                          filtroPontoId === "todos" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        Todos os pontos
                      </button>
                    </li>
                    {pontos.map(pt => {
                      const count = colabs.filter(c => c.idPonto === pt.idPonto).length;
                      const ativo = String(filtroPontoId) === String(pt.idPonto);
                      return (
                        <li key={pt.idPonto}>
                          <button
                            onClick={() => setFiltroPontoId(ativo ? "todos" : pt.idPonto)}
                            className={classNames(
                              "w-full flex items-center justify-between rounded-xl px-3 py-2 border",
                              ativo ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold px-2 py-1 rounded bg-white border">{String(pt.ordem).padStart(2,"0")}</span>
                              <span className="text-sm">{pt.nome}</span>
                              {pt.ordem === 1 && (
                                <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700">Ordem 1</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-600">{count}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>

                {/* Coluna direita: Filtros + lista */}
                <section className="col-span-12 md:col-span-8">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <input
                      className="border rounded-lg px-3 py-2 text-sm"
                      placeholder="Buscar por nome ou matrícula…"
                      value={q}
                      onChange={e=>setQ(e.target.value)}
                    />
                    <select
                      className="border rounded-lg px-3 py-2 text-sm"
                      value={filtroTipo}
                      onChange={e=>setFiltroTipo(e.target.value)}
                    >
                      <option value="todos">Todos</option>
                      <option value="lideres">Somente líderes</option>
                      <option value="colaboradores">Somente colaboradores</option>
                    </select>
                    <select
                      className="border rounded-lg px-3 py-2 text-sm"
                      value={filtroPontoId}
                      onChange={e=>setFiltroPontoId(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                    >
                      <option value="todos">Todos os pontos</option>
                      {pontos.map(pt => (
                        <option key={pt.idPonto} value={pt.idPonto}>
                          #{String(pt.ordem).padStart(2,"0")} — {pt.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                    {colabsFiltrados.map(c => {
                      const pt = c.idPonto ? pontosById.get(c.idPonto) : null;
                      const ehOrdem1 = pt?.ordem === 1;
                      return (
                        <div
                          key={c.idColaborador}
                          className={classNames(
                            "rounded-xl border p-3 flex items-center justify-between",
                            c.isLider ? "border-yellow-400 bg-yellow-50/30" : "border-gray-200"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold truncate">{c.nome}</span>
                              {c.matricula && (
                                <span className="text-xs text-gray-600">({c.matricula})</span>
                              )}
                              {c.isLider && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-300">
                                  Líder
                                </span>
                              )}
                              {ehOrdem1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Ordem 1</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                              <span>Ponto:</span>
                              <select
                                className="border rounded px-2 py-1 text-xs"
                                value={c.idPonto || ""}
                                onChange={e=>handleMoveColab(c, e.target.value ? Number(e.target.value) : "")}
                              >
                                <option value="">— não atribuído —</option>
                                {pontos.map(p => (
                                  <option key={p.idPonto} value={p.idPonto}>
                                    #{String(p.ordem).padStart(2,"0")} — {p.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className={classNames(
                                "px-3 py-1.5 rounded-lg text-sm border",
                                c.isLider
                                  ? "border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
                              )}
                              onClick={()=>handleToggleLeader(c)}
                              title={c.isLider ? "Remover liderança" : "Marcar como líder"}
                            >
                              {c.isLider ? "Remover liderança" : "Marcar líder"}
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg text-sm border border-red-300 text-red-600 hover:bg-red-50"
                              onClick={()=>handleRemoveColab(c)}
                            >
                              Desvincular
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {!colabsFiltrados.length && (
                      <div className="text-sm text-gray-500">Nenhum colaborador nessa filtragem.</div>
                    )}
                  </div>
                </section>
              </div>
            )
          ) : (
            // ABA ADICIONAR
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-[#3B7258]">Buscar colaborador</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  placeholder="Digite nome ou matrícula…"
                  value={buscaAdd}
                  onChange={e=>handleSearchGlobais(e.target.value)}
                />
                <div className="mt-3 max-h-[45vh] overflow-y-auto space-y-2">
                  {resultAdd.map(r => (
                    <div key={r.idColaborador ?? r.id_colaborador} className="border rounded-xl p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{r.nome}</div>
                        {r.matricula && <div className="text-xs text-gray-600">Matrícula: {r.matricula}</div>}
                      </div>
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-50 disabled:opacity-50"
                        disabled={!pontoAddId}
                        onClick={()=>handleAddColab(r.idColaborador ?? r.id_colaborador)}
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                  {!buscaAdd && (
                    <div className="text-sm text-gray-500">Digite para buscar colaboradores…</div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3B7258]">Ponto da rota</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  value={pontoAddId}
                  onChange={e=>setPontoAddId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Selecione o ponto</option>
                  {pontos.map(pt => (
                    <option key={pt.idPonto} value={pt.idPonto}>
                      #{String(pt.ordem).padStart(2,"0")} — {pt.nome}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">Selecione o ponto e depois clique em “Adicionar”.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
