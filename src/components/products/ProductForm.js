import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form, Input, Button, Select, Alert, Row, Col, message } from 'antd';
import { createProduct, updateProduct, fetchProducts } from '../../features/products/productSlice';
import * as Yup from 'yup';
import { useFormik } from 'formik';

const { Option } = Select;
const { TextArea } = Input;

const ProductForm = ({ product, onClose }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validationSchema = Yup.object({
    name: Yup.string().required('Product name is required'),
    category: Yup.string().required('Category is required'),
    price: Yup.number().required('Price is required').positive('Price must be positive'),
    weight: Yup.number().positive('Weight must be positive'),
    costPrice: Yup.number().positive('Cost price must be positive'),
    stock: Yup.number().integer('Stock must be a whole number').min(0, 'Stock cannot be negative')
  });

  const formik = useFormik({
    initialValues: {
      name: product?.name || '',
      category: product?.category || 'German silver',
      price: product?.price || '',
      weight: product?.weight || '',
      costPrice: product?.costPrice || '',
      stock: product?.stock || 1,
      description: product?.description || ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      setSuccess('');
      
      try {
        if (product) {
          const result = await dispatch(updateProduct({ 
            id: product.id, 
            productData: values 
          }));
          
          if (updateProduct.fulfilled.match(result)) {
            message.success('Product updated successfully!');
            setTimeout(() => {
              dispatch(fetchProducts({}));
              onClose();
            }, 1000);
          } else {
            throw new Error(result.payload || 'Failed to update product');
          }
        } else {
          const result = await dispatch(createProduct(values));
          
          if (createProduct.fulfilled.match(result)) {
            message.success('Product created successfully!');
            setTimeout(() => {
              dispatch(fetchProducts({}));
              onClose();
            }, 1000);
          } else {
            throw new Error(result.payload || 'Failed to create product');
          }
        }
      } catch (err) {
        message.error(err.message || 'Failed to save product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Form layout="vertical" onFinish={formik.handleSubmit}>
      {error && (
        <Alert message={error} type="error" style={{ marginBottom: 16 }} />
      )}
      
      {success && (
        <Alert message={success} type="success" style={{ marginBottom: 16 }} />
      )}

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            label="Product Name"
            validateStatus={formik.touched.name && formik.errors.name ? 'error' : ''}
            help={formik.touched.name && formik.errors.name}
          >
            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Form.Item>
        </Col>
        
        <Col span={24}>
          <Form.Item
            label="Category"
            validateStatus={formik.touched.category && formik.errors.category ? 'error' : ''}
            help={formik.touched.category && formik.errors.category}
          >
            <Select
              name="category"
              value={formik.values.category}
              onChange={(value) => formik.setFieldValue('category', value)}
              onBlur={formik.handleBlur}
            >
              <Option value="German silver">German silver</Option>
              <Option value="1g gold">1g gold</Option>
              <Option value="Panchaloha">Panchaloha</Option>
              <Option value="Gifts">Gifts</Option>
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            label="Price (₹)"
            validateStatus={formik.touched.price && formik.errors.price ? 'error' : ''}
            help={formik.touched.price && formik.errors.price}
          >
            <Input
              name="price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            label="Weight (g)"
            validateStatus={formik.touched.weight && formik.errors.weight ? 'error' : ''}
            help={formik.touched.weight && formik.errors.weight}
          >
            <Input
              name="weight"
              type="number"
              value={formik.values.weight}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            label="Cost Price (₹)"
            validateStatus={formik.touched.costPrice && formik.errors.costPrice ? 'error' : ''}
            help={formik.touched.costPrice && formik.errors.costPrice}
          >
            <Input
              name="costPrice"
              type="number"
              value={formik.values.costPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            label="Stock"
            validateStatus={formik.touched.stock && formik.errors.stock ? 'error' : ''}
            help={formik.touched.stock && formik.errors.stock}
          >
            <Input
              name="stock"
              type="number"
              value={formik.values.stock}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Form.Item>
        </Col>
        
        <Col span={24}>
          <Form.Item label="Description">
            <TextArea
              name="description"
              rows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
        <Button onClick={onClose} disabled={loading} style={{ marginRight: 8 }}>
          Cancel
        </Button>
        <Button 
          type="primary" 
          htmlType="submit"
          loading={loading}
        >
          {product ? 'Update' : 'Create'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;