import { describe, expect, it, vi } from "vitest";
import type {
  HyperClientOptions,
  PluginContext,
  RequestContext,
  SendRequest,
  UniversalResponse,
} from "@hyperttp/types";
import { InterceptorManager, withInterceptors } from "../src/index.js";

const request: SendRequest = {
  protocol: "acme-rpc",
  input: { operation: "lookup", value: 1 },
  metadata: { tenant: "one" },
};
const response: UniversalResponse = {
  protocol: "acme-rpc",
  ok: true,
  status: 7,
  headers: {},
  data: { value: 1 },
};
const requestContext: RequestContext = {
  requestId: "request-1",
  startTime: 1,
  meta: { trace: true },
  state: {},
};

function pluginContext(config: HyperClientOptions = {}): PluginContext {
  return { config, core: {} } as PluginContext;
}

describe("InterceptorManager", () => {
  it("chains sync and async custom-protocol request interceptors", async () => {
    const manager = new InterceptorManager();
    manager.addRequest((current) => ({
      ...current,
      input: { ...(current.input as object), sync: true },
    }));
    manager.addRequest(async (current) => ({
      ...current,
      input: { ...(current.input as object), async: true },
    }));
    manager.addRequest(() => undefined);

    await expect(manager.applyRequest(request)).resolves.toMatchObject({
      protocol: "acme-rpc",
      input: { operation: "lookup", value: 1, sync: true, async: true },
    });
  });

  it("chains sync and async response interceptors", async () => {
    const manager = new InterceptorManager();
    manager.addResponse((current) => ({ ...current, data: { sync: current.data } }));
    manager.addResponse(async (current) => ({ ...current, data: { async: current.data } }));

    await expect(manager.applyResponse(response)).resolves.toMatchObject({
      protocol: "acme-rpc",
      data: { async: { sync: { value: 1 } } },
    });
  });

  it("clears registrations and flags", () => {
    const manager = new InterceptorManager();
    manager.addRequest(() => undefined);
    manager.addResponse(() => undefined);
    manager.clear();
    expect(manager.hasRequest).toBe(false);
    expect(manager.hasResponse).toBe(false);
    expect(manager.applyRequest(request)).toBe(request);
    expect(manager.applyResponse(response)).toBe(response);
  });
});

describe("withInterceptors", () => {
  it("registers factory callbacks and forwards lifecycle contexts", async () => {
    const onRequest = vi.fn((current: SendRequest) => current);
    const onResponse = vi.fn((current: UniversalResponse) => current);
    const plugin = withInterceptors({ request: onRequest, response: onResponse });
    const context = pluginContext();

    expect(plugin.enabled?.({})).toBe(true);
    plugin.setup?.(context);
    await plugin.onRequest?.(request, context, requestContext);
    await plugin.onResponse?.(response, request, context, requestContext);

    expect(onRequest).toHaveBeenCalledWith(request, context, requestContext);
    expect(onResponse).toHaveBeenCalledWith(response, request, context, requestContext);
    expect(context.interceptors).toBeInstanceOf(InterceptorManager);
  });

  it("registers callbacks from client options and honors explicit disable", async () => {
    const configured = vi.fn((current: SendRequest) => current);
    const config = { interceptors: { enabled: true, request: [configured] } };
    const context = pluginContext(config);
    const plugin = withInterceptors();

    expect(plugin.enabled?.(config)).toBe(true);
    expect(plugin.enabled?.({ interceptors: { enabled: false } })).toBe(false);
    plugin.setup?.(context);
    await plugin.onRequest?.(request, context, requestContext);
    expect(configured).toHaveBeenCalledOnce();
  });
});
