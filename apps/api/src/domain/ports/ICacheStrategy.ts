interface ICacheStrategy<T> {
    get(key: string): Promise<T | null>;

    set(key: string, value: T, ttl?: number): Promise<void>;

    invalidate(key: string): Promise<void>;
}
