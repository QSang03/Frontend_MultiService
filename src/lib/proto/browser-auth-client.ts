// Stubbed browser proto client — disabled due to runtime compatibility issues.
export async function browserProtoLogin(_email: string, _password: string) {
  void _email;
  void _password;
  throw new Error('browserProtoLogin is disabled on this build; use server HTTP fallback');
}
