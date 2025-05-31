import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Typography, InputNumber, Popconfirm, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { removeFromCart, updateCartItemQuantity } from '../../features/order/orderSlice';

const { Title, Text } = Typography;

const Cart = () => {
  const dispatch = useDispatch();
  const { cart } = useSelector(state => state.orders);

  const handleQuantityChange = (productId, quantity) => {
    if (quantity > 0) {
      dispatch(updateCartItemQuantity({ productId, quantity }));
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateGST = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'productName',
    },
    {
      title: 'Price',
      dataIndex: ['product', 'price'],
      key: 'price',
      align: 'right',
      render: (price) => `₹${price}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (quantity, record) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleQuantityChange(record.product._id, value)}
        />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      align: 'right',
      render: (_, record) => `₹${record.product.price * record.quantity}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => dispatch(removeFromCart(record.product._id))}
          okText="Yes"
          cancelText="No"
        >
          <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={4}>Cart</Title>

      <Table
        columns={columns}
        dataSource={cart}
        rowKey={(item) => item.product._id}
        pagination={false}
        footer={() => (
          <>
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space direction="vertical">
                <Text strong>Subtotal: ₹{calculateSubtotal().toFixed(2)}</Text>
                <Text>GST (18%): ₹{calculateGST().toFixed(2)}</Text>
                <Title level={5}>Total: ₹{calculateTotal().toFixed(2)}</Title>
              </Space>
            </div>
          </>
        )}
      />
    </div>
  );
};

export default Cart;
