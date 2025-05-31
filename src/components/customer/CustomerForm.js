import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, Button, Row, Col } from 'antd';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { createCustomer, updateCustomer } from '../../features/customer/customerSlice';

const validationSchema = Yup.object({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Invalid email address'),
  phone: Yup.string().required('Required'),
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
  const { selectedCustomer } = useSelector(state => state.customers);

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
          await dispatch(updateCustomer({ id: selectedCustomer.id, customerData: values }));
        } else {
          await dispatch(createCustomer(values));
        }
        onSuccess();
      } catch (error) {
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

  return (
    <Modal
      title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
      visible={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form layout="vertical" onFinish={formik.handleSubmit}>
        <Form.Item label="Name" required>
          <Input name="name" value={formik.values.name} onChange={formik.handleChange} />
        </Form.Item>
        <Form.Item label="Email">
          <Input name="email" value={formik.values.email} onChange={formik.handleChange} />
        </Form.Item>
        <Form.Item label="Phone" required>
          <Input name="phone" value={formik.values.phone} onChange={formik.handleChange} />
        </Form.Item>
        {/* Address fields */}
        <Form.Item label="GST Number">
          <Input name="gstNumber" value={formik.values.gstNumber} onChange={formik.handleChange} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerForm;
