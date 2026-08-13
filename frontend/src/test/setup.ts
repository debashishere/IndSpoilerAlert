import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.stubEnv('VITE_USE_DEV_MOCK_AUTH', 'true');

