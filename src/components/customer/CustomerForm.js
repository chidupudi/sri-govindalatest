// src/components/customer/CustomerForm.js - Updated to make phone optional
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, Button, Row, Col, message } from 'antd';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { createCustomer, updateCustomer } from '../../features/customer/customerSlice';

const validationSchema = Yup.object({
  name: Yup.string().required('Customer name is required'),
  email: Yup.string().email('Invalid email address'),
  phone: Yup.string(), // Made optional
  address: Yup.object({
    street: Yup.string(),
    city: Yup.string(),
    state: Yup.string(),
    pincode: Yup.string(),
  }),
  gstNumber: Yup.string(),
});

const CustomerForm = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { selectedCustomer, loading } = useSelector(state => state.customers);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      gstNumber: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        if (selectedCustomer) {
          const result = await dispatch(updateCustomer({ id: selectedCustomer.id, customerData: values }));
          if (updateCustomer.fulfilled.match(result)) {
            message.success('Customer updated successfully!');
            onSuccess();
          }
        } else {
          const result = await dispatch(createCustomer(values));
          if (createCustomer.fulfilled.match(result)) {
            message.success('Customer added successfully!');
            onSuccess();
          }
        }
      } catch (error) {
        message.error('Error saving customer. Please try again.');
        console.error('Error saving customer:', error);
      }
    }
  });

  useEffect(() => {
    if (selectedCustomer) {
      formik.setValues({
        name: selectedCustomer.name || '',
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || '',
        address: selectedCustomer.address || {
          street: '',
          city: '',
          state: '',
          pincode: ''
        },
        gstNumber: selectedCustomer.gstNumber || ''
      });
    } else {
      formik.resetForm();
    }
  }, [selectedCustomer]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Modal
      title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form layout="vertical" onFinish={formik.handleSubmit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Customer Name"
              validateStatus={formik.touched.name && formik.errors.name ? 'error' : ''}
              help={formik.touched.name && formik.errors.name}
              required
            >
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter customer name"
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="Phone Number"
              validateStatus={formik.touched.phone && formik.errors.phone ? 'error' : ''}
              help={formik.touched.phone && formik.errors.phone}
            >
              <Input
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter phone number (optional)"
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="Email Address"
              validateStatus={formik.touched.email && formik.errors.email ? 'error' : ''}
              help={formik.touched.email && formik.errors.email}
            >
              <Input
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter email address (optional)"
              />
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item label="Street Address">
              <Input
                name="address.street"
                value={formik.values.address.street}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter street address"
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item label="City">
              <Input
                name="address.city"
                value={formik.values.address.city}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter city"
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item label="State">
              <Input
                name="address.state"
                value={formik.values.address.state}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter state"
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item label="PIN Code">
              <Input
                name="address.pincode"
                value={formik.values.address.pincode}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter PIN code"
              />
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item label="GST Number">
              <Input
                name="gstNumber"
                value={formik.values.gstNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter GST number (optional)"
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Button onClick={handleClose} disabled={loading} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={loading}
          >
            {selectedCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerForm;