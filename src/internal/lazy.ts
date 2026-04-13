/**
 * Minimal Lazy implementation for deferred value initialization.
 *
 * @internal
 */

/**
 * Creates a lazily initialized value.
 * Executes the initialization function on first call to `force()`,
 * subsequent calls return the cached value.
 *
 * @param init - Initialization function, executed on first call to force().
 * @returns Lazy wrapper with a `force()` method.
 */
export function Lazy<T>(init: () => T): { force(): T; } {
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
