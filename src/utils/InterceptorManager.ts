import {
  RequestInterceptor,
  ResponseInterceptor,
} from "../types/interceptors.js";

export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  public hasRequest = false;
  public hasResponse = false;

  addRequest(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    this.hasRequest = true;
  }

  addResponse(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    this.hasResponse = true;
  }

  /**
   * Применяет реквест-интерцепторы.
   * Возвращает либо измененный config, либо Promise с ним.
   */
  applyRequest(config: any): any {
    let result = config;
    const len = this.requestInterceptors.length;

    for (let i = 0; i < len; i++) {
      const nextConfig = this.requestInterceptors[i](result);

      if (nextConfig instanceof Promise) {
        return this.applyRequestAsync(i, nextConfig, result);
      }

      if (nextConfig) result = nextConfig;
    }
    return result;
  }

  private async applyRequestAsync(
    startIndex: number,
    currentPromise: Promise<any>,
    currentResult: any,
  ): Promise<any> {
    let result = currentResult;

    const resolved = await currentPromise;
    if (resolved) result = resolved;

    const len = this.requestInterceptors.length;
    for (let i = startIndex + 1; i < len; i++) {
      const nextConfig = this.requestInterceptors[i](result);
      if (nextConfig instanceof Promise) {
        const res = await nextConfig;
        if (res) result = res;
      } else if (nextConfig) {
        result = nextConfig;
      }
    }
    return result;
  }

  /**
   * Применяет респонс-интерцепторы аналогичным гибридным способом.
   */
  applyResponse(response: any): any {
    let result = response;
    const len = this.responseInterceptors.length;

    for (let i = 0; i < len; i++) {
      const nextResponse = this.responseInterceptors[i](result);

      if (nextResponse instanceof Promise) {
        return this.applyResponseAsync(i, nextResponse, result);
      }

      if (nextResponse) result = nextResponse;
    }
    return result;
  }

  private async applyResponseAsync(
    startIndex: number,
    currentPromise: Promise<any>,
    currentResult: any,
  ): Promise<any> {
    let result = currentResult;
    const resolved = await currentPromise;
    if (resolved) result = resolved;

    const len = this.responseInterceptors.length;
    for (let i = startIndex + 1; i < len; i++) {
      const nextResponse = this.responseInterceptors[i](result);
      if (nextResponse instanceof Promise) {
        const res = await nextResponse;
        if (res) result = res;
      } else if (nextResponse) {
        result = nextResponse;
      }
    }
    return result;
  }

  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.hasRequest = false;
    this.hasResponse = false;
  }
}
