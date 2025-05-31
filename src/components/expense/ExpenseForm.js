import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Row, Col } from 'antd';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import { createExpense, updateExpense } from '../../features/expense/expenseSlice';

const { Option } = Select;

const ExpenseForm = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { selectedExpense } = useSelector(state => state.expenses);

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

  const paymentMethods = [
    'Cash',
    'Bank Transfer',
    'UPI',
    'Credit Card',
    'Debit Card',
    'Cheque'
  ];

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: selectedExpense?.title || '',
      amount: selectedExpense?.amount || 0,
      category: selectedExpense?.category || '',
      date: selectedExpense?.date ? moment(selectedExpense.date.toDate?.() || selectedExpense.date) : moment(),
      paymentMethod: selectedExpense?.paymentMethod || '',
      description: selectedExpense?.description || '',
      receiptNumber: selectedExpense?.receiptNumber || ''
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Required'),
      amount: Yup.number().required('Required').positive('Amount must be positive'),
      category: Yup.string().required('Required'),
      date: Yup.date().required('Required'),
      paymentMethod: Yup.string().required('Required')
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          date: values.date.toDate ? values.date.toDate() : values.date // convert moment to Date if possible
        };

        if (selectedExpense) {
          await dispatch(updateExpense({ id: selectedExpense.id, expenseData: payload }));
        } else {
          await dispatch(createExpense(payload));
        }
        onSuccess();
      } catch (error) {
        console.error('Error saving expense:', error);
      }
    }
  });

  return (
    <Modal
      title={selectedExpense ? 'Edit Expense' : 'Add Expense'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        layout="vertical"
        onFinish={formik.handleSubmit}
        initialValues={{
          title: formik.values.title,
          amount: formik.values.amount,
          category: formik.values.category,
          date: formik.values.date,
          paymentMethod: formik.values.paymentMethod,
          description: formik.values.description,
          receiptNumber: formik.values.receiptNumber
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Title"
              name="title"
              validateStatus={formik.touched.title && formik.errors.title ? 'error' : ''}
              help={formik.touched.title && formik.errors.title}
              rules={[{ required: true, message: 'Please input title' }]}
            >
              <Input
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Amount"
              name="amount"
              validateStatus={formik.touched.amount && formik.errors.amount ? 'error' : ''}
              help={formik.touched.amount && formik.errors.amount}
              rules={[{ required: true, message: 'Please input amount' }]}
            >
              <Input
                name="amount"
                type="number"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Category"
              name="category"
              validateStatus={formik.touched.category && formik.errors.category ? 'error' : ''}
              help={formik.touched.category && formik.errors.category}
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select
                name="category"
                value={formik.values.category}
                onChange={(value) => formik.setFieldValue('category', value)}
                onBlur={formik.handleBlur}
                placeholder="Select category"
              >
                {categories.map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Date"
              name="date"
              validateStatus={formik.touched.date && formik.errors.date ? 'error' : ''}
              help={formik.touched.date && formik.errors.date}
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                value={formik.values.date}
                onChange={(date) => formik.setFieldValue('date', date)}
                onBlur={formik.handleBlur}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="paymentMethod"
              validateStatus={formik.touched.paymentMethod && formik.errors.paymentMethod ? 'error' : ''}
              help={formik.touched.paymentMethod && formik.errors.paymentMethod}
              rules={[{ required: true, message: 'Please select payment method' }]}
            >
              <Select
                name="paymentMethod"
                value={formik.values.paymentMethod}
                onChange={(value) => formik.setFieldValue('paymentMethod', value)}
                onBlur={formik.handleBlur}
                placeholder="Select payment method"
              >
                {paymentMethods.map(method => (
                  <Option key={method} value={method}>{method}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Receipt Number" name="receiptNumber">
              <Input
                name="receiptNumber"
                value={formik.values.receiptNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Description" name="description">
              <Input.TextArea
                rows={4}
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {selectedExpense ? 'Update' : 'Add'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExpenseForm;
