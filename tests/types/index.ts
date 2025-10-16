export interface MockRedis {
  store: Map<string, string>;
  set: (key: string, value: string, options?: any) => Promise<void>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<boolean>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isReady: () => boolean;
  getClient: () => any;
}
