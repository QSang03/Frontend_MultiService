#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Script to generate TypeScript files from Protocol Buffer definitions
 * Run: npm run proto:generate
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROTO_DIR = path.join(__dirname, '..', 'proto');
const OUT_DIR = path.join(__dirname, '..', 'src', 'generated');

// If local proto directory is missing, skip generation and rely on @buf packages.
if (!fs.existsSync(PROTO_DIR)) {
  console.log(`ℹ️  Proto directory not found at ${PROTO_DIR}. Skipping generation — using installed @buf packages.`);
  process.exit(0);
}

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Get all .proto files
const protoFiles = fs.readdirSync(PROTO_DIR).filter(f => f.endsWith('.proto'));

console.log('🔧 Generating TypeScript from Protocol Buffers...');
console.log(`📁 Proto directory: ${PROTO_DIR}`);
console.log(`📁 Output directory: ${OUT_DIR}`);
console.log(`📄 Found ${protoFiles.length} .proto files`);

if (protoFiles.length === 0) {
  console.log('ℹ️  No .proto files found in proto/. Skipping generation — using installed @buf packages if available.');
  process.exit(0);
}

// NOTE: Previously this script skipped generation if the @buf package
// was present (to prefer published generated artifacts). For local
// development we always generate from ./proto so we continue even if
// the @buf package exists in node_modules.
// const bufPkgPath = path.join(__dirname, '..', 'node_modules', '@buf', 'nkc_multiservice.bufbuild_es');
// if (fs.existsSync(bufPkgPath)) {
//   console.log(`ℹ️  Found installed @buf package at ${bufPkgPath}. Skipping local protoc generation.`);
//   process.exit(0);
// }

try {
  // Use ts-proto to generate TypeScript
  const tsProtoPath = path.join(__dirname, '..', 'node_modules', '.bin', 'protoc-gen-ts_proto.cmd');
  
  const command = `protoc --plugin="protoc-gen-ts_proto=${tsProtoPath}" --ts_proto_out="${OUT_DIR}" --ts_proto_opt=esModuleInterop=true,outputEncodeMethods=true,outputJsonMethods=true,useOptionals=messages --proto_path="${PROTO_DIR}" ${protoFiles.map(f => `"${path.join(PROTO_DIR, f)}"`).join(' ')}`;
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('✅ TypeScript generation complete!');
  console.log(`📦 Generated files in: ${OUT_DIR}`);
  
} catch (error) {
  console.error('❌ Error generating TypeScript:', error.message);
  process.exit(1);
}
