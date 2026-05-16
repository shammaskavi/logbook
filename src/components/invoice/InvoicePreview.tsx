import { format } from "date-fns";

interface InvoicePreviewProps {
    invoice: any;
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
    if (!invoice) return null;

    const items = Array.isArray(invoice.items) ? invoice.items : [];

    const subtotal = items.reduce(
        (sum: number, item: any) =>
            sum + Number(item.quantity || 0) * Number(item.rate || 0),
        0
    );

    const cgstPercent = Number(invoice.cgst_percent || 0);
    const sgstPercent = Number(invoice.sgst_percent || 0);
    const igstPercent = Number(invoice.igst_percent || 0);

    const cgstAmount = (subtotal * cgstPercent) / 100;
    const sgstAmount = (subtotal * sgstPercent) / 100;
    const igstAmount = (subtotal * igstPercent) / 100;

    const grandTotal = subtotal + cgstAmount + sgstAmount + igstAmount;

    const numberToWords = (num: number): string => {
        if (!num) return "Zero Rupees Only";

        const ones = [
            "",
            "One",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine",
            "Ten",
            "Eleven",
            "Twelve",
            "Thirteen",
            "Fourteen",
            "Fifteen",
            "Sixteen",
            "Seventeen",
            "Eighteen",
            "Nineteen",
        ];

        const tens = [
            "",
            "",
            "Twenty",
            "Thirty",
            "Forty",
            "Fifty",
            "Sixty",
            "Seventy",
            "Eighty",
            "Ninety",
        ];

        const convert = (n: number): string => {
            if (n < 20) return ones[n];
            if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]}`;
            if (n < 1000)
                return `${ones[Math.floor(n / 100)]} Hundred ${convert(n % 100)}`;
            if (n < 100000)
                return `${convert(Math.floor(n / 1000))} Thousand ${convert(
                    n % 1000
                )}`;
            if (n < 10000000)
                return `${convert(Math.floor(n / 100000))} Lakh ${convert(
                    n % 100000
                )}`;
            return `${convert(Math.floor(n / 10000000))} Crore ${convert(
                n % 10000000
            )}`;
        };

        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);

        let words = convert(rupees).replace(/\s+/g, " ").trim();
        if (!words) words = "Zero";

        let result = `${words} Rupees`;
        if (paise > 0) {
            result += ` and ${convert(paise).replace(/\s+/g, " ").trim()} Paise`;
        }

        return `${result} Only`;
    };

    const amountInWords =
        invoice.amount_in_words && invoice.amount_in_words !== "-"
            ? invoice.amount_in_words
            : numberToWords(grandTotal);

    const businessName = invoice.businessName || "AAMIR JAMAL";
    const businessAddress =
        invoice.businessAddress ||
        "#18/2, 2nd Cross, Vinayaka Nagar Extn, Old Guddadahalli, Bangalore 560026, Karnataka, India";
    const businessPAN = invoice.businessPAN || "AMXPJ3615P";
    const businessPhone =
        invoice.businessPhones || invoice.businessPhone || "+91 98453 43015";

    const displayInvoiceNo =
        invoice.invoice_number || invoice.invoiceNumber || "-";

    const displayDate = invoice.invoice_date
        ? format(new Date(invoice.invoice_date), "dd MMM yyyy")
        : "-";

    const totalsRows =
        invoice.gst_type === "cgst_sgst"
            ? [
                { label: `CGST ${cgstPercent}%`, value: cgstAmount },
                { label: `SGST ${sgstPercent}%`, value: sgstAmount },
            ]
            : invoice.gst_type === "igst"
                ? [{ label: `IGST ${igstPercent}%`, value: igstAmount }]
                : [];

    // Calibrated to keep the full invoice (including bank details and footer)
    // within a single A4 page when printed.
    const minimumRows = 24;
    const fillerRows = Math.max(0, minimumRows - items.length);

    return (
        <div
            id="printable-invoice"
            className="bg-white text-black font-sans mx-auto"
            style={{
                width: "210mm",
                height: "297mm",
                padding: "8mm",
                boxSizing: "border-box",
                fontSize: "11px",
                lineHeight: 1.25,
                overflow: "hidden",
                pageBreakInside: "avoid",
                breakInside: "avoid",
            }}
        >
            <div className="border border-[#8B1E14] h-full flex flex-col">
                {/* Header */}
                <div className="grid grid-cols-[56px_1fr_140px] border-b border-[#8B1E14]">
                    <div className="border-r border-[#8B1E14] p-2 flex items-center justify-center">
                        <div className="w-10 h-10 bg-[#8B1E14] text-white flex items-center justify-center font-bold text-xl leading-none">
                            AJ
                        </div>
                    </div>

                    <div className="p-2">
                        <div className="text-lg font-bold text-[#8B1E14] uppercase leading-tight">
                            {businessName}
                        </div>
                        <div className="text-[9px] text-slate-700 leading-tight mt-0.5">
                            {businessAddress}
                        </div>
                    </div>

                    <div className="border-l border-[#8B1E14] text-[9px]">
                        <div className="px-2 py-1 border-b border-[#8B1E14]">
                            <span className="font-semibold">PAN No:</span> {businessPAN}
                        </div>
                        <div className="px-2 py-1">
                            <span className="font-semibold">Ph No:</span> {businessPhone}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="bg-[#8B1E14] text-white text-center font-bold py-1 uppercase tracking-wide border-b border-[#8B1E14]">
                    Tax Invoice
                </div>

                {/* Customer and invoice info */}
                <div className="grid grid-cols-[10%_10%_44%_12%_8%_16%] border-b border-[#8B1E14] text-[10px]">
                    <div className="col-span-3 px-2 py-2 border-r border-[#8B1E14]">
                        <span className="font-semibold">To:</span>{" "}
                        <span className="font-bold uppercase">
                            {invoice.party_name || "-"}
                        </span>
                    </div>

                    <div className="col-span-2 px-2 py-2 border-r border-[#8B1E14]">
                        <span className="font-semibold">Invoice No:</span>{" "}
                        <span className="font-bold text-[#8B1E14] break-all leading-tight">
                            {displayInvoiceNo}
                        </span>
                    </div>

                    <div className="col-span-1 px-2 py-2">
                        <span className="font-semibold">Date:</span> {displayDate}
                    </div>
                </div>

                {/* Items table */}
                <table className="w-full border-collapse table-fixed text-[10px]">
                    <thead>
                        <tr className="bg-[#F5E7D9] text-[#8B1E14] uppercase font-bold">
                            <th className="w-[10%] border-r border-b border-[#8B1E14] px-2 py-1 text-left">
                                WO No.
                            </th>
                            <th className="w-[10%] border-r border-b border-[#8B1E14] px-2 py-1 text-left">
                                DC No.
                            </th>
                            <th className="w-[44%] border-r border-b border-[#8B1E14] px-2 py-1 text-left">
                                Particulars
                            </th>
                            <th className="w-[12%] border-r border-b border-[#8B1E14] px-2 py-1 text-right">
                                Quantity
                            </th>
                            <th className="w-[8%] border-r border-b border-[#8B1E14] px-2 py-1 text-right">
                                Rate
                            </th>
                            <th className="w-[16%] border-b border-[#8B1E14] px-2 py-1 text-right">
                                Amount
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {items.map((item: any, index: number) => (
                            <tr
                                key={index}
                                className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                            >
                                <td className="border-r border-[#8B1E14] px-2 py-1 align-top">
                                    {item.wo_number || "-"}
                                </td>
                                <td className="border-r border-[#8B1E14] px-2 py-1 align-top">
                                    {item.dc_number || "-"}
                                </td>
                                <td className="border-r border-[#8B1E14] px-2 py-1 align-top">
                                    {item.particulars || "-"}
                                </td>
                                <td className="border-r border-[#8B1E14] px-2 py-1 text-right align-top tabular-nums">
                                    {Number(item.quantity || 0)}
                                </td>
                                <td className="border-r border-[#8B1E14] px-2 py-1 text-right align-top tabular-nums">
                                    {Number(item.rate || 0).toFixed(2)}
                                </td>
                                <td className="px-2 py-1 text-right align-top tabular-nums font-semibold">
                                    ₹ {(Number(item.quantity || 0) * Number(item.rate || 0)).toFixed(
                                        2
                                    )}
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
                                <td className="border-r border-[#8B1E14] px-2 py-[10px]">&nbsp;</td>
                                <td className="border-r border-[#8B1E14] px-2 py-[10px]">&nbsp;</td>
                                <td className="border-r border-[#8B1E14] px-2 py-[10px]">&nbsp;</td>
                                <td className="border-r border-[#8B1E14] px-2 py-[10px]">&nbsp;</td>
                                <td className="border-r border-[#8B1E14] px-2 py-[10px]">&nbsp;</td>
                                <td className="px-2 py-[10px]">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Amount in words + totals */}
                <div className="grid grid-cols-[10%_10%_44%_12%_8%_16%] border-t border-[#8B1E14] text-[10px]">
                    <div className="col-span-3 px-2 py-2 border-r border-[#8B1E14]">
                        <span className="font-semibold">Amount (in words)</span>
                        <span className="ml-2">{amountInWords}</span>
                    </div>

                    <div className="col-span-2 bg-[#8B1E14] text-white text-center px-2 py-2 font-bold border-r border-[#8B1E14] tabular-nums">
                        {items.reduce(
                            (sum: number, item: any) => sum + Number(item.quantity || 0),
                            0
                        )}
                    </div>

                    <div className="col-span-1 bg-[#8B1E14] text-white text-right px-3 py-2 font-bold tabular-nums">
                        ₹ {grandTotal.toFixed(2)}
                    </div>
                </div>

                {/* Optional GST rows */}
                {totalsRows.length > 0 && (
                    <div className="border-t border-[#8B1E14]  px-2 py-1 text-[9px] text-right space-y-0.5">
                        {totalsRows.map((row) => (
                            <div key={row.label}>
                                {row.label}: ₹ {row.value.toFixed(2)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Bank details */}
                <div className="border-t border-b border-[#8B1E14] px-2 py-2 text-[9px] leading-relaxed">
                    <span className="font-bold mr-4">Bank Details</span>
                    <span className="mr-4">
                        <span className="font-semibold">A/C Name:</span> {businessName}
                    </span>
                    <span className="mr-4">
                        <span className="font-semibold">A/C No:</span> 35458273438546
                    </span>
                    <span className="mr-4">
                        <span className="font-semibold">IFSC Code:</span> KKBK0008047
                    </span>
                    <span className="mr-4">
                        <span className="font-semibold">Branch:</span> Avenue Road
                    </span>
                    <span>
                        <span className="font-semibold">Bank:</span> Kotak Mahindra Bank
                    </span>
                </div>

                {/* Footer */}
                <div className="grid grid-cols-3 px-3 py-10 text-[9px] text-slate-600 items-end">
                    <div className="text-left uppercase">Receiver's Signature</div>
                    <div className="text-center text-slate-400">
                        Thank you for your business
                    </div>
                    <div className="text-right uppercase font-semibold">
                        For {businessName}
                    </div>
                </div>
            </div>
        </div>
    );
}