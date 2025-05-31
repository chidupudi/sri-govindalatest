// src/components/billing/Invoice.js - Compact 4.5x6.5 inch invoice
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
  Divider,
  Tag
} from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { getOrder } from '../../features/order/orderSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
    const printContent = invoiceRef.current;
    const WinPrint = window.open('', '', 'width=400,height=600');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Invoice - ${currentOrder?.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 10px;
              font-size: 12px;
            }
            .invoice-container {
              width: 4.5in;
              max-width: 4.5in;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-center: center; }
            .company-header { text-align: center; margin-bottom: 15px; }
            .totals-section { margin-top: 10px; }
            .discount-text { color: #52c41a; }
            .strike { text-decoration: line-through; color: #999; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    
    try {
      // Convert inches to pixels (96 DPI)
      const width = 4.5 * 96; // 432px
      const height = 6.5 * 96; // 624px
      
      const canvas = await html2canvas(invoiceRef.current, {
        width: width,
        height: height,
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with exact dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4.5, 6.5]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 4.5, 6.5);
      pdf.save(`invoice-${currentOrder?.orderNumber || 'invoice'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple PDF generation
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4.5, 6.5]
      });
      
      pdf.setFontSize(10);
      pdf.text('Invoice generated - Please use print option for better formatting', 0.2, 0.5);
      pdf.save(`invoice-${currentOrder?.orderNumber || 'invoice'}.pdf`);
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading invoice..." />
      </div>
    );
  }

  // Calculate all totals (no GST)
  const originalSubtotal = currentOrder.subtotal || 
    currentOrder.items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  
  const totalDiscount = currentOrder.discount || 0;
  const finalTotal = currentOrder.total || (originalSubtotal - totalDiscount);

  const compactColumns = [
    {
      title: '#',
      key: 'sno',
      width: 30,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Item',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 120,
      render: (name, record) => (
        <div style={{ fontSize: '11px' }}>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          {record.product?.isDynamic && (
            <Tag color="blue" size="small" style={{ fontSize: '9px', padding: '0 4px' }}>Custom</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      width: 35,
    },
    {
      title: 'Rate',
      key: 'rate',
      align: 'right',
      width: 60,
      render: (_, record) => {
        const hasDiscount = record.originalPrice && record.originalPrice !== record.price;
        return (
          <div style={{ fontSize: '10px' }}>
            {hasDiscount ? (
              <>
                <div style={{ textDecoration: 'line-through', color: '#999' }}>
                  ₹{record.originalPrice}
                </div>
                <div style={{ fontWeight: 'bold' }}>₹{record.price}</div>
              </>
            ) : (
              <div style={{ fontWeight: 'bold' }}>₹{record.price}</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      align: 'right',
      width: 70,
      render: (_, record) => {
        const originalAmount = record.originalPrice ? record.originalPrice * record.quantity : record.price * record.quantity;
        const finalAmount = record.price * record.quantity;
        const hasDiscount = originalAmount !== finalAmount;
        
        return (
          <div style={{ fontSize: '10px' }}>
            {hasDiscount ? (
              <>
                <div style={{ textDecoration: 'line-through', color: '#999' }}>
                  ₹{originalAmount.toFixed(2)}
                </div>
                <div style={{ fontWeight: 'bold' }}>₹{finalAmount.toFixed(2)}</div>
              </>
            ) : (
              <div style={{ fontWeight: 'bold' }}>₹{finalAmount.toFixed(2)}</div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Action Buttons */}
      <Row justify="space-between" style={{ marginBottom: 16 }} className="no-print">
        <Title level={3}>Invoice</Title>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload} type="primary">
            Download PDF
          </Button>
        </Space>
      </Row>

      {/* Invoice Content - Exact 4.5x6.5 inch size */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div 
          ref={invoiceRef}
          className="invoice-container"
          style={{ 
            width: '432px', // 4.5 inches at 96 DPI
            height: '624px', // 6.5 inches at 96 DPI
            backgroundColor: 'white',
            padding: '12px',
            border: '1px solid #ddd',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            lineHeight: '1.2',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff', margin: 0 }}>
              Sri Govinda
            </div>
            <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
              123 Business Street, Hyderabad - 500001<br />
              Ph: +91 98765 43210 | Email: info@srigovinda.com
            </div>
          </div>

          {/* Invoice Details */}
          <Row justify="space-between" style={{ marginBottom: '10px' }}>
            <Col>
              <div style={{ fontSize: '10px' }}>
                <strong>Invoice: {currentOrder.orderNumber}</strong><br />
                Date: {new Date(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).toLocaleDateString('en-IN')}<br />
                Time: {new Date(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).toLocaleTimeString('en-IN', { hour12: true })}
              </div>
            </Col>
            <Col>
              <div style={{ fontSize: '10px', textAlign: 'right' }}>
                <strong>Bill To:</strong><br />
                {currentOrder.customer?.name || 'Walk-in Customer'}<br />
                {currentOrder.customer?.phone && `Ph: ${currentOrder.customer.phone}`}
              </div>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0' }} />

          {/* Items Table */}
          <Table
            columns={compactColumns}
            dataSource={currentOrder.items}
            pagination={false}
            rowKey={(item, index) => `${item.product?.id || item.productId}-${index}`}
            bordered
            size="small"
            style={{ 
              marginBottom: '10px',
              fontSize: '10px'
            }}
            showHeader={true}
          />

          {/* Totals Section */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '10px'
          }}>
            <Row justify="space-between" style={{ marginBottom: '3px' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 'bold' }}>₹{originalSubtotal.toFixed(2)}</span>
            </Row>
            
            {totalDiscount > 0 && (
              <Row justify="space-between" style={{ marginBottom: '3px' }}>
                <span>Discount:</span>
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>-₹{totalDiscount.toFixed(2)}</span>
              </Row>
            )}
            
            <div style={{ borderTop: '1px solid #ddd', paddingTop: '5px', marginTop: '5px' }}>
              <Row justify="space-between">
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Total Amount:</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1890ff' }}>
                  ₹{finalTotal.toFixed(2)}
                </span>
              </Row>
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ marginTop: '8px', fontSize: '9px', textAlign: 'center' }}>
            <div style={{ marginBottom: '5px' }}>
              <strong>Payment Method:</strong> {currentOrder.paymentMethod} | <strong>Status:</strong> <span style={{ color: '#52c41a' }}>PAID</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            position: 'absolute', 
            bottom: '12px', 
            left: '12px', 
            right: '12px',
            textAlign: 'center', 
            fontSize: '8px', 
            color: '#666',
            borderTop: '1px solid #eee',
            paddingTop: '5px'
          }}>
            <div style={{ marginBottom: '2px' }}>Thank you for your business!</div>
            <div>Visit us again at Sri Govinda</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;