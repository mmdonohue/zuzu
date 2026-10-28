import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const HOSTNAME_TO_PREFIX: Record<string, string> = {
  "moxilabs.ai": "/moxilabs",
  "www.moxilabs.ai": "/moxilabs",
};

// True on a microsite's custom domain, where "/" resolves to the microsite, not ZuZu
export const isMicrositeHostname = (hostname: string = window.location.hostname): boolean =>
  hostname in HOSTNAME_TO_PREFIX;

const useHostnameRouter = (): void => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sitePrefix = HOSTNAME_TO_PREFIX[window.location.hostname];
    if (!sitePrefix) return;
    if (location.pathname.startsWith(sitePrefix)) return;

    const remainder = location.pathname === "/" ? "" : location.pathname;
    navigate(sitePrefix + remainder + location.search + location.hash, {
      replace: true,
    });
  }, [navigate, location]);
};

export default useHostnameRouter;
