import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Typography,
  Popconfirm,
  Row,
  Col
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';

import {
  fetchExpenses,
  deleteExpense,
  setSelectedExpense,
  getExpenseSummary
} from '../../features/expense/expenseSlice';
import ExpenseForm from './ExpenseForm';
import ExpenseSummary from './ExpenseSummary';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ExpenseList = () => {
  const dispatch = useDispatch();
  const { items: expenses, total } = useSelector(state => state.expenses);

  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  });
  const [openForm, setOpenForm] = useState(false);

  const categories = [
    'Utilities',
    'Rent',
    'Salaries',
    'Maintenance',
    'Supplies',
    'Transportation',
    'Marketing',
    'Insurance',
    'Others'
  ];

  const fetchExpensesData = useCallback(() => {
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
      ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      ...(filters.category && { category: filters.category })
    };
    dispatch(fetchExpenses(params));
    dispatch(getExpenseSummary(params));
  }, [pagination, filters, dispatch]);

  useEffect(() => {
    fetchExpensesData();
  }, [fetchExpensesData]);

  const handleEdit = (expense) => {
    dispatch(setSelectedExpense(expense));
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    await dispatch(deleteExpense(id));
    fetchExpensesData();
  };

  const handleTableChange = (pagination) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize
    });
  };

  const handleFiltersChange = (changedFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...changedFilters
    }));
    setPagination((prev) => ({
      ...prev,
      current: 1
    }));
  };

  const clearFilters = () => {
    setFilters({ startDate: null, endDate: null, category: '' });
    setPagination((prev) => ({
      ...prev,
      current: 1
    }));
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) =>
        moment(date?.toDate?.() || date).format('YYYY-MM-DD'),
      sorter: true
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `₹${amount.toFixed(2)}`,
      sorter: true
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            type="primary"
            size="small"
          />
          <Popconfirm
            title="Are you sure delete this expense?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>Expenses</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() => {
              dispatch(setSelectedExpense(null));
              setOpenForm(true);
            }}
          >
            Add Expense
          </Button>
        </Col>
      </Row>

      <ExpenseSummary />

      <Card style={{ marginTop: 16 }}>
        <Form
          layout="inline"
          style={{ marginBottom: 16, flexWrap: 'wrap', gap: '12px' }}
        >
          <Form.Item label="Date Range">
            <RangePicker
              value={
                filters.startDate && filters.endDate
                  ? [moment(filters.startDate), moment(filters.endDate)]
                  : []
              }
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  handleFiltersChange({
                    startDate: dates[0].toDate(),
                    endDate: dates[1].toDate()
                  });
                } else {
                  handleFiltersChange({ startDate: null, endDate: null });
                }
              }}
            />
          </Form.Item>

          <Form.Item label="Category">
            <Select
              value={filters.category}
              onChange={(value) => handleFiltersChange({ category: value })}
              style={{ width: 160 }}
              allowClear
              placeholder="Select Category"
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '25']
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <ExpenseForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSuccess={() => {
          setOpenForm(false);
          fetchExpensesData();
        }}
      />
    </div>
  );
};

export default ExpenseList;
