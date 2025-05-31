// src/features/order/orderSlice.js - Fixed to avoid index issues
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firebaseService from '../../services/firebaseService';
import { updateStock } from '../products/productSlice';
import { updateCustomerStats } from '../customer/customerSlice';

// Fetch all orders with simplified filtering
export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      // Use simplified options to avoid index requirements
      const options = {
        limit: filters.limit || 100 // Add reasonable default limit
      };

      // Add where conditions for client-side filtering
      if (filters.status || filters.customerId || filters.startDate || filters.endDate) {
        options.where = [];
        
        // Only add simple filters that don't require indexes
        if (filters.status) {
          options.where.push({ field: 'status', operator: '==', value: filters.status });
        }
        
        // Date range filters will be applied client-side
        if (filters.startDate) {
          options.where.push({ field: 'createdAt', operator: '>=', value: new Date(filters.startDate) });
        }
        
        if (filters.endDate) {
          options.where.push({ field: 'createdAt', operator: '<=', value: new Date(filters.endDate) });
        }
      }

      let orders = await firebaseService.getAll('orders', options);

      // Apply additional client-side filtering
      if (filters.customerId) {
        orders = orders.filter(order => order.customerId === filters.customerId);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        orders = orders.filter(order => 
          order.orderNumber?.toLowerCase().includes(searchTerm) ||
          order.customer?.name?.toLowerCase().includes(searchTerm)
        );
      }

      // Populate customer data for orders that have customerId
      const customerIds = [...new Set(orders.filter(o => o.customerId).map(o => o.customerId))];
      const customers = {};
      
      if (customerIds.length > 0) {
        // Get customers in batches to avoid too many requests
        for (const customerId of customerIds) {
          try {
            const customer = await firebaseService.getById('customers', customerId);
            customers[customerId] = customer;
          } catch (error) {
            console.warn(`Customer ${customerId} not found:`, error);
          }
        }
      }

      // Add customer data to orders
      orders = orders.map(order => ({
        ...order,
        customer: order.customerId ? customers[order.customerId] : null
      }));

      return orders;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create order
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue, dispatch }) => {
    try {
      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const gstAmount = subtotal * 0.18;
      const total = subtotal + gstAmount;

      const order = await firebaseService.create('orders', {
        ...orderData,
        orderNumber: firebaseService.generateId('ORD-'),
        subtotal,
        gst: gstAmount,
        total,
        status: 'completed',
        paymentStatus: 'paid',
        createdAt: new Date() // Ensure consistent date format
      });

      // Update product stock
      for (const item of orderData.items) {
        dispatch(updateStock({ id: item.product.id, stockChange: -item.quantity }));
      }

      // Update customer stats if customer exists
      if (orderData.customerId) {
        dispatch(updateCustomerStats({ 
          customerId: orderData.customerId, 
          orderAmount: total 
        }));
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Get single order
export const getOrder = createAsyncThunk(
  'orders/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const order = await firebaseService.getById('orders', id);
      
      // Populate customer data
      if (order.customerId) {
        try {
          const customer = await firebaseService.getById('customers', order.customerId);
          order.customer = customer;
        } catch (error) {
          console.warn(`Customer ${order.customerId} not found:`, error);
        }
      }

      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      const order = getState().orders.items.find(o => o.id === id);
      if (!order) throw new Error('Order not found');

      const updatedOrder = await firebaseService.update('orders', id, { 
        status: 'cancelled',
        cancelledAt: new Date()
      });

      // Restore product stock
      if (order.items) {
        for (const item of order.items) {
          dispatch(updateStock({ id: item.product.id, stockChange: item.quantity }));
        }
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  currentOrder: null,
  cart: [],
  loading: false,
  error: null,
  total: 0
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Cart management
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.cart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.cart.push({ product, quantity });
      }
    },
    removeFromCart: (state, action) => {
      state.cart = state.cart.filter(item => item.product.id !== action.payload);
    },
    updateCartItemQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.find(item => item.product.id === productId);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
    },
    clearCart: (state) => {
      state.cart = [];
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.total = action.payload.length;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Don't clear items on error, keep existing data
      })
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.cart = [];
        state.currentOrder = action.payload;
        state.total = state.items.length;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get order
      .addCase(getOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(getOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity,
  clearCart,
  clearError
} = orderSlice.actions;

export default orderSlice.reducer;