import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Row, Col, Space } from 'antd';
import { Pie } from '@ant-design/charts';

const { Title, Text } = Typography;

const ExpenseSummary = () => {
  const { summary = [] } = useSelector(state => state.expenses);

  const totalExpense = summary.reduce((acc, curr) => acc + curr.total, 0);

  // Prepare data for Pie chart
  const data = summary.map(item => ({
    type: item._id,
    value: item.total,
  }));

  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  return (
    <Card>
      <Title level={4}>Expense Summary</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }}>
            <Title level={2} type="success">
              ₹{totalExpense.toFixed(2)}
            </Title>
            <Text type="secondary">Total Expenses</Text>

            {summary.map(item => (
              <Row
                justify="space-between"
                key={item._id}
                style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}
              >
                <Col>
                  <Text>{item._id}</Text>
                </Col>
                <Col>
                  <Text strong>
                    ₹{item.total.toFixed(2)} (
                    {totalExpense ? ((item.total / totalExpense) * 100).toFixed(1) : 0}%)
                  </Text>
                </Col>
              </Row>
            ))}
          </Space>
        </Col>

        <Col xs={24} md={16}>
          {summary.length > 0 && (
            <Pie {...config} height={300} />
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default ExpenseSummary;
