// src/components/ModalColaboradores.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import crownImg from "../assets/coroa.png";
import Remover from "../assets/remove.png";
import Loading from "../components/Loading";
import GoogleMapaRota from "./GoogleMapaRota";
import {useConfirm} from "../components/ConfirmAlert";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function ModalColaboradores({ open, onClose, rota }) {
  const [loading, setLoading] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);

  const [pontos, setPontos] = useState([]);
  const [colabs, setColabs] = useState([]);
  const [lideres, setLideres] = useState([]);
  const [todosColabs, setTodosColabs] = useState([]);

  const [pontoAddId, setPontoAddId] = useState("");
  const [buscaAdd, setBuscaAdd] = useState("");
  const [resultAdd, setResultAdd] = useState([]);
  const { confirm } = useConfirm();

  useEffect(() => {
    if (!open || !rota?.idRota) return;

    const carregarTudo = async () => {
      setLoading(true);
      try {
        const [traj, cols, lids, allColabs] = await Promise.all([
          api.get(`/rotas/${rota.idRota}/trajeto`),
          api.get(`/rotaColaborador/${rota.idRota}/colaboradores`),
          api.get(`/rotas/${rota.idRota}/lideres`),
          api.get(`/colaboradores`),
        ]);
        setTodosColabs(allColabs.data || []);
        const mapColabs = new Map(
          (allColabs.data || []).map((c) => [
            c.idColaborador ?? c.id_colaborador,
            {
              nome:
                c.nome ??
                c.nomeColaborador ??
                c.nome_colaborador ??
                "— sem nome —",
              matricula:
                c.matricula ??
                c.matriculaColaborador ??
                c.matricula_colaborador ??
                "",
              // 👇 pega a role do colaborador (ex: GESTOR, COLABORADOR)
              roleSistema: (c.role ?? c.funcao ?? c.role_colaborador ?? "")
                .toString()
                .toUpperCase(),
            },
          ])
        );

        const pontosNorm = (traj.data || [])
          .map((p) => ({
            idPonto: p.idPonto ?? p.id_ponto,
            nome:
              p.nomePonto ?? p.nome ?? p.nome_ponto ?? "— sem nome do ponto —",
            ordem: Number(p.ordem),
            lat: Number(
              typeof p.latitude === "string"
                ? p.latitude.replace(",", ".")
                : p.latitude
            ),
            lng: Number(
              typeof p.longitude === "string"
                ? p.longitude.replace(",", ".")
                : p.longitude
            ),
            endereco: p.endereco,
          }))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

        const lideresIds = (lids.data || []).map(
          (l) => l.idColaborador ?? l.id_colaborador
        );
        setLideres(lideresIds); // guarda só líderes ATIVOS

        const colabsNorm = (cols.data || []).map((c) => {
          const id = c.idColaborador ?? c.id_colaborador;
          const base = mapColabs.get(id) || {};

          const isLider = lideresIds.includes(id); // só olha o endpoint de líderes

          return {
            idColaborador: id,
            nome: base.nome || "— sem nome —",
            matricula: base.matricula || "",
            idPonto: c.idPonto ?? c.id_ponto ?? null,
            isLider,
            roleSistema: base.roleSistema || "COLABORADOR", // 👈 mantém a role original
          };
        });
        setPontos(pontosNorm);
        setLideres(lideresIds);
        setColabs(colabsNorm);
      } catch (err) {
        toast.error("Falha ao carregar dados da rota (colaboradores/pontos).");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarTudo();
  }, [open, rota?.idRota]);

  const pontosById = useMemo(() => {
    const m = new Map();
    pontos.forEach((pt) => m.set(pt.idPonto, pt));
    return m;
  }, [pontos]);

  const colabsOrdenados = useMemo(() => {
    const ordemDoPonto = (idPonto) => {
      if (!idPonto) return 999;
      return pontosById.get(idPonto)?.ordem ?? 999;
    };

    const arr = [...colabs];
    arr.sort((a, b) => {
      const oa = ordemDoPonto(a.idPonto);
      const ob = ordemDoPonto(b.idPonto);
      if (oa === 1 && ob !== 1) return -1;
      if (ob === 1 && oa !== 1) return 1;
      if (oa !== ob) return oa - ob;
      return (a.nome || "").localeCompare(b.nome || "");
    });

    return arr;
  }, [colabs, pontosById]);

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

    // 👇 reaproveita a mesma base de colaboradores globais
    const mapTodosColabs = new Map(
      (todosColabs || []).map((c) => [
        c.idColaborador ?? c.id_colaborador,
        {
          nome:
            c.nome ??
            c.nomeColaborador ??
            c.nome_colaborador ??
            "— sem nome —",
          matricula:
            c.matricula ??
            c.matriculaColaborador ??
            c.matricula_colaborador ??
            "",
          roleSistema: (c.role ?? c.funcao ?? c.role_colaborador ?? "")
            .toString()
            .toUpperCase(),
        },
      ])
    );

    const normCols = (cols.data || []).map((c) => {
      const id = c.idColaborador ?? c.id_colaborador;
      const isLider = lideresIds.includes(id); // só líderes ATIVOS

      const base = mapTodosColabs.get(id) || {};

      return {
        idColaborador: id,
        nome:
          c.nome ??
          c.nomeColaborador ??
          c.nome_colaborador ??
          base.nome ??
          "— sem nome —",
        matricula:
          c.matricula ?? c.matriculaColaborador ?? base.matricula ?? "",
        idPonto: c.idPonto ?? c.id_ponto ?? null,
        isLider,
        roleSistema: base.roleSistema || "COLABORADOR", // 👈 mantém GESTOR
      };
    });

    setColabs(normCols);
  } catch (e) {
    console.error("Erro ao atualizar lista de colaboradores:", e);
  }
};
  const handleToggleLeader = async (c) => {
    const isGestor = c.roleSistema === "GESTOR";

    // 👇 se for gestor e ainda não for líder, bloqueia
    if (!c.isLider && isGestor) {
      toast.warn(
        "Colaboradores com cargo de GESTOR não podem ser líderes de rota."
      );
      return;
    }

    try {
      if (!c.isLider) {
        await api.put(`/rotas/${rota.idRota}/lideres/${c.idColaborador}`);
        toast.success(`${c.nome} agora é líder da rota.`);
      } else {
        await api.delete(`/rotas/${rota.idRota}/lideres/${c.idColaborador}`);
        toast.info(`Liderança removida de ${c.nome}.`);
      }
      await refreshColabs();
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível atualizar a liderança.");
    }
  };

  const handleMoveColab = async (c, novoPontoId) => {
    const prev = [...colabs];
    setColabs(
      prev.map((x) =>
        x.idColaborador === c.idColaborador
          ? { ...x, idPonto: novoPontoId ? Number(novoPontoId) : null }
          : x
      )
    );
    try {
      await api.put(
        `/rotaColaborador/${rota.idRota}/${c.idColaborador}?idPonto=${
          novoPontoId ? Number(novoPontoId) : ""
        }`
      );
      await refreshColabs();
    } catch (e) {
      console.error(e);
      toast.error(
        "Não foi possível mover o colaborador para o ponto selecionado."
      );
      setColabs(prev);
    }
  };

