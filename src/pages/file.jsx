import React, { useState, useMemo, useEffect } from 'react';

// --- Base URL for your Flask API ---
const API_URL = 'http://localhost:5000';

// --- Icons ---
const FilesIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );
const DocsIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> );
const FolderIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> );
const FileIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg> );

// --- Styles Object ---
const styles = {
  appContainer: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#1a1d21', color: '#d4d4d4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', overflow: 'hidden' },
  mainSidebar: { width: '60px', backgroundColor: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0', gap: '1rem' },
  sidebarButton: (isActive) => ({ background: 'none', border: 'none', color: isActive ? '#8A39E1' : '#ccc', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }),
  contentWrapper: { flex: 1, display: 'flex', overflow: 'hidden' },
  fileManagerPane: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  contentHeader: { padding: '1.5rem 2rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.75rem', fontWeight: '600' },
  actionBar: { display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem 2rem', borderBottom: '1px solid #333' },
  navBar: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', borderBottom: '1px solid #333' },
  breadcrumbs: { color: 'rgba(255, 255, 255, 0.7)' },
  input: { padding: '0.75rem 1rem', border: '1px solid #555', borderRadius: '8px', backgroundColor: '#333', color: '#fff', fontSize: '1rem', outline: 'none' },
  button: { padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', backgroundColor: '#8A39E1', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  fileInputLabel: { padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px', backgroundColor: '#28a745', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  fileInput: { display: 'none' },
  fileList: { flex: 1, overflowY: 'auto', padding: '1rem 2rem' },
  fileItem: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s ease' },
  fileName: { flex: 1 },
  contextMenu: { position: 'fixed', backgroundColor: '#252526', border: '1px solid #444', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', padding: '4px', zIndex: 2000, minWidth: '150px' },
  contextMenuItem: { background: 'none', border: 'none', color: '#d4d4d4', cursor: 'pointer', padding: '6px 12px', width: '100%', textAlign: 'left', borderRadius: '4px' },
  docsContainer: { flex: 1, padding: '2rem 3rem', overflowY: 'auto', lineHeight: '1.6' },
  codeBlock: { backgroundColor: '#2a2a2e', padding: '1rem', borderRadius: '8px', border: '1px solid #333', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: '#f0f0f0', marginTop: '0.5rem' },
  loginContainer: { width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  loginBox: { padding: '2.5rem', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '350px' },
  loginInput: { padding: '1rem', border: '1px solid #555', borderRadius: '8px', backgroundColor: '#333', color: '#fff', fontSize: '1rem', outline: 'none' },
  loginButton: { padding: '1rem', border: 'none', borderRadius: '8px', backgroundColor: '#8A39E1', color: '#fff', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer' },
  scrollStyles: `
    .file-list-scrollbar::-webkit-scrollbar { width: 8px; }
    .file-list-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
    .file-list-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.4); }
    .context-menu-item:hover { background-color: #3a3a3e; }
    .context-menu-item-delete:hover { background-color: #5a2a2a; }
  `
};

// --- API Helper ---
async function apiCall(endpoint, method = 'GET', body = null, token, onAuthError) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (response.status === 401) {
      onAuthError();
      throw new Error("Session expired. Please log in again.");
    }
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${method} ${endpoint}:`, error);
    alert(`Error: ${error.message}`);
    throw error;
  }
}

// --- S3 File Manager Component ---
function S3FileManager({ authToken, onLogout }) {
  const [items, setItems] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });

  const call = (endpoint, method, body) => {
    return apiCall(endpoint, method, body, authToken, onLogout);
  };

  const loadItems = async (prefix) => {
    setIsLoading(true);
    setContextMenu({ visible: false });
    try {
      const response = await fetch(`${API_URL}/api/list?prefix=${prefix}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.status === 401) {
        onLogout();
        throw new Error("Session expired.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setItems(data.items);
      setCurrentPath(data.prefix);
    } catch (error) {
      alert(`Error loading items: ${error.message}`);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems('');
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      loadItems(item.key);
    } else {
      window.open(item.url, '_blank');
    }
  };

  const handleGoBack = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    const parentParts = parts.slice(0, -1);
    const parentPath = parentParts.length > 0 ? parentParts.join('/') + '/' : '';
    loadItems(parentPath);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName) return;
    const folderKey = `${currentPath}${newFolderName}/`;
    try {
      await call('/api/create-folder', 'POST', { folder_key: folderKey });
      loadItems(currentPath);
      setNewFolderName('');
    } catch (error) {}
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    formData.append('prefix', currentPath);
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
      });
      if (response.status === 401) {
        onLogout();
        throw new Error("Session expired.");
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      alert(`Successfully uploaded:\n${data.urls.join('\n')}`);
      loadItems(currentPath);
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    const item = contextMenu.item;
    if (!item) return;
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await call('/api/delete-item', 'POST', { key: item.key });
        loadItems(currentPath);
      } catch (error) {}
    }
  };
  
  const handleCopyUrl = () => {
    const item = contextMenu.item;
    if (!item || !item.url) {
      alert("Only files have URLs to copy.");
      return;
    }
    navigator.clipboard.writeText(item.url).then(() => {
      alert("URL copied to clipboard!");
    }).catch(err => {
      alert("Failed to copy URL.");
    });
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: item });
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items]);
  
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    const { item } = contextMenu;
    
    return (
      <div 
        style={{...styles.contextMenu, top: contextMenu.y, left: contextMenu.x}}
        onClick={(e) => e.stopPropagation()} 
      >
        {item.type === 'file' && (
          <button style={styles.contextMenuItem} className="context-menu-item" onClick={handleCopyUrl}>
            Copy URL
          </button>
        )}
        <button 
          style={{...styles.contextMenuItem, color: '#ff8a8a'}} 
          className="context-menu-item-delete"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    );
  };

  return (
    <div style={styles.fileManagerPane}>
      <div style={styles.contentHeader}>
        <h1 style={styles.title}>S3 File Manager</h1>
        <button onClick={onLogout} style={{...styles.button, backgroundColor: '#c9302c', marginLeft: 'auto'}}>Logout</button>
      </div>
      <div style={styles.actionBar}>
        <label htmlFor="file-upload" style={styles.fileInputLabel}>
          Upload File
        </label>
        <input 
          id="file-upload"
          type="file" 
          multiple 
          onChange={handleFileUpload}
          style={styles.fileInput}
        />
        <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
          <input 
            type="text"
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Create Folder
          </button>
        </form>
      </div>
      <div style={styles.navBar}>
        <button 
          onClick={handleGoBack}
          disabled={!currentPath}
          style={{...styles.button, opacity: currentPath ? 1 : 0.5}}
        >
          Back
        </button>
        <div style={styles.breadcrumbs}>
          Current Path: / {currentPath}
        </div>
      </div>
      
      <div style={styles.fileList} className="file-list-scrollbar">
        {isLoading ? (
          <p>Loading...</p>
        ) : sortedItems.length === 0 ? (
          <p>This folder is empty.</p>
        ) : (
          sortedItems.map(item => (
            <div 
              key={item.key}
              style={styles.fileItem}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => handleItemClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              {item.type === 'folder' ? <FolderIcon /> : <FileIcon />}
              <span style={styles.fileName}>{item.name}</span>
            </div>
          ))
        )}
      </div>
      {renderContextMenu()}
    </div>
  );
}

