import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Package,
  Edit,
  PlusCircle,
  Loader,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { BASE_URL } from '../../config/api';
const toast = {
  success: (msg) =>
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    }),
  error: (msg) =>
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    }),
  dismiss: () => Swal.close(),
};

const LoanProducts = () => {

  // Form State
  const [productType, setProductType] = useState('Group');
  const [productName, setProductName] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  // Data & List State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editType, setEditType] = useState('Group');
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [updating, setUpdating] = useState(false);

  // Fetch Loan Products List
  const fetchLoanProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${localprimeBase}/loan-products`);
      console.log('=== [LOAN PRODUCTS] FETCH RESPONSE ===', res.data);

      let rawList = [];
      if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data?.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res.data?.products)) {
        rawList = res.data.products;
      } else if (Array.isArray(res.data?.loan_products)) {
        rawList = res.data.loan_products;
      } else if (res.data && typeof res.data === 'object') {
        const arr = Object.values(res.data).find((val) => Array.isArray(val));
        if (arr) rawList = arr;
        else rawList = [res.data];
      }

      const normalized = rawList.map((item, idx) => {
        const id =
          item._id ||
          item.loan_id ||
          item.loanId ||
          item.product_id ||
          item.productId ||
          item.id ||
          `LP-${100 + idx}`;
        const name =
          item.productName ||
          item.product_name ||
          item.loanName ||
          item.loan_name ||
          item.name ||
          item.title ||
          'Unnamed Product';
        const type =
          item.productType ||
          item.product_type ||
          item.type ||
          item.category ||
          'Group';
        const rawStat =
          item.status || item.Status || item.is_active || 'Active';
        const statStr = String(rawStat).toLowerCase().trim();
        const finalStatus =
          statStr === 'inactive' || statStr === '0' || statStr === 'false'
            ? 'Inactive'
            : 'Active';

        return {
          raw: item,
          id,
          _id: item._id || id,
          loan_id: item.loan_id || item.loanId || item._id || id,
          product_id: item.product_id || item.productId || item._id || id,
          productName: name,
          loanName: name,
          productType: type,
          status: finalStatus,
        };
      });

      setProducts(normalized);
    } catch (error) {
      console.error('Error fetching loan products:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to fetch loan products list'
      );
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanProducts();
  }, []);

  // Create Loan Product
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!productType || productType === '--Select--') {
      toast.error('Please select Product Type');
      return;
    }
    if (!productName.trim()) {
      toast.error('Please enter Product Name');
      return;
    }
    if (!status || status === '--Select--') {
      toast.error('Please select Status');
      return;
    }

    setSubmitting(true);

    const payload = {
      productType,
      product_type: productType,
      type: productType,
      productName: productName.trim(),
      product_name: productName.trim(),
      loanName: productName.trim(),
      name: productName.trim(),
      status,
      Status: status,
      is_active: status === 'Active' ? '1' : '0',
    };

    console.log('=== [CREATE LOAN PRODUCT] PAYLOAD ===', payload);

    try {
      const res = await axios.post(`${localprimeBase}/loan-products`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('=== [CREATE LOAN PRODUCT] SUCCESS ===', res.data);
      toast.success(res.data?.message || 'Loan product created successfully!');
      setProductName('');
      setStatus('Active');
      setProductType('Group');
      fetchLoanProducts();
    } catch (err) {
      console.error('JSON error, trying FormData fallback:', err);
      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          fd.append(key, payload[key] || '');
        });
        const res2 = await axios.post(`${localprimeBase}/loan-products`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('=== [CREATE LOAN PRODUCT] FORMDATA SUCCESS ===', res2.data);
        toast.success(res2.data?.message || 'Loan product created successfully!');
        setProductName('');
        setStatus('Active');
        setProductType('Group');
        fetchLoanProducts();
      } catch (err2) {
        console.error('Create product error:', err2);
        toast.error(
          err2?.response?.data?.message ||
            err2?.response?.data?.error ||
            'Failed to create loan product.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingProduct(item);
    setEditType(item.productType || 'Group');
    setEditName(item.productName || '');
    setEditStatus(item.status || 'Active');
  };

  // Update Loan Product
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editName.trim()) {
      toast.error('Product Name cannot be empty');
      return;
    }

    setUpdating(true);

    const targetId =
      editingProduct._id ||
      editingProduct.loan_id ||
      editingProduct.product_id ||
      editingProduct.id;

    const payload = {
      _id: targetId,
      loan_id: targetId,
      product_id: targetId,
      id: targetId,
      productType: editType,
      product_type: editType,
      type: editType,
      productName: editName.trim(),
      product_name: editName.trim(),
      loanName: editName.trim(),
      name: editName.trim(),
      status: editStatus,
      Status: editStatus,
      is_active: editStatus === 'Active' ? '1' : '0',
    };

    console.log('=== [UPDATE LOAN PRODUCT] PAYLOAD ===', payload);

    try {
      const res = await axios.post(
        `${localprimeBase}/loan-products/${targetId}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('=== [UPDATE LOAN PRODUCT] SUCCESS ===', res.data);
      toast.success(res.data?.message || 'Loan product updated successfully!');
      setEditingProduct(null);
      fetchLoanProducts();
    } catch (err) {
      console.error('Update JSON error, trying FormData fallback:', err);
      try {
        const fd = new FormData();
        Object.keys(payload).forEach((key) => {
          fd.append(key, payload[key] || '');
        });
        const res2 = await axios.post(
          `${localprimeBase}/loan-products/${targetId}`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        console.log('=== [UPDATE LOAN PRODUCT] FORMDATA SUCCESS ===', res2.data);
        toast.success(res2.data?.message || 'Loan product updated successfully!');
        setEditingProduct(null);
        fetchLoanProducts();
      } catch (err2) {
        console.error('Update product error:', err2);
        toast.error(
          err2?.response?.data?.message ||
            err2?.response?.data?.error ||
            'Failed to update loan product.'
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  // Filter Search
  const filteredProducts = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    return (
      String(p.productName || '').toLowerCase().includes(s) ||
      String(p.productType || '').toLowerCase().includes(s) ||
      String(p.status || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-slate-50 min-h-screen">
      {/* Top Banner Header */}
      <div className="bg-[#3B3C6E] text-white px-4 py-2.5 rounded-t-lg shadow-sm font-semibold text-xs sm:text-sm uppercase tracking-wider mb-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-200" />
          <span>CREATE LOAN PRODUCT</span>
        </div>
        <button
          onClick={fetchLoanProducts}
          className="hover:bg-white/10 p-1 rounded transition text-xs flex items-center gap-1"
          title="Refresh List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Creation Form Bar */}
      <div className="bg-white border-x border-b border-gray-200 p-4 sm:p-6 shadow-sm mb-6 rounded-b-lg">
        <form
          onSubmit={handleCreate}
          className="flex flex-wrap items-end gap-4 sm:gap-6"
        >
          {/* Select Product Type */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select Product Type
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            >
              <option value="--Select--">--Select--</option>
              <option value="Group">Group</option>
              <option value="Loan">Loan</option>
              <option value="Limit">Limit</option>
            </select>
          </div>

          {/* Product Name */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter Product Name"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              required
            />
          </div>

          {/* Status */}
          <div className="w-36 sm:w-44">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            >
              <option value="--Select--">--Select--</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Create Button */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#2D336B] hover:bg-[#222754] text-white font-bold rounded-md text-xs sm:text-sm transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Table Header Controls */}
      <div className="bg-white rounded-t-lg border border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
          Loan Product Directory
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
            {filteredProducts.length} Products
          </span>
        </h2>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white border-x border-b border-gray-200 rounded-b-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#3B3C6E] text-white text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 w-16 text-center border-r border-indigo-900/50">
                  S.no.
                </th>
                <th className="py-3 px-4 border-r border-indigo-900/50">
                  Product Name
                </th>
                <th className="py-3 px-4 border-r border-indigo-900/50">
                  Product Type
                </th>
                <th className="py-3 px-4 border-r border-indigo-900/50 text-center">
                  Status
                </th>
                <th className="py-3 px-4 w-20 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Loading loan products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No loan products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className={
                      index % 2 === 0
                        ? 'bg-white hover:bg-slate-50 transition'
                        : 'bg-[#EAFBFB]/60 hover:bg-[#DDF6F6] transition'
                    }
                  >
                    {/* S.no. */}
                    <td className="py-3 px-4 font-semibold text-gray-700 text-center border-r border-gray-100">
                      {index + 1}
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-4 font-bold text-gray-800 border-r border-gray-100">
                      {item.productName}
                    </td>

                    {/* Product Type */}
                    <td className="py-3 px-4 text-gray-600 border-r border-gray-100 font-medium">
                      {item.productType}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center border-r border-gray-100">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {item.status === 'Active' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-gray-500" />
                        )}
                        {item.status}
                      </span>
                    </td>

                    {/* Edit Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded transition"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Loan Product
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="--Select--">--Select--</option>
                  <option value="Group">Group</option>
                  <option value="Loan">Loan</option>
                  <option value="Limit">Limit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-md text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-[#2D336B] hover:bg-[#222754] text-white font-bold rounded-md text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanProducts;
