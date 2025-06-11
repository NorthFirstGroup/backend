interface WebConfig {
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
    port: number;
}

const webConfig: WebConfig = {
    logLevel: (process.env.LOG_LEVEL as WebConfig['logLevel']) || 'debug',
    port: parseInt(process.env.PORT || '3000', 10)
};

export default webConfig;
export type { WebConfig };
