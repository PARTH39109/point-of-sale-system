import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: [],
  heldOrders: [],
  selectedCustomer: null,
  selectedPaymentMethod: null,
  
  // Totals
  subtotal: 0,
  tax: 0,
  discount: { type: 'none', value: 0, amount: 0 }, // type: 'percentage' | 'fixed' | 'none'
  coupon: null,
  grandTotal: 0,
  totalItems: 0,
  totalQuantity: 0,
  
  orderNotes: '',
  loading: false,
  error: null,
};

const calculateTotalsLogic = (state) => {
  let subtotal = 0;
  let tax = 0;
  let totalQuantity = 0;

  state.cartItems.forEach(item => {
    subtotal += item.price * item.quantity;
    // Assuming item.taxRate is a percentage (e.g., 18 for 18%)
    const itemTax = (item.price * item.quantity) * ((item.taxRate || 0) / 100);
    tax += itemTax;
    totalQuantity += item.quantity;
  });

  state.subtotal = subtotal;
  state.tax = tax;
  state.totalItems = state.cartItems.length;
  state.totalQuantity = totalQuantity;

  // Calculate discount
  let discountAmount = 0;
  if (state.discount.type === 'percentage') {
    discountAmount = subtotal * (state.discount.value / 100);
  } else if (state.discount.type === 'fixed') {
    discountAmount = state.discount.value;
  }
  
  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);
  state.discount.amount = discountAmount;

  // Calculate grand total
  state.grandTotal = (subtotal - discountAmount) + tax;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const product = action.payload;
      const existingItem = state.cartItems.find(item => item.id === product.id);
      
      // Stock validation check (UI should also pass maxStock)
      const maxStock = product.stock !== undefined ? product.stock : Infinity;

      if (existingItem) {
        if (existingItem.quantity < maxStock) {
          existingItem.quantity += 1;
        } else {
          state.error = `Cannot add more ${product.name}. Out of stock.`;
        }
      } else {
        if (maxStock > 0) {
          state.cartItems.push({
            ...product,
            price: product.sellingPrice || product.price,
            quantity: 1,
            taxRate: product.taxRate || 0
          });
        } else {
          state.error = `${product.name} is out of stock.`;
        }
      }
      
      calculateTotalsLogic(state);
    },
    
    removeItem: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.filter(item => item.id !== id);
      calculateTotalsLogic(state);
    },
    
    increaseQuantity: (state, action) => {
      const id = action.payload;
      const item = state.cartItems.find(i => i.id === id);
      const maxStock = item.stock !== undefined ? item.stock : Infinity;
      
      if (item && item.quantity < maxStock) {
        item.quantity += 1;
        calculateTotalsLogic(state);
      } else if (item) {
        state.error = `Cannot increase quantity. Max stock reached for ${item.name}.`;
      }
    },
    
    decreaseQuantity: (state, action) => {
      const id = action.payload;
      const item = state.cartItems.find(i => i.id === id);
      
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.cartItems = state.cartItems.filter(i => i.id !== id);
        }
        calculateTotalsLogic(state);
      }
    },
    
    setQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find(i => i.id === id);
      const maxStock = item.stock !== undefined ? item.stock : Infinity;
      
      if (item) {
        const validQuantity = Math.max(1, Math.min(quantity, maxStock));
        item.quantity = validQuantity;
        if (quantity > maxStock) {
          state.error = `Quantity adjusted to max available stock (${maxStock}).`;
        }
        calculateTotalsLogic(state);
      }
    },
    
    clearCart: (state) => {
      state.cartItems = [];
      state.selectedCustomer = null;
      state.discount = { type: 'none', value: 0, amount: 0 };
      state.coupon = null;
      state.orderNotes = '';
      state.selectedPaymentMethod = null;
      state.error = null;
      calculateTotalsLogic(state);
    },
    
    holdOrder: (state) => {
      if (state.cartItems.length === 0) return;
      
      const heldOrder = {
        id: `HOLD-${Date.now()}`,
        cartItems: [...state.cartItems],
        customer: state.selectedCustomer,
        totalItems: state.totalItems,
        grandTotal: state.grandTotal,
        timeHeld: new Date().toISOString(),
        discount: { ...state.discount },
        orderNotes: state.orderNotes
      };
      
      state.heldOrders.push(heldOrder);
      
      // Clear current cart after holding
      state.cartItems = [];
      state.selectedCustomer = null;
      state.discount = { type: 'none', value: 0, amount: 0 };
      state.coupon = null;
      state.orderNotes = '';
      state.selectedPaymentMethod = null;
      calculateTotalsLogic(state);
    },
    
    resumeOrder: (state, action) => {
      const holdId = action.payload;
      const heldOrderIndex = state.heldOrders.findIndex(o => o.id === holdId);
      
      if (heldOrderIndex !== -1) {
        const orderToResume = state.heldOrders[heldOrderIndex];
        
        // If there's an active cart, hold it first or replace it based on logic.
        // We'll replace it. The UI should ask for confirmation if cart is not empty.
        
        state.cartItems = orderToResume.cartItems;
        state.selectedCustomer = orderToResume.customer;
        state.discount = orderToResume.discount;
        state.orderNotes = orderToResume.orderNotes;
        
        // Remove from held orders
        state.heldOrders.splice(heldOrderIndex, 1);
        calculateTotalsLogic(state);
      }
    },
    
    deleteHeldOrder: (state, action) => {
      const holdId = action.payload;
      state.heldOrders = state.heldOrders.filter(o => o.id !== holdId);
    },
    
    applyDiscount: (state, action) => {
      const { type, value } = action.payload;
      state.discount = { type, value, amount: 0 };
      calculateTotalsLogic(state);
    },
    
    removeDiscount: (state) => {
      state.discount = { type: 'none', value: 0, amount: 0 };
      calculateTotalsLogic(state);
    },
    
    applyCoupon: (state, action) => {
      state.coupon = action.payload;
      // Coupon logic could map to a discount here
      calculateTotalsLogic(state);
    },
    
    removeCoupon: (state) => {
      state.coupon = null;
      calculateTotalsLogic(state);
    },
    
    setCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    
    clearCustomer: (state) => {
      state.selectedCustomer = null;
    },
    
    setOrderNotes: (state, action) => {
      state.orderNotes = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  addItem,
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  clearCart,
  holdOrder,
  resumeOrder,
  deleteHeldOrder,
  applyDiscount,
  removeDiscount,
  applyCoupon,
  removeCoupon,
  setCustomer,
  clearCustomer,
  setOrderNotes,
  clearError
} = cartSlice.actions;

export default cartSlice.reducer;
