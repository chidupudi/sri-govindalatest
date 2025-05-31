import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Input, Modal, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchCustomers, deleteCustomer, setSelectedCustomer } from '../../features/customer/customerSlice';
import CustomerForm from './CustomerForm'; // you can reuse your existing form or adapt it for antd

const { Search } = Input;

const CustomerList = () => {
  const dispatch = useDispatch();
  const { items: customers, loading } = useSelector(state => state.customers);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers({ search, page, pageSize }));
  }, [dispatch, search, page, pageSize]);

  const handleDelete = (id) => {
    dispatch(deleteCustomer(id)).then(() => {
      dispatch(fetchCustomers({ search, page, pageSize }));
    });
  };

  const handleEdit = (customer) => {
    dispatch(setSelectedCustomer(customer));
    setOpenForm(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'GST Number', dataIndex: 'gstNumber', key: 'gstNumber' },
    { title: 'Total Purchases', dataIndex: 'totalPurchases', key: 'totalPurchases', render: (val) => val || 0 },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Search
          placeholder="Search customers"
          onSearch={value => setSearch(value)}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          dispatch(setSelectedCustomer(null));
          setOpenForm(true);
        }}>
          Add Customer
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          total: customers.length,
          onChange: (page, size) => {
            setPage(page);
            setPageSize(size);
          },
        }}
      />

      <Modal
        visible={openForm}
        footer={null}
        onCancel={() => setOpenForm(false)}
        destroyOnClose
      >
        <CustomerForm
          onClose={() => setOpenForm(false)}
          onSuccess={() => {
            setOpenForm(false);
            dispatch(fetchCustomers({ search, page, pageSize }));
          }}
        />
      </Modal>
    </>
  );
};

export default CustomerList;
