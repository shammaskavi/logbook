import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { downscaleImage } from "@/lib/extraction/downscaleImage";
import type { ExtractedWorkOrder } from "@/lib/extraction/types";

export interface ExtractionResult {
  extracted: ExtractedWorkOrder;
  /** Which model answered — useful when comparing quality after the fact. */
  model: string;
  /** Encoded size actually uploaded, for diagnosing slow connections. */
  uploadedKb: number;
}

/**
 * Sends a photographed slip to the extraction endpoint.
 *
 * The image is resized in the browser first: a phone photo is ~4MB and would be
 * slow to upload on a shop-floor connection, while adding nothing the extraction
 * uses. The session token goes along so the endpoint can confirm the caller is a
 * signed-in user rather than anyone who found the URL.
 */
export function useExtractWorkOrder() {
  return useMutation({
    mutationFn: async (file: File): Promise<ExtractionResult> => {
      const { base64, mimeType, sizeKb } = await downscaleImage(file);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch("/api/extract-work-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        // The endpoint returns user-facing wording for the cases a person can
        // act on — expired session, daily limit, oversized photo.
        throw new Error(
          payload?.error ?? "The slip could not be read. Please enter it manually."
        );
      }

      return {
        extracted: payload.extracted as ExtractedWorkOrder,
        model: payload.model as string,
        uploadedKb: sizeKb,
      };
    },
  });
}
