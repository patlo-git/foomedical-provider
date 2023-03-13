import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { Appointment, ServiceRequest, Observation, DiagnosticReport, RequestGroup, DocumentReference } from '@medplum/fhirtypes';
import { createReference } from '@medplum/core';
import { act, render } from '@testing-library/react';
import crypto, { randomUUID } from 'crypto';
import React, { useEffect, useState as useStateMock } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientPage } from './PatientPage';
import { PatientsList } from './PatientsList';

// jest.mock('react', ()=>({
//   ...jest.requireActual('react'),
//   useState: jest.fn()
// }))

// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom') as any,
//   useNavigate: () => mockNavigate,
// }));

// for resize observer Reference Error I was getting
// global.ResizeObserver = jest.fn().mockImplementation(() => ({
//   observe: jest.fn(),
//   unobserve: jest.fn(),
//   disconnect: jest.fn(),
// }));

const mockClient = new MockClient();

async function setup(url: string): Promise<void> {
  await act(async() => {
    render(
      <MemoryRouter initialEntries={[url]}>
        <MedplumProvider medplum={mockClient}>
          <PatientPage />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('Patient Page', () => {
  const setState = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useStateMock: any = (initState: any) => [initState, setState];

  beforeEach(async () => {
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

  afterEach(() => {
    jest.resetAllMocks();
  })

  test.skip("Patient Page calls setState", async () => {
    jest.spyOn(React, 'useState').mockImplementation(useStateMock);

    await setup(`/Patient/123`);
    
    expect(setState).toHaveBeenCalledTimes(1);
  });

  test("Mock Client has resources", async () => {
    // jest.spyOn(React, 'useState').mockImplementation(useStateMock);

    // Patient
    const patient = await mockClient.readResource('Patient', '123');
    console.log('patient: ', patient)

    // Appointments
    const mockAppointment: Appointment = {
        resourceType: 'Appointment',
        participant: [patient],
        // meta: { lastUpdated },
        serviceCategory: [{
          text: 'Counselling',
          coding: [{
            code: '8',
            display: 'Counselling',
          }]
        }],
        serviceType: [{
          text: 'Crisis Assistance',
          coding: [{
            code: '309',
            display: 'Crisis Assistance'
          }]
        }],
        start: "2023-09-22T05:49:00.000Z",
        end: "2023-09-22T06:49:00.000Z",
        status: 'proposed',
      };

    const mockAppointments = await mockClient.createResource(mockAppointment);
  
    console.log('mockAppointments: ', mockAppointments);
    /*
    // Orders
    const serviceRequestData: ServiceRequest = {
      resourceType: 'ServiceRequest',
      subject: createReference(patient), // link this ServiceRequest to the Patient
      code: {
        coding: [
          {
            system: 'https://samplelab.com/tests',
            code: 'SAMPLE_SKU',
          },
        ],
      },
      // status and intent are required but not on the PatientPage query
      // the above is from the Medplum docs of creating Fhir data, so why didn't they add these "required" properties?
    };

    const serviceRequest = await mockClient.createResource(serviceRequestData);
    console.log('service request: ', serviceRequest)

    // Reports - Diagnostic Report
    // create the observations then the report
    // they're tied to Service Request
    // Observation type 

    // Create two observations from the array
    const observationData: Observation[] = [
      {
        resourceType: 'Observation',
        basedOn: [createReference(serviceRequest)], // Connect this Observation to the ServiceRequest
        subject: createReference(patient), // Connect this Observation to the Patient
        status: 'preliminary',
        code: {
          coding: [
            {
              system: 'https://samplelabtests.com/tests',
              code: 'A1c',
              display: 'A1c',
            },
          ],
        },
        valueQuantity: {
          value: 5.7,
          unit: 'mg/dL',
          system: 'http://unitsofmeasure.org',
          code: 'mg/dL',
        },
      },
      {
        resourceType: 'Observation',
        basedOn: [createReference(serviceRequest)], // Connect this Observation to the ServiceRequest
        subject: createReference(patient), // Connect this Observation to the Patient
        status: 'preliminary',
        code: {
          coding: [
            {
              system: 'https://samplelabtests.com/tests',
              code: 'blood_glucose',
              display: 'Blood Glucose',
            },
          ],
        },
        valueQuantity: {
          value: 100,
          unit: 'mg/dL',
          system: 'http://unitsofmeasure.org',
          code: 'mg/dL',
        },
      },
    ];

    // Map through the observation data to create all the observations
    const observations = await Promise.all(observationData.map(async (data) => mockClient.createResource(data)));

    // we've created the observations now to create the report
    const reportData: DiagnosticReport = {
      resourceType: 'DiagnosticReport',
      basedOn: [createReference(serviceRequest)], // Connect this DiagnosticReport to the ServiceRequest
      subject: createReference(patient), // Connect this DiagnosticReport to the Patient,
      status: 'preliminary',
      code: {
        coding: [
          {
            system: 'https://samplelab.com/testpanels',
            code: 'SAMPLE_SKU',
          },
        ],
      },
      result: observations.map(createReference), // Create an array of references to the relevant observations
    };
    const reports = await mockClient.createResource(reportData);
    console.log('Created Report result', reports.result);

    // Request Groups
    // why isn't it giving me errors about other required props like it does about resource group?
    // Property 'resourceType' is missing in type '{}' but required in type 'RequestGroup'
    const requestGroups: RequestGroup = {
      resourceType: 'RequestGroup', 
    }

    // Clinical Notes
    const clinicalNotes: DocumentReference = {
      resourceType: 'DocumentReference',
    }
    */
  
    // const mockResponse = {
    //   data: {
    //     patient: patient,
    //     appointments: [mockAppointments],
    //     orders: [serviceRequest],
    //     reports: [reports],
    //     requestGroups: [requestGroups],
    //     clinicalNotes: [clinicalNotes],
    //   }
    // }

    await setup(`/Patient/${patient.id}`);

    expect('Overview').toBeInTheDocument;
    expect('Visits').toBeInTheDocument;
    expect('Labs & Imaging').toBeInTheDocument;

    const mockResult = await mockClient.graphql(
      `patient: Patient(id: '${patient.id}') {
          resourceType
          id
          name {
            given
            family
          }
        }
      }`
    );
    
    console.log('graphql result', await mockResult);

    // await waitFor(() => screen.getByText('Overview'));

    // expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  test.skip('graphql', async () => {
    const medplum = new MockClient();
    const result = await medplum.graphql(`{
      patient: Patient(id: "123") {
        resourceType,
        id,
        meta { lastUpdated },
        birthDate,
        name { given, family },
        telecom { system, value },
        address { line, city, state },
        photo { contentType, url }
      }`);
    console.log(result);
    expect(result).toBeDefined();
  });
});