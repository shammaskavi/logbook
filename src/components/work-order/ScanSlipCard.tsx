import { useRef } from "react";
import { Camera, Loader2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanSlipCardProps {
  isScanning: boolean;
  /** Populated after a scan; each line is shown verbatim to the reviewer. */
  warnings: string[];
  /** Set once a scan has filled the form, so we can label the banner honestly. */
  scannedFrom: string | null;
  error: string | null;
  onPickFile: (file: File) => void;
  onDismiss: () => void;
}

/**
 * Entry point for filling this form from a photo of a slip.
 *
 * There is no separate review screen by design: the extraction pre-fills the
 * form the user already knows, and this banner tells them which parts to look
 * at. A dedicated review UI would mean maintaining a second editor with the same
 * dropdowns and validation.
 */
export default function ScanSlipCard({
  isScanning,
  warnings,
  scannedFrom,
  error,
  onPickFile,
  onDismiss,
}: ScanSlipCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        // Opens the camera directly on a phone, which is how these slips arrive.
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickFile(file);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      {!scannedFrom && !error && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Fill this in from a photo
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Photograph the slip and the details below are filled in for you to check.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={isScanning}
            className="gap-2 shrink-0"
          >
            {isScanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {isScanning ? "Reading slip…" : "Scan slip"}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Couldn't read that photo</p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={isScanning}
              >
                Try again
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {scannedFrom && !error && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-900">
                Filled in from the photo — please check it before saving
              </p>
              {warnings.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-amber-900/90 list-disc pl-4">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-900/80 mt-1">
                  Everything was read cleanly, but the quantities are worth a glance.
                </p>
              )}
              <p className="text-[11px] text-amber-900/60 mt-2">Read by {scannedFrom}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={isScanning}
                className="gap-1.5"
              >
                {isScanning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                Rescan
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
