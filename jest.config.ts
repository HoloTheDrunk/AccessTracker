import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    moduleFileExtensions: ['ts', 'js'],
    transform: { '^.+\\.ts?$': 'ts-jest' }
};

export default config;
