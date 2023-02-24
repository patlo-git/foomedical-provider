import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientsList } from './PatientsList';

const mockNav = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom') as any,
  useNavigate: () => mockNav,
}));

const medplum = new MockClient();

async function setup(): Promise<void> {
  await act(async() => {
    render(
      <MemoryRouter>
        <MedplumProvider medplum={medplum}>
          <PatientsList />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('Patients list', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await setup();
  });
  
  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });
    
    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  })

  test('Patients header', async () => {
    expect(screen.getByRole('heading', { name: 'Patients' })).toBeInTheDocument();
  });
  
  test('Name table header', async () => {
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });
  
  test('DoB table header', async () => {
    expect(screen.getByRole('columnheader', { name: 'DoB' })).toBeInTheDocument();
  });
  
  test('Email table header', async () => {
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
  });

  
  test('Renders "New" button', async () => {
    const newButton = screen.getByRole('button', { name: 'New' });

    expect(newButton).toBeInTheDocument();
  });
  
  test('Renders "Import" button', async () => {
    const importButton = screen.getByRole('button', { name: 'Import' });
    
    expect(importButton).toBeInTheDocument();
  });
  
  test('View button navigates to patient page', async () => {
    const viewButton = screen.getAllByRole('button', { name: 'View' })[0];
    const patient = medplum.searchResources('Patient').read();

    const patientId = patient[0].id;

    fireEvent.click(viewButton);
    
    expect(mockNav).toHaveBeenCalledWith(`/Patient/${patientId}`);
  });
});
