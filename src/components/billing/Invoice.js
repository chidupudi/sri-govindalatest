// src/components/billing/Invoice.js - Complete Enhanced Invoice with Embedded CSS
import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Button,
  Row,
  Col,
  Card,
  Spin,
  Space,
} from 'antd';
import { DownloadOutlined, PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getOrder } from '../../features/order/orderSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title } = Typography;

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
    const WinPrint = window.open('', '', 'width=800,height=600');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Invoice - ${currentOrder?.orderNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0; 
              padding: 15px;
              font-size: 11px;
              line-height: 1.4;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header-section {
              background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #b8860b 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              position: relative;
              overflow: hidden;
              border: 2px solid #d4af37;
            }
            .header-section::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 100%;
              height: 200%;
              background: rgba(255,255,255,0.1);
              transform: rotate(45deg);
            }
            .logo-section {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              position: relative;
              z-index: 2;
            }
            .logo {
              width: 50px;
              height: 50px;
              background: white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .company-name {
              font-size: 24px;
              font-weight: 700;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .company-tagline {
              font-size: 12px;
              opacity: 0.9;
              margin-top: 2px;
            }
            .invoice-title {
              font-size: 16px;
              font-weight: 600;
              margin: 10px 0 5px 0;
              position: relative;
              z-index: 2;
            }
            .invoice-details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              padding: 20px;
              background: #f8fafc;
              border-left: 4px solid #d4af37;
              border-right: 2px solid #f0f0f0;
            }
            .detail-section h4 {
              margin: 0 0 8px 0;
              color: #4a5568;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .detail-value {
              color: #2d3748;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .items-section {
              margin: 0;
            }
            .items-header {
              background: linear-gradient(90deg, #8b4513 0%, #a0522d 100%);
              color: white;
              padding: 12px;
              font-weight: 600;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: grid;
              grid-template-columns: 40px 1fr 60px 80px 90px;
              gap: 10px;
              border-top: 1px solid #d4af37;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-left: 2px solid #f0f0f0;
              border-right: 2px solid #f0f0f0;
            }
            .item-row {
              border-bottom: 1px solid #e2e8f0;
              transition: background-color 0.2s;
            }
            .item-row:hover {
              background-color: #f7fafc;
            }
            .item-row:nth-child(even) {
              background-color: #f8fafc;
            }
            .item-cell {
              padding: 8px 12px;
              font-size: 10px;
              vertical-align: middle;
            }
            .item-name {
              font-weight: 500;
              color: #2d3748;
              margin-bottom: 2px;
            }
            .item-custom-tag {
              background: linear-gradient(135deg, #d4af37, #b8860b);
              color: white;
              padding: 1px 6px;
              border-radius: 10px;
              font-size: 8px;
              font-weight: 500;
              display: inline-block;
              margin-top: 2px;
            }
            .price-original {
              text-decoration: line-through;
              color: #a0aec0;
              font-size: 9px;
              display: block;
            }
            .price-discounted {
              color: #38a169;
              font-weight: 600;
            }
            .totals-section {
              background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
              padding: 20px;
              border-radius: 0 0 8px 8px;
              position: relative;
              border-left: 2px solid #f0f0f0;
              border-right: 2px solid #f0f0f0;
              border-bottom: 2px solid #d4af37;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 11px;
            }
            .totals-label {
              color: #4a5568;
            }
            .totals-value {
              font-weight: 500;
              color: #2d3748;
            }
            .discount-row {
              color: #38a169;
              font-weight: 600;
            }
            .total-final {
              border-top: 2px solid #d4af37;
              padding-top: 12px;
              margin-top: 12px;
              font-size: 14px;
              font-weight: 700;
            }
            .total-final .totals-value {
              color: #d4af37;
              font-size: 16px;
            }
            .payment-info {
              background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
              color: white;
              padding: 12px 20px;
              margin: 15px 0;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .payment-method {
              font-weight: 600;
            }
            .payment-status {
              display: flex;
              align-items: center;
              gap: 5px;
              font-weight: 600;
            }
            .footer-section {
              text-align: center;
              padding: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 10px;
            }
            .thank-you {
              font-size: 12px;
              font-weight: 600;
              color: #4a5568;
              margin-bottom: 5px;
            }
            .page-indicator {
              position: absolute;
              top: 15px;
              right: 20px;
              background: rgba(255,255,255,0.2);
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 10px;
              font-weight: 500;
              z-index: 3;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 60px;
              color: rgba(0,0,0,0.02);
              font-weight: 900;
              pointer-events: none;
              z-index: 1;
            }
            @media print {
              body { margin: 0; font-size: 10px; }
              .no-print { display: none !important; }
              .invoice-container { max-width: none; }
              .page-break { page-break-before: always; }
              .item-row:hover { background-color: transparent; }
            }
            @page {
              margin: 0.5in;
              size: A4;
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
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`invoice-${currentOrder?.orderNumber || 'invoice'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (isLoading || !currentOrder) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Loading invoice..." />
      </div>
    );
  }

  const originalSubtotal = currentOrder.subtotal || 
    currentOrder.items.reduce((sum, item) => sum + ((item.originalPrice || item.price) * item.quantity), 0);
  
  const totalDiscount = currentOrder.discount || 0;
  const finalTotal = currentOrder.total || (originalSubtotal - totalDiscount);

  const itemsPerPage = 12;
  const pages = [];
  for (let i = 0; i < currentOrder.items.length; i += itemsPerPage) {
    pages.push(currentOrder.items.slice(i, i + itemsPerPage));
  }

  const renderPageHeader = (pageNum, totalPages) => (
    <div 
      style={{
        background: 'linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #b8860b 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: pageNum === 1 ? '8px 8px 0 0' : '0',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid #d4af37'
      }}
    >
      {/* Decorative golden pattern */}
      <div 
        style={{
          content: '',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '200%',
          background: 'rgba(255,255,255,0.1)',
          transform: 'rotate(45deg)',
          pointerEvents: 'none'
        }}
      />
      
      {pageNum > 1 && (
        <div 
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            padding: '5px 10px',
            borderRadius: '15px',
            fontSize: '10px',
            fontWeight: '500',
            zIndex: 3
          }}
        >
          Page {pageNum} of {totalPages}
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={{
              width: '50px',
              height: '50px',
              background: 'white',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '15px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '2px solid #d4af37'
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#d4af37' }}>SG</span>
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              Sri Govinda
            </div>
            <div style={{ fontSize: '11px', opacity: '0.9', marginTop: '2px', letterSpacing: '1px' }}>
              ✨ Gold • German Silver • Panchaloha • Gifts ✨
            </div>
          </div>
        </div>
        
        {/* Traditional motif */}
        <div style={{
          fontSize: '30px',
          opacity: '0.3',
          transform: 'rotate(15deg)'
        }}>
          🕉️
        </div>
      </div>
      
      {pageNum === 1 && (
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            margin: '10px 0 5px 0',
            letterSpacing: '2px'
          }}>
            INVOICE
          </div>
          <div style={{ fontSize: '11px', opacity: '0.9' }}>
            #{currentOrder.orderNumber}
          </div>
        </div>
      )}
    </div>
  );

  const renderInvoiceDetails = () => (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        padding: '20px',
        background: '#f8fafc',
        borderLeft: '4px solid #d4af37',
        borderRight: '2px solid #f0f0f0'
      }}
    >
      <div>
        <h4 style={{
          margin: '0 0 8px 0',
          color: '#4a5568',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Invoice Details
        </h4>
        <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
          <strong>Invoice #:</strong> {currentOrder.orderNumber}
        </div>
        <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
          <strong>Date:</strong> {new Date(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
          <strong>Time:</strong> {new Date(currentOrder.createdAt?.toDate?.() || currentOrder.createdAt).toLocaleTimeString('en-IN', { 
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      
      <div>
        <h4 style={{
          margin: '0 0 8px 0',
          color: '#4a5568',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Bill To
        </h4>
        <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
          <strong>{currentOrder.customer?.name || 'Walk-in Customer'}</strong>
        </div>
        {currentOrder.customer?.phone && (
          <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
            📞 {currentOrder.customer.phone}
          </div>
        )}
        {currentOrder.customer?.email && (
          <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
            ✉️ {currentOrder.customer.email}
          </div>
        )}
        <div style={{ color: '#2d3748', marginBottom: '4px', fontSize: '11px' }}>
          📍 Hyderabad, Telangana
        </div>
      </div>
    </div>
  );

  const renderItemsTable = (items, isFirstPage = true) => (
    <div style={{ margin: 0 }}>
      {isFirstPage && (
        <div 
          style={{
            background: 'linear-gradient(90deg, #8b4513 0%, #a0522d 100%)',
            color: 'white',
            padding: '12px',
            fontWeight: '600',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'grid',
            gridTemplateColumns: '40px 1fr 60px 80px 90px',
            gap: '10px',
            borderTop: '1px solid #d4af37'
          }}
        >
          <div>#</div>
          <div>Product Details</div>
          <div style={{ textAlign: 'center' }}>Qty</div>
          <div style={{ textAlign: 'right' }}>Unit Price</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
        </div>
      )}
      
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        background: 'white',
        borderLeft: '2px solid #f0f0f0',
        borderRight: '2px solid #f0f0f0'
      }}>
        <tbody>
          {items.map((item, index) => {
            const globalIndex = pages.flat().indexOf(item) + 1;
            const hasDiscount = item.originalPrice && item.originalPrice !== item.price;
            const originalAmount = item.originalPrice ? item.originalPrice * item.quantity : item.price * item.quantity;
            const finalAmount = item.price * item.quantity;
            
            return (
              <tr 
                key={`${item.product?.id || item.productId}-${index}`}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white'
                }}
              >
                <td style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '40px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#667eea'
                }}>
                  {globalIndex}
                </td>
                <td style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '40%'
                }}>
                  <div style={{
                    fontWeight: '500',
                    color: '#2d3748',
                    marginBottom: '2px'
                  }}>
                    {item.product?.name || 'Unknown Product'}
                  </div>
                  {item.product?.category && (
                    <div style={{ fontSize: '9px', color: '#718096' }}>
                      {item.product.category}
                    </div>
                  )}
                  {item.product?.isDynamic && (
                    <span style={{
                      background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                      color: 'white',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '8px',
                      fontWeight: '500',
                      display: 'inline-block',
                      marginTop: '2px'
                    }}>
                      Custom Item
                    </span>
                  )}
                  {/* Add category-specific emoji */}
                  {item.product?.category && (
                    <span style={{ 
                      fontSize: '8px', 
                      marginLeft: '4px',
                      opacity: '0.7'
                    }}>
                      {item.product.category.toLowerCase().includes('gold') ? '🥇' :
                       item.product.category.toLowerCase().includes('german') ? '🥈' :
                       item.product.category.toLowerCase().includes('panchaloha') ? '🕉️' :
                       item.product.category.toLowerCase().includes('gift') ? '🎁' : '✨'}
                    </span>
                  )}
                </td>
                <td style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '60px',
                  textAlign: 'center',
                  fontWeight: '600'
                }}>
                  {item.quantity}
                </td>
                <td style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '80px',
                  textAlign: 'right'
                }}>
                  {hasDiscount ? (
                    <div>
                      <span style={{
                        textDecoration: 'line-through',
                        color: '#a0aec0',
                        fontSize: '9px',
                        display: 'block'
                      }}>
                        ₹{item.originalPrice}
                      </span>
                      <span style={{ color: '#38a169', fontWeight: '600' }}>
                        ₹{item.price}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontWeight: '500' }}>₹{item.price}</div>
                  )}
                </td>
                <td style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  verticalAlign: 'middle',
                  width: '90px',
                  textAlign: 'right'
                }}>
                  {hasDiscount ? (
                    <div>
                      <span style={{
                        textDecoration: 'line-through',
                        color: '#a0aec0',
                        fontSize: '9px',
                        display: 'block'
                      }}>
                        ₹{originalAmount.toFixed(2)}
                      </span>
                      <span style={{ color: '#38a169', fontWeight: '600' }}>
                        ₹{finalAmount.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontWeight: '600', color: '#2d3748' }}>
                      ₹{finalAmount.toFixed(2)}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTotalsSection = () => (
    <div 
      style={{
        background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
        padding: '20px',
        borderRadius: '0 0 8px 8px',
        position: 'relative',
        borderLeft: '2px solid #f0f0f0',
        borderRight: '2px solid #f0f0f0',
        borderBottom: '2px solid #d4af37'
      }}
    >
      {/* Watermark */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '60px',
          color: 'rgba(0,0,0,0.02)',
          fontWeight: '900',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        PAID
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '11px'
      }}>
        <span style={{ color: '#4a5568' }}>
          Subtotal ({currentOrder.items.length} items):
        </span>
        <span style={{ fontWeight: '500', color: '#2d3748' }}>
          ₹{originalSubtotal.toFixed(2)}
        </span>
      </div>
      
      {totalDiscount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '11px',
          color: '#38a169',
          fontWeight: '600'
        }}>
          <span>💰 Discount Applied:</span>
          <span>-₹{totalDiscount.toFixed(2)}</span>
        </div>
      )}
      
      <div style={{
        borderTop: '2px solid #667eea',
        paddingTop: '12px',
        marginTop: '12px',
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: '#4a5568' }}>Total Amount:</span>
        <span style={{ color: '#d4af37', fontSize: '16px' }}>
          ₹{finalTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );

  const renderPaymentInfo = () => (
    <div 
      style={{
        background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
        color: 'white',
        padding: '12px 20px',
        margin: '15px 0',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ fontWeight: '600' }}>
        💳 Payment Method: {currentOrder.paymentMethod || 'Cash'}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontWeight: '600'
      }}>
        <CheckCircleOutlined style={{ fontSize: '14px' }} />
        PAID
      </div>
    </div>
  );

  const renderFooter = () => (
    <div 
      style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid #e2e8f0',
        color: '#718096',
        fontSize: '10px'
      }}
    >
      <div style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '5px'
      }}>
        Thank you for choosing Sri Govinda! 🙏
      </div>
      <div>We appreciate your business and look forward to serving you again.</div>
      <div style={{ marginTop: '8px', fontSize: '9px' }}>
        For any queries, contact us at +91 98765 43210 | info@srigovinda.com
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Action Buttons */}
      <Row justify="space-between" style={{ marginBottom: 16 }} className="no-print">
        <Title level={3}>Invoice Preview</Title>
        <Space>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="large">
            Print Invoice
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload} type="primary" size="large">
            Download PDF
          </Button>
        </Space>
      </Row>

      {/* Invoice Content */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div 
          ref={invoiceRef}
          style={{ 
            maxWidth: '800px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            border: '3px solid #d4af37'
          }}
        >
          {pages.map((pageItems, pageIndex) => (
            <div key={pageIndex} style={{ pageBreakBefore: pageIndex > 0 ? 'always' : 'auto' }}>
              {renderPageHeader(pageIndex + 1, pages.length)}
              
              {pageIndex === 0 && renderInvoiceDetails()}
              
              {renderItemsTable(pageItems, pageIndex === 0)}
              
              {pageIndex === pages.length - 1 && (
                <>
                  {renderTotalsSection()}
                  {renderPaymentInfo()}
                  {renderFooter()}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Invoice;