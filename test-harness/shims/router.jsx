// Test-only stand-in for react-router-dom (HashRouter subset). Not shipped.
import React, { createContext, useContext, useEffect, useState, Children } from "react";
const Ctx = createContext({ pathname: "/" });
const current = () => (location.hash.replace(/^#/, "") || "/").split("?")[0];
export function HashRouter({ children }) {
  const [pathname, set] = useState(current());
  useEffect(() => { const h = () => set(current()); addEventListener("hashchange", h); return () => removeEventListener("hashchange", h); }, []);
  return <Ctx.Provider value={{ pathname }}>{children}</Ctx.Provider>;
}
export const useLocation = () => useContext(Ctx);
export const useNavigate = () => (to) => { location.hash = to; };
export function Routes({ children }) {
  const { pathname } = useLocation();
  const routes = Children.toArray(children);
  const hit = routes.find((r) => r.props.path === pathname) || routes.find((r) => r.props.path === "*");
  return hit ? hit.props.element : null;
}
export const Route = () => null;
export function Navigate({ to }) { useEffect(() => { location.hash = to; }, [to]); return null; }
export function Link({ to, children, ...rest }) { return <a href={"#" + to} {...rest}>{children}</a>; }
export function NavLink({ to, end, className, children, ...rest }) {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  return <a href={"#" + to} aria-current={isActive ? "page" : undefined} className={typeof className === "function" ? className({ isActive }) : className} {...rest}>
    {typeof children === "function" ? children({ isActive }) : children}</a>;
}
