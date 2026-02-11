export type ServiceCategoryDto = {
  id: string;
  name: string;
  description?: string;
  attributesSchema?: string;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  status?: number;
};

export function timestampToIso(ts?: unknown): string | undefined {
  if (!ts) return undefined;
  const t = ts as Record<string, unknown>;
  const secondsField = t['seconds'];
  const secondsRaw = (secondsField == null)
    ? undefined
    : (typeof secondsField === 'number' || typeof secondsField === 'string' ? secondsField : String(secondsField));
  if (secondsRaw == null) return undefined;
  const seconds = Number(secondsRaw);
  if (Number.isNaN(seconds)) return undefined;
  const nanos = Number((t.nanos as number | undefined) ?? 0);
  const ms = seconds * 1000 + Math.floor(nanos / 1e6);
  try {
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Recursively converts BigInt values to numbers/strings for JSON serialization.
 * Protobuf uses BigInt for int64 fields which JSON.stringify cannot handle.
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    // Convert to number if safe, otherwise string
    const num = Number(obj);
    if (Number.isSafeInteger(num)) {
      return num as unknown as T;
    }
    return String(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result as T;
  }
  
  return obj;
}

export function normalizeCategory(c: unknown): ServiceCategoryDto {
  const obj = (c as Record<string, unknown>) || {};
  const id = String(obj.id ?? obj.categoryId ?? obj.category_id ?? '');
  const name = String(obj.name ?? '');
  const description = obj.description == null ? undefined : String(obj.description);
  const attributesSchema = (obj.attributesSchema ?? obj.attributes_schema) as string | undefined;
  const parentId = (obj.parentId ?? obj.parent_id ?? null) as string | null | undefined;
  const createdAt = timestampToIso(obj.createdAt ?? obj.created_at);
  const updatedAt = timestampToIso(obj.updatedAt ?? obj.updated_at);
  const createdBy = obj.createdBy == null ? undefined : String(obj.createdBy);
  const statusRaw = obj.status as number | string | undefined;
  const status = statusRaw == null ? undefined : Number(statusRaw);

  return {
    id,
    name,
    description,
    attributesSchema,
    parentId,
    createdAt,
    updatedAt,
    createdBy,
    status: Number.isNaN(status) ? undefined : status,
  };
}
