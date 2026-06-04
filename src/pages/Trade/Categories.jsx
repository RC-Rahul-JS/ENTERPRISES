import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Tag, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import useApi from "../../api/useApi";

const CategoryModule = () => {
  const [categories, setCategories] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const {getData,postData}=useApi(  )

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

  // 2. Create or Update Category (Integrated with your logic)
  const handleSubmit = async (e, id = null) => {
    const isEdit = !!id;
    const nameToSubmit = isEdit ? editValue : newCategory;

    if (!nameToSubmit.trim()) return;

    setLoading(true);
    const submissionData = { name: nameToSubmit };

    try {
      // API CALL
      const res = await postData('/trade/categories/add', submissionData);
      console.log(res);
      Swal.fire({
        title: "Successful",
        text: isEdit ? 'Updating Category' : 'Submitting Category Data',
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      if (isEdit) {
        // Update Local State for Edit
        setCategories(prev => prev.map(cat => 
          cat._id === id ? { ...cat, name: editValue } : cat
        ));
        setEditingId(null);
      } else {
        // Update Local State for Create
        const newEntry = { ...submissionData, _id: res._id || Date.now() };
        setCategories(prev => [newEntry, ...prev]);
        setNewCategory('');
        setIsAdding(false);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Category
  const deleteCategory = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }); 

    if (result.isConfirmed) {
      try {
        await postData('/trade/categories/delete', { id }); // Example delete endpoint
        setCategories(categories.filter(cat => cat._id !== id));
        Swal.fire('Deleted!', 'Category has been removed.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete', 'error');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Tag size={20} className="text-blue-500" />
          Categories
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Create Form */}
      {isAdding && (
        <div className="mb-6 flex gap-2 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category name..."
            disabled={loading}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50"
          />
          <button 
            onClick={(e) => handleSubmit(e)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Add
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
            {editingId === category._id ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded outline-none"
                  autoFocus
                />
                <button onClick={() => handleSubmit(null, category._id)} className="text-green-600">
                  <Check size={18} />
                </button>
                <button onClick={() => setEditingId(null)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-slate-700 font-medium">{category.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* <button onClick={() => { setEditingId(category._id); setEditValue(category.name); }} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil size={16} /></button> */}
                  <button onClick={() => deleteCategory(category._id)} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>








      
    </div>
  );
};

export default CategoryModule;