// src/components/dashboard/Dashboard.js - Improved with profit calculations and filters
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
  Divider,
  Button,
  Tooltip,
  Alert,
  Select,
  DatePicker
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
  HistoryOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { fetchOrders } from '../../features/order/orderSlice';
import { fetchProducts } from '../../features/products/productSlice';
import { fetchCustomers } from '../../features/customer/customerSlice';
import { fetchExpenses } from '../../features/expense/expenseSlice';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const StatCard = ({ title, value, icon, color, trend, trendValue, prefix, suffix, warning }) => {
  const trendColor = trend === 'up' ? '#3f8600' : '#cf1322';
  
  return (
    <Card hoverable>
      <Space direction="horizontal" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Statistic
            title={
              <Space>
                {title}
                {warning && (
                  <Tooltip title={warning}>
                    <InfoCircleOutlined style={{ color: '#faad14' }} />
                  </Tooltip>
                )}
              </Space>
            }
            value={value}
            prefix={prefix || icon}
            suffix={suffix}
            valueStyle={{ color }}
          />
        </div>
        {trend && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {trend === 'up' ? (
              <ArrowUpOutlined style={{ color: trendColor, fontSize: '16px' }} />
            ) : (
              <ArrowDownOutlined style={{ color: trendColor, fontSize: '16px' }} />
            )}
            <Text style={{ color: trendColor, fontSize: '12px', fontWeight: 'bold' }}>
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

  const [dateFilter, setDateFilter] = useState('week'); // week, 2weeks, month
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalExpenses: 0,
    totalProfit: 0,
    profitMargin: 0,
    costAnalysis: { withCost: 0, withoutCost: 0 },
    salesData: [],
    topProducts: [],
    recentOrders: [],
    profitData: []
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
  }, [orders, products, customers, expenses, dateFilter]);

  const getDateRange = () => {
    const now = moment();
    let startDate;
    
    switch (dateFilter) {
      case 'week':
        startDate = now.clone().subtract(7, 'days');
        break;
      case '2weeks':
        startDate = now.clone().subtract(14, 'days');
        break;
      case 'month':
        startDate = now.clone().subtract(30, 'days');
        break;
      default:
        startDate = now.clone().subtract(7, 'days');
    }
    
    return { startDate, endDate: now };
  };

  const calculateDashboardData = () => {
    const { startDate, endDate } = getDateRange();
    
    // Filter orders for the selected period
    const filteredOrders = orders.filter(order => {
      if (order.status === 'cancelled') return false;
      const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
      return orderDate.isBetween(startDate, endDate, null, '[]');
    });

    // Calculate total sales and orders
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    
    // Calculate expenses for the same period
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = moment(expense.date?.toDate?.() || expense.date);
      return expenseDate.isBetween(startDate, endDate, null, '[]');
    });
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Calculate cost analysis
    const costAnalysis = analyzeCostPrices();
    
    // Calculate total cost of goods sold and profit
    const totalCostOfGoods = calculateCostOfGoods(filteredOrders);
    const grossProfit = totalSales - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Low stock products (stock <= 10)
    const lowStockProducts = products.filter(product => product.stock <= 10).length;

    // Sales data for chart
    const salesData = generateSalesData(filteredOrders, startDate, endDate);
    
    // Profit data for chart
    const profitData = generateProfitData(filteredOrders, filteredExpenses, startDate, endDate);
    
    // Top products by sales
    const topProducts = getTopProducts(filteredOrders);

    // Recent orders (last 5)
    const recentOrders = [...filteredOrders]
      .sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt))
      .slice(0, 5);

    setDashboardData({
      totalSales,
      totalOrders,
      totalCustomers: customers.length,
      totalProducts: products.length,
      lowStockProducts,
      totalExpenses,
      totalProfit: netProfit,
      profitMargin,
      costAnalysis,
      salesData,
      topProducts,
      recentOrders,
      profitData
    });
  };

  const analyzeCostPrices = () => {
    const withCost = products.filter(product => product.costPrice && product.costPrice > 0).length;
    const withoutCost = products.filter(product => !product.costPrice || product.costPrice <= 0).length;
    
    return { withCost, withoutCost, total: products.length };
  };

  const calculateCostOfGoods = (ordersList) => {
    let totalCost = 0;
    
    ordersList.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.product?.id || p.id === item.productId);
          if (product && product.costPrice) {
            totalCost += product.costPrice * item.quantity;
          } else if (product) {
            // If no cost price, estimate at 60% of selling price
            totalCost += (item.price * 0.6) * item.quantity;
          }
        });
      }
    });
    
    return totalCost;
  };

  const generateSalesData = (ordersList, start, end) => {
    const days = [];
    const current = start.clone();
    
    while (current.isSameOrBefore(end, 'day')) {
      const dayOrders = ordersList.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isSame(current, 'day');
      });
      
      const dayTotal = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const dayCount = dayOrders.length;
      
      days.push({
        date: current.format('MMM DD'),
        sales: dayTotal,
        orders: dayCount,
        fullDate: current.format('YYYY-MM-DD')
      });
      
      current.add(1, 'day');
    }
    
    return days;
  };

  const generateProfitData = (ordersList, expensesList, start, end) => {
    const days = [];
    const current = start.clone();
    
    while (current.isSameOrBefore(end, 'day')) {
      const dayOrders = ordersList.filter(order => {
        const orderDate = moment(order.createdAt?.toDate?.() || order.createdAt);
        return orderDate.isSame(current, 'day');
      });
      
      const dayExpenses = expensesList.filter(expense => {
        const expenseDate = moment(expense.date?.toDate?.() || expense.date);
        return expenseDate.isSame(current, 'day');
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const dayCost = calculateCostOfGoods(dayOrders);
      const dayExpenseTotal = dayExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const dayProfit = dayRevenue - dayCost - dayExpenseTotal;
      
      days.push({
        date: current.format('MMM DD'),
        revenue: dayRevenue,
        cost: dayCost,
        expenses: dayExpenseTotal,
        profit: dayProfit,
        fullDate: current.format('YYYY-MM-DD')
      });
      
      current.add(1, 'day');
    }
    
    return days;
  };

  const getTopProducts = (ordersList) => {
    const productSales = {};
    
    ordersList.forEach(order => {
      if (order.items) {
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
      render: (date) => moment(date?.toDate?.() || date).format('DD/MM/YY')
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
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  const costWarning = dashboardData.costAnalysis.withoutCost > 0 
    ? `${dashboardData.costAnalysis.withoutCost} products missing cost price. Profit calculations may be estimated.`
    : null;

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Dashboard Overview</Title>
        </Col>
        <Col>
          <Space>
            <Text>Time Period:</Text>
            <Select value={dateFilter} onChange={setDateFilter} style={{ width: 120 }}>
              <Option value="week">1 Week</Option>
              <Option value="2weeks">2 Weeks</Option>
              <Option value="month">1 Month</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Cost Price Warning */}
      {costWarning && (
        <Alert
          message="Cost Price Information"
          description={costWarning}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link">
              Manage Products
            </Button>
          }
        />
      )}
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Total Sales"
            value={dashboardData.totalSales.toFixed(2)}
            prefix="₹"
            icon={<MoneyCollectOutlined />}
            color="#3f8600"
            trend="up"
            trendValue="12%"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Net Profit"
            value={dashboardData.totalProfit.toFixed(2)}
            prefix="₹"
            icon={<TrophyOutlined />}
            color={dashboardData.totalProfit >= 0 ? "#3f8600" : "#cf1322"}
            trend={dashboardData.totalProfit >= 0 ? "up" : "down"}
            trendValue={`${dashboardData.profitMargin.toFixed(1)}%`}
            warning={costWarning}
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
            warning={costWarning}
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
            title="Total Expenses"
            value={dashboardData.totalExpenses.toFixed(2)}
            prefix="₹"
            icon={<ArrowDownOutlined />}
            color="#f5222d"
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard
            title="Profit Margin"
            value={dashboardData.profitMargin.toFixed(1)}
            suffix="%"
            icon={<DollarOutlined />}
            color={dashboardData.profitMargin >= 20 ? "#3f8600" : dashboardData.profitMargin >= 10 ? "#faad14" : "#f5222d"}
            warning={costWarning}
          />
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Large Sales Chart */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <LineChartOutlined />
                <Text strong>Sales & Profit Trend ({dateFilter === 'week' ? 'Last 7 Days' : dateFilter === '2weeks' ? 'Last 14 Days' : 'Last 30 Days'})</Text>
              </Space>
            }
            style={{ height: '420px' }}
          >
            <div style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.profitData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#1890ff"
                    fillOpacity={1} 
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#52c41a"
                    fillOpacity={1} 
                    fill="url(#colorProfit)"
                    name="Profit"
                  />
                </AreaChart>
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
            style={{ height: '420px' }}
          >
            <div style={{ height: '320px' }}>
              {dashboardData.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.topProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {dashboardData.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
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

      {/* Cost Analysis and Recent Orders */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <InfoCircleOutlined />
                <Text strong>Cost Price Analysis</Text>
              </Space>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="With Cost Price"
                  value={dashboardData.costAnalysis.withCost}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Missing Cost Price"
                  value={dashboardData.costAnalysis.withoutCost}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                Products with cost price enable accurate profit calculations. 
                Missing cost prices are estimated at 60% of selling price.
              </Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
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
              size="small"
              locale={{
                emptyText: 'No recent orders'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;