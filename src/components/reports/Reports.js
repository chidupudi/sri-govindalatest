// src/components/reports/Reports.js
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Row, 
  Col, 
  Card, 
  Typography, 
  Button, 
  DatePicker, 
  Space, 
  Statistic, 
  Divider, 
  Alert, 
  Spin,
  message
} from 'antd';
import {
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  WarningOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MoneyCollectOutlined
} from '@ant-design/icons';
import { 
  generateSalesReport,
  generateInventoryReport,
  generateCustomerReport,
  generateExpenseReport,
  generateProfitLossReport,
  clearReport
} from '../../features/reports/reportSlice';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => {
  return (
    <Card>
      <Statistic
        title={title}
        value={value}
        prefix={<Icon style={{ color }} />}
        suffix={change && (
          <span style={{ color, fontSize: 14 }}>
            {changeType === 'increase' ? <RiseOutlined /> : <FallOutlined />}
            {change}
          </span>
        )}
      />
    </Card>
  );
};

const Reports = () => {
  const dispatch = useDispatch();
  const { reportData, loading, error, reportType } = useSelector(state => state.reports);

  const [dates, setDates] = useState([
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
    new Date()
  ]);
  const [activeReport, setActiveReport] = useState('sales');

  const loadReport = useCallback(() => {
    const [startDate, endDate] = dates;
    const params = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    dispatch(clearReport());

    switch (activeReport) {
      case 'sales':
        dispatch(generateSalesReport(params));
        break;
      case 'inventory':
        dispatch(generateInventoryReport());
        break;
      case 'customers':
        dispatch(generateCustomerReport(params));
        break;
      case 'expenses':
        dispatch(generateExpenseReport(params));
        break;
      case 'profit-loss':
        dispatch(generateProfitLossReport(params));
        break;
      default:
        break;
    }
  }, [dispatch, activeReport, dates]);

  useEffect(() => {
    loadReport();
  }, [activeReport, loadReport]);

  const onDateChange = (datesValue) => {
    if (!datesValue || datesValue.length !== 2) return;
    setDates([datesValue[0].toDate(), datesValue[1].toDate()]);
  };

  useEffect(() => {
    loadReport();
  }, [dates, loadReport]);

  const reportButtons = [
    { key: 'sales', label: 'Sales Report', icon: RiseOutlined, color: '#1890ff' },
    { key: 'inventory', label: 'Inventory Report', icon: AppstoreOutlined, color: '#722ed1' },
    { key: 'customers', label: 'Customer Report', icon: UserOutlined, color: '#13c2c2' },
    { key: 'expenses', label: 'Expense Report', icon: BankOutlined, color: '#faad14' },
    { key: 'profit-loss', label: 'Profit & Loss', icon: BarChartOutlined, color: '#52c41a' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  // --- Sales Report ---
  const renderSalesReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No sales data available for the selected period</Text>;
    }

    const totalSales = reportData.reduce((sum, item) => sum + item.totalSales, 0);
    const totalOrders = reportData.reduce((sum, item) => sum + item.orderCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Sales"
              value={`₹${totalSales.toLocaleString()}`}
              change="+12.5%"
              changeType="increase"
              icon={DollarOutlined}
              color="#52c41a"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Total Orders"
              value={totalOrders.toLocaleString()}
              change="+8.3%"
              changeType="increase"
              icon={ShoppingOutlined}
              color="#1890ff"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Avg Order Value"
              value={`₹${avgOrderValue.toLocaleString()}`}
              change="+4.1%"
              changeType="increase"
              icon={RiseOutlined}
              color="#13c2c2"
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Sales Trend Over Time</Title>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={reportData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Area type="monotone" dataKey="totalSales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // --- Inventory Report ---
  const renderInventoryReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No inventory data available</Text>;
    }

    const totalValue = reportData.reduce((sum, item) => sum + item.totalValue, 0);
    const totalItems = reportData.reduce((sum, item) => sum + item.itemCount, 0);
    const lowStockItems = reportData.reduce((sum, item) => sum + item.lowStockItems, 0);

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Inventory Value"
              value={`₹${totalValue.toLocaleString()}`}
              icon={DollarOutlined}
              color="#722ed1"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Total Items"
              value={totalItems.toLocaleString()}
              icon={ShoppingCartOutlined}
              color="#1890ff"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Low Stock Items"
              value={lowStockItems.toString()}
              change={lowStockItems > 0 ? "Attention Required" : "All Good"}
              changeType={lowStockItems > 0 ? "decrease" : "increase"}
              icon={WarningOutlined}
              color={lowStockItems > 0 ? "#fa541c" : "#52c41a"}
            />
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Card>
              <Title level={4}>Inventory by Category</Title>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="itemCount" fill="#722ed1" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Title level={4}>Inventory Distribution</Title>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={reportData}
                    dataKey="totalValue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {reportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  // --- Customer Report ---
  const renderCustomerReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No customer data available for the selected period</Text>;
    }

    const totalCustomers = reportData.totalCustomers || 0;
    const newCustomers = reportData.newCustomers || 0;
    const returningCustomers = reportData.returningCustomers || 0;

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Customers"
              value={totalCustomers}
              icon={TeamOutlined}
              color="#13c2c2"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="New Customers"
              value={newCustomers}
              icon={UserOutlined}
              color="#1890ff"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Returning Customers"
              value={returningCustomers}
              icon={UserOutlined}
              color="#722ed1"
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Customer Growth Over Time</Title>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.customerGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newCustomers" stroke="#13c2c2" />
              <Line type="monotone" dataKey="returningCustomers" stroke="#722ed1" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // --- Expense Report ---
  const renderExpenseReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No expense data available for the selected period</Text>;
    }

    const totalExpenses = reportData.reduce((sum, item) => sum + item.amount, 0);
    const expenseByCategory = reportData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

    const expenseDataForPie = Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount,
    }));

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <StatCard
              title="Total Expenses"
              value={`₹${totalExpenses.toLocaleString()}`}
              icon={MoneyCollectOutlined}
              color="#fa541c"
            />
          </Col>
          <Col span={12}>
            <StatCard
              title="Expense Categories"
              value={Object.keys(expenseByCategory).length}
              icon={BankOutlined}
              color="#fa8c16"
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Expenses by Category</Title>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={expenseDataForPie}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label
              >
                {expenseDataForPie.map((entry, index) => (
                  <Cell key={`cell-expense-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  // --- Profit & Loss Report ---
  const renderProfitLossReport = () => {
    if (!reportData || reportData.length === 0) {
      return <Text type="secondary">No profit & loss data available</Text>;
    }

    const totalRevenue = reportData.totalRevenue || 0;
    const totalCost = reportData.totalCost || 0;
    const profitLoss = totalRevenue - totalCost;

    return (
      <>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <StatCard
              title="Total Revenue"
              value={`₹${totalRevenue.toLocaleString()}`}
              icon={DollarOutlined}
              color="#52c41a"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Total Cost"
              value={`₹${totalCost.toLocaleString()}`}
              icon={MoneyCollectOutlined}
              color="#fa541c"
            />
          </Col>
          <Col span={8}>
            <StatCard
              title="Profit / Loss"
              value={`₹${profitLoss.toLocaleString()}`}
              icon={profitLoss >= 0 ? RiseOutlined : FallOutlined}
              color={profitLoss >= 0 ? '#52c41a' : '#fa541c'}
            />
          </Col>
        </Row>

        <Card>
          <Title level={4}>Revenue vs Cost Over Time</Title>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.overTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#52c41a" />
              <Line type="monotone" dataKey="totalCost" stroke="#fa541c" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </>
    );
  };

  const renderReport = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" tip="Loading report..." />
        </div>
      );
    }
    if (error) {
      message.error(error);
      return <Alert message="Error loading report" type="error" showIcon />;
    }
    switch (activeReport) {
      case 'sales': return renderSalesReport();
      case 'inventory': return renderInventoryReport();
      case 'customers': return renderCustomerReport();
      case 'expenses': return renderExpenseReport();
      case 'profit-loss': return renderProfitLossReport();
      default: return null;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>Reports Dashboard</Title>
      <Space style={{ marginBottom: 16 }} wrap>
        {reportButtons.map(({ key, label, icon: Icon, color }) => (
          <Button
            key={key}
            type={activeReport === key ? 'primary' : 'default'}
            icon={<Icon />}
            onClick={() => setActiveReport(key)}
          >
            {label}
          </Button>
        ))}
      </Space>

      {(activeReport === 'sales' || activeReport === 'customers' || activeReport === 'expenses') && (
        <div style={{ marginBottom: 24 }}>
          <RangePicker
            defaultValue={[dates[0], dates[1]]}
            onChange={onDateChange}
            allowClear={false}
          />
        </div>
      )}

      {renderReport()}
    </div>
  );
};

export default Reports;
