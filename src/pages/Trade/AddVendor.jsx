import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Trash2, Edit, ChevronLeft, Loader, X, AlertTriangle, Cpu } from 'lucide-react';
import useApi from "../../api/useApi";
import Swal from 'sweetalert2';
// --- INITIAL DATA STORE ---
// This data is now the initial state for the application.
const initialClientsData = [
    // { 
    //     id: 1, 
    //     name: 'Innovate Solutions Inc.', 
    //     contactPerson: 'Alice Johnson', 
    //     email: 'alice@innovate.com', 
    //     phone: '+91 98765 43210', 
    //     gstin: '27AABC12345Z1ZA', 
    //     address: '101, Tech Park Avenue', 
    //     city: 'Bangalore', 
    //     state: 'Karnataka', 
    //     pincode: '560001', 
    //     status: 'Active' 
    // },
    // { 
    //     id: 2, 
    //     name: 'Global Finance Corp', 
    //     contactPerson: 'Bob Smith', 
    //     email: 'bob@gfc.com', 
    //     phone: '+91 88888 77777', 
    //     gstin: '', 
    //     address: '45, Fortune Tower', 
    //     city: 'Mumbai', 
    //     state: 'Maharashtra', 
    //     pincode: '400001', 
    //     status: 'Inactive' 
    // },
    // { 
    //     id: 3, 
    //     name: 'HealthTech Pioneers', 
    //     contactPerson: 'Charlie Brown', 
    //     email: 'charlie@htp.org', 
    //     phone: '+91 77777 66666', 
    //     gstin: '07AAACC9999Z1ZJ', 
    //     address: '20, Medical Plaza', 
    //     city: 'Delhi', 
    //     state: 'Delhi', 
    //     pincode: '110001', 
    //     status: 'Active' 
    // },
];

const LOCAL_DELAY = 500; // Simulated delay for local state updates

// --- HELPER COMPONENTS ---

// Helper function to get status badge styling
const getStatusBadge = (status) => {
    switch (status) {
        case 'Active':
            return 'bg-green-100 text-green-800 border border-green-300';
        case 'Inactive':
            return 'bg-red-100 text-red-800 border border-red-300';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
};

const LoadingSpinner = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-16 text-blue-600">
        <Loader className="animate-spin" size={32} />
        <p className="mt-3 text-lg font-medium">{message}</p>
    </div>
);

