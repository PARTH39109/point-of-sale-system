import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, Download, ArrowLeft, RotateCcw, CheckCircle, 
  MapPin, Phone, Mail, FileText, ShoppingCart, User, Landmark, AlertCircle
} from 'lucide-react';
import invoiceService from '../../services/invoiceService';

const fmt = (n) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n || 0);

export default function InvoicePreview() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [layout, setLayout] = useState('thermal'); // 'thermal' or 'a4'

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await invoiceService.getInvoiceByOrderId(orderId);
        setInvoice(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchInvoice();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const blob = await invoiceService.downloadInvoicePdf(invoice.orderNumber);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber || invoice.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-text-secondary font-medium">Generating Invoice Preview...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-base p-4">
        <div className="card max-w-md w-full p-6 text-center space-y-4 border-danger-bg/30">
          <div className="w-12 h-12 bg-danger-bg/10 text-danger-text rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Invoice Not Found</h2>
          <p className="text-text-secondary text-sm">{error || 'The requested invoice could not be located.'}</p>
          <button className="btn btn-primary w-full" onClick={() => navigate('/cashier')}>
            Return to Cashier Terminal
          </button>
        </div>
      </div>
    );
  }

  const isPaid = invoice.paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-bg-base p-4 md:p-8 font-sans">
      
      {/* ─── Control Bar (hidden during printing) ───────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between no-print bg-bg-elevated p-4 rounded-xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            className="btn btn-secondary p-2.5" 
            onClick={() => navigate('/cashier')}
            title="Back to Cashier"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Sale Completed Successfully
            </h1>
            <p className="text-xs text-text-secondary">Invoice: {invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Layout selection */}
        <div className="flex items-center gap-2 bg-bg-base p-1 rounded-lg border border-border-subtle">
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${layout === 'thermal' ? 'bg-brand-400 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setLayout('thermal')}
          >
            80mm Thermal
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${layout === 'a4' ? 'bg-brand-400 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setLayout('a4')}
          >
            A4 Invoice
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="btn btn-secondary flex-1 sm:flex-none text-xs" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </button>
          <button className="btn btn-secondary flex-1 sm:flex-none text-xs" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1.5" /> Print
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none text-xs" onClick={() => navigate('/cashier')}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> New Sale
          </button>
        </div>
      </div>

      {/* ─── INVOICE VIEW CONTAINER ────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto flex justify-center">
        
        {/* Style configurations for print media */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { background: white !important; color: black !important; padding: 0 !important; }
            .no-print { display: none !important; }
            .print-area { border: none !important; box-shadow: none !important; padding: 0 !important; background: white !important; }
            .a4-print { width: 210mm !important; min-height: 297mm !important; }
            .thermal-print { width: 80mm !important; }
          }
        `}} />

        {/* ─── Layout 1: Thermal Receipt ─── */}
        {layout === 'thermal' && (
          <div className="print-area thermal-print w-[80mm] bg-white text-black p-4 border border-border-subtle shadow-md font-mono text-xs">
            
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
              <h2 className="text-base font-bold tracking-tight uppercase">POINT OF SALE</h2>
              <p className="font-semibold text-sm">Store #{invoice.storeId}</p>
              {invoice.branchId && <p className="text-[10px]">Branch ID: {invoice.branchId}</p>}
              <p className="text-[10px] leading-tight mt-1">123 POS Road, Tech City<br />GSTIN: 27AAAAA1111A1Z1</p>
            </div>

            {/* Info block */}
            <div className="py-2 space-y-0.5 border-b border-dashed border-gray-300 text-[10px]">
              <div className="flex justify-between">
                <span>INVOICE:</span><span>{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>ORDER ID:</span><span>{invoice.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span><span>{new Date(invoice.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span><span>{invoice.cashierName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>CUSTOMER:</span><span>{invoice.customerName || 'Walk-in'}</span>
              </div>
            </div>

            {/* Item Table */}
            <div className="py-3 border-b border-dashed border-gray-300">
              <div className="grid grid-cols-12 font-bold mb-1 border-b border-gray-300 pb-1">
                <span className="col-span-6">Item Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              
              <div className="space-y-2">
                {invoice.items?.map(item => (
                  <div key={item.id} className="grid grid-cols-12 leading-tight">
                    <div className="col-span-6 flex flex-col">
                      <span className="font-medium truncate">{item.productName}</span>
                      <span className="text-[9px] text-gray-500">@{fmt(item.unitPrice)}</span>
                    </div>
                    <span className="col-span-2 text-right">{item.quantity}</span>
                    <span className="col-span-4 text-right">{fmt(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summaries */}
            <div className="py-3 space-y-1 border-b border-dashed border-gray-300 font-semibold text-right">
              <div className="flex justify-between text-[10px]">
                <span>Subtotal:</span><span>{fmt(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-[10px] text-red-600">
                  <span>Discount:</span><span>-{fmt(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px]">
                <span>Tax (GST):</span><span>{fmt(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200">
                <span>TOTAL:</span><span>{fmt(invoice.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 space-y-0.5 border-b border-dashed border-gray-300 text-[10px]">
              <div className="flex justify-between">
                <span>Method:</span><span>{invoice.paymentMethod || 'CASH'}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Status:</span><span>{invoice.paymentStatus}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center space-y-2 text-[10px]">
              <p className="font-bold">*** THANK YOU ***</p>
              <p className="leading-tight text-[9px] text-gray-500">
                Returns accepted within 7 days with receipt.<br />
                Follow us at www.possystem.com
              </p>
              <div className="border border-gray-300 p-2 inline-block mx-auto rounded">
                <span className="text-[8px] tracking-widest font-sans font-bold">QR VERIFIED</span>
              </div>
              <p className="text-[8px] text-gray-400 mt-2">Generated by POS Terminal</p>
            </div>

          </div>
        )}

        {/* ─── Layout 2: A4 Invoice ─── */}
        {layout === 'a4' && (
          <div className="print-area a4-print w-full md:w-[210mm] min-h-[297mm] bg-white text-black p-8 md:p-12 border border-border-subtle shadow-md flex flex-col justify-between">
            
            {/* Header info */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">POINT OF SALE</h2>
                  <p className="text-sm font-semibold text-gray-600 mt-1">Store #{invoice.storeId}</p>
                  {invoice.branchId && <p className="text-xs text-gray-500">Branch: {invoice.branchName || `Branch #${invoice.branchId}`}</p>}
                </div>
                <div className="text-left sm:text-right text-xs text-gray-500 space-y-1">
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>123 POS Road, Corporate Hub, Tech City</span>
                  </div>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 99887 76655</span>
                  </div>
                  <div className="flex sm:justify-end items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>billing@possystem.com</span>
                  </div>
                  <p className="font-semibold text-gray-700 pt-1">GSTIN: 27AAAAA1111A1Z1 (Placeholder)</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-gray-200">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billed To</h3>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-800">{invoice.customerName || 'Walk-in Customer'}</span>
                  </div>
                  {invoice.customerPhone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />
                      <span>{invoice.customerPhone}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1.5 text-xs text-gray-600 sm:text-right">
                  <div className="flex sm:justify-end gap-2">
                    <span className="font-bold">Invoice Number:</span>
                    <span className="font-mono">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="font-bold">Order Number:</span>
                    <span className="font-mono">{invoice.orderNumber}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="font-bold">Date & Time:</span>
                    <span>{new Date(invoice.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2">
                    <span className="font-bold">Processed By:</span>
                    <span>{invoice.cashierName}</span>
                  </div>
                </div>
              </div>

              {/* Table of items */}
              <div className="py-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 font-bold text-gray-700 bg-gray-50">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-3 text-right">Tax</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map(item => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-semibold text-gray-800">{item.productName}</td>
                        <td className="py-3 px-3 font-mono text-[10px] text-gray-500">{item.productId}</td>
                        <td className="py-3 px-3 text-right">{item.quantity}</td>
                        <td className="py-3 px-3 text-right">{fmt(item.unitPrice)}</td>
                        <td className="py-3 px-3 text-right text-red-600">-{fmt(item.discount)}</td>
                        <td className="py-3 px-3 text-right">{fmt(item.tax)}</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">{fmt(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                
                {/* Payment/Terms */}
                <div className="text-[11px] text-gray-500 max-w-md space-y-2">
                  <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200/50">
                    <Landmark className="w-4 h-4 text-brand-400" />
                    <div>
                      <span className="font-semibold text-gray-700 block">Payment Method: {invoice.paymentMethod || 'CASH'}</span>
                      <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {invoice.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 block mb-0.5">Return & Exchange Policy</span>
                    <span>Goods can be exchanged within 7 business days from date of purchase when presented with this original invoice. Returns must be in brand new, unused condition.</span>
                  </div>
                </div>

                {/* Totals grid */}
                <div className="w-full sm:w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{fmt(invoice.subtotal)}</span>
                  </div>
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold">
                      <span>Discount:</span>
                      <span>-{fmt(invoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST):</span>
                    <span>{fmt(invoice.taxAmount)}</span>
                  </div>
                  <div className="divider my-1"></div>
                  <div className="flex justify-between text-sm font-black text-gray-900">
                    <span>Grand Total:</span>
                    <span className="text-brand-400">{fmt(invoice.grandTotal)}</span>
                  </div>
                </div>

              </div>

              {/* Signature/Stamp area */}
              <div className="flex justify-between items-end mt-12 pt-8 border-t border-gray-100">
                <div className="text-center">
                  <div className="border border-gray-300 p-2.5 rounded mb-1 bg-gray-50 font-sans font-bold text-[9px] tracking-widest text-gray-500 uppercase">
                    QR RECEIPT VERIFIED
                  </div>
                  <span className="text-[9px] text-gray-400">Digital POS Signature</span>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-gray-300 mx-auto"></div>
                  <span className="text-[10px] text-gray-500 font-medium block mt-1">Authorized Signatory</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-gray-400 mt-8">
                Thank you for shopping with us! generated automatically by Point of Sale.
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
