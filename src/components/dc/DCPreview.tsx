import React from "react";
import { format } from "date-fns";
import { useBusinessSettings } from "@/hooks/use-data";
import { supabase } from "@/integrations/supabase/client";

type DCItem = {
    work_order_number: string;
    job_work_type_name: string;
    quantity: number;
};

type DCPreviewProps = {
    businessName: string;
    businessAddress: string;
    businessGSTIN?: string;
    businessPhones?: string[];
    dcNumber: string;
    dcDate: string;
    partyName: string;
    partyGSTIN?: string;
    transporterName?: string;
    noOfBundles?: number;
    items: DCItem[];
};

export function DCPreview({
    businessName,
    businessAddress,
    businessGSTIN,
    businessPhones = [],
    dcNumber,
    dcDate,
    partyName,
    transporterName,
    noOfBundles,
    items,
}: DCPreviewProps) {
    const { data: businessSettings } = useBusinessSettings();

    const totalQuantity = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    const displayDate = dcDate
        ? format(new Date(dcDate), "dd MMM yyyy")
        : "-";

    const resolvedBusinessName =
        businessSettings?.business_name || businessName || "AAMIR JAMAL";

    const resolvedBusinessAddress =
        businessSettings?.business_address || businessAddress || "";

    const resolvedBusinessGSTIN =
        businessSettings?.gstin || businessGSTIN || "";

    const primaryPhone =
        businessSettings?.phone ||
        (businessPhones.length > 0 ? businessPhones[0] : "-");

    // Smart initials fallback — first letter of each word, max 2 chars
    const businessInitials = resolvedBusinessName
        .trim()
        .split(/\s+/)
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Resolve logo public URL (bucket is public, stable across sessions)
    const logoPublicUrl = businessSettings?.logo_url
        ? supabase.storage.from("business-logos").getPublicUrl(businessSettings.logo_url).data.publicUrl
        : null;


    // Half A4 height so two copies fit on one A4 page.
    const copyHeight = "148.5mm";
    const minimumRows = 15;
    const fillerRows = Math.max(0, minimumRows - items.length);

    return (
        <div
            id="printable-dc"
            className="bg-white text-black mx-auto"
            style={{
                width: "210mm",
                height: copyHeight,
                padding: "4mm",
                boxSizing: "border-box",
                fontFamily: "Arial, sans-serif",
                fontSize: "10px",
                lineHeight: 1.2,
                overflow: "hidden",
                pageBreakInside: "avoid",
                breakInside: "avoid",
            }}
        >
            <div className="border border-[#8B1E14] h-full flex flex-col">
                {/* Header */}
                <div className="grid grid-cols-[44px_1fr_140px] border-b border-[#8B1E14]">
                    <div className="border-r border-[#8B1E14] p-2 flex items-center justify-center">
                        {logoPublicUrl ? (
                            <img
                                src={logoPublicUrl}
                                alt="Business logo"
                                style={{ width: 32, height: 32, objectFit: "contain" }}
                            />
                        ) : (
                            <div className="w-8 h-8 bg-[#8B1E14] text-white flex items-center justify-center font-bold text-lg leading-none">
                                {businessInitials}
                            </div>
                        )}
                    </div>

                    <div className="p-2">
                        <div className="text-sm font-bold uppercase text-[#8B1E14] leading-tight">
                            {resolvedBusinessName}
                        </div>
                        <div className="text-[8px] text-slate-700 leading-tight mt-0.5">
                            {resolvedBusinessAddress}
                        </div>
                    </div>

                    <div className="border-l border-[#8B1E14] text-[8px]">
                        {resolvedBusinessGSTIN && (
                            <div className="px-2 py-1 border-b border-[#8B1E14]">
                                <span className="font-semibold">GSTIN:</span> {resolvedBusinessGSTIN}
                            </div>
                        )}
                        <div className="px-2 py-1">
                            <span className="font-semibold">Ph No:</span> {primaryPhone}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="bg-[#8B1E14] text-white text-center font-bold py-1 uppercase border-b border-[#8B1E14]">
                    Delivery Challan
                </div>

                {/* Party / DC Info */}
                <div className="grid grid-cols-[1fr_120px_120px] border-b border-[#8B1E14] text-[9px]">
                    <div className="px-2 py-2 border-r border-[#8B1E14]">
                        <span className="font-semibold">To:</span>{" "}
                        <span className="font-bold uppercase">{partyName || "-"}</span>
                    </div>

                    <div className="px-2 py-2 border-r border-[#8B1E14]">
                        <span className="font-semibold">DC No:</span>{" "}
                        <span className="font-bold text-[#8B1E14]">{dcNumber}</span>
                    </div>

                    <div className="px-2 py-2">
                        <span className="font-semibold">Date:</span> {displayDate}
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-1">
                    <table className="w-full border-collapse table-fixed text-[9px]">
                        <thead>
                            <tr className="bg-[#F5E7D9] text-[#8B1E14] uppercase font-bold">
                                <th className="w-[14%] border-r border-b border-[#8B1E14] px-2 py-1 text-left">
                                    WO No.
                                </th>
                                <th className="w-[63%] border-r border-b border-[#8B1E14] px-2 py-1 text-left">
                                    Particulars
                                </th>
                                <th className="w-[23%] border-b border-[#8B1E14] px-2 py-1 text-right">
                                    Quantity
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item, index) => (
                                <tr
                                    key={index}
                                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                >
                                    <td className="border-r border-[#8B1E14] px-2 py-1 align-top">
                                        {item.work_order_number || "-"}
                                    </td>
                                    <td className="border-r border-[#8B1E14] px-2 py-1 align-top">
                                        {item.job_work_type_name || "-"}
                                    </td>
                                    <td className="px-2 py-1 text-right align-top tabular-nums font-semibold">
                                        {Number(item.quantity || 0)}
                                    </td>
                                </tr>
                            ))}

                            {Array.from({ length: fillerRows }).map((_, index) => (
                                <tr
                                    key={`filler-${index}`}
                                    className={
                                        (items.length + index) % 2 === 0 ? "bg-white" : "bg-slate-50"
                                    }
                                >
                                    <td className="border-r border-[#8B1E14] px-2 py-[7px]">&nbsp;</td>
                                    <td className="border-r border-[#8B1E14] px-2 py-[7px]">&nbsp;</td>
                                    <td className="px-2 py-[7px]">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>

                        <tfoot>
                            <tr className="border-t border-[#8B1E14] text-[9px]">
                                <td colSpan={2} className="px-2 py-1 border-r border-[#8B1E14]">
                                    <span className="font-semibold">Transporter:</span>{" "}
                                    {transporterName || "Self / N/A"}
                                    <span className="mx-3">|</span>
                                    <span className="font-semibold">No. Of Bundles:</span>{" "}
                                    {noOfBundles ?? "-"}
                                </td>
                                <td className="bg-[#F5E7D9] px-2 py-1 text-right font-bold text-[#8B1E14] tabular-nums">
                                    {totalQuantity}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-3 px-3 py-4 text-[8px] text-slate-600 items-end border-t border-[#8B1E14]">
                    <div className="text-left uppercase">Receiver's Signature</div>
                    <div className="text-center text-slate-400">Job Work Only</div>
                    <div className="text-right uppercase font-semibold">
                        For {resolvedBusinessName}
                    </div>
                </div>
            </div>
        </div>
    );
}