// Custom Modal for Deletion Confirmation
const ConfirmationModal = ({ isOpen, clientName, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all duration-300 scale-100">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-red-600 flex items-center">
                        <AlertTriangle className="mr-2" size={20} /> Confirm Deletion
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition" disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                <p className="text-gray-700 mb-6">
                    Are you sure you want to permanently delete the Vendor: <span className="font-semibold text-gray-900">{clientName}</span>? This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium border rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition flex items-center"
                    >
                        {loading ? (
                            <Loader size={16} className="animate-spin mr-2" />
                        ) : (
                            <Trash2 size={16} className="mr-2" />
                        )}
                        {loading ? 'Deleting...' : 'Delete Vendor'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- CORE COMPONENTS ---

// Component for the client list table
const ClientTable = ({ clients, onDeleteRequest, onEdit, loading }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-8 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Vendor List ({clients.length})</h2>
            
            {loading ? (
                <LoadingSpinner message="Updating data..." />
            ) : (
                <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Company Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Contact Person</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Email/Phone</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">GSTIN</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Location</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {clients.map((client) => (
                            <tr key={client._id} className="hover:bg-blue-50 transition duration-150">
                                {/* Company Name */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                                
                                {/* Contact Person */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{client.contactPerson}</td>
                                
                                {/* Email / Phone */}
                                <td className="px-4 py-4 text-sm text-gray-500">
                                    <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800 block">{client.email}</a>
                                    <span className="text-xs text-gray-400">{client.phone}</span>
                                </td>
                                
                                {/* GSTIN */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{client.gstin || 'N/A'}</td>
                                
                                {/* Location (Combined fields) */}
                                <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                                    <span className="block text-gray-700 font-medium">{client.city}, {client.state}</span>
                                    <span className="text-xs text-gray-400">{client.pincode}</span>
                                    <span className="block text-xs text-gray-500 truncate" title={client.address}>{client.address}</span>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(client.status)}`}>
                                        {client.status}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    {/* <button
                                        onClick={() => onDeleteRequest(client)} // Request deletion, don't execute yet
                                        className="text-red-600 hover:text-red-900 transition mr-3 p-1 rounded-full hover:bg-red-50"
                                        title="Delete Client"
                                        disabled={loading}
                                    >
                                        <Trash2 size={16} />
                                    </button> */}
                                    <button
                                        onClick={() => onEdit(client)} 
                                        className="text-blue-600 hover:text-blue-900 transition p-1 rounded-full hover:bg-blue-50"
                                        title="Edit Vendor"
                                        disabled={loading}
                                    >
                                        <Edit size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {clients.length === 0 && !loading && (
                 <div className="text-center py-8 text-gray-500 italic">No Vendors found. Add a new Vendor above!</div>
            )}
        </div>
    );
};

// Define empty state structure for resetting/initialization
const emptyClientState = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'Active',
};

// Component for adding/editing a client
const ClientForm = ({ initialClient, onSave, onCancel, loading, setLoading }) => {
    const [currentClient, setCurrentClient] = useState(initialClient || emptyClientState);
    const [errorMessage, setErrorMessage] = useState('');

    const isEditing = !!initialClient;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentClient(prev => ({ ...prev, [name]: value }));
        setErrorMessage('');
    };


    
        function isValidGSTIN(gstin) {
    if (!gstin) return true;

    // GSTIN should be 15 characters
    if (gstin.length !== 15) return false;

    // GSTIN Format Regex
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    return gstRegex.test(gstin.toUpperCase());
}

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Simple validation
        const requiredFields = ['name', 'contactPerson', 'phone', 'address', 'city', 'state', 'pincode'];
        const missingFields = requiredFields.filter(field => !currentClient[field].trim());

        if (missingFields.length > 0) {
            const fieldNames = missingFields.map(f => f.replace(/([A-Z])/g, ' $1').trim().toLowerCase());
            setErrorMessage(`Please fill in all required fields: ${fieldNames.join(', ')}.`);
            return;
        }

        if (currentClient.gstin.trim() && !isValidGSTIN(currentClient.gstin.trim())) {
    setErrorMessage("Invalid GSTIN format. Please enter a valid 15-character GST number.");
    return;
}

        // Pass the client data up to the parent App component for local state saving
        onSave(currentClient); 
        console.log(currentClient)

        // Reset form state only if adding new client
        if (!isEditing) {
            setCurrentClient(emptyClientState);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-blue-500">
            <button 
                type="button" 
                onClick={onCancel} 
                className="mb-4 text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition"
                disabled={loading}
            >
                <ChevronLeft size={16} className="mr-1" /> Back to Vendor List
            </button>

            <h2 className="text-xl font-bold mb-6 text-blue-700 flex items-center">
                {isEditing ? (
                    <><Edit size={20} className="mr-2" /> Edit Vendor Details: {initialClient.name}</>
                ) : (
                    <><PlusCircle size={20} className="mr-2" /> Enter New Vendor Details</>
                )}
            </h2>
            
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm" role="alert">
                    <p className="font-bold mb-1">Validation Error</p>
                    <p>{errorMessage}</p>
                </div>
            )}

            <fieldset disabled={loading} className="space-y-4">
                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Company Name */}
                    <div><label htmlFor="name" className="block text-sm font-medium text-gray-700">Company Name *</label><input type="text" name="name" id="name" value={currentClient.name} onChange={handleChange} placeholder="e.g., Acme Corp" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    {/* Contact Person */}
                    <div><label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person *</label><input type="text" name="contactPerson" id="contactPerson" value={currentClient.contactPerson} onChange={handleChange} placeholder="e.g., Jane Doe" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    {/* Email */}
                    <div><label htmlFor="email" className="block text-sm font-medium text-gray-700">Email </label><input type="email" name="email" id="email" value={currentClient.email} onChange={handleChange} placeholder="e.g., manager@acme.com" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    {/* Phone */}
                    <div><label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone *</label><input type="tel" name="phone" id="phone" value={currentClient.phone} onChange={handleChange} placeholder="e.g., +91 9876543210" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>

                    {/* Address */}
                    <div className="lg:col-span-4 sm:col-span-2"><label htmlFor="address" className="block text-sm font-medium text-gray-700">Address *</label><input type="text" name="address" id="address" value={currentClient.address} onChange={handleChange} placeholder="e.g., 123 Main Street, Near Park" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    
                    {/* City */}
                    <div><label htmlFor="city" className="block text-sm font-medium text-gray-700">City *</label><input type="text" name="city" id="city" value={currentClient.city} onChange={handleChange} placeholder="e.g., Mumbai" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    {/* State */}
                    <div><label htmlFor="state" className="block text-sm font-medium text-gray-700">State *</label><input type="text" name="state" id="state" value={currentClient.state} onChange={handleChange} placeholder="e.g., Maharashtra" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    {/* Pincode */}
                    <div><label htmlFor="pincode" className="block text-sm font-medium text-gray-700">Pincode *</label><input type="text" name="pincode" id="pincode" value={currentClient.pincode} onChange={handleChange} placeholder="e.g., 400001" required className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>

                    {/* GSTIN */}
                    <div><label htmlFor="gstin" className="block text-sm font-medium text-gray-700">GSTIN (Optional)</label><input type="text" name="gstin" id="gstin" value={currentClient.gstin} onChange={handleChange} placeholder="e.g., 27AABC12345Z1ZA" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border" /></div>
                    {/* Status */}
                    <div><label htmlFor="status" className="block text-sm font-medium text-gray-700">Status *</label><select name="status" id="status" value={currentClient.status} onChange={handleChange} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition p-2 border bg-white" required><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out transform hover:scale-[1.01]"
                    >
                        {loading ? (
                            <Loader size={18} className="animate-spin mr-2" />
                        ) : isEditing ? (
                            <><Edit size={18} className="mr-2" /> Update Vendor</>
                        ) : (
                            <><PlusCircle size={18} className="mr-2" /> Save Vendor</>
                        )}
                    </button>
                </div>
            </fieldset>
        </form>
    );
};

// Main Application Component
const App = () => {

        const {getData,postData}= useApi()
    // Initializing state directly with mock data
    const [clients, setClients] = useState(initialClientsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState('list'); 
    const [editingClient, setEditingClient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for Delete Modal
    const [modalClient, setModalClient] = useState(null);
    const isModalOpen = !!modalClient;

    // LOCAL CRUD LOGIC

       const getproduct=async()=>{
            const res=await getData('/trade/vendors')
            setClients(res)
        }
    
        useEffect(() => {
          getproduct()
        }, [])

    
    // Handler for local save/update logic
    const handleSaveClient = (clientData) => {
        setLoading(true);
        setError(null);

      

       

        // Simulate a network/processing delay
        setTimeout(async() => {
            if (clientData._id) {
                // Update Logic
                setClients(prevClients => 
                    prevClients.map(c => c._id === clientData._id ? clientData : c)
                );

                 const res=await postData('/trade/vendors',clientData)
                         console.log(res)
                              Swal.fire({
                                title: "Successful",
                                text: 'updated successfully',
                                icon: "success",
                                timer:2000
                              });
            } else {
                // Create Logic: Assign a unique ID
                const newId = Date.now();
                setClients(prevClients => [...prevClients, { ...clientData, id: newId }]);

                 const res=await postData('/trade/vendors',{ ...clientData, id: newId, pAccount:'A20' })
                         console.log(res)
                              Swal.fire({
                                title: "Successful",
                                text: 'Created successfully',
                                icon: "success",
                                timer:2000
                              });
            }
            setLoading(false);
            handleViewCancel();
            
            // Switch back to list view
        }, LOCAL_DELAY);

         
    };
    
    // Handler for clicking the Edit button
    const handleEditClick = (client) => {
        setEditingClient(client);
        setView('form'); 
        setError(null);
    };

    // Handler to return to the list view (used by cancel/successful save)
    const handleViewCancel = () => {
        setEditingClient(null); // Clear editing state
        setView('list');
        setError(null); // Clear any existing form error when returning to list
    };
    
    // Handler to request client deletion (opens modal)
    const handleDeleteRequest = (client) => {
        setModalClient(client);
    };

    // Handler to execute client deletion (called from modal)
    const handleDeleteExecute = () => {
        if (!modalClient) return;

        setLoading(true);
        setError(null);
        
        // Simulate a network/processing delay
        setTimeout(() => {
            setClients(prevClients => 
                prevClients.filter(c => c._id !== modalClient._id)
            );
            
            // Close modal and stop loading
            setModalClient(null);
            setLoading(false);
        }, LOCAL_DELAY);
    };

    // Filter clients based on search term
    const filteredClients = clients.filter(client => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return (
            client.name.toLowerCase().includes(lowerCaseSearch) ||
            client.contactPerson.toLowerCase().includes(lowerCaseSearch) ||
            client.email.toLowerCase().includes(lowerCaseSearch) ||
            client.phone.includes(lowerCaseSearch)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <header className="mb-8 pb-4 border-b border-blue-200 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-800">
                        New Poultry Hub CRM Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center">
                        <Cpu size={14} className="mr-1 text-gray-400" /> Data managed via Local React State.
                    </p>
                </div>

                {/* Button to switch to Add Client Form */}
                {view === 'list' && (
                    <button
                        onClick={() => setView('form')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out transform hover:scale-[1.01]"
                        disabled={loading}
                    >
                        <PlusCircle size={18} className="mr-2" /> Add New Vendor
                    </button>
                )}
            </header>
            
            <div className="max-w-6xl mx-auto">
                {error && <div className="bg-red-100 p-4 rounded-lg text-red-700 mb-6">{error}</div>}

                {/* Conditional rendering based on the current view */}
                {view === 'form' ? (
                    /* Show the Client Form (used for both Add and Edit) */
                    <ClientForm 
                        initialClient={editingClient} 
                        onSave={handleSaveClient} // Pass the local save function
                        onCancel={handleViewCancel} 
                        loading={loading}
                        setLoading={setLoading}
                    />
                ) : (
                    /* Show the Client List and Search Bar */
                    <>
                        {/* Search Bar */}
                        <div className="mt-8 relative max-w-lg">
                            <input
                                type="text"
                                placeholder="Search Vendors by name, contact person, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-blue-300 rounded-xl shadow-inner focus:border-blue-500 focus:ring-blue-500 transition"
                                disabled={loading}
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={20} />
                        </div>

                        {/* Client Table */}
                        <ClientTable 
                            clients={filteredClients} 
                            onDeleteRequest={handleDeleteRequest}
                            onEdit={handleEditClick} 
                            loading={loading && !isModalOpen} 
                        />
                    </>
                )}
            </div>
            
            {/* Confirmation Modal */}
            <ConfirmationModal 
                isOpen={isModalOpen}
                clientName={modalClient?.name}
                onConfirm={handleDeleteExecute}
                onCancel={() => setModalClient(null)}
                loading={loading}
            />
        </div>
    );
};

export default App;