// src/components/billing/Billing.js - Business perspective version
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
  message,
  Input,
  Form,
  Modal,
  Space,
  Tabs,
  Badge,
  Divider,
  Table,
  Tag,
  Popconfirm,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  UserAddOutlined, 
  ShoppingCartOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  CalculatorOutlined,
  PrinterOutlined,
  DollarOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { 
  createOrder, 
  addToCart, 
  removeFromCart, 
  updateCartItemQuantity, 
  updateCartItemPrice,
  clearCart 
} from '../../features/order/orderSlice';
import { fetchCustomers, createCustomer } from '../../features/customer/customerSlice';
import { fetchProducts, createProduct } from '../../features/products/productSlice';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const Billing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart, loading, error } = useSelector(state => state.orders);
  const { items: customers } = useSelector(state => state.customers);
  const { items: products } = useSelector(state => state.products);

  // Basic states
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [productForm] = Form.useForm();
  const [customerForm] = Form.useForm();
  
  // Price editing states
  const [editingItem, setEditingItem] = useState(null);
  const [newPrice, setNewPrice] = useState(0);

  // Payment confirmation states
  const [finalPaymentMethod, setFinalPaymentMethod] = useState('Cash');

  const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer'];

  useEffect(() => {
    dispatch(fetchCustomers({}));
    dispatch(fetchProducts({}));
  }, [dispatch]);

  // Product handling
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
      message.success(`${selectedProduct.name} added to cart`);
    } else {
      message.warning('Please select a product and enter quantity');
    }
  };

  const handleAddDynamicProduct = async () => {
    try {
      const values = await productForm.validateFields();
      
      const tempProduct = {
        id: `temp_${Date.now()}`,
        name: values.name,
        price: values.price,
        category: 'Custom',
        stock: 999,
        isDynamic: true
      };

      dispatch(addToCart({ 
        product: tempProduct, 
        quantity: values.quantity,
        originalPrice: values.price,
        currentPrice: values.price
      }));

      dispatch(createProduct({
        name: values.name,
        price: values.price,
        category: 'Custom',
        stock: 999,
        description: 'Custom product'
      }));

      productForm.resetFields();
      setShowProductModal(false);
      message.success('Custom product added!');
    } catch (error) {
      message.error('Please fill all required fields');
    }
  };

  // Customer handling
  const handleAddDynamicCustomer = async () => {
    try {
      const values = await customerForm.validateFields();
      
      const result = await dispatch(createCustomer({
        name: values.name,
        phone: values.phone || '',
        email: values.email || '',
        address: { street: '', city: '', state: '', pincode: '' }
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

  // Cart item management
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity > 0) {
      dispatch(updateCartItemQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(removeFromCart(productId));
    message.success('Item removed from cart');
  };

  // Price negotiation
  const openPriceEdit = (item) => {
    setEditingItem(item);
    setNewPrice(item.currentPrice);
    setShowPriceModal(true);
  };

  const applyNewPrice = () => {
    if (!editingItem || newPrice <= 0) {
      message.error('Please enter a valid price');
      return;
    }

    dispatch(updateCartItemPrice({ 
      productId: editingItem.product.id, 
      newPrice: newPrice 
    }));
    
    const difference = editingItem.originalPrice - newPrice;
    if (difference > 0) {
      message.success(`Price reduced! Giving ₹${difference.toFixed(2)} discount to customer`);
    } else if (difference < 0) {
      message.success(`Price increased by ₹${Math.abs(difference).toFixed(2)}`);
    } else {
      message.success('Price updated!');
    }
    
    setShowPriceModal(false);
    setEditingItem(null);
  };

  // Calculations
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
      finalTotal: currentTotal,
      itemCount: cart.length,
      totalQuantity: cart.reduce((total, item) => total + item.quantity, 0)
    };
  };

  // Order submission with payment confirmation
  const handleSubmit = () => {
    if (cart.length === 0) {
      message.warning('Please add items to cart');
      return;
    }
    
    if (!selectedCustomer) {
      message.warning("Please select a customer");
      return;
    }

    setFinalPaymentMethod('Cash');
    setShowPaymentModal(true);
  };

  const confirmAndGenerateInvoice = async () => {
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
        discount: item.originalPrice > 0 ? ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100 : 0
      })),
      paymentMethod: finalPaymentMethod,
      subtotal: totals.subtotal,
      discount: totals.totalDiscount,
      discountPercentage: totals.discountPercentage,
      afterDiscount: totals.currentTotal,
      total: totals.finalTotal,
    };

    const result = await dispatch(createOrder(orderData));
    if (result.type === 'orders/create/fulfilled') {
      message.success('Invoice generated successfully!');
      dispatch(clearCart());
      setShowPaymentModal(false);
      navigate(`/invoices/${result.payload.id}`);
    }
  };

  const totals = calculateTotals();

  // Cart table columns
  const cartColumns = [
    {
      title: 'Item',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 120,
      render: (name, record) => (
        <div>
          <Text strong style={{ fontSize: '12px' }}>{name}</Text>
          {record.product.isDynamic && (
            <Tag color="blue" size="small" style={{ marginLeft: 4, fontSize: '9px' }}>Custom</Tag>
          )}
          <div style={{ fontSize: '10px', color: '#666' }}>
            {record.product.category}
          </div>
        </div>
      ),
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: 50,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => handleQuantityChange(record.product.id, val)}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Price',
      key: 'price',
      width: 85,
      render: (_, record) => {
        const hasDiscount = record.originalPrice !== record.currentPrice;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '10px', 
                textDecoration: 'line-through', 
                color: '#999' 
              }}>
                ₹{record.originalPrice}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text strong style={{ color: hasDiscount ? '#52c41a' : 'inherit' }}>
                ₹{record.currentPrice}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openPriceEdit(record)}
                style={{ padding: 0, minWidth: 'auto' }}
                title="Negotiate Price"
              />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Total',
      key: 'total',
      width: 70,
      render: (_, record) => {
        const itemTotal = record.currentPrice * record.quantity;
        const originalTotal = record.originalPrice * record.quantity;
        const hasDiscount = originalTotal !== itemTotal;
        
        return (
          <div>
            {hasDiscount && (
              <div style={{ 
                fontSize: '10px', 
                textDecoration: 'line-through', 
                color: '#999' 
              }}>
                ₹{originalTotal.toFixed(2)}
              </div>
            )}
            <Text strong style={{ color: hasDiscount ? '#52c41a' : 'inherit' }}>
              ₹{itemTotal.toFixed(2)}
            </Text>
            {hasDiscount && (
              <div style={{ fontSize: '9px', color: '#52c41a' }}>
                <GiftOutlined /> ₹{Math.abs(originalTotal - itemTotal).toFixed(2)} off
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 30,
      render: (_, record) => (
        <Popconfirm
          title="Remove item?"
          onConfirm={() => handleRemoveItem(record.product.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            style={{ padding: 0 }}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 16, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
      <Row gutter={12} style={{ height: '100%' }}>
        {/* Left Panel - Product Selection & Cart */}
        <Col xs={24} lg={14} style={{ height: '100%' }}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                <span>Product Selection</span>
                <Badge count={totals.totalQuantity} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            size="small"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'hidden', padding: '12px' }}
            extra={
              cart.length > 0 && (
                <Popconfirm
                  title="Clear all items from cart?"
                  onConfirm={() => dispatch(clearCart())}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size="small" danger>Clear Cart</Button>
                </Popconfirm>
              )
            }
          >
            <Tabs defaultActiveKey="1" size="small">
              <TabPane tab="Existing Products" key="1">
                <Row gutter={8} style={{ marginBottom: 12 }}>
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
                      size="small"
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
                      placeholder="Qty"
                      size="small"
                    />
                  </Col>
                  <Col span={6}>
                    <Button 
                      type="primary" 
                      onClick={handleAddProduct} 
                      block 
                      size="small"
                      icon={<PlusOutlined />}
                    >
                      Add
                    </Button>
                  </Col>
                </Row>
              </TabPane>
              
              <TabPane tab="Custom Product" key="2">
                <Button 
                  type="dashed" 
                  icon={<PlusOutlined />} 
                  onClick={() => setShowProductModal(true)}
                  block
                  size="small"
                >
                  Add Custom Product
                </Button>
              </TabPane>
            </Tabs>

            <Divider style={{ margin: '12px 0' }} />

            {/* Cart Table */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                Shopping Cart ({totals.itemCount} items, {totals.totalQuantity} qty)
              </Title>
              
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>No items in cart</div>
                  <div style={{ fontSize: '12px' }}>Add products to get started</div>
                </div>
              ) : (
                <Table
                  columns={cartColumns}
                  dataSource={cart}
                  rowKey={(item) => item.product.id}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                  style={{ fontSize: '12px' }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Right Panel - Customer & Checkout */}
        <Col xs={24} lg={10} style={{ height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            
            {/* Customer Selection */}
            <Card 
              title="Customer Selection" 
              size="small"
              bodyStyle={{ padding: '12px' }}
            >
              <Row gutter={8}>
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
                    size="small"
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
                    size="small"
                  >
                    Add
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Order Summary - Business Perspective */}
            <Card 
              title={
                <Space>
                  <CalculatorOutlined />
                  <span>Order Summary</span>
                </Space>
              }
              size="small"
              style={{ flex: 1 }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ marginBottom: 16 }}>
                <Row gutter={8} style={{ marginBottom: 8 }}>
                  <Col span={12}>
                    <Statistic 
                      title="Items" 
                      value={totals.itemCount} 
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Quantity" 
                      value={totals.totalQuantity} 
                      valueStyle={{ fontSize: 16 }}
                    />
                  </Col>
                </Row>

                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text>List Price:</Text>
                  <Text>₹{totals.subtotal.toFixed(2)}</Text>
                </Row>
                
                {totals.totalDiscount !== 0 && (
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text>
                      {totals.totalDiscount > 0 ? (
                        <span style={{ color: '#fa8c16' }}>💝 Discount Given:</span>
                      ) : (
                        <span style={{ color: '#52c41a' }}>📈 Premium Added:</span>
                      )}
                    </Text>
                    <Text style={{ 
                      color: totals.totalDiscount > 0 ? '#fa8c16' : '#52c41a', 
                      fontWeight: 'bold' 
                    }}>
                      {totals.totalDiscount > 0 ? '' : '+'}₹{Math.abs(totals.totalDiscount).toFixed(2)}
                    </Text>
                  </Row>
                )}
                
                <Divider style={{ margin: '8px 0' }} />
                
                <Row justify="space-between" style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>Selling Price:</Text>
                  <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                    ₹{totals.finalTotal.toFixed(2)}
                  </Text>
                </Row>

                {totals.totalDiscount > 0 && (
                  <div style={{ 
                    backgroundColor: '#fff7e6', 
                    border: '1px solid #ffd591', 
                    borderRadius: 4, 
                    padding: 8, 
                    marginBottom: 12,
                    textAlign: 'center'
                  }}>
                    <Text style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                      🎁 Giving ₹{totals.totalDiscount.toFixed(2)} discount to customer
                    </Text>
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div style={{ 
                  backgroundColor: '#f0f5ff', 
                  border: '1px solid #adc6ff', 
                  borderRadius: 4, 
                  padding: 8, 
                  marginBottom: 16,
                  fontSize: '12px'
                }}>
                  <div><strong>Customer:</strong> {selectedCustomer.name}</div>
                  {selectedCustomer.phone && (
                    <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                  )}
                </div>
              )}
              
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                block
                disabled={cart.length === 0 || !selectedCustomer}
                icon={<PrinterOutlined />}
                style={{ height: 48, fontSize: 16 }}
              >
                Generate Invoice
              </Button>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          closable
          style={{ position: 'fixed', top: 80, right: 16, zIndex: 1000, maxWidth: 400 }}
        />
      )}

      {/* Payment Confirmation Modal */}
      <Modal
        title={
          <Space>
            <PrinterOutlined />
            <span>Confirm Payment & Generate Invoice</span>
          </Space>
        }
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <div>
          {/* Order Summary */}
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text strong>Customer:</Text>
              <Text>{selectedCustomer?.name}</Text>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text strong>Items:</Text>
              <Text>{totals.itemCount} items ({totals.totalQuantity} qty)</Text>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Text strong>List Price:</Text>
              <Text>₹{totals.subtotal.toFixed(2)}</Text>
            </Row>
            {totals.totalDiscount !== 0 && (
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Text strong style={{ color: totals.totalDiscount > 0 ? '#fa8c16' : '#52c41a' }}>
                  {totals.totalDiscount > 0 ? 'Discount Given:' : 'Premium Added:'}
                </Text>
                <Text strong style={{ color: totals.totalDiscount > 0 ? '#fa8c16' : '#52c41a' }}>
                  {totals.totalDiscount > 0 ? '' : '+'}₹{Math.abs(totals.totalDiscount).toFixed(2)}
                </Text>
              </Row>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <Row justify="space-between">
              <Text strong style={{ fontSize: 16 }}>Final Amount:</Text>
              <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                ₹{totals.finalTotal.toFixed(2)}
              </Text>
            </Row>
          </Card>

          {/* Payment Method Selection */}
          <div style={{ marginBottom: 20 }}>
            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>
              Select Payment Method:
            </Text>
            <Row gutter={8}>
              {paymentMethods.map(method => (
                <Col span={6} key={method}>
                  <Button
                    type={finalPaymentMethod === method ? 'primary' : 'default'}
                    onClick={() => setFinalPaymentMethod(method)}
                    block
                    style={{ 
                      height: 50,
                      fontSize: 14,
                      fontWeight: finalPaymentMethod === method ? 'bold' : 'normal'
                    }}
                  >
                    {method}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>

          {/* Confirmation Message */}
          <div style={{ 
            backgroundColor: finalPaymentMethod === 'Cash' ? '#fff7e6' : '#e6f7ff', 
            border: `1px solid ${finalPaymentMethod === 'Cash' ? '#ffd591' : '#91d5ff'}`, 
            borderRadius: 4, 
            padding: 12, 
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <Text strong>
              Customer will pay ₹{totals.finalTotal.toFixed(2)} via {finalPaymentMethod}
            </Text>
            {finalPaymentMethod === 'Cash' && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                Make sure you have sufficient change ready
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => setShowPaymentModal(false)}
                size="large"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={confirmAndGenerateInvoice}
                loading={loading}
                size="large"
                icon={<PrinterOutlined />}
                style={{ minWidth: 150 }}
              >
                Confirm & Print Invoice
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Price Edit Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined />
            <span>Negotiate Price</span>
          </Space>
        }
        open={showPriceModal}
        onCancel={() => setShowPriceModal(false)}
        footer={null}
        destroyOnClose
        width={400}
      >
        {editingItem && (
          <div>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
              <Row justify="space-between">
                <Col>
                  <Text strong>{editingItem.product.name}</Text>
                  <br />
                  <Text type="secondary">Quantity: {editingItem.quantity}</Text>
                </Col>
                <Col style={{ textAlign: 'right' }}>
                  <Text type="secondary">List Price:</Text>
                  <br />
                  <Text strong>₹{editingItem.originalPrice}</Text>
                </Col>
              </Row>
            </Card>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Enter Final Selling Price:</Text>
              <InputNumber
                value={newPrice}
                onChange={setNewPrice}
                style={{ width: '100%', marginTop: 8 }}
                size="large"
                min={0}
                step={0.01}
                prefix="₹"
                placeholder="Enter final selling price"
              />
            </div>

            <Card size="small" style={{ backgroundColor: '#f0f5ff', marginBottom: 16 }}>
              <Row justify="space-between">
                <Text>Per Item:</Text>
                <Text strong>₹{newPrice} × {editingItem.quantity}</Text>
              </Row>
              <Row justify="space-between">
                <Text>Total:</Text>
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                  ₹{(newPrice * editingItem.quantity).toFixed(2)}
                </Text>
              </Row>
              <Row justify="space-between">
                <Text style={{ color: newPrice < editingItem.originalPrice ? '#fa8c16' : '#52c41a' }}>
                  {newPrice < editingItem.originalPrice ? 'Discount Given:' : 'Premium Added:'}
                </Text>
                <Text strong style={{ color: newPrice < editingItem.originalPrice ? '#fa8c16' : '#52c41a' }}>
                  ₹{Math.abs((editingItem.originalPrice - newPrice) * editingItem.quantity).toFixed(2)}
                </Text>
              </Row>
            </Card>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setShowPriceModal(false)}>
                  Cancel
                </Button>
                <Button type="primary" onClick={applyNewPrice}>
                  Update Price
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Product Modal */}
      <Modal
        title="Add Custom Product"
        open={showProductModal}
        onCancel={() => setShowProductModal(false)}
        footer={null}
        destroyOnClose
        width={400}
      >
        <Form form={productForm} layout="vertical" onFinish={handleAddDynamicProduct}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true, message: 'Enter product name' }]}
          >
            <Input placeholder="Enter product name" />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Enter price' }]}
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
            rules={[{ required: true, message: 'Enter quantity' }]}
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

      {/* Add Customer Modal */}
      <Modal
        title="Add New Customer"
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        footer={null}
        destroyOnClose
        width={400}
      >
        <Form form={customerForm} layout="vertical" onFinish={handleAddDynamicCustomer}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: 'Enter customer name' }]}
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