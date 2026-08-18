import { Activity, Crosshair, Search } from "lucide-react";
import type { ConcentrationMode } from "./config";
import { CONCENTRATION_ACCENT } from "./config";

export function ConcentrationModeLogo({
  mode,
  large = false,
}: {
  mode: ConcentrationMode;
  large?: boolean;
}) {
  const size = large ? 58 : 42;
  const Icon = mode === "signals" ? Activity : mode === "tracking" ? Crosshair : Search;
  return (
    <div
      className={`relative flex items-center justify-center rounded-[16px] border ${large ? "h-[76px] w-[76px]" : "h-[54px] w-[58px]"}`}
      style={{
        color: CONCENTRATION_ACCENT,
        borderColor: "rgba(249,115,22,.32)",
        background: "rgba(249,115,22,.1)",
        boxShadow: large ? "0 0 26px rgba(249,115,22,.18)" : "none",
      }}
      aria-hidden="true"
    >
      <span className="absolute inset-2 rounded-[12px] border border-orange-300/10" />
      <Icon size={size * (large ? 0.52 : 0.48)} strokeWidth={1.7} />
      {mode === "signals" && <span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,.9)]" />}
      {mode === "tracking" && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,.9)]" />}
      {mode === "search" && <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,.9)]" />}
    </div>
  );
}