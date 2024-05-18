import { config } from 'dotenv';
import { env } from 'process';
import { defineConfig, Options } from 'tsup';

if (!('NODE_ENV' in env)) config({ path: '.dev.vars' });

export default defineConfig(({ watch }) => {
	const options: Options = {
		clean: !watch,
		entry: ['src/index.ts'],
		format: 'esm',
		external: ['dotenv'],
		minify: true,
		target: 'esnext',
		sourcemap: env.NODE_ENV === 'development' ? 'inline' : undefined,
	};

	return options;
});
