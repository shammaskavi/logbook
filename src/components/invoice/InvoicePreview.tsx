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


    // Helper function for amount in words (Rupees and Paise)
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
            if (n < 100)
                return tens[Math.floor(n / 10)] + " " + ones[n % 10];
            if (n < 1000)
                return (
                    ones[Math.floor(n / 100)] +
                    " Hundred " +
                    convert(n % 100)
                );
            if (n < 100000)
                return (
                    convert(Math.floor(n / 1000)) +
                    " Thousand " +
                    convert(n % 1000)
                );
            if (n < 10000000)
                return (
                    convert(Math.floor(n / 100000)) +
                    " Lakh " +
                    convert(n % 100000)
                );
            return (
                convert(Math.floor(n / 10000000)) +
                " Crore " +
                convert(n % 10000000)
            );
        };

        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);

        let words = convert(rupees).replace(/\s+/g, " ").trim();

        if (!words) words = "Zero";

        let result = `${words} Rupees`;

        if (paise > 0) {
            result += ` and ${convert(paise).trim()} Paise`;
        }

        return result + " Only";
    };

    const amountInWords =
        invoice.amount_in_words && invoice.amount_in_words !== "-"
            ? invoice.amount_in_words
            : numberToWords(grandTotal);

    return (
        <div className="bg-white text-black max-w-[820px] mx-auto border border-gray-400 p-6 print:p-4 print:border">

            {/* HEADER */}
            <div className="border border-gray-400 p-4 mb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-bold tracking-wide">
                            KAMIL JAMAL
                        </h1>
                        <p className="text-xs">Saree Finishing Job Work</p>
                        <p className="text-xs">
                            18/2, 2nd Cross, Vinayaka Nagar Extn,
                        </p>
                        <p className="text-xs">
                            Old Guddadahalli, Bangalore - 560026
                        </p>
                        <p className="text-xs">GSTIN: 29AEDPJ8482L1ZU</p>
                        <p className="text-xs">Mob: +91 9379354380, +91 9845343015</p>
                    </div>

                    <div className="text-right text-sm">
                        <p className="font-semibold border px-3 py-1 inline-block">
                            JOB WORK INVOICE
                        </p>
                        <p className="mt-2">
                            <strong>Invoice No:</strong> {invoice.invoice_number}
                        </p>
                        <p>
                            <strong>Date:</strong>{" "}
                            {invoice.invoice_date
                                ? format(new Date(invoice.invoice_date), "dd-MM-yyyy")
                                : "-"}
                        </p>
                        <p>
                            <strong>SAC Code:</strong> 998821
                        </p>
                    </div>
                </div>
            </div>

            {/* BILL TO */}
            <div className="border border-gray-400 p-3 mb-4 text-sm">
                <p>
                    <strong>To:</strong> {invoice.party_name}
                </p>
                {invoice.party_gstin && (
                    <p>
                        <strong>GSTIN:</strong> {invoice.party_gstin}
                    </p>
                )}
            </div>

            {/* ITEMS TABLE */}
            <table className="w-full text-sm border border-gray-400 mb-6">
                <thead>
                    <tr>
                        <th className="border border-gray-400 px-2 py-1 text-left">W.O No</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">D.C No</th>
                        <th className="border border-gray-400 px-2 py-1 text-left">Particulars</th>
                        <th className="border border-gray-400 px-2 py-1 text-right">Qty</th>
                        <th className="border border-gray-400 px-2 py-1 text-right">Rate</th>
                        <th className="border border-gray-400 px-2 py-1 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="border border-gray-400 py-6 text-center">
                                No items available
                            </td>
                        </tr>
                    ) : (
                        items.map((item: any, index: number) => (
                            <tr key={index}>
                                <td className="border border-gray-400 px-2 py-1">
                                    {item.wo_number || "-"}
                                </td>
                                <td className="border border-gray-400 px-2 py-1">
                                    {item.dc_number || "-"}
                                </td>
                                <td className="border border-gray-400 px-2 py-1">
                                    {item.particulars}
                                </td>
                                <td className="border border-gray-400 px-2 py-1 text-right">
                                    {item.quantity}
                                </td>
                                <td className="border border-gray-400 px-2 py-1 text-right">
                                    {Number(item.rate).toFixed(2)}
                                </td>
                                <td className="border border-gray-400 px-2 py-1 text-right">
                                    {(Number(item.quantity) * Number(item.rate)).toFixed(2)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* TOTALS BOX */}
            <div className="flex justify-between items-end mb-6">
                <div className="text-sm w-1/2">
                    <p>
                        <strong>Amount:</strong> {amountInWords}
                    </p>
                </div>

                <table className="text-sm border border-gray-400 w-72">
                    <tbody>
                        <tr>
                            <td className="border px-2 py-1">Total</td>
                            <td className="border px-2 py-1 text-right">
                                {subtotal.toFixed(2)}
                            </td>
                        </tr>

                        {invoice.gst_type === "cgst_sgst" && (
                            <>
                                <tr>
                                    <td className="border px-2 py-1">
                                        SGST @ {sgstPercent}%
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                        {sgstAmount.toFixed(2)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="border px-2 py-1">
                                        CGST @ {cgstPercent}%
                                    </td>
                                    <td className="border px-2 py-1 text-right">
                                        {cgstAmount.toFixed(2)}
                                    </td>
                                </tr>
                            </>
                        )}

                        {invoice.gst_type === "igst" && (
                            <tr>
                                <td className="border px-2 py-1">
                                    IGST @ {igstPercent}%
                                </td>
                                <td className="border px-2 py-1 text-right">
                                    {igstAmount.toFixed(2)}
                                </td>
                            </tr>
                        )}

                        <tr className="font-semibold">
                            <td className="border px-2 py-1">GRAND TOTAL</td>
                            <td className="border px-2 py-1 text-right">
                                {grandTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SIGNATURE */}
            <div className="text-center text-xs mt-8">
                <p>This is a system generated invoice.</p>
            </div>

        </div>
    );
}
