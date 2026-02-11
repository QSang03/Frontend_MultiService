import { NextResponse } from 'next/server';
import { getRefreshToken, updateTokens, deleteSession } from '@/lib/auth/session';
import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import { RefreshResponse } from '@/types/auth';
import { protoRefreshToken } from '@/lib/proto/auth-client';

const USE_PROTOBUF = process.env.NEXT_PUBLIC_USE_PROTOBUF === 'true';

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    // Use protobuf if enabled
    if (USE_PROTOBUF) {
      const result = await protoRefreshToken(refreshToken);
      
      if (!result.success || !result.response) {
        console.error('Protobuf refresh token failed:', result.error);
        await deleteSession();
        return NextResponse.json({ error: result.error || 'Refresh failed' }, { status: 401 });
      }

      const { tokens, mfaRequired, user } = result.response;
      
      // If MFA required, return special response
      if (mfaRequired) {
        return NextResponse.json({
          mfa_required: true,
          mfa_token: result.response.mfaToken,
        });
      }

      // Update session with new tokens
      if (tokens) {
        await updateTokens(tokens.accessToken, tokens.refreshToken);
        return NextResponse.json({ 
          success: true, 
          accessToken: tokens.accessToken,
          user: user ? {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.fullName,
            organizationId: user.organizationId,
          } : undefined,
        });
      }

      return NextResponse.json({ error: 'No tokens in response' }, { status: 401 });
    }

    // Fallback to HTTP
    const response = await axios.post<RefreshResponse>(
      `${API_BASE_URL}/v1/auth/refresh`, 
      { refresh_token: refreshToken }
    );

    const { access_token, refresh_token } = response.data;

    if (access_token && refresh_token) {
        await updateTokens(access_token, refresh_token);
        return NextResponse.json({ 
            success: true, 
            accessToken: access_token
        });
    }

    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });

  } catch (error) {
    console.error('Refresh API Route Error:', error);
    await deleteSession();
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
  }
}
