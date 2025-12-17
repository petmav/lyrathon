import '@testing-library/jest-dom';

// Fill missing text encoder/decoder for likely JSDOM environment
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });
