// src/components/products/ProductList.js - Tablet optimized layout
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

  // Table columns for desktop
  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category}
          </Text>
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      width: 150,
      render: (_, record) => (
        <div>
          <div>Weight: {record.weight || '-'}g</div>
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
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            ₹{record.price}
          </div>
          {record.costPrice && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Cost: ₹{record.costPrice}
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
            backgroundColor: stock <= 10 ? '#ff4d4f' : stock <= 50 ? '#faad14' : '#52c41a'
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
          <div>
            <Text strong style={{ fontSize: '14px' }}>{product.name}</Text>
            <br />
            <Tag color="blue" size="small">{product.category}</Tag>
            {product.weight && (
              <Tag color="green" size="small">{product.weight}g</Tag>
            )}
          </div>
        </Col>
        <Col>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              ₹{product.price}
            </div>
            <Badge
              count={product.stock}
              style={{
                backgroundColor: product.stock <= 10 ? '#ff4d4f' : 
                                product.stock <= 50 ? '#faad14' : '#52c41a',
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
      {/* Header */}
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: screens.xs ? 12 : 16 }}
      >
        <Row justify="space-between" align="middle" gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Title level={4} style={{ margin: 0 }}>Products</Title>
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
              placeholder="Search products..."
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
              <Option value="German silver">German silver</Option>
              <Option value="1g gold">1g gold</Option>
              <Option value="Panchaloha">Panchaloha</Option>
              <Option value="Gifts">Gifts</Option>
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
              Loading products...
            </Text>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Text type="secondary" style={{ fontSize: 16, display: 'block' }}>
              No products found
            </Text>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {filters.search || filters.category || filters.lowStock
                ? 'Try adjusting your filters or add a new product'
                : 'Get started by adding your first product'}
            </Text>
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
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
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
        title="Bulk Upload Products"
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