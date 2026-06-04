import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Package, Code, Tag, Percent, DollarSign, Loader2, CheckCircle, XCircle, List, Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import useApi from "../../api/useApi";
import Swal from 'sweetalert2';
import CameraScanner from './CameraScanner';
import { MdScanner } from 'react-icons/md';
// Mock list of categories for the dropdown


const initialFormData = {
    productName: '',
    type: 'billable',
    hsnCode: '',
    price: '',
    category: 'Beds',
    gstPercentage: '', // New field for total GST
    barcode: '', // New field for total GST
    warranty: '', // New field for warranty period
};

/**
 * Reusable Input Field Component
 */
const InputField = ({ id, label, type = 'text', icon: Icon, value, onChange, isRequired = true, readOnly = false,category=[] }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 flex items-center">
            {Icon && <Icon className="w-4 h-4 mr-2 text-indigo-500" />}
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        {type === 'select' ? (
            <select
                id={id}
                name={id}
                value={value}
                onChange={onChange}
                required={isRequired}
                readOnly={readOnly}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm appearance-none ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
                {category.map((option) => (
                    <option key={option.name} value={option.name}>
                        {option.name}
                    </option>
                ))}
            </select>
        ) : (
            <input
                onWheel={(e) => e.target.blur()}
                id={id}
                name={id}
                type={type}
                value={value}
                onChange={onChange}
                required={isRequired}
                readOnly={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                {...(type === 'number' && { min: "0", step: "0.01" })}
            />
        )}
    </div>
);

/**
 * Reusable Display Field Component for Calculated Values
 */
const DisplayField = ({ label, icon: Icon, value, unit = '' }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 flex items-center">
            {Icon && <Icon className="w-4 h-4 mr-2 text-green-600" />}
            {label}
        </label>
        <div className="w-full px-4 py-2 border border-green-300 bg-green-50 text-green-800 rounded-lg shadow-sm font-semibold">
            {value} {unit}
        </div>
    </div>
);

const App = () => {
    const {getData,postData}= useApi()
    const [formData, setFormData] = useState(initialFormData);
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [products, setProducts] = useState([]); // State to hold the list of added products
    const [editingProduct, setEditingProduct] = useState(null); // Holds the ID of the product being edited
    const [categories,setCategories] = useState([])
    const [isCameraOpen, setIsCameraOpen] = useState(false);
      // 1. Fetch Categories on Load
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Replace with your actual GET utility if different
      const res = await postData('/trade/categories/get',{});
      console.log(res)
      setCategories(res); 
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
  };

    // Calculate CGST and SGST based on the total GST percentage
    const { cgst, sgst ,igst } = useMemo(() => {
        const totalGST = parseFloat(formData.gstPercentage) || 0;
        const halfGST = (totalGST / 2).toFixed(2);
        return {
            cgst: halfGST,
            sgst: halfGST,
            igst: totalGST.toFixed(2),
        };
    }, [formData.gstPercentage]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        let cleanValue = value;

        // Specific handling for the GST Percentage field to ensure it's a number
        if (name === 'gstPercentage') {
            // Allow only digits and one decimal point
            cleanValue = value.replace(/[^0-9.]/g, '');
        }

        setFormData(prev => ({ ...prev, [name]: cleanValue }));
    }, []);
    
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingProduct(null);
        setStatus('idle');
    }, []);

    const getproduct=async()=>{
        const res=await getData('/trade/products')
        setProducts(res.filter(p=>p.type==='billable'))
    }

    useEffect(() => {
      getproduct()
    }, [])
    

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setStatus('loading');

        // Validation check for all required fields
        if (!formData.productName || !formData.hsnCode || !formData.category || !formData.gstPercentage) {
            setStatus('error');
            console.error("Validation failed. Missing required fields.");
            setTimeout(() => setStatus('idle'), 3000);
            return;
        }

        // Construct final submission data including the calculated GST components
        const submissionData = {
            ...formData,
            cgst: cgst,
            sgst: sgst,
            igst: igst
        };

        // Simulate an API call delay
        console.log(editingProduct ? 'Updating Product Data:' : 'Submitting Product Data:', submissionData);


         


        // await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            if (editingProduct) {
                // Update existing product
                console.log(submissionData)

                const res=await postData('/trade/products',submissionData)
         console.log(res)
              Swal.fire({
                title: "Successful",
                text: 'Submitting Product Data',
                icon: "success",
                timer:2000
              });



                setProducts(prevProducts => prevProducts.map(p => 
                    p._id === editingProduct 
                        ? { ...submissionData, _id: editingProduct }
                        : p
                ));
                setStatus('success');
            } else {

                const res=await postData('/trade/products',submissionData)
         console.log(res)
              Swal.fire({
                title: "Successful",
                text: 'Submitting Product Data',
                icon: "success",
                timer:2000
              });
                // Add new product
                const newProduct = { ...submissionData, id: Date.now() }; // Unique ID for new product
                setProducts(prev => [newProduct, ...prev]); 
                setStatus('success');
            }
            
            resetForm(); // Clear form on success
            
        } catch (error) {
            setStatus('error');
            console.error('Submission failed:', error);
        } finally {
            // Reset status after a few seconds
            setTimeout(() => setStatus('idle'), 4000);
        }
    }, [formData, cgst, sgst, editingProduct, resetForm]);

    const handleEdit = useCallback((product) => {
        setEditingProduct(product._id);
        setFormData({
            productName: product.productName,
            hsnCode: product.hsnCode,
            category: product.category,
            gstPercentage: product.gstPercentage,
                price: product.price,
            _id: product._id,
            barcode: product.barcode || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top form
    }, []);


    const StatusMessage = () => {
        if (status === 'success') {
            return (
                <div className="p-4 mb-6 text-sm text-green-800 rounded-lg bg-green-50 flex items-center transition duration-300 ease-in-out">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {editingProduct ? 'Product updated successfully!' : 'Product added successfully!'}
                </div>
            );
        }
        if (status === 'error') {
            return (
                <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 flex items-center transition duration-300 ease-in-out">
                    <XCircle className="w-5 h-5 mr-2" />
                    Failed to process product. Please fill out all required fields.
                </div>
            );
        }
        return null;
    };

    const formTitle = editingProduct ? 'Edit Existing Product' : 'Add New Product';


    const [product, setProduct] = useState({ name: '', price: '', barcode: '' });

  const handleCameraScan = (barcode) => {
    // Populate form and instantly shut down camera
    // setProduct((prev) => ({ ...prev, barcode }));
    setFormData(prev => ({ ...prev, barcode })); // Update form data with scanned barcode
    setIsCameraOpen(false); 
  };


    return (
        <div className="min-h-screen p-4 bg-gray-50 flex items-start justify-center font-[Inter]">
            <div className=" w-full bg-white shadow-2xl rounded-xl p-6 sm:p-8 lg:p-10 border border-gray-100 mt-8 mb-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
                        {editingProduct ? <Pencil className="w-7 h-7 mr-3 text-indigo-600" /> : <Package className="w-7 h-7 mr-3 text-indigo-600" />}
                        {formTitle}
                    </h1>
                    <p className="mt-1 text-gray-500">
                        {editingProduct ? 'Modify the product details and tax information below.' : 'Enter the core product details and tax information.'}
                    </p>
                </header>

                <StatusMessage />

                <form onSubmit={handleSubmit} className="space-y-6 pb-8 border-b border-gray-200">
                    {/* General Information Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            id="productName"
                            label="Product Name"
                            icon={Package}
                            value={formData.productName}
                            onChange={handleChange}
                        />

                        <InputField
                            id="hsnCode"
                            label="HSN Code (Required)"
                            icon={Code}
                            value={formData.hsnCode}
                            onChange={handleChange}
                            isRequired={true}
                        />

                        <InputField
                            id="category"
                            label="Product Category"
                            icon={Tag}
                            type="select"
                            value={formData.category}
                            onChange={handleChange}
                            category={categories}
                        />
                         <InputField
                            id="price"
                            label="Product Price"
                            icon={Tag}
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                        />
                         <InputField
                            id="warranty"
                            label="Warranty Period (months)"
                            icon={Tag}
                            type="number"
                            value={formData.warranty}
                            onChange={handleChange}
                        />

                        <InputField
                            id="gstPercentage"
                            label="Total GST Percentage"
                            icon={Percent}
                            type="number"
                            value={formData.gstPercentage}
                            onChange={handleChange}
                            isRequired={true}
                        />
                        <div style={{ marginBottom: '15px' }} className="space-y-2">
                        <label className="block text-sm  font-medium text-gray-700 flex items-center">
                           <MdScanner className="w-4 h-4 mr-2 text-indigo-500" />
                            
                            Barcode:</label>
                
                        <div style={{ display: 'flex', gap: '8px' }}  >
                            <input 
                            type="text" 
                            value={formData.barcode} 
                            onChange={handleChange}
                            placeholder="Scan or type code"
                            style={{ flex: 1, padding: '8px' }}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm`}
                            />
                            <button 
                            type="button" 
                            onClick={() => setIsCameraOpen(true)}
                            style={{ padding: '8px', cursor: 'pointer' }}
                            className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 shadow-sm`}

                            >
                            📷 Scan
                            </button>
                        </div>
                        </div>

                        {isCameraOpen && (
                        <CameraScanner 
                            onScanSuccess={handleCameraScan} 
                            onClose={() => setIsCameraOpen(false)} 
                        />
                        )}

                        {/* <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block' }}>Product Name:</label>
                        <input 
                            type="text" 
                            value={product.name} 
                            onChange={(e) => setProduct({...product, name: e.target.value})}
                            style={{ width: '100%', padding: '8px' }}
                        />
                        </div> */}
                    </div>

                    {/* GST Calculation Section */}
                    <h2 className="text-xl font-semibold text-gray-800 pt-4 border-t border-gray-100 mt-6">
                        Tax Breakdown (Calculated)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DisplayField
                            label="CGST (Central GST)"
                            icon={DollarSign}
                            value={cgst}
                            unit="%"
                        />
                        <DisplayField
                            label="SGST (State GST)"
                            icon={DollarSign}
                            value={sgst}
                            unit="%"
                        />
                        <DisplayField
                            label="IGST"
                            icon={DollarSign}
                            value={igst}
                            unit="%"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end space-x-4">
                        {editingProduct && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition duration-300 ease-in-out"
                            >
                                <RefreshCcw className="w-5 h-5 mr-2" />
                                Cancel Edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className={`
                                w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md
                                text-white transition duration-300 ease-in-out
                                ${status === 'loading'
                                    ? 'bg-indigo-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                }
                            `}
                        >
                            {status === 'loading' ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : editingProduct ? (
                                <Pencil className="w-5 h-5 mr-2" />
                            ) : (
                                <Package className="w-5 h-5 mr-2" />
                            )}
                            {status === 'loading' ? 'Processing...' : (editingProduct ? 'Update Product' : 'Add Product')}
                        </button>
                    </div>
                </form>

                {/* Product List Section */}
                <div className="mt-8 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <List className="w-6 h-6 mr-2 text-indigo-600" />
                        Added Products ({products.length})
                    </h2>
                    
                    {products.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 border border-dashed rounded-lg">
                            No products added yet. Use the form above to add your first item!
                        </div>
                    ) : (
                        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        {['Product Name', 'HSN Code', 'Category', 'Total GST %',
                                        //  'CGST %', 'SGST %',
                                          'Action'].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.productName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.hsnCode}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.category}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">{product.gstPercentage}%</td>
                                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{product.cgst}%</td> */}
                                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{product.sgst}%</td> */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
                                                >
                                                    <Pencil className="w-4 h-4 mr-1" />
                                                    Edit
                                                </button>
                                                {/* <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Remove
                                                </button> */}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;