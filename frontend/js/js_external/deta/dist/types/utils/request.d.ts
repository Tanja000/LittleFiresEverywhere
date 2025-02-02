import { KeyType } from '../types/key';
interface RequestInit {
    payload?: any;
    headers?: {
        [key: string]: string;
    };
}
interface GetConfig {
    blobResponse: boolean;
}
interface Response {
    status: number;
    response?: any;
    error?: Error;
}
export default class Requests {
    private requestConfig;
    constructor(key: string, type: KeyType, baseURL: string);
    put(uri: string, payload: any): Promise<Response>;
    delete(uri: string, payload?: any): Promise<Response>;
    get(uri: string, config?: GetConfig): Promise<Response>;
    post(uri: string, init: RequestInit): Promise<Response>;
    patch(uri: string, payload?: any): Promise<Response>;
    private static fetch;
}
export {};
