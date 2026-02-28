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
        const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const convert = (n: number): string => {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10];
            if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + convert(n % 100);
            if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand " + convert(n % 1000);
            if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh " + convert(n % 100000);
            return convert(Math.floor(n / 10000000)) + " Crore " + convert(n % 10000000);
        };
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        let words = convert(rupees).replace(/\s+/g, " ").trim();
        if (!words) words = "Zero";
        let result = `${words} Rupees`;
        if (paise > 0) result += ` and ${convert(paise).trim()} Paise`;
        return result + " Only";
    };

    const amountInWords = invoice.amount_in_words && invoice.amount_in_words !== "-"
        ? invoice.amount_in_words
        : numberToWords(grandTotal);

    return (
        <div
            id="printable-invoice"
            className="bg-white text-slate-800 p-8 flex flex-col font-sans"
            style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                backgroundColor: 'white'
            }}
        >
            {/* TOP BAR - Reduced Margin */}
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-2">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">TAX INVOICE</h1>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Job Work Services</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-bold text-slate-900 uppercase">Kamil Jamal</h2>
                    <p className="text-[10px] text-slate-600">Saree Finishing Job Work</p>
                </div>
            </div>

            {/* HEADER INFO - Compact Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-0.5">
                    <h3 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">From</h3>
                    <p className="text-xs font-bold text-slate-800 leading-tight">Kamil Jamal</p>
                    <p className="text-[10px] leading-tight text-slate-600">
                        18/2, 2nd Cross, Vinayaka Nagar Extn, Old Guddadahalli, Bangalore - 560026
                    </p>
                    <p className="text-[10px]"><strong>GSTIN:</strong> 29AEDPJ8482L1ZU | <strong>Mob:</strong> 9379354380</p>
                </div>
                <div className="space-y-0.5 text-right text-[10px]">
                    <h3 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Invoice Details</h3>
                    <p><strong>Invoice No:</strong> <span className="text-slate-900 font-bold">{invoice.invoice_number}</span></p>
                    <p><strong>Date:</strong> {invoice.invoice_date ? format(new Date(invoice.invoice_date), "dd-MM-yyyy") : "-"}</p>
                    <p><strong>SAC Code:</strong> 998821</p>
                </div>
            </div>

            {/* BILL TO - Slimmer Padding */}
            <div className="bg-slate-50 px-3 py-2 rounded mb-4 border border-slate-100 flex justify-between items-center">
                <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 mr-2">Bill To:</span>
                    <span className="text-xs font-bold text-slate-900">{invoice.party_name}</span>
                </div>
                {invoice.party_gstin && (
                    <div className="text-[10px]">
                        <span className="font-semibold text-slate-500">GSTIN:</span> {invoice.party_gstin}
                    </div>
                )}
            </div>

            {/* ITEMS TABLE - Tightened Padding for 20+ Items */}
            <div className="flex-grow">
                <table className="w-full text-[11px] mb-4 border-collapse">
                    <thead>
                        <tr
                            className="bg-slate-900 text-white"
                            style={{ backgroundColor: '#0f172a', color: 'white', WebkitPrintColorAdjust: 'exact' }}
                        >
                            <th className="px-3 py-1.5 text-left font-semibold first:rounded-l-sm">W.O / D.C</th>
                            <th className="px-3 py-1.5 text-left font-semibold">Particulars</th>
                            <th className="px-3 py-1.5 text-right font-semibold">Qty</th>
                            <th className="px-3 py-1.5 text-right font-semibold">Rate</th>
                            <th className="px-3 py-1.5 text-right font-semibold last:rounded-r-sm">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 border-b border-slate-200">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic font-light">No items listed</td>
                            </tr>
                        ) : (
                            items.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="px-3 py-1.5 align-top">
                                        <div className="text-slate-900 font-bold text-[10px]">{item.wo_number || "-"}</div>
                                        <div className="text-[8px] text-slate-400 uppercase tracking-tighter leading-none">DC: {item.dc_number || "-"}</div>
                                    </td>
                                    <td className="px-3 py-1.5 align-top text-slate-700 leading-tight">{item.particulars}</td>
                                    <td className="px-3 py-1.5 align-top text-right text-slate-900 font-medium">{item.quantity}</td>
                                    <td className="px-3 py-1.5 align-top text-right text-slate-900">{Number(item.rate).toFixed(2)}</td>
                                    <td className="px-3 py-1.5 align-top text-right font-bold text-slate-900">
                                        {(Number(item.quantity) * Number(item.rate)).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* TOTALS SECTION - Compact */}
            <div className="flex justify-between items-start pt-3 border-t-2 border-slate-900">
                <div className="w-1/2">
                    <h3 className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Total Amount in Words</h3>
                    <p className="text-[10px] italic text-slate-700 leading-tight font-medium uppercase">{amountInWords}</p>
                </div>

                <div className="w-1/3 text-[11px]">
                    <div className="space-y-1">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-semibold">{subtotal.toFixed(2)}</span>
                        </div>

                        {invoice.gst_type === "cgst_sgst" && (
                            <>
                                <div className="flex justify-between text-slate-600">
                                    <span>SGST ({sgstPercent}%)</span>
                                    <span>{sgstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
                                    <span>CGST ({cgstPercent}%)</span>
                                    <span>{cgstAmount.toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {invoice.gst_type === "igst" && (
                            <div className="flex justify-between text-slate-600 pb-1 border-b border-slate-100">
                                <span>IGST ({igstPercent}%)</span>
                                <span>{igstAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] font-bold text-slate-900 uppercase">Grand Total</span>
                            <span className="text-xl font-black text-slate-900 tracking-tighter">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER & SIGNATURE - Moved closer to totals */}
            <div className="mt-6 grid grid-cols-2 gap-4 items-end">
                <div className="text-[9px] text-slate-400 space-y-0.5 leading-tight">
                    <p>1. Certified that the particulars given above are true and correct.</p>
                    <p>2. Subject to Bangalore Jurisdiction.</p>
                    <p className="pt-2 italic font-semibold text-slate-500 uppercase tracking-widest text-[8px]">
                        System Generated By VelocityOS velocityos.in
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-900 mb-8 uppercase tracking-wider">For KAMIL JAMAL</p>
                    <div className="border-t border-slate-900 w-32 ml-auto"></div>
                    <p className="text-[9px] font-bold uppercase mt-1 text-slate-400 tracking-widest">Authorized Signatory</p>
                </div>
            </div>
        </div>
    );
}