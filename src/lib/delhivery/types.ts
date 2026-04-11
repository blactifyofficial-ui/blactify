export interface DelhiveryResponse {
    success: boolean;
    data?: Record<string, unknown> | string;
    message?: string;
    details?: unknown;
    waybills?: string[];
    packages?: Array<Record<string, unknown>>;
}
