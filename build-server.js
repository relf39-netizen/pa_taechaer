import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/server.cjs',
    format: 'cjs',
    external: ['express'], // express should be in node_modules in production
  });
  console.log('Server built successfully');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
