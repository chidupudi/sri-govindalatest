// src/components/customer/CustomerList.js - Fixed version with proper Add/Edit
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Popconfirm, 
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Avatar,
  message,
  Tooltip
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ShoppingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { 
  fetchCustomers, 
  deleteCustomer, 
  setSelectedCustomer 
} from '../../features/customer/customerSlice';
import CustomerForm from './CustomerForm';

const { Search } = Input;
const { Title, Text } = Typography;

const CustomerList = () => {
  const dispatch = useDispatch();
  const { items: customers, loading, error } = useSelector(state => state.customers);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    console.log('CustomerList: Loading customers...');
    dispatch(fetchCustomers({ search, page, pageSize }));
  }, [dispatch, search, page, pageSize]);

  const handleEdit = (customer) => {
    console.log('Editing customer:', customer);
    dispatch(setSelectedCustomer(customer));
    setOpenForm(true);
  };

  const handleAdd = () => {
    console.log('Adding new customer');
    dispatch(setSelectedCustomer(null));
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await dispatch(deleteCustomer(id));
      if (deleteCustomer.fulfilled.match(result)) {
        message.success('Customer deleted successfully');
        dispatch(fetchCustomers({ search, page, pageSize }));
      } else {
        message.error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Error deleting customer');
    }
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    dispatch(setSelectedCustomer(null));
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    dispatch(setSelectedCustomer(null));
    dispatch(fetchCustomers({ search, page, pageSize }));
    message.success('Customer saved successfully');
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            size={40} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {record.name}
            </div>
            {record.email && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <MailOutlined style={{ marginRight: 4 }} />
                {record.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 150,
      render: (_, record) => (
        <div>
          {record.phone ? (
            <div style={{ marginBottom: 4 }}>
              <PhoneOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              <Text copyable style={{ fontSize: '12px' }}>{record.phone}</Text>
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>No phone</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Address',
      key: 'address',
      width: 200,
      render: (_, record) => {
        const address = record.address;
        if (!address || (!address.street && !address.city && !address.state)) {
          return <Text type="secondary" style={{ fontSize: '12px' }}>No address</Text>;
        }
        
        const addressParts = [
          address.street,
          address.city,
          address.state,
          address.pincode
        ].filter(Boolean);
        
        return (
          <Text style={{ fontSize: '12px' }}>
            {addressParts.join(', ')}
          </Text>
        );
      },
    },
    {
      title: 'Purchase History',
      key: 'purchases',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            {record.totalPurchases || 0}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            <ShoppingOutlined /> orders
          </div>
          {record.totalSpent && (
            <div style={{ fontSize: '11px', color: '#52c41a', fontWeight: 'bold' }}>
              ₹{record.totalSpent.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'GST Number',
      dataIndex: 'gstNumber',
      key: 'gstNumber',
      width: 120,
      render: (gstNumber) => 
        gstNumber ? (
          <Tag color="purple" style={{ fontSize: '10px' }}>{gstNumber}</Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Customer">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="primary"
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Customer"
            description="Are you sure you want to delete this customer? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger"
            placement="topRight"
          >
            <Tooltip title="Delete Customer">
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="danger">Error loading customers: {error}</Text>
            <br />
            <Button 
              onClick={() => dispatch(fetchCustomers({}))} 
              type="primary" 
              style={{ marginTop: 16 }}
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Customers ({customers.length})
          </Title>
          <Text type="secondary">Manage your customer database</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            size="large"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            Add Customer
          </Button>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search customers by name, phone, or email..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={8} style={{ textAlign: 'right' }}>
            <Space>
              <Text type="secondary">
                {customers.length} customer{customers.length !== 1 ? 's' : ''} found
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Customer Table */}
      <Card>
        {customers.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">No customers found</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {search ? 'Try adjusting your search terms' : 'Start by adding your first customer'}
            </Text>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              size="large"
            >
              Add First Customer
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={customers}
            loading={loading}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: customers.length,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['5', '10', '25', '50'],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} customers`,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
            rowClassName={(record, index) => 
              index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
            }
          />
        )}
      </Card>

      {/* Customer Form Modal */}
      <CustomerForm
        open={openForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      <style jsx>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: white;
        }
        .table-row-light:hover,
        .table-row-dark:hover {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default CustomerList;