/**
 * Demo Banner Component
 *
 * Displays a fixed banner at the top of the page indicating demo mode.
 * - Green (emerald) for interactive routes where CRUD operations work
 * - Amber for view-only routes where the demo has limited functionality
 */

import { useState, useEffect } from 'react';
import { isInteractiveRoute, isViewOnlyRoute } from '../config';

export default function DemoBanner() {
  const [pathname, setPathname] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Listen for route changes (works with React Router)
  useEffect(() => {
    const handleRouteChange = () => {
      setPathname(window.location.pathname);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // Also check periodically for SPA navigation (React Router doesn't fire popstate)
    const interval = setInterval(() => {
      if (window.location.pathname !== pathname) {
        setPathname(window.location.pathname);
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(interval);
    };
  }, [pathname]);

  const isInteractive = isInteractiveRoute(pathname);
  const isViewOnly = isViewOnlyRoute(pathname);

  // Default to interactive style if route isn't explicitly classified
  const showViewOnly = isViewOnly && !isInteractive;

  if (showViewOnly) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 border-b border-amber-300 py-2 px-4 text-center text-amber-800 text-sm font-medium shadow-sm">
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          BarkBase Demo — This page is view-only
        </span>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-100 border-b border-emerald-300 py-2 px-4 text-center text-emerald-800 text-sm font-medium shadow-sm">
      <span className="inline-flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        BarkBase Demo — Feel free to interact and explore!
      </span>
    </div>
  );
}
