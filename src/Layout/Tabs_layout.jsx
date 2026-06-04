import {Outlet,NavLink } from "react-router-dom";
import Cookies from 'js-cookie';
const Tabs_layout = ({tabs}) => {
  return (
      <>
        <div className="flex space-x-4 mb-6 text-xs">
        {tabs.map((tab) => (
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