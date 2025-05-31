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
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { fetchProducts, deleteProduct, setFilters } from '../../features/products/productSlice';
import ProductForm from './ProductForm';
import BulkUpload from './BulkUpload';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const ProductList = () => {
  const dispatch = useDispatch();
  const { items, loading, filters } = useSelector((state) => state.products);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);

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

  // Columns definition for antd Table
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Weight (g)',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => (weight || '-'),
    },
    {
      title: 'Price (₹)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <Text strong>₹{price}</Text>,
    },
    {
      title: 'Cost Price (₹)',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (costPrice) => (costPrice ? `₹${costPrice}` : '-'),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) =>
        stock <= 10 ? (
          <Text type="danger" strong>
            {stock} (Low)
          </Text>
        ) : (
          <Text>{stock}</Text>
        ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku) => sku || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            type="primary"
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{ marginBottom: 24 }}
        title={<Title level={4}>Products Management</Title>}
        bodyStyle={{ paddingBottom: 16 }}
      >
        <Row gutter={[16, 16]} align="middle" wrap>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search Products"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Category"
              value={filters.category || ''}
              onChange={(val) => handleFilterChange('category', val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Categories</Option>
              <Option value="German silver">German silver</Option>
              <Option value="1g gold">1g gold</Option>
              <Option value="Panchaloha">Panchaloha</Option>
              <Option value="Gifts">Gifts</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              <Switch
                checked={filters.lowStock || false}
                onChange={(checked) => handleFilterChange('lowStock', checked)}
              />
              <Text>Low Stock Only</Text>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={24} lg={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setOpenBulkUpload(true)}
              >
                Bulk Upload
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setSelectedProduct(null);
                  setOpenForm(true);
                }}
              >
                Add Product
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
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
          <Table
            dataSource={items}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            bordered
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>

      {/* Product Form Modal */}
      <Modal
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        open={openForm}
        onCancel={() => setOpenForm(false)}
        footer={null}
        width={800}
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
        width={600}
        destroyOnClose
      >
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          Upload a CSV file with the following columns: name, category, weight, price, costPrice, stock, description, sku
        </Text>
        <BulkUpload onSuccess={handleCloseBulkUpload} />
      </Modal>
    </div>
  );
};

export default ProductList;
