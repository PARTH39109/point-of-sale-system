import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, ArrowLeft, RefreshCcw, CheckCircle2, 
  Trash2, Plus, Minus, FileText, User, ShoppingBag, Clock, Tag
} from 'lucide-react';
import orderService from '../../services/orderService';
import refundService from '../../services/refundService';

const fmt = (n) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n || 0);

const REFUND_REASONS = [
  'Damaged Product',
  'Wrong Product',
  'Expired Product',
  'Customer Cancelled',
  'Billing Error',
  'Other'
];

export default function RefundManagement() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState(null);
  const [orderRefunds, setOrderRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refund execution state
  const [refundReason, setRefundReason] = useState(REFUND_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // { productId: { qtyToRefund, refundAmount } }
  const [processing, setProcessing] = useState(false);
  
  // Refund History global logs state
  const [refundHistory, setRefundHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load refund history initially
  useEffect(() => {
    fetchGlobalHistory();
  }, []);

  const fetchGlobalHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await refundService.getRefunds({ page: 0, size: 20 });
      setRefundHistory(response.data.content || []);
    } catch (err) {
      console.error('Failed to load global history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setOrder(null);
      setSelectedItems({});
      
      // Try resolving by order number or invoice number
      const response = await orderService.getOrderByOrderNumber(searchQuery.trim());
      setOrder(response.data);
      
      // Load previous refunds for this order
      const refundList = await refundService.getRefundsByOrder(response.data.id);
      setOrderRefunds(refundList.data || []);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice or Order not found. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingRefundableQty = (item) => {
    // Find quantity already refunded for this product
    const alreadyRefunded = orderRefunds.reduce((sum, ref) => {
      const match = ref.items?.find(ri => ri.productId === item.productId);
      return sum + (match ? match.quantityRefunded : 0);
    }, 0);
    return Math.max(0, item.quantity - alreadyRefunded);
  };

  const handleSelectItemToggle = (item) => {
    const pId = item.productId;
    if (selectedItems[pId]) {
      const updated = { ...selectedItems };
      delete updated[pId];
      setSelectedItems(updated);
    } else {
      const maxQty = getRemainingRefundableQty(item);
      if (maxQty === 0) {
        alert('This item has already been fully refunded.');
        return;
      }
      setSelectedItems(prev => ({
        ...prev,
        [pId]: {
          quantityRefunded: 1,
          unitPrice: item.unitPrice,
          taxRefunded: (item.tax / item.quantity),
          discountRefunded: (item.discount / item.quantity),
          refundAmount: item.unitPrice - (item.discount / item.quantity) + (item.tax / item.quantity)
        }
      }));
    }
  };

  const updateItemQty = (item, direction) => {
    const pId = item.productId;
    const current = selectedItems[pId];
    if (!current) return;

    const maxQty = getRemainingRefundableQty(item);
    let nextQty = current.quantityRefunded;

    if (direction === 'inc') {
      nextQty = Math.min(nextQty + 1, maxQty);
    } else {
      nextQty = Math.max(nextQty - 1, 1);
    }

    const unitTax = item.tax / item.quantity;
    const unitDisc = item.discount / item.quantity;
    const lineTotal = nextQty * (item.unitPrice - unitDisc + unitTax);

    setSelectedItems(prev => ({
      ...prev,
      [pId]: {
        ...current,
        quantityRefunded: nextQty,
        taxRefunded: unitTax * nextQty,
        discountRefunded: unitDisc * nextQty,
        refundAmount: lineTotal
      }
    }));
  };

  const calculateTotalRefundAmount = () => {
    return Object.values(selectedItems).reduce((sum, item) => sum + item.refundAmount, 0);
  };

  const handleConfirmRefund = async () => {
    const list = Object.entries(selectedItems).map(([pId, val]) => ({
      productId: parseInt(pId),
      quantityRefunded: val.quantityRefunded,
      unitPrice: val.unitPrice,
      taxRefunded: val.taxRefunded,
      discountRefunded: val.discountRefunded,
      refundAmount: val.refundAmount
    }));

    if (list.length === 0) {
      alert('Select at least one item to process.');
      return;
    }

    if (!window.confirm('Process this refund transaction? This will adjust inventory and update order status.')) {
      return;
    }

    try {
      setProcessing(true);
      const refundPayload = {
        orderId: order.id,
        refundReason,
        refundType: list.length === order.items?.length ? 'FULL' : 'PARTIAL',
        notes,
        items: list
      };

      await refundService.processRefund(refundPayload);
      alert('Refund processed successfully!');
      setOrder(null);
      setSelectedItems({});
      setNotes('');
      fetchGlobalHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process refund. Please check stock levels/original values.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Refund & Returns</h1>
          <p className="text-sm text-text-secondary">Process customer refunds, inventory restorations, and log sales adjustments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Search and Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search box */}
          <div className="card p-5">
            <h2 className="card-title text-base mb-4">Find Order / Invoice</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input 
                  type="text" 
                  placeholder="Enter Invoice No or Order ID (e.g., ORD-...)" 
                  className="input pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {error && (
              <div className="flex items-start gap-2 bg-danger-bg/10 text-danger-text text-xs p-3 rounded-lg mt-3">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Items selection display */}
          {order && (
            <div className="card p-5 space-y-4">
              <div className="flex justify-between items-start pb-3 border-b border-border-subtle">
                <div>
                  <h3 className="font-bold text-text-primary text-base">{order.orderNumber}</h3>
                  <p className="text-xs text-text-secondary">Date: {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-text-tertiary">Payment Status</div>
                  <span className="badge badge-success text-[10px] uppercase font-bold">{order.paymentStatus}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Purchased Items</h4>
                <div className="divide-y divide-border-subtle/50">
                  {order.items?.map(item => {
                    const isSelected = !!selectedItems[item.productId];
                    const remainingQty = getRemainingRefundableQty(item);
                    const isFullyRefunded = remainingQty === 0;

                    return (
                      <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input 
                            type="checkbox"
                            className="mt-1 shrink-0 rounded"
                            checked={isSelected}
                            disabled={isFullyRefunded}
                            onChange={() => handleSelectItemToggle(item)}
                          />
                          <div className="min-w-0">
                            <span className={`font-semibold text-sm block text-text-primary ${isFullyRefunded ? 'line-through opacity-50' : ''}`}>
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-text-tertiary block mt-0.5">Purchased: {item.quantity} | Refundable: {remainingQty}</span>
                            <span className="font-medium text-xs text-brand-400 block mt-1">{fmt(item.unitPrice)} each</span>
                          </div>
                        </div>

                        {isSelected && !isFullyRefunded && (
                          <div className="flex items-center gap-4 shrink-0">
                            {/* Qty controls */}
                            <div className="flex items-center bg-bg-surface border border-border-subtle rounded-lg overflow-hidden h-8">
                              <button 
                                className="w-8 h-full flex items-center justify-center hover:bg-bg-elevated"
                                onClick={() => updateItemQty(item, 'dec')}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-text-primary">
                                {selectedItems[item.productId].quantityRefunded}
                              </span>
                              <button 
                                className="w-8 h-full flex items-center justify-center hover:bg-bg-elevated"
                                onClick={() => updateItemQty(item, 'inc')}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-right w-24">
                              <span className="text-xs font-bold text-text-primary block">
                                {fmt(selectedItems[item.productId].refundAmount)}
                              </span>
                              <span className="text-[9px] text-text-tertiary">Refund value</span>
                            </div>
                          </div>
                        )}

                        {isFullyRefunded && (
                          <span className="text-[10px] font-bold text-danger-text uppercase bg-danger-bg/10 px-2 py-0.5 rounded">Refunded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Process form */}
        <div className="space-y-6">
          
          {order && Object.keys(selectedItems).length > 0 && (
            <div className="card p-5 space-y-5">
              <h2 className="card-title text-base">Process Return</h2>
              
              <div className="form-group">
                <label className="form-label">Refund Reason</label>
                <select 
                  className="input"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                >
                  {REFUND_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Internal)</label>
                <textarea 
                  rows="3"
                  className="input py-2"
                  placeholder="Details about product state or customer request..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="divider"></div>

              <div className="space-y-2 text-sm bg-bg-base/50 p-3 rounded-lg border border-border-subtle">
                <div className="flex justify-between text-text-secondary">
                  <span>Selected Products:</span>
                  <span className="font-bold text-text-primary">{Object.keys(selectedItems).length}</span>
                </div>
                <div className="flex justify-between items-end pt-2 border-t border-border-subtle/50">
                  <span className="font-bold text-text-primary">Refund Total:</span>
                  <span className="text-xl font-black text-brand-400">{fmt(calculateTotalRefundAmount())}</span>
                </div>
              </div>

              <button 
                className="btn btn-primary w-full h-12"
                onClick={handleConfirmRefund}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm Refund Transaction'}
              </button>
            </div>
          )}

          {/* Refund History logs */}
          <div className="card p-5 space-y-4">
            <h3 className="card-title text-base flex justify-between items-center">
              <span>Recent Refund Logs</span>
              <Clock className="w-4 h-4 text-text-tertiary" />
            </h3>
            
            {historyLoading ? (
              <p className="text-xs text-text-tertiary text-center py-4">Loading history...</p>
            ) : refundHistory.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {refundHistory.map(ref => (
                  <div key={ref.id} className="bg-bg-base/40 p-3 rounded-lg border border-border-subtle flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-text-primary">{ref.refundNumber}</span>
                      <span className="text-brand-400">{fmt(ref.refundAmount)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary text-[10px]">
                      <span>Order: {ref.orderNumber}</span>
                      <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-1">Reason: <span className="font-semibold text-text-secondary">{ref.refundReason}</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-tertiary text-center py-4">No recent refunds processed.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
