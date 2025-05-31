import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Button,
  Tag,
  Spin,
  Row,
  Col,
  Typography,
  Space,
  Popconfirm,
  message,
} from 'antd';
import { EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { fetchOrders, cancelOrder } from '../../features/order/orderSlice';
import OrderSummary from './OrderSummary';
import moment from 'moment';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: orders = [], total = 0, loading: isLoading } = useSelector(state => state.orders);

  const [dates, setDates] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchOrdersData = useCallback(() => {
    const [startDate, endDate] = dates;
    const params = {
      page,
      limit: pageSize,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
      ...(status && { status }),
    };
    dispatch(fetchOrders(params));
  }, [page, pageSize, dates, status, dispatch]);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  const handleView = (id) => navigate(`/invoice/${id}`);

  const handleCancel = async (id) => {
    await dispatch(cancelOrder(id));
    message.success('Order cancelled');
    fetchOrdersData();
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'completed':
        return <Tag color="green">Completed</Tag>;
      case 'pending':
        return <Tag color="orange">Pending</Tag>;
      case 'cancelled':
        return <Tag color="red">Cancelled</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => moment(text?.toDate?.() || text).format('DD/MM/YYYY'),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (_, record) => record.customer?.name || 'Walk-in Customer',
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (value) => `₹${(value || 0).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
            type="link"
          />
          {record.status === 'pending' && (
            <Popconfirm
              title="Are you sure to cancel this order?"
              onConfirm={() => handleCancel(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={<CloseCircleOutlined />}
                danger
                type="link"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: 24 }}>
        <OrderSummary />

        <Card style={{ marginTop: 24 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Title level={4}>Orders</Title>
          </Row>

          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                onChange={(values) => setDates(values || [])}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Select Status"
                onChange={setStatus}
                value={status}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="">All</Option>
                <Option value="pending">Pending</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Col>
          </Row>

          <Table
            dataSource={orders}
            columns={columns}
            rowKey="id"
            pagination={{
              current: page,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              onChange: (newPage, newPageSize) => {
                setPage(newPage);
                setPageSize(newPageSize);
              },
            }}
          />
        </Card>
      </div>
    </Spin>
  );
};

export default OrderList;
