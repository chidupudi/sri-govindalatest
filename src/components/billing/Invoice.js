import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Button,
  Table,
  Row,
  Col,
  Card,
  Spin,
  Space,
  Divider
} from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { getOrder } from '../../features/order/orderSlice';
import { jsPDF } from 'jspdf';

const { Title, Text } = Typography;

const Invoice = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, isLoading } = useSelector(state => state.orders);
  const invoiceRef = useRef();

  useEffect(() => {
    dispatch(getOrder(id));
  }, [dispatch, id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!invoiceRef.current) return;
    const doc = new jsPDF();
    doc.html(invoiceRef.current, {
      callback: function (doc) {
        doc.save(`invoice-${currentOrder?.orderNumber || 'invoice'}.pdf`);
      },
      x: 10,
      y: 10,
    });
  };

  if (isLoading || !currentOrder) {
    return <Spin size="large" />;
  }

  const columns = [
    {
      title: 'Item',
      dataIndex: ['product', 'name'],
      key: 'name',
    },
    {
      title: 'Weight (g)',
      dataIndex: 'weight',
      key: 'weight',
      align: 'right',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `₹${price}`,
    },
    {
      title: 'Total',
      key: 'total',
      align: 'right',
      render: (_, record) => `₹${record.price * record.quantity}`,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Title level={3}>Invoice</Title>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            Download PDF
          </Button>
        </Space>
      </Row>

      <Card ref={invoiceRef} bordered>
        <Row justify="space-between" gutter={16}>
          <Col span={12}>
            <Title level={5}>Sri Govinda</Title>
            <Text>Your Shop Address</Text><br />
            <Text>Phone: Your Phone</Text><br />
            <Text>Email: Your Email</Text><br />
            <Text>GST No: Your GST Number</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Text>Invoice No: {currentOrder.orderNumber}</Text><br />
            <Text>Date: {new Date(currentOrder.createdAt).toLocaleDateString()}</Text>
          </Col>
        </Row>

        <Divider />

        <Title level={5}>Customer Details</Title>
        <Text>{currentOrder.customer?.name}</Text><br />
        <Text>{currentOrder.customer?.phone}</Text><br />
        <Text>{currentOrder.customer?.address?.street}</Text><br />
        <Text>
          {currentOrder.customer?.address?.city}, {currentOrder.customer?.address?.state}
        </Text><br />
        {currentOrder.customer?.gstNumber && (
          <Text>GST No: {currentOrder.customer.gstNumber}</Text>
        )}

        <Divider />

        <Table
          columns={columns}
          dataSource={currentOrder.items}
          pagination={false}
          rowKey="_id"
        />

        <Row justify="end" style={{ marginTop: 16 }}>
          <Col span={12}>
            <Row justify="space-between">
              <Col><Text strong>Subtotal:</Text></Col>
              <Col><Text>₹{currentOrder.subtotal}</Text></Col>
            </Row>
            <Row justify="space-between">
              <Col><Text strong>GST (18%):</Text></Col>
              <Col><Text>₹{currentOrder.gst}</Text></Col>
            </Row>
            <Row justify="space-between" style={{ marginTop: 8 }}>
              <Col><Title level={5}>Total:</Title></Col>
              <Col><Title level={5}>₹{currentOrder.total}</Title></Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        <Text>Payment Method: {currentOrder.paymentMethod}</Text>
        <br />
        <Text type="secondary">Thank you for your business!</Text>
      </Card>
    </div>
  );
};

export default Invoice;
