import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const COOKIE_NAME = 'zuzu_last_page';
const COOKIE_MAX_AGE_SECONDS = 7776000; // 90 days

// Never save or restore these paths
const EXCLUDED_PATHS = ['/login', '/signup', '/auth/verify'];

const readCookie = (): string | null => {
  const match = document.cookie.split('; ').find(row => row.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
};

const writeCookie = (path: string): void => {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(path)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
};

const useLastVisited = (): void => {
  const location = useLocation();
  const navigate = useNavigate();
  const didRedirect = useRef(false);

  // On initial mount: redirect from '/' to last visited page only on fresh external load
  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;

    if (location.pathname !== '/') return;

    // If the user came from within the same site, they navigated to '/' intentionally — don't redirect
    const referrer = document.referrer;
    const isInternalNavigation = referrer && new URL(referrer).hostname === window.location.hostname;
    if (isInternalNavigation) return;

    const last = readCookie();
    if (last && last !== '/' && !EXCLUDED_PATHS.includes(last)) {
      navigate(last, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On every navigation: persist the current path
  useEffect(() => {
    if (EXCLUDED_PATHS.includes(location.pathname)) return;
    writeCookie(location.pathname);
  }, [location.pathname]);
};

export default useLastVisited;