const handleRemoveColab = async (c) => {
  // 1) Confirmação bonitinha via confirm global
  try {
    await confirm({
      title: "Remover colaborador",
      message: `Deseja realmente remover ${c.nome} da rota?`,
      confirmText: "Remover",
      cancelText: "Cancelar",
    });
  } catch {
    // cancelou → não faz nada
    return;
  }

  // 2) Atualização otimista da UI
  const prev = [...colabs];
  setColabs(prev.filter((x) => x.idColaborador !== c.idColaborador));

  try {
    // 3) Feedback imediato com toast.promise
    await toast.promise(
      (async () => {
        // tenta remover dos líderes antes (se não for líder, back ignora / erro 404/400)
        try {
          await api.delete(
            `/rotas/${rota.idRota}/lideres/${c.idColaborador}`
          );
        } catch (err) {
          const status = err?.response?.status;
          if (status !== 400 && status !== 404) {
            console.warn(
              "Erro ao remover liderança antes de tirar da rota:",
              status,
              err?.response?.data
            );
          }
          // 400/404 aqui não quebram o fluxo
        }

        // remove vínculo da rota
        await api.delete(
          `/rotaColaborador/${rota.idRota}/${c.idColaborador}`
        );

        // atualiza lista real
        await refreshColabs();
      })(),
      {
        pending: "Removendo colaborador...",
        success: "Colaborador desvinculado com sucesso.",
        error: {
          render({ data }) {
            // data é o erro lançado dentro da promise
            if (data?.response?.status === 403) {
              return "O sistema não permitiu remover este colaborador da rota. Verifique com o back-end.";
            }
            return "Não foi possível desvincular.";
          },
        },
      }
    );
  } catch (e) {
    console.error(e);
    // se deu erro na promise, volta a lista pro estado anterior
    setColabs(prev);
  }
};

  const normalizar = (s = "") =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  const handleSearchGlobais = (txt) => {
    setBuscaAdd(txt);
    const texto = txt.trim();

    // menos de 2 caracteres: limpa resultados
    if (texto.length < 2) {
      setResultAdd([]);
      return;
    }

    const filtro = normalizar(texto);

    // evita sugerir quem já está na rota
    const idsNaRota = new Set(
      colabs.map((c) => c.idColaborador ?? c.id_colaborador)
    );

    const filtrados = (todosColabs || []).filter((colab) => {
      const id = colab.idColaborador ?? colab.id_colaborador;
      if (idsNaRota.has(id)) return false; // já está na rota, não sugere

      const nome = normalizar(
        colab.nome || colab.nomeColaborador || colab.nome_colaborador || ""
      );

      const matriculaRaw = colab.matricula || colab.matriculaColaborador || "";
      const mat = normalizar(String(matriculaRaw));

      return nome.includes(filtro) || mat.includes(filtro);
    });

    setResultAdd(filtrados);
  };

  const handleAddColab = async (idColaborador) => {
    if (!pontoAddId) {
      toast.warn("Escolha um ponto da rota para adicionar.");
      return;
    }

    try {
      setLoadingAdd(true);
      await api.put(
        `/rotaColaborador/${rota.idRota}/${idColaborador}?idPonto=${Number(
          pontoAddId
        )}`
      );

      setBuscaAdd("");
      setResultAdd([]);
      setPontoAddId("");

      await refreshColabs();
      toast.success("Colaborador adicionado com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível adicionar o colaborador.");
    } finally {
      setLoadingAdd(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {loadingAdd && (
        <Loading fullscreen size={120} message="Adicionando colaborador..." />
      )}

      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
          {/* HEADER fixo dentro do modal */}
          <div className="px-6 py-4 border-b flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#3B7258]">
                Colaboradores — {rota?.nome}
              </h2>
              <p className="text-md text-gray-500">
                {(rota?.periodo || "").toLowerCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-red-200 text-red-800"
            >
              Fechar
            </button>
          </div>

          {/* CONTEÚDO SCROLLÁVEL */}
          <div className="flex-1 overflow-y-auto">
            {/* Colaboradores + adicionar */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ESQUERDA */}
              <div className="md:col-span-2">
                <h3 className="text-md font-semibold text-[#3B7258] ">
                  Colaboradores desta rota
                </h3>
                <h1 className="text-xs text-gray-500 mb-4">
                  Apena colaboradores do primeiro ponto (ordem 1) - podem virar
                  líder
                </h1>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loading size={80} message="Carregando colaboradores..." />
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
                    {colabsOrdenados.map((c) => {
                      const pontoAtual = c.idPonto
                        ? pontosById.get(c.idPonto)
                        : null;
                      const ehOrdem1 = pontoAtual?.ordem === 1;

                      // 👇 garante string e upper case pra não dar erro
                      const isGestor =
                        (c.roleSistema || "").toUpperCase() === "GESTOR";

                      // só pode ser líder se estiver no ponto 1 E não for gestor
                      const canBeLeader = ehOrdem1 && !isGestor;

                      return (
                        <div
                          key={c.idColaborador}
                          className={classNames(
                            "rounded-xl border p-4",
                            isGestor
                              ? "border-2 border-green-500 bg-green-50/20"
                              : c.isLider
                              ? "border-2 border-yellow-500 bg-yellow-50/15 shadow-sm shadow-yellow-500/50"
                              : "border-2 border-gray-200 bg-gray-50/30"
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold truncate">
                                  {c.nome}
                                </span>
                                {c.matricula && (
                                  <span className="text-sm text-gray-600">
                                    - {c.matricula}
                                  </span>
                                )}
                                {isGestor && (
                                  <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    Gestor
                                  </span>
                                )}
                                {c.isLider && (
                                  <span className="text-[10px] px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 border border-yellow-200">
                                    Líder
                                  </span>
                                )}
                                {ehOrdem1 && (
                                  <span className="text-[10px] px-2 py-1 rounded-md bg-green-100 text-green-700 border border-green-200">
                                    Ordem 1
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-stretch gap-2 text-sm shrink-0">
                              <button
                                className={classNames(
                                  "px-3 py-1.5 rounded-lg border flex items-center gap-2 text-left transition-all",
                                  c.isLider
                                    ? "border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                    : "border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                disabled={c.isLider ? false : !canBeLeader}
                                title={
                                 c.isLider
                ? "Remover liderança"
                : isGestor
                ? "Colaboradores com cargo de GESTOR não podem ser líderes de rota."
                : canBeLeader
                ? "Marcar este colaborador como líder da rota"
                : "Só pode marcar líder se o colaborador estiver no ponto de ordem 1"
            }
                                onClick={() => handleToggleLeader(c)}
                              >
                                <img
                                  src={crownImg}
                                  alt="Coroa"
                                  className={`h-5 w-5 transition-all duration-200 ${
                                    c.isLider
                                      ? "grayscale-0 brightness-100"
                                      : "grayscale brightness-50"
                                  }`}
                                />
                                {c.isLider
                                  ? "Remover liderança"
                                  : "Marcar líder"}
                              </button>

                              <button
                                className="px-3 py-1.5 rounded-lg border flex items-center gap-1 border-red-300 text-left text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={c.isLider} // líder ativo não pode ser removido
                                title={
                                  c.isLider
                                    ? "Remova a liderança deste colaborador antes de tirá-lo da rota."
                                    : "Remover colaborador da rota"
                                }
                                onClick={() => {
                                  if (!c.isLider) {
                                    handleRemoveColab(c);
                                  }
                                }}
                              >
                                <img
                                  src={Remover}
                                  alt="Remover"
                                  className="h-5 w-5 inline-block mr-1"
                                />
                                Remover
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-gray-700 mt-4 flex flex-wrap items-center gap-2">
                            <span className="font-medium">Ponto:</span>
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={c.idPonto || ""}
                              onChange={(e) =>
                                handleMoveColab(
                                  c,
                                  e.target.value ? Number(e.target.value) : ""
                                )
                              }
                            >
                              <option value="">— não atribuído —</option>
                              {pontos.map((p) => (
                                <option key={p.idPonto} value={p.idPonto}>
                                  #{String(p.ordem).padStart(2, "0")} — {p.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}

                    {!colabsOrdenados.length && (
                      <div className="text-sm text-gray-500">
                        Nenhum colaborador vinculado ainda.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DIREITA */}
              <div className="md:col-span-1">
                <h3 className="text-sm font-semibold text-[#3B7258] mb-1">
                  Adicionar colaborador
                </h3>
                <h1 className="text-xs text-gray-500 mb-2">
                  Seleciona um ponto para atribuir um colaborador a rota
                </h1>

                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700">
                    Ponto da rota
                  </label>
                  <select
                    className="w-full border border-gray-500  focus:outline-none focus:ring-2 focus:ring-[#038C3E] rounded-lg px-3 py-2 mt-1 text-sm text-gray-600"
                    value={pontoAddId}
                    onChange={(e) =>
                      setPontoAddId(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  >
                    <option value="">Selecione o ponto</option>
                    {pontos.map((pt) => (
                      <option key={pt.idPonto} value={pt.idPonto}>
                        #{String(pt.ordem).padStart(2, "0")} — {pt.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-600 ">
                    Buscar colaborador (nome ou matrícula)
                  </label>
                  <input
                    className="w-full border border-gray-500 focus:outline-none focus:ring-2 focus:ring-[#038C3E] rounded-lg px-3 py-2 mt-1 text-sm"
                    placeholder="Ex: João / 12345"
                    value={buscaAdd}
                    onChange={(e) => handleSearchGlobais(e.target.value)}
                  />
                </div>

                <div className="text-xs text-gray-600 mb-2">Resultados:</div>

                <div className="mt-3 max-h-[40vh] overflow-y-auto space-y-2 relative">
                  {loadingSearch ? (
                    <div className="flex items-center justify-center py-6">
                      <Loading
                        size={60}
                        message="Carregando..."
                        className="p-0"
                      />
                    </div>
                  ) : (
                    <>
                      {resultAdd.map((r) => (
                        <div
                          key={r.idColaborador ?? r.id_colaborador}
                          className="border border-gray-800/30 rounded-xl p-3 flex items-center justify-between"
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
                                Matrícula:{" "}
                                {r.matricula || r.matriculaColaborador}
                              </div>
                            )}
                          </div>
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 border hover:bg-[#038C3E] hover:text-white disabled:opacity-50 shrink-0"
                            disabled={!pontoAddId}
                            onClick={() =>
                              handleAddColab(
                                r.idColaborador ?? r.id_colaborador
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

                      {buscaAdd.trim().length >= 2 &&
                        resultAdd.length === 0 && (
                          <div className="text-sm text-gray-500">
                            Nenhum colaborador encontrado.
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* MAPA no rodapé do conteúdo, também dentro da área scrollável */}
            <div className="px-6 pb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Trajeto no mapa
              </h3>

              {pontos.length > 0 ? (
                <div className="w-full rounded-xl overflow-hidden border border-slate-200">
                  <GoogleMapaRota
                    pontos={pontos}
                    height={260}
                    followRoads={true}
                  />
                </div>
              ) : (
                <div className="h-[220px] w-full bg-white text-slate-400 text-xs grid place-items-center rounded-xl border border-dashed border-slate-200">
                  Sem trajeto cadastrado para esta rota.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
