/**
 * Environment configuration for Protocol Buffers
 */

// Feature flag to enable/disable protobuf communication
// Set to true to use binary protobuf, false to use JSON
export const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

// Log the current mode on startup
if (typeof window === 'undefined') {
  console.log(`🔧 API Communication Mode: ${USE_PROTOBUF ? 'Protocol Buffers (Binary)' : 'JSON'}`);
}

/**
 * Get the appropriate Content-Type header based on protobuf flag
 */
export function getContentType(): string {
  return USE_PROTOBUF ? 'application/x-protobuf' : 'application/json';
}

/**
 * Get the appropriate Accept header based on protobuf flag
 */
export function getAcceptType(): string {
  return USE_PROTOBUF ? 'application/x-protobuf' : 'application/json';
}
