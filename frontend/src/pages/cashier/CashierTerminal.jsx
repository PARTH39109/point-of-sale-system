import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../../store/slices/authSlice';
import {
  Search, ScanLine, User, ShoppingCart, Tag, Clock,
  Pause, Play, AlertCircle, X, ChevronRight, Package, LayoutGrid,
  AlertTriangle, ShieldCheck, Minus, Plus, Trash2, CheckCircle2, Menu
} from 'lucide-react';
import { productService, categoryService } from '../../services/productService';
import { shiftService } from '../../services/shiftService';
import api from '../../services/api';
import orderService from '../../services/orderService';
import PaymentModal from './PaymentModal';
import CashierNavDrawer from './CashierNavDrawer';
import './CashierTerminal.css';
import './CashierShell.css';

import {
  addItem,
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  holdOrder,
  resumeOrder,
  deleteHeldOrder,
  setCustomer,
  clearCustomer,
  applyDiscount,
  removeDiscount,
  clearError
} from '../../store/slices/cartSlice';

// Defensive de-dupe in case the same category id is ever returned twice
// (e.g. a stale cache or a race between requests).
const dedupeById = (list) => {
  const seen = new Set();
  return (list || []).filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const CashierTerminal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  // Redux State
  const cartState = useSelector(state => state.cart);
  const {
    cartItems, heldOrders, selectedCustomer,
    subtotal, tax, discount, grandTotal, error
  } = cartState;

  // Local State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [minStockMap, setMinStockMap] = useState({});
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // UI States
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState({ type: 'percentage', value: 0 });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  // Shift Workflow States
  const [activeShift, setActiveShift] = useState(null);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [startShiftForm, setStartShiftForm] = useState({ openingCash: 5000, notes: '' });
  const [endShiftForm, setEndShiftForm] = useState({ countedCash: '', notes: '' });
  const [endShiftData, setEndShiftData] = useState(null);
  const [reconciling, setReconciling] = useState(false);

  // Refs
  const barcodeInputRef = useRef(null);
  const productSearchRef = useRef(null);
  const customerSearchRef = useRef(null);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'F1':
          e.preventDefault();
          productSearchRef.current?.focus();
          break;
        case 'F2':
          e.preventDefault();
          customerSearchRef.current?.focus();
          break;
        case 'F4':
          e.preventDefault();
          setShowDiscountModal(true);
          break;
        case 'F8':
          e.preventDefault();
          if (cartItems.length > 0) {
            handleHoldOrder();
          }
          break;
        case 'F9':
          e.preventDefault();
          setShowHoldModal(true);
          break;
        case 'F10':
          e.preventDefault();
          if (cartItems.length > 0) {
            handleCheckout();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowHoldModal(false);
          setShowDiscountModal(false);
          document.activeElement?.blur();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length]);

  // Time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear errors automatically after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const requests = [
          productService.getAllProducts(),
          categoryService.getAllCategories(),
          api.get('/api/customer'),
          shiftService.getActiveShift().catch(() => ({ data: null })), // Catch error in case user is not cashier
        ];

        let inventoryRes = null;
        try {
          inventoryRes = await api.get('/api/inventory/me');
        } catch {
          inventoryRes = { data: [] };
        }

        const [prodRes, catRes, custRes, shiftRes] = await Promise.all(requests);

        setCategories(dedupeById(catRes.data));
        setCustomers(custRes.data);
        setActiveShift(shiftRes?.data || null);

        const stockByProduct = {};
        const minStockByProduct = {};
        (inventoryRes.data || []).forEach(item => {
          stockByProduct[item.productId] = item.quantity;
          minStockByProduct[item.productId] = item.minStockLevel ?? 10;
          if (item.branchName) setBranchName(item.branchName);
          if (item.branchId) localStorage.setItem('pos_branch_id', String(item.branchId));
        });
        setInventoryMap(stockByProduct);
        setMinStockMap(minStockByProduct);

        const branchProductIds = new Set(Object.keys(stockByProduct).map(Number));
        const branchScopedProducts = prodRes.data.filter(p => branchProductIds.has(p.id));
        setProducts(branchScopedProducts);
      } catch (err) {
        console.error("Failed to load POS data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle adding product via barcode enter
  const handleBarcodeEnter = (e) => {
    if (e.key === 'Enter' && barcodeQuery.trim() !== '') {
      const product = products.find(p => p.barcode === barcodeQuery.trim() || p.sku === barcodeQuery.trim());
      if (product) {
        handleAddToCart(product);
        setBarcodeQuery(''); // clear after scan
      } else {
        alert('Product not found for this barcode');
      }
    }
  };

  // Handlers
  const getProductStock = (productId) => inventoryMap[productId] ?? 0;
  const getProductMinStock = (productId) => minStockMap[productId] ?? 10;

  const handleAddToCart = (product) => {
    const stock = getProductStock(product.id);
    dispatch(addItem({ ...product, stock }));
  };

  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;
    if (user?.role === 'ROLE_CASHIER' && !activeShift) {
      alert("Please start your shift before holding orders.");
      return;
    }
    dispatch(holdOrder());
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (user?.role === 'ROLE_CASHIER' && !activeShift) {
      alert("Please start your shift before accepting payments.");
      return;
    }

    try {
      setIsProcessing(true);

      const orderRequest = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        subtotal,
        discountAmount: discount.amount,
        discountType: discount.type,
        taxAmount: tax,
        grandTotal,
        paymentStatus: 'PENDING',
        paymentMethod: 'CASH',
        notes: '',
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: 0,
          tax: (item.price * item.quantity) * ((item.taxRate || 0) / 100)
        }))
      };

      const response = await orderService.createOrder(orderRequest);

      setCurrentOrder(response.data);
      setShowPaymentModal(true);

    } catch (err) {
      console.error("Checkout failed", err);
      alert(err.response?.data?.message || "Failed to process order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentSales = (method) => {
    if (!endShiftData || !endShiftData.paymentBreakdown) return 0;
    const found = endShiftData.paymentBreakdown.find(p => p.method.toUpperCase() === method.toUpperCase());
    return found ? found.amount : 0;
  };

  const handleStartShiftSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await shiftService.startShift({
        openingCash: parseFloat(startShiftForm.openingCash),
        notes: startShiftForm.notes,
        shiftLabel: null
      });
      setActiveShift(res.data);
      setShowStartShiftModal(false);
      alert("Shift started successfully!");
    } catch (err) {
      console.error("Failed to start shift", err);
      alert(err.response?.data?.message || "Failed to start shift. Please try again.");
    }
  };

  const handleEndShiftClick = async () => {
    if (!activeShift) return;
    try {
      setReconciling(true);
      const res = await shiftService.getShiftReport(activeShift.id);
      setEndShiftData(res.data);
      setEndShiftForm({
        countedCash: Math.round(res.data.expectedCash || 0),
        notes: ''
      });
      setShowEndShiftModal(true);
    } catch (err) {
      console.error("Failed to fetch shift report", err);
      alert("Failed to load shift sales details. Please try again.");
    } finally {
      setReconciling(false);
    }
  };

  const handleEndShiftSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await shiftService.endShift(activeShift.id, {
        closingCashActual: parseFloat(endShiftForm.countedCash),
        notes: endShiftForm.notes
      });
      setActiveShift(null);
      setShowEndShiftModal(false);
      setEndShiftData(null);
      alert("Shift ended successfully!");
    } catch (err) {
      console.error("Failed to end shift", err);
      alert(err.response?.data?.message || "Failed to end shift. Please try again.");
    }
  };

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    dispatch(applyDiscount({
      type: discountInput.type,
      value: Number(discountInput.value)
    }));
    setShowDiscountModal(false);
  };

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    // Backend returns a flat `categoryId` (not a nested `category` object) —
    // matching against p.category.id always evaluated to false, so clicking
    // any category silently showed zero products.
    const matchesCategory = selectedCategory === '' || (p.categoryId && p.categoryId.toString() === selectedCategory.toString());

    return matchesSearch && matchesCategory && p.isActive;
  });

  // Filter Customers
  const filteredCustomers = customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
      <div className="pos-shell">

        <CashierNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

        {/* ERROR TOAST */}
        {error && (
            <div className="pos-toast">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
              <button onClick={() => dispatch(clearError())}><X className="w-4 h-4" /></button>
            </div>
        )}

        {/* TOP BAR */}
        <header className="pos-topbar">
          <div className="pos-topbar-left">
            <button className="cashier-hamburger" onClick={() => setNavOpen(true)} aria-label="Open menu">
              <Menu className="w-4 h-4" />
            </button>

            <div className="pos-brand">
              <div className="pos-brand-mark">POS</div>
              <span className="pos-brand-title">Cashier Terminal</span>
            </div>             <div className="pos-topbar-meta">
              <span className="pos-status-dot" title="Session active" />
              <div className="pos-topbar-meta-item">
                <User className="w-3.5 h-3.5" style={{ color: 'var(--brand-400)' }} />
                <span>{user?.fullName || 'Cashier'}</span>
              </div>
              <span className="pos-topbar-meta-dot" />
              <div className="pos-topbar-meta-item">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                <span>{branchName || 'Branch'}</span>
              </div>
              {user?.role === 'ROLE_CASHIER' && (
                <>
                  <span className="pos-topbar-meta-dot" />
                  <div className="pos-topbar-meta-item">
                    {activeShift ? (
                      <>
                        <span style={{ color: 'var(--success-text, #10b981)', marginRight: 4 }}>🟢</span>
                        <span>Shift Active (Started {activeShift.openedAt ? new Date(activeShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''})</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>⚪</span>
                        <span>Shift Not Started</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pos-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="pos-clock pos-figure">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--brand-400)' }} />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            {user?.role === 'ROLE_CASHIER' && (
              activeShift ? (
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handleEndShiftClick}
                  disabled={reconciling}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13, height: 36 }}
                >
                  <span style={{ fontSize: 10 }}>🔴</span> End Shift
                </button>
              ) : (
                <button 
                  className="btn btn-success btn-sm" 
                  onClick={() => setShowStartShiftModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', fontSize: 13, height: 36 }}
                >
                  <span style={{ fontSize: 10 }}>🟢</span> Start Shift
                </button>
              )
            )}
          </div>
        </header>

        {/* MAIN BODY: sidebar / products / cart */}
        <div className="pos-body">

          {/* LEFT SIDEBAR */}
          <aside className="pos-sidebar">
            <div className="pos-sidebar-search">
              <div className="pos-field is-scan">
                <ScanLine className="pos-field-icon" />
                <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan barcode..."
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    onKeyDown={handleBarcodeEnter}
                    autoFocus
                />
                <span className="pos-field-kbd">ENTER</span>
              </div>

              <div className="pos-field">
                <Search className="pos-field-icon" />
                <input
                    ref={productSearchRef}
                    id="product-search"
                    type="text"
                    placeholder="Search products (F1)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="pos-sidebar-section-label">Categories</div>

            <div className="pos-category-list">
              <button
                  className={`pos-category-btn ${selectedCategory === '' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('')}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="pos-category-label">All Products</span>
              </button>

              {categories.map(cat => (
                  <button
                      key={cat.id}
                      className={`pos-category-btn ${selectedCategory === cat.id.toString() ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id.toString())}
                      title={cat.name}
                  >
                    <Tag className="w-4 h-4" />
                    <span className="pos-category-label">{cat.name}</span>
                  </button>
              ))}
            </div>
          </aside>

          {/* CENTER — PRODUCT GRID */}
          <main className="pos-main">
            <div className="pos-main-header">
              <h2 className="pos-main-title">
                {selectedCategory === '' ? 'All Products' : categories.find(c => c.id.toString() === selectedCategory)?.name || 'Products'}
              </h2>
              <span className="pos-main-count">{filteredProducts.length} items</span>
            </div>

            <div className="pos-product-grid">
              {filteredProducts.map(product => {
                const stock = getProductStock(product.id);
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= getProductMinStock(product.id);
                const price = product.sellingPrice || product.price;

                return (
                    <div
                        key={product.id}
                        onClick={() => !isOut && handleAddToCart(product)}
                        className={`pos-card ${isOut ? 'is-out' : ''}`}
                    >
                  <span className={`pos-card-badge ${isOut ? 'stock-out' : isLow ? 'stock-low' : 'stock-ok'}`}>
                    {isLow && !isOut && <AlertTriangle className="w-3 h-3" />}
                    {isOut ? 'OUT OF STOCK' : isLow ? `LOW: ${stock}` : `STOCK: ${stock}`}
                  </span>

                      <div className="pos-card-image">
                        {isOut && (
                            <div className="pos-card-overlay">
                              <span>OUT OF STOCK</span>
                            </div>
                        )}
                        {product.image ? (
                            <img src={product.image} alt={product.name} />
                        ) : (
                            <Package className="w-10 h-10 pos-card-image-placeholder" />
                        )}
                      </div>

                      <div className="pos-card-body">
                        <div className="pos-card-sku">{product.sku}</div>
                        <h3 className="pos-card-name">{product.name}</h3>

                        <div className="pos-card-footer">
                          <div className="pos-card-price-block">
                            <div className="pos-card-price pos-figure">{formatCurrency(price)}</div>
                            {product.mrp > price && (
                                <div className="pos-card-mrp pos-figure">{formatCurrency(product.mrp)}</div>
                            )}
                          </div>
                          <button
                              type="button"
                              className="pos-card-add"
                              title="Add to cart"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOut) handleAddToCart(product);
                              }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
                <div className="pos-empty">
                  <Package className="w-14 h-14" style={{ opacity: 0.2 }} />
                  <h3>No products found</h3>
                  <p>Try adjusting your search criteria or scanning a different barcode.</p>
                </div>
            )}
          </main>

          {/* RIGHT — CART PANEL */}
          <aside className="pos-cart">

            {/* Customer selection (F2) */}
            <div className="pos-cart-customer">
              {selectedCustomer ? (
                  <div className="pos-cart-customer-chip">
                    <div className="pos-cart-customer-chip-info">
                      <div className="pos-cart-customer-avatar">{selectedCustomer.name.charAt(0)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="pos-cart-customer-name">{selectedCustomer.name}</div>
                        <div className="pos-cart-customer-sub">{selectedCustomer.phone || selectedCustomer.email || 'Guest'}</div>
                      </div>
                    </div>
                    <button className="pos-cart-customer-remove" onClick={() => dispatch(clearCustomer())}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
              ) : (
                  <div className="pos-field" style={{ position: 'relative' }}>
                    <User className="pos-field-icon" style={{ color: 'var(--brand-400)' }} />
                    <input
                        ref={customerSearchRef}
                        id="customer-search"
                        type="text"
                        placeholder="Add customer (F2)..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                    />

                    {customerSearch.length > 0 && (
                        <div className="pos-cart-customer-dropdown">
                          {filteredCustomers.length > 0 ? (
                              filteredCustomers.map(cust => (
                                  <div
                                      key={cust.id}
                                      className="pos-cart-customer-option"
                                      onClick={() => {
                                        dispatch(setCustomer(cust));
                                        setCustomerSearch('');
                                      }}
                                  >
                                    <span className="pos-cart-customer-option-name">{cust.name}</span>
                                    <span className="pos-cart-customer-option-phone">{cust.phone}</span>
                                  </div>
                              ))
                          ) : (
                              <div className="pos-cart-customer-empty">No customers found</div>
                          )}
                        </div>
                    )}
                  </div>
              )}
            </div>

            {/* Cart items */}
            <div className="pos-cart-items">
              {user?.role === 'ROLE_CASHIER' && !activeShift ? (
                <div style={{
                  padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)',
                  border: '1px dashed var(--border-light)', margin: '20px 16px'
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertTriangle size={24} color="var(--warning-text, #ca8a04)" />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Shift Not Started</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>You must start a shift before checking out or managing orders.</p>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowStartShiftModal(true)}
                    style={{ background: '#10b981', borderColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: 6, margin: '8px auto 0' }}
                  >
                    Start Shift
                  </button>
                </div>
              ) : cartItems.length > 0 ? (
                  cartItems.map(item => (
                      <div key={item.id} className="pos-cart-item">
                        <div className="pos-cart-item-top">
                          <div className="pos-cart-item-main">
                            <div className="pos-cart-item-thumb">
                              {item.image ? (
                                  <img src={item.image} alt="" />
                              ) : (
                                  <Package className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                              )}
                            </div>
                            <div className="pos-cart-item-info">
                              <div className="pos-cart-item-name">{item.name}</div>
                              <div className="pos-cart-item-sku">{item.barcode || item.sku}</div>
                              <div className="pos-cart-item-price pos-figure">{formatCurrency(item.price)}</div>
                            </div>
                          </div>
                          <div className="pos-cart-item-line-total pos-figure">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>

                        <div className="pos-cart-item-bottom">
                          <div className="pos-qty-stepper">
                            <button className="pos-qty-btn" onClick={() => dispatch(decreaseQuantity(item.id))}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <div className="pos-qty-value">{item.quantity}</div>
                            <button className="pos-qty-btn" onClick={() => dispatch(increaseQuantity(item.id))}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button className="pos-cart-item-remove" onClick={() => dispatch(removeItem(item.id))}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                  ))
              ) : (
                  <div className="pos-cart-empty">
                    <div className="pos-cart-empty-icon">
                      <ShoppingCart className="w-7 h-7" />
                    </div>
                    <p>Cart is empty</p>
                    <p>Scan a barcode or click a product to add it to the cart.</p>
                  </div>
              )}
            </div>

            {/* Totals & checkout */}
            <div className="pos-cart-summary">
              <div className="pos-summary-row">
                <span>Subtotal ({cartState.totalQuantity} items)</span>
                <span className="pos-figure">{formatCurrency(subtotal)}</span>
              </div>

              <div className="pos-summary-row is-link" onClick={() => (user?.role !== 'ROLE_CASHIER' || activeShift) && setShowDiscountModal(true)}>
              <span className="pos-summary-label">
                Discount (F4)
                {discount.amount > 0 && <CheckCircle2 className="w-3 h-3" />}
              </span>
                <span className="pos-figure" style={{ color: 'var(--brand-400)' }}>-{formatCurrency(discount.amount)}</span>
              </div>

              <div className="pos-summary-row">
                <span>Tax (GST)</span>
                <span className="pos-figure">{formatCurrency(tax)}</span>
              </div>

              <div className="pos-summary-divider" />

              <div className="pos-summary-total-row">
                <span className="pos-summary-total-label">Total</span>
                <span className="pos-summary-total-value pos-figure">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="pos-cart-secondary-actions">
                <button
                    className="pos-action-btn warn"
                    onClick={handleHoldOrder}
                    disabled={cartItems.length === 0 || (user?.role === 'ROLE_CASHIER' && !activeShift)}
                >
                  <Pause className="w-4 h-4" />
                  Hold (F8)
                </button>
                <button 
                  className="pos-action-btn" 
                  onClick={() => setShowHoldModal(true)}
                  disabled={user?.role === 'ROLE_CASHIER' && !activeShift}
                >
                  <Play className="w-4 h-4" />
                  Resume (F9)
                  {heldOrders.length > 0 && <span className="pos-action-badge">{heldOrders.length}</span>}
                </button>
              </div>

              <button
                  onClick={handleCheckout}
                  className="pos-checkout-btn"
                  disabled={cartItems.length === 0 || isProcessing || (user?.role === 'ROLE_CASHIER' && !activeShift)}
              >
                <span>{isProcessing ? 'Processing...' : 'Checkout (F10)'}</span>
                <span className="pos-checkout-total pos-figure">
                {formatCurrency(grandTotal)}
                  <ChevronRight className="w-4 h-4" style={{ opacity: 0.8 }} />
              </span>
              </button>
            </div>
          </aside>
        </div>

        {/* MODALS */}

        {/* 1. Discount Modal */}
        {showDiscountModal && (
            <div className="modal-overlay z-50">
              <div className="modal max-w-sm w-full">
                <div className="modal-header">
                  <h2 className="modal-title">Apply Discount</h2>
                  <button className="text-text-tertiary hover:text-text-primary" onClick={() => setShowDiscountModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleApplyDiscount}>
                  <div className="p-4 space-y-4">
                    <div className="flex gap-2 p-1 bg-bg-elevated rounded-lg border border-border-subtle">
                      <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${discountInput.type === 'percentage' ? 'bg-bg-surface text-brand-400 shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                          onClick={() => setDiscountInput({...discountInput, type: 'percentage'})}
                      >
                        Percentage (%)
                      </button>
                      <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${discountInput.type === 'fixed' ? 'bg-bg-surface text-brand-400 shadow-sm border border-border-subtle' : 'text-text-secondary hover:text-text-primary'}`}
                          onClick={() => setDiscountInput({...discountInput, type: 'fixed'})}
                      >
                        Fixed Amount (₹)
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        {discountInput.type === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
                      </label>
                      <input
                          type="number"
                          min="0"
                          max={discountInput.type === 'percentage' ? "100" : subtotal}
                          step={discountInput.type === 'percentage' ? "1" : "0.01"}
                          required
                          className="input text-lg font-bold"
                          value={discountInput.value || ''}
                          onChange={(e) => setDiscountInput({...discountInput, value: e.target.value})}
                          autoFocus
                      />
                    </div>
                  </div>
                  <div className="modal-footer flex justify-between items-center">
                    <button
                        type="button"
                        className="text-danger-text text-sm font-medium hover:underline"
                        onClick={() => {
                          dispatch(removeDiscount());
                          setShowDiscountModal(false);
                        }}
                    >
                      Remove Discount
                    </button>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowDiscountModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Apply</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* 2. Hold Orders Modal */}
        {showHoldModal && (
            <div className="modal-overlay z-50">
              <div className="modal max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="modal-header shrink-0">
                  <h2 className="modal-title flex items-center gap-2">
                    <Pause className="w-5 h-5 text-warning-text" />
                    Held Orders
                    <span className="badge badge-neutral ml-2">{heldOrders.length}</span>
                  </h2>
                  <button className="text-text-tertiary hover:text-text-primary" onClick={() => setShowHoldModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 bg-bg-base/50">
                  {heldOrders.length > 0 ? (
                      <div className="space-y-3">
                        {heldOrders.map(order => (
                            <div key={order.id} className="card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-brand-400/50 transition-colors">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-text-primary">{order.id}</span>
                                  <span className="text-xs text-text-tertiary">•</span>
                                  <span className="text-xs text-text-secondary">{new Date(order.timeHeld).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-text-secondary flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  {order.customer ? order.customer.name : 'Guest Customer'}
                                </div>
                                <div className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                                  <Package className="w-3 h-3" />
                                  {order.totalItems} items
                                </div>
                              </div>

                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                  <div className="text-xs text-text-tertiary uppercase tracking-wider mb-0.5">Total</div>
                                  <div className="font-bold text-lg text-brand-400">{formatCurrency(order.grandTotal)}</div>
                                </div>

                                <div className="flex items-center gap-2 border-l border-border-subtle pl-4 ml-2">
                                  <button
                                      className="btn btn-secondary"
                                      onClick={() => {
                                        dispatch(resumeOrder(order.id));
                                        setShowHoldModal(false);
                                      }}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Resume
                                  </button>
                                  <button
                                      className="btn btn-ghost text-danger-text hover:bg-danger-bg/10 px-2"
                                      onClick={() => {
                                        if(window.confirm('Delete this held order?')) dispatch(deleteHeldOrder(order.id));
                                      }}
                                      title="Delete Held Order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                  ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-text-tertiary">
                        <Pause className="w-12 h-12 mb-2 opacity-30" />
                        <p className="font-medium text-text-secondary">No held orders</p>
                      </div>
                  )}
                </div>

                <div className="modal-footer shrink-0">
                  <button className="btn btn-secondary w-full" onClick={() => setShowHoldModal(false)}>Close</button>
                </div>
              </div>
            </div>
        )}

        {showPaymentModal && currentOrder && (
            <PaymentModal
                order={currentOrder}
                onClose={() => {
                  setShowPaymentModal(false);
                  setCurrentOrder(null);
                }}
                onSuccess={(paymentResult) => {
                  setShowPaymentModal(false);
                  setCurrentOrder(null);
                  dispatch(clearCart());
                  alert('Payment completed successfully!');
                  navigate(`/cashier/invoice/${paymentResult[0]?.orderId || currentOrder.id}`);
                }}
            />
        )}

        {/* Start Shift Modal */}
        {showStartShiftModal && (
          <div className="modal-overlay z-50">
            <div className="modal max-w-sm w-full">
              <div className="modal-header">
                <h2 className="modal-title">Start New Shift</h2>
                <button className="text-text-tertiary hover:text-text-primary" onClick={() => setShowStartShiftModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleStartShiftSubmit}>
                <div className="p-4 space-y-4">
                  <div className="form-group">
                    <label className="form-label required">Opening Cash</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="input text-lg font-bold"
                      value={startShiftForm.openingCash}
                      onChange={(e) => setStartShiftForm({...startShiftForm, openingCash: e.target.value})}
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="input"
                      rows="3"
                      placeholder="Optional notes..."
                      value={startShiftForm.notes}
                      onChange={(e) => setStartShiftForm({...startShiftForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer flex justify-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStartShiftModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#10b981', color: 'white' }}>Start Shift</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* End Shift Modal */}
        {showEndShiftModal && endShiftData && (
          <div className="modal-overlay z-50">
            <div className="modal max-w-md w-full">
              <div className="modal-header">
                <h2 className="modal-title">Close Shift</h2>
                <button className="text-text-tertiary hover:text-text-primary" onClick={() => setShowEndShiftModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEndShiftSubmit}>
                <div className="p-4 space-y-4">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opening Cash</span>
                      <span className="font-bold text-lg">{formatCurrency(endShiftData.openingCash)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Sales</span>
                      <span className="font-bold text-lg text-brand-400">{formatCurrency(getPaymentSales('CASH'))}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Sales</span>
                      <span className="font-bold text-lg text-brand-400">{formatCurrency(getPaymentSales('CARD'))}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UPI Sales</span>
                      <span className="font-bold text-lg text-brand-400">{formatCurrency(getPaymentSales('UPI'))}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Cash in Drawer</span>
                      <span className="font-bold text-xl text-success-text" style={{ color: '#10b981' }}>{formatCurrency(endShiftData.expectedCash)}</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Counted Cash</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="input text-lg font-bold"
                      value={endShiftForm.countedCash}
                      onChange={(e) => setEndShiftForm({...endShiftForm, countedCash: e.target.value})}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cash Difference:</span>
                    <span className="font-bold" style={{ color: ((parseFloat(endShiftForm.countedCash) || 0) - (endShiftData.expectedCash || 0)) === 0 ? 'var(--text-primary)' : ((parseFloat(endShiftForm.countedCash) || 0) - (endShiftData.expectedCash || 0)) > 0 ? '#10b981' : '#f87171' }}>
                      {formatCurrency((parseFloat(endShiftForm.countedCash) || 0) - (endShiftData.expectedCash || 0))}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="input"
                      rows="3"
                      placeholder="Reason for discrepancy or general closing notes..."
                      value={endShiftForm.notes}
                      onChange={(e) => setEndShiftForm({...endShiftForm, notes: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer flex justify-end gap-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEndShiftModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-danger" style={{ color: 'white' }}>End Shift</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  );
};

export default CashierTerminal;