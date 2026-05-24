export interface InterceptorOptions {
  /**
   * @ru Включить перехватчики
   * @en Enable interceptors
   */
  enabled?: boolean;
}

export type RequestInterceptor = (config: {
  url: string;
  method: string;
  headers: Record<string, string | string[]>;
  body?: any;
}) => any | Promise<any>;

export type ResponseInterceptor = (response: {
  status: number;
  headers: Record<string, string | string[]>;
  body: any;
  url: string;
}) => any | Promise<any>;
