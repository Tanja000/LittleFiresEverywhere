import { KeyType } from '../types/key';
import { PutOptions, ListOptions } from '../types/drive/request';
import { GetResponse, PutResponse, ListResponse, DeleteResponse, DeleteManyResponse } from '../types/drive/response';
export default class Drive {
    private requests;
    constructor(key: string, type: KeyType, projectId: string, driveName: string, host?: string);
    get(name: string): Promise<GetResponse>;
    delete(name: string): Promise<DeleteResponse>;
    deleteMany(names: string[]): Promise<DeleteManyResponse>;
    list(options?: ListOptions): Promise<ListResponse>;
    put(name: string, options: PutOptions): Promise<PutResponse>;
    private upload;
}
