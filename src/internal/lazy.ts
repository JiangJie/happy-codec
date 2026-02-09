/**
 * Minimal Lazy implementation for deferred value initialization.
 *
 * @internal
 */

/**
 * Lazy wrapper that defers value computation until first access.
 */
export interface Lazy<T> {
    /**
     * Forces computation and returns the value.
     * Executes the initialization function on first call, subsequent calls return the cached value.
     */
    force(): T;
}

/**
 * Creates a lazily initialized value.
 *
 * @param init - Initialization function, executed on first call to force().
 * @returns Lazy wrapper.
 */
export function Lazy<T>(init: () => T): Lazy<T> {
    let value: T;
    let initialized = false;

    return {
        force(): T {
            if (!initialized) {
                value = init();
                initialized = true;
            }
            return value;
        },
    };
}
