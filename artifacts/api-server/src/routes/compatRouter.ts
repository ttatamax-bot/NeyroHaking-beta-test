import { Router } from "express";

type RouteHandler = (req: any, res: any, next?: any) => unknown;

export type CompatibleRouter = {
  get(path: string, handler: RouteHandler): CompatibleRouter;
  post(path: string, handler: RouteHandler): CompatibleRouter;
  use(...handlers: any[]): CompatibleRouter;
};

export function createCompatibleRouter(): CompatibleRouter {
  return Router() as unknown as CompatibleRouter;
}