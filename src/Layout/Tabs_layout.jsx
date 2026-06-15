import {Outlet,NavLink } from "react-router-dom";
import Cookies from 'js-cookie';
const Tabs_layout = ({tabs}) => {
  let permissions = null;
  try {
    const stored = localStorage.getItem('permissions');
    if (stored) permissions = JSON.parse(stored);
  } catch (e) {
    permissions = null;
  }

  const logintype = Cookies.get('logintype');
  // Fallback: If no permissions are set yet (existing session), or if admin/ca/superadmin, give full access
  const filteredTabs = logintype === 'ca' || logintype === 'admin' || !permissions || permissions.length === 0 || permissions.includes('ALL')
    ? tabs
    : tabs.filter(tab => permissions.includes(`Tab: ${tab.label}`));

  return (
      <>
        <div className="flex space-x-2 md:space-x-4 mb-6 text-xs overflow-x-auto pb-1 scrollbar-hide flex-nowrap">
        {filteredTabs.map((tab) => (
            <NavLink
            key={tab.route}
            to={tab.route}
            end
            className={({ isActive }) =>
                `px-4 py-2 rounded-lg shadow-md transition-all duration-200 ${
                isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`
            }
            >
            {tab.label}
            </NavLink>
        ))}
        </div>
        <hr />
       <Outlet /> {/* Renders nested tab content */}
       </>
  )
}

export default Tabs_layout