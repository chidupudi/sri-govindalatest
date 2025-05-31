// src/components/billing/InvoiceList.js - Invoice viewing component
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PrinterOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import invoiceService from '../../services/invoiceService';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    limit: 50
  });

  useEffect(() => {
    loadInvoices();
    loadSummary();
  }, [filters]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getInvoices(filters);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      message.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await invoiceService.getInvoiceSummary(30);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleSearch = async (value) => {
    if (value.trim()) {
      setLoading(true);
      try {
        const searchResults = await invoiceService.searchInvoices(value);
        setInvoices(searchResults);
      } catch (error) {
        message.error('Search failed');
      } finally {
        setLoading(false);
      }
    } else {
      loadInvoices();
    }
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

  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  const handleExport = async () => {
    try {
      const exportData = await invoiceService.exportInvoices(filters);
      
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
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
      message.error('Export failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'cancelled': return 'red';
      case 'refunded': return 'orange';
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
        <Text strong style={{ color: '#1890ff' }}>{text}</Text>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      width: 140,
      render: (date) => (
        <div>
          <div>{moment(date.toDate()).format('DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(date.toDate()).format('HH:mm A')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.customerName}</div>
          {record.customerPhone && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.customerPhone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 60,
      align: 'center',
      render: (count) => (
        <Tag color="blue">{count}</Tag>
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
                ₹{record.subtotal.toFixed(2)}
              </div>
              <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                ₹{record.total.toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: '#52c41a' }}>
                Save ₹{record.discount.toFixed(2)}
              </div>
            </>
          ) : (
            <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
              ₹{record.total.toFixed(2)}
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
        <Tag color="purple">{method}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
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
              onClick={() => {
                navigate(`/invoices/${record.id}`);
                setTimeout(() => window.print(), 1000);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

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
            <Title level={4} style={{ margin: 0 }}>Invoices</Title>
          </Col>
          <Col>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={invoices.length === 0}
            >
              Export
            </Button>
          </Col>
        </Row>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search invoices..."
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => {
                if (e.target.value === '') {
                  loadInvoices();
                }
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              onChange={handleDateFilter}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              onChange={handleStatusFilter}
              value={filters.status}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="cancelled">Cancelled</Option>
              <Option value="refunded">Refunded</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text type="secondary">
              Showing {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
            </Text>
          </Col>
        </Row>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={invoices}
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
      </Card>
    </div>
  );
};

export default InvoiceList;