// src/components/dashboard/Dashboard.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Spin, 
  Table,
  Tag,
  Space,
  Divider
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  ProductOutlined,
  MoneyCollectOutlined,
  ExclamationOutlined,
  LineChartOutlined,
  PieChartOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { fetchOrders } from '../../features/order/orderSlice';
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customer/customerSlice';
import { fetchExpenses } from '../../features/expense/expenseSlice';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, color, trend, trendValue }) => {
  const trendColor = trend === 'up' ? '#3f8600' : '#cf1322';
  
  return (
    <Card>
      <Space direction="horizontal" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Statistic
          title={title}
          value={value}
          prefix={icon}
          valueStyle={{ color }}
        />
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {trend === 'up' ? (
              <ArrowUpOutlined style={{ color: trendColor }} />
            ) : (
              <ArrowDownOutlined style={{ color: trendColor }} />
            )}
            <Text style={{ color: trendColor, marginLeft: 4 }}>
              {trendValue}
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  
  const { items: orders, loading: ordersLoading } = useSelector(state => state.orders);
  const { items: products, loading: productsLoading } = useSelector(state => state.products);
  const { items: customers, loading: customersLoading } = useSelector(state => state.customers);
  const { items: expenses, loading: expensesLoading } = useSelector(state => state.expenses);

  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalExpenses: 0,
    salesData: [],
    topProducts: [],
    recentOrders: []
  });

  useEffect(() => {
    // Load all data
    dispatch(fetchOrders({}));
    dispatch(fetchProducts({}));
    dispatch(fetchCustomers({}));
    dispatch(fetchExpenses({}));
  }, [dispatch]);

  useEffect(() => {
    // Calculate dashboard metrics when data changes
    if (orders.length || products.length || customers.length || expenses.length) {
      calculateDashboardData();
    }
  }, [orders, products, customers, expenses]);

  const calculateDashboardData = () => {
    // Calculate total sales
    const completedOrders = orders.filter(order => order.status !== 'cancelled');
    const totalSales = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Calculate expenses for current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Low stock products (stock <= 10)
    const lowStockProducts = products.filter(product => product.stock <= 10).length;

    // Sales data for chart (last 7 days)
    const salesData = getLast7DaysSales();
    
    // Top products by sales
    const topProducts = getTopProducts();

    // Recent orders
    const recentOrders = [...completedOrders]
      .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt))
      .slice(0, 5);

    setDashboardData({
      totalSales,
      totalOrders: completedOrders.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      lowStockProducts,
      totalExpenses,
      salesData,
      topProducts,
      recentOrders
    });
  };

  const getLast7DaysSales = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayOrders = orders.filter(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString() && order.status !== 'cancelled';
      });
      
      const dayTotal = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      last7Days.push({
        date: dateStr,
        sales: dayTotal,
        orders: dayOrders.length
      });
    }
    
    return last7Days;
  };

  const getTopProducts = () => {
    const productSales = {};
    
    orders.forEach(order => {
      if (order.status !== 'cancelled' && order.items) {
        order.items.forEach(item => {
          const productId = item.product?.id || item.productId;
          const productName = item.product?.name || 'Unknown Product';
          
          if (!productSales[productId]) {
            productSales[productId] = {
              name: productName,
              quantity: 0,
              revenue: 0
            };
          }
          
          productSales[productId].quantity += item.quantity || 0;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const isLoading = ordersLoading || productsLoading || customersLoading || expensesLoading;

  const recentOrdersColumns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${id.slice(-6)}`
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (text) => text || 'Walk-in Customer'
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date?.toDate?.() || date).toLocaleDateString()
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'amount',
      render: (amount) => `₹${amount?.toLocaleString() || 0}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'blue'}>
          {status?.toUpperCase()}
        </Tag>
      )
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard Overview</Title>
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Total Sales"
            value={dashboardData.totalSales}
            prefix="₹"
            icon={<MoneyCollectOutlined />}
            color="#3f8600"
            trend="up"
            trendValue="12%"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Total Orders"
            value={dashboardData.totalOrders}
            icon={<ShoppingCartOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Customers"
            value={dashboardData.totalCustomers}
            icon={<UserOutlined />}
            color="#722ed1"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Products"
            value={dashboardData.totalProducts}
            icon={<ProductOutlined />}
            color="#13c2c2"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Low Stock Items"
            value={dashboardData.lowStockProducts}
            icon={<ExclamationOutlined />}
            color="#faad14"
            trend="down"
            trendValue="5%"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Monthly Expenses"
            value={dashboardData.totalExpenses}
            prefix="₹"
            icon={<ArrowDownOutlined />}
            color="#f5222d"
          />
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <LineChartOutlined />
                <Text strong>Sales Trend (Last 7 Days)</Text>
              </Space>
            }
          >
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#1890ff"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <PieChartOutlined />
                <Text strong>Top Products by Revenue</Text>
              </Space>
            }
          >
            <div style={{ height: '300px' }}>
              {dashboardData.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.topProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {dashboardData.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%' 
                }}>
                  <Text type="secondary">No sales data available</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <Text strong>Recent Orders</Text>
          </Space>
        }
      >
        <Table
          columns={recentOrdersColumns}
          dataSource={dashboardData.recentOrders}
          rowKey="id"
          pagination={false}
          size="middle"
          locale={{
            emptyText: 'No recent orders'
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;