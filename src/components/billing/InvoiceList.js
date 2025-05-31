// src/components/billing/InvoiceList.js - Fixed version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  DatePicker,
  Select,
  Tooltip,
  message,
  Modal,
  Statistic,
  Spin,
  Alert
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PrinterOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { fetchOrders } from '../../features/order/orderSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const InvoiceList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get orders from Redux store (these are our invoices)
  const { items: orders, loading, error } = useSelector(state => state.orders);
  
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    paymentMethod: ''
  });

  // Load orders on component mount
  useEffect(() => {
    console.log('InvoiceList: Loading orders...');
    dispatch(fetchOrders({ limit: 100 }));
  }, [dispatch]);

  // Filter orders and calculate summary when orders or filters change
  useEffect(() => {
    if (orders && orders.length > 0) {
      console.log('InvoiceList: Processing orders:', orders.length);
      filterAndProcessOrders();
    } else {
      setFilteredInvoices([]);
      setSummary(null);
    }
  }, [orders, filters]);

  const filterAndProcessOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm) ||
        order.customer?.name?.toLowerCase().includes(searchTerm) ||
        order.customer?.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Apply payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(order => order.paymentMethod === filters.paymentMethod);
    }

    // Apply date range filter
    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate >= filters.startDate && orderDate <= filters.endDate;
      });
    }

    // Calculate summary for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= thirtyDaysAgo && order.status !== 'cancelled';
    });

    const summaryData = {
      totalInvoices: recentOrders.length,
      totalRevenue: recentOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalDiscount: recentOrders.reduce((sum, order) => sum + (order.discount || 0), 0),
      averageOrderValue: recentOrders.length > 0 ? 
        recentOrders.reduce((sum, order) => sum + (order.total || 0), 0) / recentOrders.length : 0
    };

    setFilteredInvoices(filtered);
    setSummary(summaryData);
    console.log('InvoiceList: Filtered invoices:', filtered.length);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDateFilter = (dates) => {
    setFilters(prev => ({
      ...prev,
      startDate: dates ? dates[0].toDate() : null,
      endDate: dates ? dates[1].toDate() : null
    }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handlePaymentMethodFilter = (paymentMethod) => {
    setFilters(prev => ({ ...prev, paymentMethod }));
  };

  const handleViewInvoice = (order) => {
    navigate(`/invoices/${order.id}`);
  };

  const handlePrintInvoice = (order) => {
    // Open invoice in new window for printing
    const printWindow = window.open(`/invoices/${order.id}`, '_blank');
    setTimeout(() => {
      printWindow?.print();
    }, 1000);
  };

  const handleRefresh = () => {
    dispatch(fetchOrders({ limit: 100 }));
    message.success('Invoices refreshed');
  };

  const handleExport = () => {
    try {
      // Simple CSV export
      const csvData = filteredInvoices.map(order => ({
        'Invoice Number': order.orderNumber,
        'Date': moment(order.createdAt?.toDate?.() || order.createdAt).format('YYYY-MM-DD'),
        'Customer': order.customer?.name || 'Walk-in Customer',
        'Phone': order.customer?.phone || '',
        'Items': order.items?.length || 0,
        'Subtotal': order.subtotal || 0,
        'Discount': order.discount || 0,
        'Total': order.total || 0,
        'Payment Method': order.paymentMethod || '',
        'Status': order.status || ''
      }));

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${moment().format('YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      message.success('Invoice data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>{text || 'N/A'}</Text>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => {
        const orderDate = date?.toDate ? date.toDate() : new Date(date);
        return (
          <div>
            <div>{moment(orderDate).format('DD/MM/YYYY')}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {moment(orderDate).format('HH:mm A')}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.customer?.name || 'Walk-in Customer'}</div>
          {record.customer?.phone && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.customer.phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 60,
      align: 'center',
      render: (items) => (
        <Tag color="blue">{items?.length || 0}</Tag>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <div>
          {record.discount > 0 ? (
            <>
              <div style={{ fontSize: '12px', textDecoration: 'line-through', color: '#999' }}>
                ₹{(record.subtotal || 0).toFixed(2)}
              </div>
              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                ₹{(record.total || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: '#52c41a' }}>
                Save ₹{(record.discount || 0).toFixed(2)}
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
              ₹{(record.total || 0).toFixed(2)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (method) => (
        <Tag color="purple">{method || 'Cash'}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {(status || 'completed').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Invoice">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewInvoice(record)}
              type="primary"
            />
          </Tooltip>
          <Tooltip title="Print">
            <Button
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => handlePrintInvoice(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading invoices..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error Loading Invoices"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Summary Cards */}
      {summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Invoices (30 days)"
                value={summary.totalInvoices}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={summary.totalRevenue}
                prefix="₹"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Savings"
                value={summary.totalDiscount}
                prefix="₹"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Avg Order Value"
                value={summary.averageOrderValue}
                prefix="₹"
                precision={2}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Invoices ({filteredInvoices.length})
            </Title>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                disabled={filteredInvoices.length === 0}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Search invoices..."
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                if (e.target.value === '') {
                  handleSearch('');
                }
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <RangePicker
              onChange={handleDateFilter}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Status"
              onChange={handleStatusFilter}
              value={filters.status}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Status</Option>
              <Option value="completed">Completed</Option>
              <Option value="pending">Pending</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="Payment"
              onChange={handlePaymentMethodFilter}
              value={filters.paymentMethod}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Methods</Option>
              <Option value="Cash">Cash</Option>
              <Option value="Card">Card</Option>
              <Option value="UPI">UPI</Option>
              <Option value="Bank Transfer">Bank Transfer</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Text type="secondary">
              Showing {filteredInvoices.length} of {orders.length} invoices
            </Text>
          </Col>
        </Row>

        {/* Table */}
        {filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Text type="secondary" style={{ fontSize: 16 }}>
              {orders.length === 0 ? 'No invoices found' : 'No invoices match your filters'}
            </Text>
            <br />
            <Text type="secondary">
              {orders.length === 0 ? 'Create your first invoice by going to Billing' : 'Try adjusting your search criteria'}
            </Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredInvoices}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} invoices`,
            }}
            scroll={{ x: 'max-content' }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default InvoiceList;