// --- Documentation Page Component ---
function DocumentationView() {
  return (
    <div style={styles.docsContainer} className="file-list-scrollbar">
      <h1 style={styles.title}>API Documentation</h1>
<p>Use these API endpoints to interact with your S3 server. <strong>All requests must include an `Authorization: Bearer {'<token>'}` header.</strong></p>      
      <hr style={{border: '1px solid #333'}} />
      
      <h3>1. Authenticate (Get Token)</h3>
      <p>Get your temporary access token. This is the only endpoint that does *not* require a token.</p>
      <div style={styles.codeBlock}>
        {`POST ${API_URL}/api/login\n\n`}
        {`# JSON Body:\n{\n  "username": "your_username",\n  "password": "your_password"\n}\n\n`}
        {`# Example Response:\n{\n  "access_token": "ey...[a_very_long_token]..."\n}`}
      </div>
      
      <h3>2. List Items (Files & Folders)</h3>
      <p>Fetches the contents of a specific folder (prefix).</p>
      <div style={styles.codeBlock}>
        {`GET ${API_URL}/api/list?prefix=<folder_path>\n\n`}
        {`# Example with curl:\n`}
        {`curl -H "Authorization: Bearer <token>" "${API_URL}/api/list?prefix=uploads/"`}
      </div>

      <h3>3. Upload File(s)</h3>
      <p>Uploads one or more files to a specific folder.</p>
      <div style={styles.codeBlock}>
        {`POST ${API_URL}/api/upload\n\n`}
        {`# Form Data:\n- files: (one or more file objects)\n- prefix: (optional folder path, e.g., "uploads/")\n\n`}
        {`# Example with curl:\n`}
        {`curl -X POST -H "Authorization: Bearer <token>" -F "files=@/path/to/image.jpg" -F "prefix=uploads/" "${API_URL}/api/upload"`}
      </div>

      <h3>4. Create Folder</h3>
      <p>Creates a new "folder".</p>
      <div style={styles.codeBlock}>
        {`POST ${API_URL}/api/create-folder\n\n`}
        {`# JSON Body:\n{\n  "folder_key": "your/new/folder/path/"\n}`}
      </div>

      <h3>5. Delete Item (File or Folder)</h3>
      <p>Deletes a single file or an entire folder and all its contents.</p>
      <div style={styles.codeBlock}>
        {`POST ${API_URL}/api/delete-item\n\n`}
        {`# JSON Body (to delete a file):\n{\n  "key": "uploads/image.jpg"\n}\n\n`}
        {`# JSON Body (to delete a folder):\n{\n  "key": "uploads/images/"\n}`}
      </div>
    </div>
  );
}

