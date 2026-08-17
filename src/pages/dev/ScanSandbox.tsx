import { useState } from "react";
import ScanSlipCard from "@/components/work-order/ScanSlipCard";

/**
 * Development-only preview of the scan banner's states.
 *
 * The real flow lives behind sign-in and needs the extraction endpoint, so this
 * renders the presentational states directly — idle, scanning, filled-with-
 * warnings, and failed — to check wording and layout without a round trip.
 * Mounted only when `import.meta.env.DEV`.
 */

const WARNINGS = [
  'Check the date — the slip reads "24/8/23". Handwritten dates are the least reliable field.',
  "1 of 3 job works could not be matched to your list — pick one on each row, or add it.",
  "The slip's total is 669 but the items add up to 326. Check the quantities.",
  "First item description is partially missing/torn off due to ring binder damage.",
];

type State = "idle" | "scanning" | "filled" | "clean" | "error";

const STATES: State[] = ["idle", "scanning", "filled", "clean", "error"];

export default function ScanSandbox() {
  const [state, setState] = useState<State>("idle");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-lg font-semibold mb-1">Scan banner states</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Presentational only — picking a file does nothing here.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                state === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <ScanSlipCard
          isScanning={state === "scanning"}
          warnings={state === "filled" ? WARNINGS : []}
          scannedFrom={
            state === "filled" || state === "clean" ? "gemini-3.6-flash" : null
          }
          error={
            state === "error"
              ? "Today's free scanning limit has been reached. It resets tomorrow — please enter this one manually."
              : null
          }
          onPickFile={() => setState("scanning")}
          onDismiss={() => setState("idle")}
        />

        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          The work order form fields would sit here.
        </div>
      </div>
    </div>
  );
}
