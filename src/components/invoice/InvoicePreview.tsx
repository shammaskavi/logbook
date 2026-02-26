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
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900">TAX INVOICE</h1>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Job Work Services</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-900 uppercase">Kamil Jamal</h2>
                    <p className="text-xs text-slate-600">Saree Finishing Job Work</p>
                </div>
            </div>

            {/* HEADER INFO */}
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">From</h3>
                    <p className="text-sm font-bold text-slate-800">Kamil Jamal</p>
                    <p className="text-xs leading-relaxed text-slate-600">
                        18/2, 2nd Cross, Vinayaka Nagar Extn,<br />
                        Old Guddadahalli, Bangalore - 560026
                    </p>
                    <p className="text-xs pt-1"><strong>GSTIN:</strong> 29AEDPJ8482L1ZU</p>
                    <p className="text-xs"><strong>Mob:</strong> +91 9379354380, 9845343015</p>
                </div>
                <div className="space-y-1 text-right">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-wider">Invoice Details</h3>
                    <p className="text-sm"><strong>Invoice No:</strong> <span className="text-slate-900 font-bold">{invoice.invoice_number}</span></p>
                    <p className="text-sm"><strong>Date:</strong> {invoice.invoice_date ? format(new Date(invoice.invoice_date), "dd MMMM yyyy") : "-"}</p>
                    <p className="text-sm"><strong>SAC Code:</strong> 998821</p>
                </div>
            </div>

            {/* BILL TO */}
            <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-100">
                <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Bill To</h3>
                <p className="text-md font-bold text-slate-900">{invoice.party_name}</p>
                {invoice.party_gstin && (
                    <p className="text-xs mt-1"><strong>GSTIN:</strong> {invoice.party_gstin}</p>
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
                            <th className="px-4 py-3 text-left font-semibold first:rounded-l-md">W.O / D.C</th>
                            <th className="px-4 py-3 text-left font-semibold">Particulars</th>
                            <th className="px-4 py-3 text-right font-semibold">Qty</th>
                            <th className="px-4 py-3 text-right font-semibold">Rate</th>
                            <th className="px-4 py-3 text-right font-semibold last:rounded-r-md">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 italic font-light">No items listed in this invoice</td>
                            </tr>
                        ) : (
                            items.map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-4 align-top">
                                        <div className="text-slate-900 font-bold">{item.wo_number || "-"}</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tighter">DC: {item.dc_number || "-"}</div>
                                    </td>
                                    <td className="px-4 py-4 align-top text-slate-700">{item.particulars}</td>
                                    <td className="px-4 py-4 align-top text-right text-slate-900 font-medium">{item.quantity}</td>
                                    <td className="px-4 py-4 align-top text-right text-slate-900">{Number(item.rate).toFixed(2)}</td>
                                    <td className="px-4 py-4 align-top text-right font-bold text-slate-900">
                                        {(Number(item.quantity) * Number(item.rate)).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* TOTALS SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start pt-6 border-t-2 border-slate-900">
                <div className="w-full md:w-1/2 mb-6">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Total Amount in Words</h3>
                    <p className="text-sm italic text-slate-700 leading-snug font-medium uppercase">{amountInWords}</p>
                </div>

                <div className="w-full md:w-1/3">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-semibold">{subtotal.toFixed(2)}</span>
                        </div>

                        {invoice.gst_type === "cgst_sgst" && (
                            <>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>SGST ({sgstPercent}%)</span>
                                    <span>{sgstAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 pb-2 border-b border-slate-100">
                                    <span>CGST ({cgstPercent}%)</span>
                                    <span>{cgstAmount.toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {invoice.gst_type === "igst" && (
                            <div className="flex justify-between text-sm text-slate-600 pb-2 border-b border-slate-100">
                                <span>IGST ({igstPercent}%)</span>
                                <span>{igstAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-bold text-slate-900 uppercase">Grand Total</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER & SIGNATURE */}
            <div className="mt-12 grid grid-cols-2 gap-8 items-end">
                <div className="text-[10px] text-slate-400 space-y-1 leading-relaxed">
                    <p>1. Certified that the particulars given above are true and correct.</p>
                    <p>2. Goods once sold will not be taken back or exchanged.</p>
                    <p>3. Subject to Bangalore Jurisdiction.</p>
                    <p className="pt-4 italic font-semibold text-slate-500 uppercase tracking-widest">System Generated Invoice By VelocityOS velocityos.in</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-900 mb-16 uppercase tracking-wider">For KAMIL JAMAL</p>
                    <div className="border-t border-slate-900 w-48 ml-auto"></div>
                    <p className="text-[10px] font-bold uppercase mt-2 text-slate-400 tracking-widest">Authorized Signatory</p>
                </div>
            </div>
        </div>
    );
}