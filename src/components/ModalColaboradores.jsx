import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ModalColaboradores({ open, onClose, rota }) {
  const [loading, setLoading] = useState(false);

  // dados base
  const [pontos, setPontos] = useState([]); // [{idPonto, nome, ordem}]
  const [colabs, setColabs] = useState([]); // [{idColaborador, nome, matricula, idPonto, isLider}]

  const [lideres, setLideres] = useState([]); // [idColaborador]

  // adicionar colaborador (lado direito)
  const [pontoAddId, setPontoAddId] = useState("");
  const [buscaAdd, setBuscaAdd] = useState("");
  const [resultAdd, setResultAdd] = useState([]);

  // =========================
  // LOAD INICIAL
  // =========================
  useEffect(() => {
    if (!open || !rota?.idRota) return;

    const carregarTudo = async () => {
      setLoading(true);
      try {
        // GET /rotas/{idRota}/trajeto   -> pontos
        // GET /rotaColaborador/{idRota}/colaboradores -> colaboradores
        // GET /rotas/{idRota}/lideres -> líderes ATIVOS
        const [traj, cols, lids] = await Promise.all([
          api.get(`/rotas/${rota.idRota}/trajeto`),
          api.get(`/rotaColaborador/${rota.idRota}/colaboradores`),
          api.get(`/rotas/${rota.idRota}/lideres`),
        ]);

        // normalizar pontos
        const pontosNorm = (traj.data || [])
          .map((p) => ({
            idPonto: p.idPonto ?? p.id_ponto,
            nome:
              p.nomePonto ??
              p.nome ??
              p.nome_ponto ??
              "— sem nome do ponto —",
            ordem: Number(p.ordem),
          }))
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

        // ids líderes
        const lideresIds = (lids.data || []).map(
          (l) => l.idColaborador ?? l.id_colaborador
        );

        // normalizar colaboradores
        const colabsNorm = (cols.data || []).map((c) => ({
          idColaborador: c.idColaborador ?? c.id_colaborador,
          nome:
            c.nome ??
            c.nomeColaborador ??
            c.nome_colaborador ??
            "— sem nome —",
          matricula: c.matricula ?? c.matriculaColaborador ?? "",
          idPonto: c.idPonto ?? c.id_ponto ?? null,
          isLider:
            lideresIds.includes(
              c.idColaborador ?? c.id_colaborador
            ) || c.role === "LIDER",
          role:
            c.role ||
            (lideresIds.includes(
              c.idColaborador ?? c.id_colaborador
            )
              ? "LIDER"
              : "COLABORADOR"),
        }));

        setPontos(pontosNorm);
        setLideres(lideresIds);
        setColabs(colabsNorm);
      } catch (err) {
        toast.error("Erro carregando colaboradores:", err);
        toast.error("Falha ao carregar dados da rota (colaboradores/pontos).");
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [open, rota?.idRota]);

  // map rápido p/ lookup de ponto
  const pontosById = useMemo(() => {
    const m = new Map();
    pontos.forEach((pt) => m.set(pt.idPonto, pt));
    return m;
  }, [pontos]);

  // ordena colaboradores:
  // - quem está no ponto de ordem 1 primeiro
  // - depois ordem crescente do ponto
  // - depois nome
  const colabsOrdenados = useMemo(() => {
    const ordemDoPonto = (idPonto) => {
      if (!idPonto) return 999;
      return pontosById.get(idPonto)?.ordem ?? 999;
    };

    const arr = [...colabs];
    arr.sort((a, b) => {
      const oa = ordemDoPonto(a.idPonto);
      const ob = ordemDoPonto(b.idPonto);

      // prioridade pra quem está no ponto ordem 1
      if (oa === 1 && ob !== 1) return -1;
      if (ob === 1 && oa !== 1) return 1;

      if (oa !== ob) return oa - ob;
      return (a.nome || "").localeCompare(b.nome || "");
    });

    return arr;
  }, [colabs, pontosById]);

  // =========================
  // HELPERS DE API (refresh / atualizar)
  // =========================
  const refreshColabs = async () => {
    try {
      const [cols, lids] = await Promise.all([
        api.get(`/rotaColaborador/${rota.idRota}/colaboradores`),
        api.get(`/rotas/${rota.idRota}/lideres`),
      ]);
      const lideresIds = (lids.data || []).map(
        (l) => l.idColaborador ?? l.id_colaborador
      );
      setLideres(lideresIds);

      const normCols = (cols.data || []).map((c) => ({
        idColaborador: c.idColaborador ?? c.id_colaborador,
        nome:
          c.nome ??
          c.nomeColaborador ??
          c.nome_colaborador ??
          "— sem nome —",
        matricula: c.matricula ?? c.matriculaColaborador ?? "",
        idPonto: c.idPonto ?? c.id_ponto ?? null,
        isLider:
          lideresIds.includes(
            c.idColaborador ?? c.id_colaborador
          ) || c.role === "LIDER",
        role:
          c.role ||
          (lideresIds.includes(
            c.idColaborador ?? c.id_colaborador
          )
            ? "LIDER"
            : "COLABORADOR"),
      }));

      setColabs(normCols);
    } catch (e) {
      console.error("Erro ao atualizar lista de colaboradores:", e);
    }
  };

  // trocar liderança
  const handleToggleLeader = async (c) => {
    try {
      if (!c.isLider) {
        // tentar promover
        await api.put(`/rotas/${rota.idRota}/lideres/${c.idColaborador}`);
      } else {
        // tentar remover liderança
        await api.delete(`/rotas/${rota.idRota}/lideres/${c.idColaborador}`);
      }

      await refreshColabs();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível atualizar a liderança.");
    }
  };

  // mover colaborador de ponto
  const handleMoveColab = async (c, novoPontoId) => {
    const prev = [...colabs];

    // otimista na UI
    setColabs(prev.map(x =>
      x.idColaborador === c.idColaborador
        ? { ...x, idPonto: novoPontoId ? Number(novoPontoId) : null }
        : x
    ));

    try {
      // tentar via query param (sem body)
      await api.put(
        `/rotaColaborador/${rota.idRota}/${c.idColaborador}?idPonto=${novoPontoId ? Number(novoPontoId) : ""}`
      );

      await refreshColabs();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível mover o colaborador para o ponto selecionado.");
      // rollback
      setColabs(prev);
    }
  };

  // remover colaborador da rota
  const handleRemoveColab = async (c) => {
    const ok = confirm(
      `Desvincular ${c.nome} desta rota?`
    );
    if (!ok) return;
    const prev = [...colabs];
    setColabs(
      prev.filter(
        (x) => x.idColaborador !== c.idColaborador
      )
    );
    try {
      await api.delete(
        `/rotaColaborador/${rota.idRota}/${c.idColaborador}`
      );
      await refreshColabs();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível desvincular.");
      setColabs(prev); // rollback
    }
  };

  // =========================
  // BUSCA GLOBAL P/ ADICIONAR
  // =========================
  const normalizar = (s = "") =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const handleSearchGlobais = async (txt) => {
    setBuscaAdd(txt);

    const texto = txt.trim();
    if (texto.length < 2) {
      // menos de 2 letras: não busca, não mostra nada
      setResultAdd([]);
      return;
    }

    try {
      // pega todos (ou o que a API devolver)
      const r = await api.get(`/colaboradores`);
      const lista = r.data || [];

      // filtra no front por nome OU matrícula
      const filtro = normalizar(texto);
      const filtrados = lista.filter((colab) => {
        const nome = normalizar(
          colab.nome ||
          colab.nomeColaborador ||
          colab.nome_colaborador ||
          ""
        );
        const mat = normalizar(colab.matricula || "");
        return nome.includes(filtro) || mat.includes(filtro);
      });

      setResultAdd(filtrados);
    } catch (e) {
      console.error(e);
      setResultAdd([]);
    }
  };

  // adicionar colaborador na rota
  const handleAddColab = async (idColaborador) => {
    if (!pontoAddId) {
      alert("Escolha um ponto da rota para adicionar.");
      return;
    }

    try {
      // mesmo esquema: PUT rotaColaborador/rota/colab?idPonto=#
      await api.put(
        `/rotaColaborador/${rota.idRota}/${idColaborador}?idPonto=${Number(pontoAddId)}`
      );

      setBuscaAdd("");
      setResultAdd([]);
      setPontoAddId("");

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
        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#3B7258]">
              Colaboradores — {rota?.nome}
            </h2>
            <p className="text-xs text-gray-500">
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

        {/* BODY: layout 2 colunas */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ESQUERDA: lista colaboradores */}
          <div className="md:col-span-2">
            <h3 className="text-md font-semibold text-[#3B7258] ">
              Colaboradores desta rota
            </h3>
            <h1 className="text-xs text-gray-500 mb-4">
              Apena colaboradores do primeiro ponto (ordem 1) - podem virar líder
            </h1>

            {loading ? (
              <div className="text-sm text-gray-500">
                Carregando…
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                {colabsOrdenados.map((c) => {
                  const pontoAtual = c.idPonto
                    ? pontosById.get(c.idPonto)
                    : null;
                  const ehOrdem1 =
                    pontoAtual?.ordem === 1;
                  const canBeLeader = !!ehOrdem1;
                  return (
                    <div
                      key={c.idColaborador}
                      className={classNames(
                        "rounded-xl border p-4",
                        c.isLider
                          ? "border-yellow-400 bg-yellow-50/30"
                          : "border-gray-200 bg-gray-50/30"
                      )}
                    >
                      {/* linha topo: nome + badges + botões líder/remover */}
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold truncate">
                              {c.nome}
                            </span>
                            {c.matricula && (
                              <span className="text-xs text-gray-600">
                                ({c.matricula})
                              </span>
                            )}
                            {c.isLider && (
                              <span className="text-[10px] px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-300">
                                Líder
                              </span>
                            )}
                            {ehOrdem1 && (
                              <span className="text-[10px] px-2 py-1 rounded bg-green-100 text-green-700 border border-green-300">
                                Ordem 1
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-stretch gap-2 text-sm shrink-0">
                          <button
                            className={classNames(
                              "px-3 py-1.5 rounded-lg border text-left",
                              c.isLider
                                ? "border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            disabled={
                              // Se já é líder, pode SEMPRE clicar (pra remover)
                              c.isLider
                                ? false
                                : // Se NÃO é líder ainda, só deixa clicar se estiver na ordem 1
                                !canBeLeader
                            }
                            title={
                              c.isLider
                                ? "Remover liderança"
                                : canBeLeader
                                  ? "Marcar este colaborador como líder da rota"
                                  : "Só pode marcar líder se o colaborador estiver no ponto de ordem 1"
                            }
                            onClick={() => {
                              // Se o botão está desabilitado, o onClick nem roda.
                              handleToggleLeader(c);
                            }}
                          >
                            {c.isLider ? "Remover liderança" : "Marcar líder"}
                          </button>

                          <button
                            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-left"
                            onClick={() => handleRemoveColab(c)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>

                      {/* linha baixo: ponto select */}
                      <div className="text-xs text-gray-700 mt-4 flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          Ponto:
                        </span>
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={c.idPonto || ""}
                          onChange={(e) =>
                            handleMoveColab(
                              c,
                              e.target.value
                                ? Number(
                                  e.target.value
                                )
                                : ""
                            )
                          }
                        >
                          <option value="">
                            — não atribuído —
                          </option>
                          {pontos.map((p) => (
                            <option
                              key={p.idPonto}
                              value={p.idPonto}
                            >
                              #
                              {String(
                                p.ordem
                              ).padStart(2, "0")}{" "}
                              — {p.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {!colabsOrdenados.length && (
                  <div className="text-sm text-gray-500">
                    Nenhum colaborador vinculado
                    ainda.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DIREITA: adicionar colaborador */}
          <div className="md:col-span-1">
            <h3 className="text-sm font-semibold text-[#3B7258] mb-4">
              Adicionar colaborador
            </h3>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700">
                Ponto da rota
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                value={pontoAddId}
                onChange={(e) =>
                  setPontoAddId(
                    e.target.value
                      ? Number(
                        e.target.value
                      )
                      : ""
                  )
                }
              >
                <option value="">
                  Selecione o ponto
                </option>
                {pontos.map((pt) => (
                  <option
                    key={pt.idPonto}
                    value={pt.idPonto}
                  >
                    #
                    {String(pt.ordem).padStart(
                      2,
                      "0"
                    )}{" "}
                    — {pt.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700">
                Buscar colaborador (nome ou
                matrícula)
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
                placeholder="Ex: João / 12345"
                value={buscaAdd}
                onChange={(e) =>
                  handleSearchGlobais(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="text-xs text-gray-600 mb-2">
              Resultados:
            </div>
            <div className="mt-3 max-h-[45vh] overflow-y-auto space-y-2">
              {resultAdd.map((r) => (
                <div
                  key={r.idColaborador ?? r.id_colaborador}
                  className="border rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {r.nome ||
                        r.nomeColaborador ||
                        r.nome_colaborador ||
                        "— sem nome —"}
                    </div>
                    {(r.matricula || r.matriculaColaborador) && (
                      <div className="text-xs text-gray-600">
                        Matrícula: {r.matricula || r.matriculaColaborador}
                      </div>
                    )}
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs border hover:bg-gray-50 disabled:opacity-50 shrink-0"
                    disabled={!pontoAddId}
                    onClick={() =>
                      handleAddColab(
                        r.idColaborador ??
                        r.id_colaborador
                      )
                    }
                  >
                    Adicionar
                  </button>
                </div>
              ))}

              {!buscaAdd.trim() && (
                <div className="text-sm text-gray-500">
                  Digite pelo menos 2 letras…
                </div>
              )}

              {buscaAdd.trim().length >= 1 && resultAdd.length === 0 && (
                <div className="text-sm text-gray-500">
                  Nenhum colaborador encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
