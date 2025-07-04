// src/components/products/ProductList.js - Mitti Arts pottery themed
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Table,
  Button,
  Input,
  Switch,
  Select,
  Modal,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  Tag,
  Card,
  Grid,
  Badge,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { fetchProducts, deleteProduct, setFilters } from '../../features/products/productSlice';
import ProductForm from './ProductForm';
import BulkUpload from './BulkUpload';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { useBreakpoint } = Grid;

const ProductList = () => {
  const dispatch = useDispatch();
  const { items, loading, filters } = useSelector((state) => state.products);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const screens = useBreakpoint();

  // Auto switch to card view on tablet/mobile
  useEffect(() => {
    if (screens.md && !screens.lg) {
      setViewMode('cards');
    } else if (screens.lg) {
      setViewMode('table');
    }
  }, [screens]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setOpenForm(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleOutlined />,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await dispatch(deleteProduct(id));
          dispatch(fetchProducts(filters));
        } catch (error) {
          console.error('Error deleting product:', error);
        }
      },
    });
  };

  const handleFilterChange = (name, value) => {
    dispatch(setFilters({ [name]: value }));
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedProduct(null);
    dispatch(fetchProducts(filters));
  };

  const handleCloseBulkUpload = () => {
    setOpenBulkUpload(false);
    dispatch(fetchProducts(filters));
  };

  // Get category emoji
  const getCategoryEmoji = (category) => {
    const categoryMap = {
      'Pottery': '🏺',
      'Terracotta': '🟫',
      'Clay Art': '🎨',
      'Decorative Items': '✨',
      'Garden Pottery': '🌱',
      'Kitchen Pottery': '🍽️',
      'Gifts & Souvenirs': '🎁',
      'Custom Orders': '🛠️'
    };
    return categoryMap[category] || '🏺';
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colorMap = {
      'Pottery': '#8b4513',
      'Terracotta': '#cd853f',
      'Clay Art': '#daa520',
      'Decorative Items': '#b8860b',
      'Garden Pottery': '#228b22',
      'Kitchen Pottery': '#ff6347',
      'Gifts & Souvenirs': '#9932cc',
      'Custom Orders': '#2f4f4f'
    };
    return colorMap[category] || '#8b4513';
  };

  // Table columns for desktop
  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{getCategoryEmoji(record.category)}</span>
            <Text strong>{text}</Text>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            <Tag color={getCategoryColor(record.category)} size="small">
              {record.category}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Weight: {record.weight || '-'}kg</div>
          <div>SKU: {record.sku || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Pricing',
      key: 'pricing',
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b4513' }}>
            ₹{record.price}
          </div>
          {record.costPrice && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Cost: ₹{record.costPrice}
            </div>
          )}
          {record.costPrice && (
            <div style={{ fontSize: '11px', color: '#52c41a' }}>
              Margin: {Math.round(((record.price - record.costPrice) / record.price) * 100)}%
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      align: 'center',
      render: (stock) => (
        <Badge
          count={stock}
          style={{
            backgroundColor: stock <= 5 ? '#ff4d4f' : stock <= 20 ? '#faad14' : '#52c41a'
          }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              type="primary"
              style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Card view for tablets
  const ProductCard = ({ product }) => (
    <Card
      size="small"
      style={{ 
        marginBottom: 12,
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <Row gutter={[8, 8]} align="middle">
        <Col flex="auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '18px' }}>{getCategoryEmoji(product.category)}</span>
            <Text strong style={{ fontSize: '14px' }}>{product.name}</Text>
          </div>
          <div>
            <Tag color={getCategoryColor(product.category)} size="small">
              {product.category}
            </Tag>
            {product.weight && (
              <Tag color="blue" size="small">{product.weight}kg</Tag>
            )}
          </div>
        </Col>
        <Col>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b4513' }}>
              ₹{product.price}
            </div>
            {product.costPrice && (
              <div style={{ fontSize: '11px', color: '#666' }}>
                Cost: ₹{product.costPrice}
              </div>
            )}
            <Badge
              count={product.stock}
              style={{
                backgroundColor: product.stock <= 5 ? '#ff4d4f' : 
                                product.stock <= 20 ? '#faad14' : '#52c41a',
                fontSize: '10px'
              }}
            />
          </div>
        </Col>
        <Col>
          <Space direction="vertical" size="small">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(product)}
              type="primary"
              block
              style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
            />
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(product.id)}
              block
            />
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div style={{ padding: screens.xs ? 12 : 24 }}>
      {/* Header with Mitti Arts branding */}
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: screens.xs ? 12 : 16 }}
      >
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '24px' }}>🏺</span>
              <div>
                <Title level={4} style={{ margin: 0, color: '#8b4513' }}>
                  Mitti Arts Products
                </Title>
                <Text type="secondary">Handcrafted pottery & terracotta collection</Text>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: screens.xs ? 'left' : 'right' }}>
            <Space wrap>
              {screens.md && (
                <Button.Group>
                  <Button
                    icon={<TableOutlined />}
                    type={viewMode === 'table' ? 'primary' : 'default'}
                    onClick={() => setViewMode('table')}
                  />
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'cards' ? 'primary' : 'default'}
                    onClick={() => setViewMode('cards')}
                  />
                </Button.Group>
              )}
              <Button
                icon={<UploadOutlined />}
                onClick={() => setOpenBulkUpload(true)}
                size={screens.xs ? 'small' : 'middle'}
              >
                {screens.xs ? 'Bulk' : 'Bulk Upload'}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedProduct(null);
                  setOpenForm(true);
                }}
                size={screens.xs ? 'small' : 'middle'}
                style={{ backgroundColor: '#8b4513', borderColor: '#8b4513' }}
              >
                {screens.xs ? 'Add' : 'Add Product'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: screens.xs ? 12 : 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search pottery products..."
              prefix={<SearchOutlined />}
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Category"
              value={filters.category || ''}
              onChange={(val) => handleFilterChange('category', val)}
              allowClear
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="">All Categories</Option>
              <Option value="Pottery">🏺 Pottery</Option>
              <Option value="Terracotta">🟫 Terracotta</Option>
              <Option value="Clay Art">🎨 Clay Art</Option>
              <Option value="Decorative Items">✨ Decorative Items</Option>
              <Option value="Garden Pottery">🌱 Garden Pottery</Option>
              <Option value="Kitchen Pottery">🍽️ Kitchen Pottery</Option>
              <Option value="Gifts & Souvenirs">🎁 Gifts & Souvenirs</Option>
              <Option value="Custom Orders">🛠️ Custom Orders</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Switch
                checked={filters.lowStock || false}
                onChange={(checked) => handleFilterChange('lowStock', checked)}
                size={screens.xs ? 'small' : 'default'}
              />
              <Text>Low Stock Only</Text>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Text type="secondary">
              {items.length} product{items.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Content */}
      <Card bodyStyle={{ padding: screens.xs ? 8 : 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: 16 }}>
              Loading pottery collection...
            </Text>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>🏺</div>
            <Text type="secondary" style={{ fontSize: 16, display: 'block' }}>
              No pottery products found
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {filters.search || filters.category || filters.lowStock
                ? 'Try adjusting your filters or add a new product'
                : 'Get started by adding your first pottery product'}
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                setSelectedProduct(null);
                setOpenForm(true);
              }}
              style={{ 
                marginTop: 16,
                backgroundColor: '#8b4513', 
                borderColor: '#8b4513' 
              }}
            >
              Add Your First Product
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'table' && screens.lg ? (
              <Table
                dataSource={items}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} products`
                }}
                bordered
                size="middle"
                scroll={{ x: 'max-content' }}
              />
            ) : (
              <div>
                {items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Product Form Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏺</span>
            <span>{selectedProduct ? 'Edit Product' : 'Add New Product'}</span>
          </div>
        }
        open={openForm}
        onCancel={() => setOpenForm(false)}
        footer={null}
        width={screens.xs ? '95%' : 800}
        destroyOnClose
      >
        <ProductForm product={selectedProduct} onClose={handleCloseForm} />
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📁</span>
            <span>Bulk Upload Products</span>
          </div>
        }
        open={openBulkUpload}
        onCancel={() => setOpenBulkUpload(false)}
        footer={[
          <Button key="close" onClick={() => setOpenBulkUpload(false)}>
            Close
          </Button>,
        ]}
        width={screens.xs ? '95%' : 600}
        destroyOnClose
      >
        <BulkUpload onSuccess={handleCloseBulkUpload} />
      </Modal>
    </div>
  );
};

export default ProductList;