import React, { useId } from "react";
import "./Toggle.css"; // IMPORTANTE: importa o CSS só aqui

export default function Toggle({
  checked,
  onChange,
  offLabel = "Off",
  onLabel = "On",
  showPrefixText = false, // se quiser o "This is"
}) {
  const id = useId();

  return (
    <div className="checkbox-wrapper-35 inline-flex items-center">
      {/* input REAL, controlado pelo React */}
      <input
        id={id}
        type="checkbox"
        className="switch"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />

      <label htmlFor={id}>
        {showPrefixText && (
          <span className="switch-x-text">This is </span>
        )}

        <span className="switch-x-toggletext">
          <span className="switch-x-unchecked">
            <span className="switch-x-hiddenlabel">Unchecked: </span>
            {offLabel}
          </span>
          <span className="switch-x-checked">
            <span className="switch-x-hiddenlabel">Checked: </span>
            {onLabel}
          </span>
        </span>
      </label>
    </div>
  );
}
