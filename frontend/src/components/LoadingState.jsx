import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="loading-state">
      <Loader2 className="spin-icon" size={20} style={{ animation: "spin 0.8s linear infinite" }} />
      {label}
    </div>
  );
}
