import { Outlet, NavLink, useLocation } from "react-router-dom";
import Cookies from 'js-cookie';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Tabs_layout = ({ tabs }) => {
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

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const location = useLocation();

  // ── Update scroll arrow visibility ───────────────────────────────────────
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, filteredTabs]);

  // ── Auto-scroll active tab into view on route change ─────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeLink = el.querySelector('[data-active="true"]');
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(updateArrows, 300);
  }, [location.pathname, updateArrows]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Scrollable Tab Bar ─────────────────────────────────────────── */}
      <div className="relative flex items-center mb-4">

        {/* Left Arrow */}
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll tabs left"
          className={`
            flex-shrink-0 z-10 w-8 h-8 flex items-center justify-center
            rounded-full bg-white border border-gray-200 shadow-sm
            text-gray-500 hover:text-purple-600 hover:border-purple-300
            transition-all duration-200 mr-1
            ${canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tab Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap flex-1 py-1 px-0.5"
        >
          {filteredTabs.map((tab) => (
            <NavLink
              key={tab.route}
              to={tab.route}
              end
              data-active={location.pathname.endsWith('/' + tab.route) || (tab.route === '' && location.pathname.endsWith('/')) ? 'true' : 'false'}
              className={({ isActive }) =>
                `flex-shrink-0 whitespace-nowrap px-4 py-2 rounded-lg shadow-sm text-xs font-semibold
                 transition-all duration-200 border
                 ${isActive
                   ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200 shadow-md'
                   : 'bg-white text-gray-600 border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                 }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll tabs right"
          className={`
            flex-shrink-0 z-10 w-8 h-8 flex items-center justify-center
            rounded-full bg-white border border-gray-200 shadow-sm
            text-gray-500 hover:text-purple-600 hover:border-purple-300
            transition-all duration-200 ml-1
            ${canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <hr className="border-gray-200 mb-4" />
      <Outlet /> {/* Renders nested tab content */}
    </>
  );
};

export default Tabs_layout;