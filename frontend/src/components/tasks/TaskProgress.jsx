import React, { useState } from "react";

export default function TaskProgress({ progress, editable = false, onChange }) {
  const [value, setValue] = useState(progress);
  const [saving, setSaving] = useState(false);

  const commit = async (next) => {
    setValue(next);
    if (!editable || !onChange) return;
    setSaving(true);
    try {
      await onChange(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="task-progress">
      <div className="task-progress-track">
        <div className="task-progress-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="task-progress-meta">
        {editable ? (
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value}
            disabled={saving}
            onChange={(e) => setValue(Number(e.target.value))}
            onMouseUp={(e) => commit(Number(e.target.value))}
            onTouchEnd={(e) => commit(Number(e.target.value))}
            aria-label="Task progress"
          />
        ) : null}
        <span className="task-progress-value">{value}%</span>
      </div>
    </div>
  );
}