// --- Login View Component ---
function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <form style={styles.loginBox} onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>S3 Manager Login</h2>
        {error && <p style={{ color: '#ff8a8a', textAlign: 'center' }}>{error}</p>}
        <input 
          type="text"
          placeholder="Username"
          style={styles.loginInput}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input 
          type="password"
          placeholder="Password"
          style={styles.loginInput}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" style={styles.loginButton}>Login</button>
      </form>
    </div>
  );
}


// --- Main App Component (now handles auth state) ---
function DeveloperPeaceUI() {
  const [activeView, setActiveView] = useState('files');
  const [token, setToken] = useState(localStorage.getItem('s3-token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('s3-token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('s3-token');
    setToken(null);
  };

  // This is the main content of the app, shown only if logged in
  const MainApp = () => (
    <div style={styles.appContainer}>
      <style>{styles.scrollStyles}</style>
      <div style={styles.mainSidebar}>
        <button
          style={styles.sidebarButton(activeView === 'files')}
          onClick={() => setActiveView('files')}
          title="File Manager"
        >
          <FilesIcon />
        </button>
        <button
          style={styles.sidebarButton(activeView === 'docs')}
          onClick={() => setActiveView('docs')}
          title="Documentation"
        >
          <DocsIcon />
        </button>
      </div>
      <div style={styles.contentWrapper}>
        {activeView === 'files' ? <S3FileManager authToken={token} onLogout={handleLogout} /> : <DocumentationView />}
      </div>
    </div>
  );

  // If we have a token, show the app. If not, show the login page.
  return (
    <>
      {token ? <MainApp /> : <LoginView onLogin={handleLogin} />}
    </>
  );
}

export default DeveloperPeaceUI;