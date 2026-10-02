import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rustProtos = path.resolve('r:/rust/protos');
if (fs.existsSync(rustProtos)) {
  try {
    console.log('🔄 Syncing fresh Protobuf definitions from r:/rust/protos...');
    execSync('npx -y @bufbuild/buf generate', { cwd: rustProtos, stdio: 'inherit' });
    console.log('✅ Fresh protos synced from Rust backend successfully.');
  } catch (err) {
    console.warn('⚠️ Could not sync from r:/rust/protos:', err.message);
  }
} else {
  console.log('ℹ️ r:/rust/protos not found, keeping installed @buf package.');
}
