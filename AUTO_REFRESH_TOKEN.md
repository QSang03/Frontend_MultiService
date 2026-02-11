# Auto-Refresh Token Implementation

## Vấn đề đã fix

Trước đây khi access token hết hạn và F5 trang:
- ❌ Server actions (protoGetProfile, etc.) gọi backend → 401 unauthenticated
- ❌ Không tự động refresh token
- ❌ User phải logout/login lại

## Giải pháp triển khai

### Server Actions Auto-Retry (`src/lib/proto/auth-client.ts`)
✅ **Tự động retry khi gặp unauthenticated error**

**Helper functions:**
- `refreshAccessToken()`: Call `/api/auth/refresh` endpoint
- `executeWithRefresh<T>()`: Wrapper tự động retry 1 lần nếu gặp error code 16 (unauthenticated)

**Methods đã wrap:**
- ✅ `protoGetProfile()`
- ✅ `protoUpdateProfile()`
- ✅ `protoMfaGenerate()`
- ✅ `protoMfaVerify()`
- ✅ `protoMfaDisable()`
- ✅ `protoGetRecoveryCodes()`

**Flow:**

```
protoGetProfile() called
  → gRPC call with old token
    → 401 unauthenticated?
      → executeWithRefresh detects error
        → Call refreshAccessToken()
          → Fetch /api/auth/refresh
            → Update cookies
              → Retry protoGetProfile() with new token
                → Success ✅
```

### Client-side Axios Interceptor (`src/lib/axios.ts`)
✅ **Auto-refresh cho HTTP calls**
- Response interceptor catch 401
- Call `/api/auth/refresh`
- Retry original request
- Prevent concurrent refresh với `isRefreshing` flag

## Test Cases

### Test 1: F5 trang khi token hết hạn
1. Login vào hệ thống
2. Đợi 15 phút (access_token expires) HOẶC xóa `access_token` cookie manually
3. F5 trang profile
4. **Expected:** 
   - Console log: `[executeWithRefresh] Unauthenticated error, attempting refresh...`
   - Console log: `[executeWithRefresh] Refresh successful, retrying operation...`
   - Page load bình thường với dữ liệu profile

### Test 2: Server action khi token hết hạn
1. Login và vào profile page
2. Xóa `access_token` cookie manually (DevTools)
3. Click "Cập nhật" profile
4. **Expected:** 
   - Console log: `[executeWithRefresh] Unauthenticated error, attempting refresh...`
   - Console log: `[executeWithRefresh] Refresh successful, retrying operation...`
   - Update thành công

### Test 3: HTTP call khi token hết hạn
1. Xóa `access_token` cookie
2. Gọi API thông qua axios (ví dụ: lấy danh sách orders)
3. **Expected:**
   - Axios interceptor catch 401
   - Auto-refresh token
   - Retry request thành công

## Console Logs để debug

Khi refresh thành công, bạn sẽ thấy:
```
[createAuthenticatedClient] Access token exists: false
[createAuthenticatedClient] No token found, attempting refresh...
[createAuthenticatedClient] After refresh, token exists: true
[protoGetProfile] Calling getProfile...
[protoGetProfile] Response: { ... }
```

HOẶC nếu gặp lỗi trong lúc call:
```
[protoGetProfile] Error: [unauthenticated] Missing authorization metadata
[executeWithRefresh] Unauthenticated error, attempting refresh...
[executeWithRefresh] Refresh successful, retrying operation...
[protoGetProfile] Response: { ... }
```

## Cấu hình

Không cần config thêm - tất cả đã tích hợp sẵn!

## Notes

- Middleware chỉ chạy server-side (trước khi render page)
- `executeWithRefresh` chỉ retry 1 lần (prevent infinite loop)
- Refresh endpoint (`/api/auth/refresh`) sử dụng protobuf khi `NEXT_PUBLIC_USE_PROTOBUF=true`
