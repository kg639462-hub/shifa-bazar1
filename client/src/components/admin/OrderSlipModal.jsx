import React from 'react';
import { X, Printer, Phone, MapPin, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import DispensaryLogo from '../common/DispensaryLogo';

export default function OrderSlipModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  // Bulletproof isolated print: Prints ONLY this specific slip with 0 background admin elements
  const handlePrint = () => {
    const slipElement = document.getElementById('order-slip-printable');
    if (!slipElement) {
      window.print();
      return;
    }

    // Clean up any existing print iframe
    let printFrame = document.getElementById('order-slip-print-frame');
    if (printFrame) {
      document.body.removeChild(printFrame);
    }

    // Create a new invisible iframe for dedicated printing
    printFrame = document.createElement('iframe');
    printFrame.id = 'order-slip-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow || printFrame.contentDocument;
    const doc = frameDoc.document || frameDoc;

    // Grab all stylesheets and font links from parent document
    const headContent = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Slip - Order #${order.id}</title>
          ${headContent}
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            body {
              background: #ffffff !important;
              color: #111827 !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #order-slip-printable {
              width: 100% !important;
              max-width: 620px !important;
              margin: 0 auto !important;
              padding: 16px !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body>
          <div id="order-slip-printable">
            ${slipElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print once iframe resources are rendered
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        window.print();
      }
    }, 300);
  };

  const isCOD = (order.payment_method || '').toLowerCase() === 'cod';
  const totalAmount = Number(order.total_amount || 0).toFixed(2);
  const items = order.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl w-full max-w-xl border border-[#d6e8dd] shadow-2xl overflow-hidden my-6 print:m-0 print:w-full print:max-w-none print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-[#0a2e1e] text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-300" />
            <span className="font-serif text-xs font-bold">Delivery Packing Slip</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#0a2e1e] text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download Slip (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* EXACT DELIVERY SLIP FORMAT                                    */}
        {/* Strictly: 1. Company Intro  2. Payment  3. Deliver To  4. Items*/}
        {/* ============================================================== */}
        <div id="order-slip-printable" className="p-6 sm:p-8 text-gray-900 bg-white space-y-4 print:p-4 text-xs font-sans">
          
          {/* 1. COMPANY INTRO & ORDER IDENTIFIER */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#0a2e1e] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DispensaryLogo variant="header" />
              </div>
              <h1 className="text-sm font-bold text-[#0a2e1e] font-serif tracking-wide pt-1">
                Ash-Shifa Herbal Dispensary
              </h1>
              <p className="text-[11px] text-gray-600 leading-tight">
                Ring Road Medical Enclave, Hyderabad, Telangana - 500001<br />
                Support: <span className="font-bold text-gray-800">+91 91234 56789</span> • Lic: AYUR/DISP/2026/089
              </p>
            </div>

            <div className="text-right space-y-1 shrink-0">
              <span className="inline-block bg-[#0a2e1e] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded">
                DELIVERY SLIP
              </span>
              <p className="font-mono text-xs font-bold text-[#0a2e1e] pt-1">
                Order #{order.id}
              </p>
              <p className="text-[10px] text-gray-500">
                Date: {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* 2. PAYMENT DETAILS (High-Visibility for Delivery Executive) */}
          <div className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-4 ${
            isCOD
              ? 'bg-amber-50 border-amber-400 text-amber-950'
              : 'bg-emerald-50 border-emerald-400 text-emerald-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${isCOD ? 'bg-amber-200' : 'bg-emerald-200'}`}>
                {isCOD ? (
                  <AlertCircle className="w-5 h-5 text-amber-900" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-900" />
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  {isCOD ? '⚠️ CASH ON DELIVERY (COD)' : '✓ PREPAID ONLINE ORDER'}
                </span>
                <p className="text-sm font-bold">
                  {isCOD ? (
                    <span>COLLECT CASH FROM PATIENT: ₹{totalAmount}</span>
                  ) : (
                    <span>PAID IN FULL (RAZORPAY) — DO NOT COLLECT CASH</span>
                  )}
                </p>
                <p className="text-[10px] opacity-80">
                  {isCOD
                    ? 'Please collect exact cash from customer before handing over package.'
                    : `Transaction ID: ${order.razorpay_payment_id || 'RZP-PREPAID-VERIFIED'}`}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">TOTAL NET</span>
              <span className="font-sans text-xl font-bold">₹{totalAmount}</span>
            </div>
          </div>

          {/* 3. CUSTOMER DETAILS & DELIVERY ADDRESS */}
          <div className="border border-gray-300 rounded-xl p-4 bg-gray-50/70 space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-[11px] font-bold text-[#0a2e1e] uppercase tracking-wider">
                DELIVER TO (CUSTOMER DETAILS)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Customer Info */}
              <div className="space-y-1">
                <div>
                  <span className="text-[10px] text-gray-500 block">Customer Name:</span>
                  <p className="text-sm font-bold text-[#0a2e1e]">
                    {order.shipping_name || 'Valued Customer'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Contact Phone:</span>
                  <div className="inline-flex items-center gap-1.5 bg-white border border-gray-300 px-2 py-0.5 rounded-md mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span className="font-bold text-gray-900 text-xs">
                      {order.shipping_phone || 'No phone provided'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Destination */}
              <div className="space-y-0.5 sm:border-l sm:border-gray-200 sm:pl-3">
                <span className="text-[10px] text-gray-500 block">Delivery Address:</span>
                <p className="text-xs font-semibold text-gray-900 leading-relaxed whitespace-pre-line">
                  {order.shipping_address}
                </p>
                <p className="text-xs font-bold text-gray-900 pt-0.5">
                  {[order.shipping_city, order.shipping_state].filter(Boolean).join(', ')} - <span className="text-emerald-800 font-extrabold">{order.shipping_pincode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 4. PACKAGE CONTENTS (ONLY ITEMS IN THIS ORDER) */}
          <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
            <div className="bg-[#f0faf4] px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-800" />
                <span className="text-[11px] font-bold text-[#0a2e1e] uppercase tracking-wider">
                  PACKAGE CONTENTS ({items.length} ITEMS)
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                Order #{order.id}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-xs italic">
                  Botanical Prescription Package
                </div>
              ) : (
                items.map((item, idx) => {
                  const unitPrice = Number(item.unit_price || item.price || 0);
                  const qty = item.quantity || 1;
                  const lineTotal = Number(item.total_price || unitPrice * qty);
                  return (
                    <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 block">
                          {item.product_name || item.name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Qty: {qty} × ₹{unitPrice.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-sans font-bold text-[#0a2e1e] text-xs">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Total summary row */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">Total Net Amount:</span>
              <span className="font-sans text-sm font-bold text-[#0a2e1e]">
                ₹{totalAmount}
              </span>
            </div>
          </div>

          {/* Simple Bottom Brand Note */}
          <div className="text-center text-[10px] text-gray-500 pt-1 border-t border-gray-200">
            Thank you for ordering with <span className="font-bold text-[#0a2e1e]">Ash-Shifa Herbal Dispensary</span> • Helpline: +91 91234 56789
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="bg-gray-50 px-5 py-3 border-t border-[#e2ece5] flex items-center justify-between print:hidden">
          <p className="text-[11px] text-gray-500">
            Tip: In print settings, choose <span className="font-bold text-[#0a2e1e]">"Save as PDF"</span> or select your printer.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#0a2e1e] hover:bg-[#072417] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
