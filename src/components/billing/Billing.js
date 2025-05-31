// src/components/billing/Billing.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Select,
  Typography,
  Alert,
  Divider,
  message,
} from 'antd';
import { createOrder, addToCart } from '../../features/order/orderSlice';
import { fetchCustomers } from '../../features/customer/customerSlice';
import { fetchProducts } from '../../features/products/productSlice';
import Cart from './Cart';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const Billing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector(state => state.orders);
  const { items: customers } = useSelector(state => state.customers);
  const { items: products } = useSelector(state => state.products);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchProducts({}));
  }, [dispatch]);

  const handleAddProduct = () => {
    if (selectedProduct && quantity > 0) {
      dispatch(addToCart({ product: selectedProduct, quantity }));
      setSelectedProduct(null);
      setQuantity(1);
    } else {
      message.warning('Please select a product and enter a valid quantity.');
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (!selectedCustomer) {
      message.warning("Please select a customer before generating invoice.");
      return;
    }

    const orderData = {
      customerId: selectedCustomer.id,
      items: cart.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.product.price,
      })),
      paymentMethod,
      total: cart.reduce((total, item) => total + (item.product.price * item.quantity), 0),
      gstAmount: cart.reduce((total, item) => total + (item.product.price * item.quantity * 0.18), 0),
    };

    const result = await dispatch(createOrder(orderData));
    if (result.type === 'orders/create/fulfilled') {
      navigate('/orders');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Billing</Title>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card title="Add Products" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Select Product"
                  value={selectedProduct?.id}
                  onChange={(value) => {
                    const product = products.find(p => p.id === value);
                    setSelectedProduct(product || null);
                  }}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map(product => (
                    <Option key={product.id} value={product.id}>
                      {`${product.name} - ₹${product.price}`}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <InputNumber
                  min={1}
                  value={quantity}
                  onChange={(val) => setQuantity(val)}
                  style={{ width: '100%' }}
                  placeholder="Quantity"
                />
              </Col>
              <Col span={6}>
                <Button type="primary" onClick={handleAddProduct} block>
                  Add
                </Button>
              </Col>
            </Row>
          </Card>

          <Card title="Cart" style={{ marginBottom: 24 }}>
            <Cart />
          </Card>

          <Card title="Customer Details">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Select Customer"
                  value={selectedCustomer?.id}
                  onChange={(value) => {
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {`${customer.name} (${customer.phone})`}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  style={{ width: '100%' }}
                >
                  {paymentMethods.map(method => (
                    <Option key={method} value={method}>
                      {method}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Order Summary" style={{ position: 'sticky', top: 20 }}>
            <Divider />
            <Row justify="space-between">
              <Text>Subtotal:</Text>
              <Text>
                ₹
                {cart
                  .reduce((total, item) => total + (item.product.price * item.quantity), 0)
                  .toFixed(2)}
              </Text>
            </Row>
            <Row justify="space-between">
              <Text>GST (18%):</Text>
              <Text>
                ₹
                {(cart
                  .reduce((total, item) => total + (item.product.price * item.quantity), 0) * 0.18)
                  .toFixed(2)}
              </Text>
            </Row>
            <Divider />
            <Row justify="space-between">
              <Text strong>Total:</Text>
              <Text strong>
                ₹
                {(cart
                  .reduce((total, item) => total + (item.product.price * item.quantity), 0) * 1.18)
                  .toFixed(2)}
              </Text>
            </Row>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmit}
              loading={loading}
              block
              style={{ marginTop: 20 }}
              disabled={cart.length === 0}
            >
              Generate Invoice
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Billing;
