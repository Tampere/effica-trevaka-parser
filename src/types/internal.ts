export type TransformFunction = (returnAll: boolean) => Promise<any>;
export type TransformOperation = { name: string, function: TransformFunction }