// src/components/billing/Billing.js - No GST version
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
  Input,
  Form,
  Modal,
  Space,
} from 'antd';
import { PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import { createOrder, addToCart } from '../../features/order/orderSlice';
import { fetchCustomers, createCustomer } from '../../features/customer/customerSlice';
import { fetchProducts, createProduct } from '../../features/products/productSlice';
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
  
  // Dynamic product states
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm] = Form.useForm();
  
  // Dynamic customer states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm] = Form.useForm();

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchProducts({}));
  }, [dispatch]);

  const handleAddProduct = () => {
    if (selectedProduct && quantity > 0) {
      dispatch(addToCart({ 
        product: selectedProduct, 
        quantity,
        originalPrice: selectedProduct.price,
        currentPrice: selectedProduct.price
      }));
      setSelectedProduct(null);
      setQuantity(1);
    } else {
      message.warning('Please select a product and enter a valid quantity.');
    }
  };

  const handleAddDynamicProduct = async () => {
    try {
      const values = await productForm.validateFields();
      
      // Create a temporary product for the cart
      const tempProduct = {
        id: `temp_${Date.now()}`,
        name: values.name,
        price: values.price,
        category: 'Dynamic',
        stock: 999,
        isDynamic: true
      };

      // Add to cart immediately
      dispatch(addToCart({ 
        product: tempProduct, 
        quantity: values.quantity,
        originalPrice: values.price,
        currentPrice: values.price
      }));

      // Also create the product in the system for future use
      dispatch(createProduct({
        name: values.name,
        price: values.price,
        category: 'Dynamic',
        stock: 999,
        description: 'Dynamically added product'
      }));

      productForm.resetFields();
      setShowProductModal(false);
      message.success('Product added to cart!');
    } catch (error) {
      message.error('Please fill all required fields');
    }
  };

  const handleAddDynamicCustomer = async () => {
    try {
      const values = await customerForm.validateFields();
      
      // Create customer
      const result = await dispatch(createCustomer({
        name: values.name,
        phone: values.phone || '',
        email: values.email || '',
        address: {
          street: '',
          city: '',
          state: '',
          pincode: ''
        }
      }));

      if (createCustomer.fulfilled.match(result)) {
        setSelectedCustomer(result.payload);
        customerForm.resetFields();
        setShowCustomerModal(false);
        message.success('Customer added successfully!');
        dispatch(fetchCustomers({}));
      }
    } catch (error) {
      message.error('Error adding customer');
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => total + (item.originalPrice * item.quantity), 0);
    const currentTotal = cart.reduce((total, item) => total + (item.currentPrice * item.quantity), 0);
    const totalDiscount = subtotal - currentTotal;
    const discountPercentage = subtotal > 0 ? ((totalDiscount / subtotal) * 100) : 0;

    return {
      subtotal,
      currentTotal,
      totalDiscount,
      discountPercentage,
      finalTotal: currentTotal // No GST, so final total is same as current total
    };
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      message.warning('Please add items to cart');
      return;
    }
    
    if (!selectedCustomer) {
      message.warning("Please select a customer before generating invoice.");
      return;
    }

    const totals = calculateTotals();

    const orderData = {
      customerId: selectedCustomer.id,
      items: cart.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          category: item.product.category
        },
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        currentPrice: item.currentPrice,
        price: item.currentPrice,
        discount: ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100
      })),
      paymentMethod,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      discountPercentage: totals.discountPercentage,
      afterDiscount: totals.currentTotal,
      total: totals.finalTotal, // No GST
    };

    const result = await dispatch(createOrder(orderData));
    if (result.type === 'orders/create/fulfilled') {
      message.success('Invoice generated successfully!');
      navigate(`/invoices/${result.payload.id}`);
    }
  };

  const totals = calculateTotals();

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Billing</Title>

      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

      <Row gutter={24}>
        <Col xs={24} md={16}>
          {/* Existing Products Section */}
          <Card title="Select Existing Products" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={10}>
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
              <Col span={8}>
                <Button type="primary" onClick={handleAddProduct} block>
                  Add Product
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Dynamic Product Addition */}
          <Card title="Add New Product" style={{ marginBottom: 24 }}>
            <Button 
              type="dashed" 
              icon={<PlusOutlined />} 
              onClick={() => setShowProductModal(true)}
              block
            >
              Add Custom Product
            </Button>
          </Card>

          <Card title="Shopping Cart" style={{ marginBottom: 24 }}>
            <Cart allowPriceEdit={true} />
          </Card>

          {/* Customer Section */}
          <Card title="Customer Details">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={18}>
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
                      {`${customer.name}${customer.phone ? ` (${customer.phone})` : ''}`}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Button 
                  icon={<UserAddOutlined />} 
                  onClick={() => setShowCustomerModal(true)}
                  block
                >
                  Add Customer
                </Button>
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
            <Row justify="space-between">
              <Text>Subtotal:</Text>
              <Text>₹{totals.subtotal.toFixed(2)}</Text>
            </Row>
            
            {totals.totalDiscount > 0 && (
              <>
                <Row justify="space-between">
                  <Text>Discount ({totals.discountPercentage.toFixed(1)}%):</Text>
                  <Text style={{ color: '#52c41a' }}>-₹{totals.totalDiscount.toFixed(2)}</Text>
                </Row>
              </>
            )}
            
            <Divider />
            
            <Row justify="space-between">
              <Text strong>Total:</Text>
              <Text strong>₹{totals.finalTotal.toFixed(2)}</Text>
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

      {/* Dynamic Product Modal */}
      <Modal
        title="Add Custom Product"
        open={showProductModal}
        onCancel={() => setShowProductModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={productForm} layout="vertical" onFinish={handleAddDynamicProduct}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={0.01}
              placeholder="Enter price"
              prefix="₹"
            />
          </Form.Item>
          
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
            initialValue={1}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Enter quantity"
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowProductModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add to Cart
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Dynamic Customer Modal */}
      <Modal
        title="Add New Customer"
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={customerForm} layout="vertical" onFinish={handleAddDynamicCustomer}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Phone Number"
          >
            <Input placeholder="Enter phone number (optional)" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
          >
            <Input placeholder="Enter email (optional)" />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCustomerModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add Customer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Billing;