// src/components/DeleteRotaButton.jsx
import React, { useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function DeleteRotaButton({ idRota, rotaNome, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir a rota "${rotaNome || idRota}"?`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      // Se o endpoint for literalmente /delete/rotas/{idRota}, troque aqui:
      // await api.delete(`/delete/rotas/${idRota}`);
      await api.delete(`/rotas/${idRota}`);

      toast.success("Rota excluída com sucesso.");

      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error("Erro ao excluir rota:", err.response?.data || err);
      toast.error("Não foi possível excluir a rota.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      aria-label="Excluir rota"
      className="delete-button"
      onClick={handleDelete}
      disabled={loading}
    >
      <svg
        className="trash-svg"
        viewBox="0 -10 64 74"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="trash-can">
          <rect
            x={16}
            y={24}
            width={32}
            height={30}
            rx={3}
            ry={3}
            fill="#e74c3c"
          />
          <g id="lid-group">
            <rect
              x={12}
              y={12}
              width={40}
              height={6}
              rx={2}
              ry={2}
              fill="#c0392b"
            />
            <rect
              x={26}
              y={8}
              width={12}
              height={4}
              rx={2}
              ry={2}
              fill="#c0392b"
            />
          </g>
        </g>
      </svg>
    </button>
  );
}
