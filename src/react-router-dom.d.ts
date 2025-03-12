declare module 'react-router-dom' {
  import * as React from 'react';

  export interface BrowserRouterProps {
    basename?: string;
    children?: React.ReactNode;
  }

  export interface RouteProps {
    path?: string;
    element?: React.ReactNode;
    children?: React.ReactNode;
  }

  export interface NavigateProps {
    to: string;
    replace?: boolean;
    state?: any;
  }

  export interface NavigateOptions {
    replace?: boolean;
    state?: any;
  }

  export interface NavigateFunction {
    (to: string, options?: NavigateOptions): void;
    (delta: number): void;
  }

  export interface LocationState {
    [key: string]: any;
  }

  export interface Location<S = LocationState> {
    pathname: string;
    search: string;
    hash: string;
    state: S;
    key: string;
  }

  export const BrowserRouter: React.FC<BrowserRouterProps>;
  export const Routes: React.FC<{ children?: React.ReactNode }>;
  export const Route: React.FC<RouteProps>;
  export const Navigate: React.FC<NavigateProps>;
  export const Link: React.FC<{ to: string; children?: React.ReactNode; [key: string]: any }>;
  export const NavLink: React.FC<{ to: string; children?: React.ReactNode; [key: string]: any }>;
  export const Outlet: React.FC;
  
  export function useNavigate(): NavigateFunction;
  export function useLocation<S = LocationState>(): Location<S>;
  export function useParams<P extends { [K in keyof P]?: string } = {}>(): P;
} 