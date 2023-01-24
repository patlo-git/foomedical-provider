import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { HeaderBar } from './HeaderBar';

async function setup(url='/', medplum = new MockClient()): Promise<void> {
  await act(async() => {
    render(
      <MemoryRouter
        initialEntries={[url]} initialIndex={0}>
        <MedplumProvider medplum={medplum}>
          <HeaderBar />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('Header bar tabs render', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });

    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });
  });

  test('Worklist', async () => {
    await setup();

    const tab = screen.getByRole('tab', { name: 'Worklist' });
    
    expect(tab).toBeInTheDocument;
  });
  
  test('Patients', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Patients' })).toBeInTheDocument();
  });
  
  test('Visits', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Visits' })).toBeInTheDocument();
  });
  
  test('Forms', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Forms' })).toBeInTheDocument();
  });
  
  test('Reports', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Reports' })).toBeInTheDocument();
  });

  test('Care Plans', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Care Plans' })).toBeInTheDocument();
  });

  test('Messages', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Messages' })).toBeInTheDocument();
  });

  test('Rx', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Rx' })).toBeInTheDocument();
  });

  test('Transition of Care', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Transition of Care' })).toBeInTheDocument();
  });

  test('Send Message', async () => {
    await setup();

    expect(screen.getByRole('tab', { name: 'Send Message' })).toBeInTheDocument();
  });
});