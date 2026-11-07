// Minimal type stand-ins used ONLY by the offline test harness (no npm access).
// The real project uses @types/react, react-router-dom, lucide-react, leaflet types.
declare module "react" {
  export type ReactNode = any;
  export type FC<P = {}> = (p: P) => any;
  export type Dispatch<A> = (a: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export function useState<S>(init: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(fn: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(fn: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...a: any[]) => any>(fn: T, deps: readonly unknown[]): T;
  export function useRef<T>(init: T): { current: T };
  export function useRef<T>(init: T | null): { current: T | null };
  export function useContext<T>(c: Context<T>): T;
  export interface Context<T> { Provider: any; _t?: T }
  export function createContext<T>(v: T): Context<T>;
  export function lazy<T>(f: () => Promise<{ default: T }>): T;
  export const Suspense: any;
  export const StrictMode: any;
  export class Component<P = {}, S = {}> { props: P & { children?: any }; state: S; setState(s: Partial<S>): void; constructor(p: P); }
  export type ButtonHTMLAttributes<T> = Record<string, any> & { _?: T };
  export type InputHTMLAttributes<T> = Record<string, any> & { _?: T };
  const React: { ButtonHTMLAttributes: any };
  export default React;
}
declare namespace React {
  type ReactNode = any;
  type ButtonHTMLAttributes<T> = Record<string, any> & { _?: T };
  type InputHTMLAttributes<T> = Record<string, any> & { _?: T };
}
declare module "react/jsx-runtime" { export const jsx: any; export const jsxs: any; export const Fragment: any; }
declare namespace JSX { interface IntrinsicElements { [k: string]: any } type Element = any; interface ElementChildrenAttribute { children: {} } interface IntrinsicAttributes { key?: any } }
declare module "react-dom/client" { export function createRoot(el: Element): { render(n: any): void }; }
declare module "react-router-dom" {
  export const HashRouter: any, Routes: any, Route: any, NavLink: any, Link: any, Navigate: any;
  export function useLocation(): { pathname: string };
  export function useNavigate(): (to: string) => void;
}
declare module "lucide-react" {
  type Icon = (p: Record<string, any>) => any;
  export const ArrowDown: Icon;
  export const Bell: Icon;
  export const BellRing: Icon;
  export const BookOpen: Icon;
  export const Check: Icon;
  export const ChevronRight: Icon;
  export const CircleAlert: Icon;
  export const CircleCheck: Icon;
  export const CircleHelp: Icon;
  export const Clock: Icon;
  export const CloudLightning: Icon;
  export const CloudOff: Icon;
  export const Download: Icon;
  export const ExternalLink: Icon;
  export const FlaskConical: Icon;
  export const HardDrive: Icon;
  export const House: Icon;
  export const Languages: Icon;
  export const LifeBuoy: Icon;
  export const ListChecks: Icon;
  export const LocateFixed: Icon;
  export const Lock: Icon;
  export const Map: Icon;
  export const MapPin: Icon;
  export const MessageSquare: Icon;
  export const Navigation: Icon;
  export const Package: Icon;
  export const PawPrint: Icon;
  export const Pencil: Icon;
  export const Phone: Icon;
  export const Plane: Icon;
  export const Plus: Icon;
  export const Radio: Icon;
  export const RefreshCw: Icon;
  export const Route: Icon;
  export const ScanSearch: Icon;
  export const Search: Icon;
  export const Settings: Icon;
  export const ShieldAlert: Icon;
  export const ShieldCheck: Icon;
  export const ShoppingCart: Icon;
  export const Star: Icon;
  export const Tent: Icon;
  export const Trash2: Icon;
  export const TriangleAlert: Icon;
  export const Users: Icon;
  export const Wifi: Icon;
  export const WifiOff: Icon;
  export const Wind: Icon;
  export const X: Icon;
  export const Zap: Icon;
}
declare module "*.css" {}
declare module "leaflet" { export type Map = any; export type LayerGroup = any; export const map: any, tileLayer: any, layerGroup: any, circleMarker: any; }
declare module "leaflet/dist/leaflet.css" {}
interface ImportMetaEnv { PROD: boolean; DEV: boolean; VITE_SYNC_URL?: string; VITE_DEMO_DEFAULT?: string }
interface ImportMeta { readonly env: ImportMetaEnv }
