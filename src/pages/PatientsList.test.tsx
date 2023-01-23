import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientsList } from './PatientsList';

async function setup(url='/patients', medplum = new MockClient()): Promise<void> {
  await act(async() => {
    render(
      <MemoryRouter
        initialEntries={[url]} initialIndex={0}>
        <MedplumProvider medplum={medplum}>
          <PatientsList />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('Patients list', () => {
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

  test('Patients header', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Patients' })).toBeInTheDocument;
  });
  
  test('Name table header', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });
  
  test('DoB table header', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'DoB' })).toBeInTheDocument();
  });
  
  test('Email table header', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
  });

  
  test('Renders "New" button', async () => {
    await setup();
    const newButton = screen.getByRole('button', { name: 'New' });

    expect(newButton).toBeInTheDocument();
  });
  
  test('Renders "Import" button', async () => {
    await setup();
    const importButton = screen.getByRole('button', { name: 'Import' });
    
    expect(importButton).toBeInTheDocument();
  });
  
  test('Renders "View" button', async () => {
    await setup();
    const viewButton = screen.getAllByRole('button', { name: 'View' })[0];

    fireEvent.click(viewButton);

    expect(viewButton).toBeInTheDocument();
  });
});
