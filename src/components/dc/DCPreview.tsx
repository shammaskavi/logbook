import React from "react";
import { format } from "date-fns";

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
    partyGSTIN,
    transporterName,
    noOfBundles,
    items,
}: DCPreviewProps) {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div
            id="printable-dc"
            className="bg-white text-slate-800 p-10 flex flex-col font-sans"
            style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                backgroundColor: 'white'
            }}
        >
            {/* TOP BAR / LABEL */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-slate-900 pb-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Delivery Challan</h1>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Job Work Movement</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900 uppercase">{businessName}</h2>
                    <p className="text-xs text-slate-600 italic">Material Dispatch Slip</p>
                </div>
            </div>

            {/* HEADER INFO */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">From</h3>
                    <p className="text-sm font-bold text-slate-800">{businessName}</p>
                    <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                        {businessAddress}
                    </p>
                    {businessGSTIN && <p className="text-xs pt-1"><strong>GSTIN:</strong> {businessGSTIN}</p>}
                    {businessPhones.length > 0 && (
                        <p className="text-xs"><strong>Mob:</strong> {businessPhones.join(", ")}</p>
                    )}
                </div>
                <div className="space-y-1 text-right">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Challan Details</h3>
                    <p className="text-sm"><strong>DC No:</strong> <span className="text-slate-900 font-bold">{dcNumber}</span></p>
                    <p className="text-sm"><strong>Date:</strong> {dcDate ? format(new Date(dcDate), "dd MMMM yyyy") : "-"}</p>
                    <div className="pt-2">
                        <span className="border border-slate-900 px-3 py-1 text-[10px] font-black uppercase inline-block">
                            Job Work Only
                        </span>
                    </div>
                </div>
            </div>

            {/* BILL TO / PARTY */}
            <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-100">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Consignee / To</h3>
                <p className="text-md font-bold text-slate-900">{partyName}</p>
                {partyGSTIN && (
                    <p className="text-xs mt-1"><strong>Party GSTIN:</strong> {partyGSTIN}</p>
                )}
            </div>

            {/* ITEMS TABLE */}
            <div className="flex-grow">
                <table className="w-full text-sm mb-8 border-collapse">
                    <thead>
                        <tr
                            className="bg-slate-900 text-white"
                            style={{ backgroundColor: '#0f172a', color: 'white', WebkitPrintColorAdjust: 'exact' }}
                        >
                            <th className="px-4 py-3 text-left font-semibold first:rounded-l-md">Work Order No.</th>
                            <th className="px-4 py-3 text-left font-semibold">Particulars / Job Description</th>
                            <th className="px-4 py-3 text-right font-semibold last:rounded-r-md">Quantity (Pcs)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-10 text-center text-slate-400 italic font-light">No items listed in this challan</td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-4 align-top text-slate-900 font-bold">{item.work_order_number}</td>
                                    <td className="px-4 py-4 align-top text-slate-700">{item.job_work_type_name}</td>
                                    <td className="px-4 py-4 align-top text-right font-bold text-slate-900">{item.quantity}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 font-bold">
                            <td colSpan={2} className="px-4 py-3 text-right text-slate-500 uppercase text-xs tracking-widest">Total Quantity</td>
                            <td className="px-4 py-3 text-right text-lg text-slate-900">{totalQuantity}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* TRANSPORT INFO */}
            <div className="grid grid-cols-2 gap-8 py-6 border-t border-slate-100">
                <div className="space-y-2">
                    <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Transporter:</span>
                        <span className="text-sm font-semibold text-slate-700">{transporterName || "Self / N/A"}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">No. of Bundles:</span>
                        <span className="text-sm font-semibold text-slate-700">{noOfBundles ?? "-"}</span>
                    </div>
                </div>
            </div>

            {/* SIGNATURES */}
            <div className="mt-16 grid grid-cols-2 gap-12 items-end">
                <div className="text-left">
                    <div className="border-t border-slate-300 w-48 pt-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Receiver's Signature</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-900 mb-16 uppercase tracking-wider text-wrap">For {businessName}</p>
                    <div className="border-t border-slate-900 w-48 ml-auto pt-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Authorized Signatory</p>
                    </div>
                </div>
            </div>

            {/* VELOCITY OS FOOTER */}
            <div className="mt-auto pt-10 text-center">
                <p className="text-[9px] text-slate-300 uppercase tracking-[0.2em]">
                    System Powered by VelocityOS Pvt. Ltd | velocityos.in
                </p>
            </div>
        </div>
    );
}