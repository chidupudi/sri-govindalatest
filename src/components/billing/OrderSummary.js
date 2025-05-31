import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Row, Col, Typography, Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';

const { Title, Text } = Typography;

const OrderSummary = () => {
  const { orders, isLoading } = useSelector(state => state.orders);

  const calculateTotalSales = () => {
    return orders?.reduce((total, order) => {
      if (order.status !== 'cancelled') {
        return total + order.total;
      }
      return total;
    }, 0) || 0;
  };

  const calculateAverageOrderValue = () => {
    const validOrders = orders?.filter(order => order.status !== 'cancelled') || [];
    return validOrders.length ? calculateTotalSales() / validOrders.length : 0;
  };

  const getOrdersByStatus = () => {
    const statusCount = {
      completed: 0,
      pending: 0,
      cancelled: 0
    };
    orders?.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const getDailySales = () => {
    const salesByDate = {};
    orders?.forEach(order => {
      if (order.status !== 'cancelled') {
        const date = new Date(order.createdAt).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + order.total;
      }
    });
    return Object.entries(salesByDate).map(([date, total]) => ({
      date,
      total
    }));
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '2rem auto' }} />;
  }

  return (
    <Card title="Sales Summary">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Title level={3}>₹{calculateTotalSales().toFixed(2)}</Title>
            <Text type="secondary">Total Sales</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Title level={3}>₹{calculateAverageOrderValue().toFixed(2)}</Title>
            <Text type="secondary">Average Order Value</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Title level={3}>{orders?.length || 0}</Title>
            <Text type="secondary">Total Orders</Text>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Title level={5}>Daily Sales</Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getDailySales()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#1890ff" />
            </LineChart>
          </ResponsiveContainer>
        </Col>
        <Col xs={24} md={8}>
          <Title level={5}>Orders by Status</Title>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getOrdersByStatus()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#1890ff"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Col>
      </Row>
    </Card>
  );
};

export default OrderSummary;
