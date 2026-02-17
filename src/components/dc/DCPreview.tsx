import React from "react";

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
        <div className="dc-print bg-white text-black p-8 text-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-lg font-bold uppercase">{businessName}</h1>
                    <div className="whitespace-pre-line">{businessAddress}</div>
                    {businessGSTIN && <div>GSTIN: {businessGSTIN}</div>}
                    {businessPhones.length > 0 && (
                        <div>Mob: {businessPhones.join(", ")}</div>
                    )}
                </div>

                <div className="border border-black px-4 py-1 text-sm font-semibold">
                    DELIVERY SLIP
                </div>
            </div>

            {/* Party + DC Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    {/* <div className="font-semibold">To:</div>
                    <div className="font-medium">{partyName}</div>
                     */}
                    <div className="mt-1">
                        <span className="font-semibold">To:</span> {partyName}
                    </div>
                    {partyGSTIN && (
                        <div className="mt-1">
                            <span className="font-semibold">Party's GSTIN:</span> {partyGSTIN}
                        </div>
                    )}
                </div>

                <div className="text-right space-y-1">
                    <div>
                        <span className="font-semibold">DC No:</span>{" "}
                        <span className="text-red-600 font-semibold">{dcNumber}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Date:</span> {dcDate}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full border border-black border-collapse mb-6">
                <thead>
                    <tr className="border-b border-black">
                        <th className="border-r border-black px-2 py-1 text-left">
                            WO No.
                        </th>
                        <th className="border-r border-black px-2 py-1 text-left">
                            Particulars
                        </th>
                        <th className="px-2 py-1 text-right">Quantity</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-black last:border-b-0">
                            <td className="border-r border-black px-2 py-1">
                                {item.work_order_number}
                            </td>
                            <td className="border-r border-black px-2 py-1">
                                {item.job_work_type_name}
                            </td>
                            <td className="px-2 py-1 text-right">{item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                    <div className="font-semibold">Goods sent through:</div>
                    <div>{transporterName || "-"}</div>
                </div>

                <div>
                    <div className="font-semibold">No. of Bundles:</div>
                    <div>{noOfBundles ?? "-"}</div>
                </div>

                <div className="text-right">
                    <div className="font-semibold">Total Quantity:</div>
                    <div className="font-semibold">{totalQuantity}</div>
                </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-12">
                <div>
                    <div className="border-t border-black w-48 pt-1 text-xs">
                        Receiver Signature
                    </div>
                </div>

                <div className="text-center">
                    <div className="border border-black px-4 py-1 text-xs inline-block">
                        FOR JOB WORK ONLY
                    </div>
                </div>

                <div className="text-right">
                    <div className="border-t border-black w-48 pt-1 text-xs">
                        FOR {businessName}
                    </div>
                </div>
            </div>
            <div className="text-center">
                <div className="py-8 text-xs inline-block">
                    Developed by VelocityOS Pvt. Ltd. | www.velocityos.in | 7698810804
                </div>
            </div>
        </div>
    );
}