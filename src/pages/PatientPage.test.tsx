import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import React from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientPage } from './PatientPage';
import { Appointment, Patient } from '@medplum/fhirtypes';
import { PatientsList } from './PatientsList';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom') as any,
  useNavigate: () => mockNavigate,
}));

// for resize observer Reference Error I was getting
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

const mockClient = new MockClient();

async function setup(): Promise<void> {
  /*
    // From https://www.medplum.com/docs/fhir-datastore/create-fhir-data
    // Generate an example MRN (Medical Record Number)
    // We will use this in the "conditional create"
    const patientData: Patient = {
      resourceType: 'Patient',
      name: [{ given: ['Party'], family: 'Test' }],
      birthDate: '2020-01-01',
      gender: 'female',
      identifier: [
        {
          system: 'https://namespace.example.health/',
          value: '773',
        },
      ],
    };

    // When creating an order, and if you don't know if the patient exists, you can use this MRN to check. Use this search criterion to make sure the 'identifier=' criterion for a conditional create
    // See the FHIR "conditional create" operation for full details: https://www.hl7.org/fhir/http.html#ccreate

    // ccreate is trial use
    const patient = await mockClient.createResourceIfNoneExist(patientData, 'identifier=' + '773');
    console.log('Created Patient: ', patient.id)

    const appointments: Appointment = {
      resourceType: 'Appointment',
      id: patient.id,
      status: 'booked',
      participant: [patientData]
    };

    // const appointment = await mockClient.createResource<Appointment>(appointments);
    // console.log('appointment: ', appointment);
    console.log('patient: ', patient);
  
  const mockGraphQLResponse = {
    data: {
      patient: patient,
      appointments: appointments,
      orders: [],
      reports: [],
      requestGroups: [],
      clinicalNotes: [],
    }
  }

  // console.log('mock response: ', mockGraphQLResponse)
  */
  await act(async() => {
    render(
      <MemoryRouter>
        <MedplumProvider medplum={mockClient}>
          <PatientPage />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('Patient Page', () => {
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

  test("Mock Client has resources", async () => {
    await waitFor(() => screen.getByText('Mia Wallace'));

    expect(screen.getByText('Mia Wallace')).toBeInTheDocument();
  });
});