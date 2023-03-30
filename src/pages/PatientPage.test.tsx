import { MockClient, HomerSimpson } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { Patient, Appointment, ServiceRequest, Observation, DiagnosticReport, RequestGroup, DocumentReference, Bundle, SearchParameter } from '@medplum/fhirtypes';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import crypto, { randomUUID } from 'crypto';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientPage } from './PatientPage';
import { createReference, indexStructureDefinitionBundle, indexSearchParameterBundle } from '@medplum/core';
import { readJson } from '@medplum/definitions';

const medplum = new MockClient();

// For ReferenceError: ResizeObserver is not defined error
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

async function setup(url: string = '/Patient'): Promise<void> {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={[url]} initialIndex={0}>
        <MedplumProvider medplum={medplum}>
          <PatientPage />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
};

let mockPatient: Patient;
let mockAppointment: Appointment;
let mockOrders: ServiceRequest;
let mockReports: DiagnosticReport;
let mockRequestGroups: RequestGroup;
let mockClinicalNotes: DocumentReference;

describe('Patient Page', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    jest.clearAllMocks();
    await act(async () => {
      setup(`Patient/${mockPatient.id}`);
    })
  });
  
  beforeAll(async () => {
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-types.json') as Bundle);
    indexStructureDefinitionBundle(readJson('fhir/r4/profiles-resources.json') as Bundle);
    indexSearchParameterBundle(readJson('fhir/r4/search-parameters.json') as Bundle<SearchParameter>);
    
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });
    
    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });

    // Create Resources
    mockPatient = await medplum.createResource({
      resourceType: 'Patient',
      identifier: [
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'SS',
                display: 'Social Security Number',
              },
            ],
            text: 'Social Security Number',
          },
          system: 'http://hl7.org/fhir/sid/us-ssn',
          value: '999-47-3714',
        },
        {
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'DL',
                display: "Driver's License",
              },
            ],
            text: "Driver's License",
          },
          system: 'urn:oid:2.16.840.1.113883.4.3.25',
          value: 'S99985931',
        },
      ],
      id: randomUUID(),
      meta: {
        lastUpdated: "2023-03-27T22:42:02.818Z",
      },
      birthDate: '1978',
      name: [
        {
          given: ['Bruce'],
          family: 'Wayne',
        }
      ],
      telecom: [
        {
          system: 'phone',
          value: '555-555-5555',
        },
        {
          system: 'email',
          value: 'notbatman@example.com',
        },
      ],
      address: [
        {
          line: ['Wayne Manor'],
          city: 'Gotham',
          state: 'Il',
        }
      ],
      photo: [
        {
          contentType: 'image/jpeg',
          url: 'https://m.media-amazon.com/images/M/MV5BYWM1MDM2YzEtZGVjZi00NGJjLTg1ZmEtNmQ4YjRiOGUxNDRjXkEyXkFqcGdeQXVyMDc2NTEzMw@@._V1_.jpg'
        }
      ]
    });

    // modelled after Medplum mock patient, 'Kay Raynor'
    mockAppointment = await medplum.createResource({
      resourceType: 'Appointment',
      id: randomUUID(),
      meta: {
        lastUpdated: "2023-03-28T22:42:02.818Z"
      },
      serviceCategory: [
        {
          text: 'Counselling',
          coding: [
            {
              code: '8',
              display: 'Counselling',
            }
          ]
        }
      ],
      serviceType: [
        {
          text: 'Crisis Assistance',
          coding: [
            {
              code: '309',
              display: 'Crisis Assistance'
            }
          ]
        }
      ],
      start: "2023-05-16T05:49:00.000Z",
      end: "2023-05-16T06:49:00.000Z",
      status: 'proposed',
    });

    // Service Request - Labs and Imaging
    // partially modelled after Medplum mock patient, 'Russell Kuhn'
    mockOrders = await medplum.createResource({
      resourceType: 'ServiceRequest',
      // link this ServiceRequest to the Patient
      subject: createReference(mockPatient),
      id: randomUUID(),
      meta: {
        lastUpdated: '2023-03-29T16:55:02.818Z'
      },
      category: [
        {
          text: 'Imaging',
          coding: [
            {
              code: '363679005',
              display: 'Imaging',
            }
          ],
        },
      ],
      code: {
        text: 'Cranial MRI',
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '227',
            display: 'Cranial MRI',
          },
        ],
      },
      status: 'completed',
    });

    // Diagnostic Report - Labs and Imaging
    // modeled after Medplum mock patient, 'Gerardo Green'
    mockReports = await medplum.createResource({
      resourceType: 'DiagnosticReport',
      id: '0af4b01b-092e-4be6-9f7e-41bc7a134a41',
      meta: {
        lastUpdated: '2023-03-29T17:38:02.818Z',
      },
      code: {
        text: 'Diagnostic Report',
      },
    });

    // Request Group - Care Plans 
    // modelled after mock patient, 'Ryan Baily' and 'Kay Raynor'
    mockRequestGroups = await medplum.createResource({
      resourceType: 'RequestGroup',
      id: randomUUID(),
      status: 'draft',
      intent: 'proposal',
      meta:
      {
        lastUpdated: '2023-03-29T17:50:02.818Z',
      },
      code: {
        text: "COVID 19 Assessment",
      },
      action: [
        {
          id: 'action-0',
          title: 'Initial Consultation',
          resource:
          {
            reference: 'Task/29b10f2d-91a9-48ed-92b8-b4ea5aa09bca'
          },
        },
        {
          id: 'action-1',
          title: 'COVID-19 Symptoms Assessment',
          resource:
          {
            reference: 'Task/e67d0c42-08b6-415a-90a9-5174eb571fd'
          },
        },
        {
          id: 'action-2',
          title: 'COVID-19 PCR Test',
          resource:
          {
            reference: 'Task/2ab107d9-69e6-41cf-8175-bf2ad4ccd947'
          },
        }
      ]
    });

    // Document Reference
    // partially modelled after mock patient, 'Johnathan Kemmer'
    // error message on .content
    mockClinicalNotes = await medplum.createResource({
      resourceType: 'DocumentReference',
      id: randomUUID(),
      description: 'This is a clinical note',
      type: {
        text: 'Consult Note',
        coding: [
          {
            code: '11488-4',
          },
        ],
      },
      content: [
        {
          attachment: {
            url: 'https://hl7.org/fhir/us/core/stu3.1.1/StructureDefinition-us-core-documentreference.html',
          },
        },
      ],
    });

  });

  test('Simple route', async () => {
    const client = new MockClient();
    const result = await client.get(`fhir/R4/Patient/123`);
    expect(result).toMatchObject(HomerSimpson);
  });

  test('Mock patient is created', async () => {
    console.log('mock patient: ', mockPatient)
    expect(mockPatient).toBeDefined();

    // would love to be able to searching something other than a SSN
    const existingPatient = await medplum.searchOne('Patient', `identifier=999-47-3714`);

    console.log('existing patient: ', existingPatient)
    expect(existingPatient).toBeDefined();
    expect(existingPatient).toEqual(mockPatient);
  });
  
  test('Graphql call on mockclient returns newly created mock data', async () => {
    const result = await medplum.graphql(`{
      patient: Patient(id: "${mockPatient.id}") {
        resourceType,
        id,
        meta { lastUpdated },
        birthDate,
        name { given, family },
        telecom { system, value },
        address { line, city, state },
        photo { contentType, url }
      }
    }`);

    console.log('graphql result: ', result);

    expect(result).toBeDefined();
  });

  // Patient Page response data is currently an empty object
  test.skip('Mock patient renders following graphql call', async () => {
    const result = await medplum.graphql(`{
      patient: Patient(id: "${mockPatient.id}") {
        resourceType,
        id,
        meta { lastUpdated },
        birthDate,
        name { given, family },
        telecom { system, value },
        address { line, city, state },
        photo { contentType, url }
      }
    }`);

    console.log('graphql result: ', result)

    // const mockName = await waitFor(() => screen.getByText('Bruce Wayne'));
    
    // expect(mockName).toBeInTheDocument();
  });
  
  test.skip('Overview renders', async () => {
    screen.getAllByText('Overview');
    screen.getByText('Appointment');
    
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Service Request'}));
    });

    expect(screen.getByText('completed')).toBeInTheDocument();
  });
  
  test.skip('Mock appointments render', async () => {
    
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Visits'}));
    });

    expect(screen.getByText('Counselling')).toBeInTheDocument();
  });
  
});