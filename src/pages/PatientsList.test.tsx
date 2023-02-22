import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import * as router from 'react-router';
import { MemoryRouter } from 'react-router-dom'; // can you just use memory router and is it better to do so? trying not to install another package.
import { TextEncoder } from 'util';
import { PatientsList } from './PatientsList';

const medplum = new MockClient()
const navigate = jest.fn();

async function setup(url='/patients'): Promise<void> {
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
  beforeEach(async () => {
    window.localStorage.clear();
    jest.spyOn(router, 'useNavigate').mockImplementation(() => navigate);
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
  
  test('View button goes somewhere', async () => {
    const viewButton = screen.getAllByRole('button', { name: 'View' })[0];
    const patients = medplum.searchResources('Patient').read();

    const patientId = patients[0].id;

    fireEvent.click(viewButton);
    
    expect(navigate).toHaveBeenCalledWith(`/Patient/${patientId}`);
  });
});
