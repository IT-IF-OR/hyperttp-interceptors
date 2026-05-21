export interface InterceptorOptions {
  /**
   * @ru Включить перехватчика
   * @en Enable interceptor
   */
  enabled?: boolean;
}

export type RequestInterceptor = (config: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}) => any | Promise<any>;

export type ResponseInterceptor = (response: {
  status: number;
  headers: Record<string, any>;
  body: Buffer;
  url: string;
}) => any | Promise<any>;

/**
 * @ru Данные тела запроса
 * @en Request body data
 */
export type RequestBodyData = any | null | undefined;
