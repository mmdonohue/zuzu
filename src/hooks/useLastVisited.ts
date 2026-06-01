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

const SESSION_KEY = 'zuzu_session_active';

const useLastVisited = (): void => {
  const location = useLocation();
  const navigate = useNavigate();
  const didRedirect = useRef(false);

  // On initial mount: redirect from '/' to last visited only on a true fresh page load
  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;

    if (location.pathname !== '/') return;

    // If sessionStorage flag is set, the user is already navigating within the app — don't redirect
    const isActiveSession = sessionStorage.getItem(SESSION_KEY);
    if (isActiveSession) return;

    const last = readCookie();
    if (last && last !== '/' && !EXCLUDED_PATHS.includes(last)) {
      navigate(last, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On every navigation: mark session active + persist the current path
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, '1');
    if (EXCLUDED_PATHS.includes(location.pathname)) return;
    writeCookie(location.pathname);
  }, [location.pathname]);
};

export default useLastVisited;
