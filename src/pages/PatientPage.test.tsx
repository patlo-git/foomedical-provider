import { MockClient, HomerSimpson } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { Patient, Appointment, ServiceRequest, Observation, DiagnosticReport, RequestGroup, DocumentReference, Bundle, SearchParameter } from '@medplum/fhirtypes';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import crypto from 'crypto';
import React, { Suspense } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientPage } from './PatientPage';
import { createReference, indexStructureDefinitionBundle, indexSearchParameterBundle } from '@medplum/core';
import { readJson } from '@medplum/definitions';
import { Loading } from '../components/Loading';

// For ReferenceError: ResizeObserver is not defined error
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const medplum = new MockClient();

let mockPatient: Patient;
let mockAppointment: Appointment;
let mockOrders: ServiceRequest;
let mockReports: DiagnosticReport;
let mockRequestGroups: RequestGroup;
let mockClinicalNotes: DocumentReference;

describe('Patient Page', () => {
  // the following setup is based on @medplum/app BulkAppPage.test
  async function setup(url = '/Patient'): Promise<void> {
    await act(async () => {
      render(
        <MedplumProvider medplum={medplum}>
          <MemoryRouter initialEntries={[url]} initialIndex={0}>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/Patient/:id" element={<PatientPage />} />
                <Route path="/Patient/:id/:tab" element={<PatientPage />} />
                <Route path="/Patient/:id/:tab/:resourceId" element={<PatientPage />} />
              </Routes>
            </Suspense>
          </MemoryRouter>
        </MedplumProvider>
      );
    });
  }
  
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
      // id is created when resource is submitted to the server using create operation
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

    // modelled on Medplum mock patient, 'Kay Raynor'
    mockAppointment = await medplum.createResource({
      resourceType: 'Appointment',
      participant: [
        { 
          actor: createReference(mockPatient), 
          status: 'needs-action',
        },
      ],
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

    // Service Request - Labs and Imaging resource
    // partially modelled on Medplum mock patient, 'Russell Kuhn'
    mockOrders = await medplum.createResource({
      resourceType: 'ServiceRequest',
      subject: createReference(mockPatient),
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
    
    // Creating a Diagnostic Report
    // https://www.medplum.com/docs/fhir-datastore/create-fhir-data
    // Create the Observations
    // Create two observations from the array
    const observationData: Observation[] = [
      {
        resourceType: 'Observation',
        basedOn: [createReference(mockOrders)], // Connect this Observation to the ServiceRequest
        subject: createReference(mockPatient), // Connect this Observation to the Patient
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
        basedOn: [createReference(mockOrders)], // Connect this Observation to the ServiceRequest
        subject: createReference(mockPatient), // Connect this Observation to the Patient
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
    const observations = await Promise.all(observationData.map(async (data) => medplum.createResource(data)));

    // Diagnostic Report - Labs & Imaging resource
    // modeled on Medplum mock patient, 'Gerardo Green'
    mockReports = await medplum.createResource({
      resourceType: 'DiagnosticReport',
      basedOn: [createReference(mockOrders)], // Connect this DiagnosticReport to the ServiceRequest
      subject: createReference(mockPatient), // Connect this DiagnosticReport to the Patient,
      code: {
        text: 'Diagnostic Report',
        coding: [
          {
            system: 'https://samplelab.com/testpanels',
            code: 'SAMPLE_SKU',
          },
        ],
      },
      status: 'registered',
      category: [
        {
          text: 'cardiology',
          coding: [
            {
              code: 'cardiology',
              display: 'cardiology',
            }
          ]
        }
      ],
      presentedForm: [
        {
          contentType: 'application/pdf',
          title: 'report-patient-male-01.pdf',
          url: "https://storage.medplum.com/binary/d3bfeb9d-abc0-4058-ad26-73a5850c4e0e/1b760c1f-fea3-46f4-ad79-849b242c3de1?Expires=1680895449&Key-Pair-Id=K1PPSRCGJGLWV7&Signature=E7iooCL8uXZDCeFBQzDXUhnQnUM5wu7dz-kEIL5uWnlIgREoCMQpr3NBnMVSdDJWqAreSEpx5u9wlbvtZWGezYifOAYhxh9bmMhr5mZT3JGsSINAUHi5F96gzfx4fu3rU3yumVem46eMOhqAVKaJi9gSAt8rfx~rgfyqdSQn7IfLOgyRMdSGocXHXkx8aeMJamhe1SNOcgPGfZk9RnGqYdZPpzOj1sU162QCgu2h-BxGRHShm-2q9s7Qx2af~pqs2OPI3Q8RJwweXGH07FXYtnCIF0BwcKn4FQr4CzFjuABUN1tx2EofWgMIa5eBrnk9Kjq0Uq8f0VQWWSJDgNsd3A__"
        }
      ],
      identifier: [
        {
          system: 'https://provider.foomedical.com/',
          value: 'report-patient-male-01'
        }
      ],
      result: observations.map(createReference), // Create an array of references to the relevant observations
    });

    // Request Group - Care Plans 
    // modelled on mock patients, 'Ryan Baily' and 'Kay Raynor'
    mockRequestGroups = await medplum.createResource({
      resourceType: 'RequestGroup',
      subject: createReference(mockPatient),
      status: 'draft',
      intent: 'proposal',
      code: {
        text: "COVID-19 Assessment",
      },
      action: [
        {
          id: 'action-0',
          title: 'Initial Consultation',
          resource:
          {
            // Ideally we don't hardcode this
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
    // partially modelled on mock patient, 'Johnathan Kemmer'
    mockClinicalNotes = await medplum.createResource({
      resourceType: 'DocumentReference',
      description: `This is a clinical note for Bruce Wayne`,
      subject: createReference(mockPatient),
      category: [
        {
          text: 'clinical-note',
        },
      ],
      type: {
        text: 'Consult note - See the Joker',
        coding: [
          {
            code: '11488-4',
          },
        ],
      },
      content: [
        /*
        {
          // modelled on Medplum mock patient 'Kay Raynor'
          attachment: {
            url: 'https://storage.medplum.com/binary/6278687b-679c-40d4-a0dd-ac846191e940/99f46b2d-2d0b-46ae-ba0d-858a07289a6a?Expires=1681235171&Key-Pair-Id=K1PPSRCGJGLWV7&Signature=Qjo7T1qeRYokDfzK8Cs2AzaAMKnWHG6L2UO7ra4~Gtbyc1Q8sD4A4K8ZvJWE~y1nJayDCSsPstQYwCQ3TZ2k9w8c2lQFzeg9wlNtiBNHskXimy0pqYBKUGTHPpIiy-4cABLNzkLvl2tQYXeqpFaA8eooSNLwvOrERMfKHUubXBPpRtQSZ5GRgINugzC-TpcgGyXCuaDmkY9IYbUgc7Y80aS3w2C~qJw3UjcAS98K6wr9-77fC09d3-znP~k5lCQRqYmXg-jygHonlH8epR4Y72jgJJ-D6WzSODvta4GGDZYxuRwTX1EU4WQTGf9Gyyvwc2gbqG33VvvsdBLohoVIRg__',
          },
        },
        */
      ],
      status: 'current',
    });
  });

  beforeEach(async () => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('Simple route', async () => {
    const client = new MockClient();
    const result = await client.get(`fhir/R4/Patient/123`);
    expect(result).toMatchObject(HomerSimpson);
  });

  test('Mock patient is created', async () => {
    expect(mockPatient).toBeDefined();

    const identifier = mockPatient.identifier?.[0]?.value;

    const existingPatient = await medplum.searchOne('Patient', `identifier=${identifier}`);

    expect(existingPatient).toBeDefined();
    expect(existingPatient).toEqual(mockPatient);
  });
  
  test('Verify graphql call on mockclient returns newly created mock data', async () => {
    const query = `{
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
    }`;

    const result = await medplum.graphql(query);

    const { patient } = result.data;

    expect(result).toBeDefined();
    expect(patient).toBeDefined();
  });

  test('Mock patient renders following graphql call', async () => {
    await setup(`/Patient/${mockPatient.id}`);
    await waitFor(() => screen.getByText('Bruce Wayne'));
    
    expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
  });
  
  test('Overview tab with mock Appointments resource link renders', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: new URL('http://localhost'),
        assign: jest.fn(),
        configurable: true,
      },
      writable: true,
    });

    await setup(`/Patient/${mockPatient.id}`);

    screen.getByRole('tab', {  name: 'Overview' })
    screen.getByRole('heading', { name: 'Overview' })
    
    
    await waitFor(() => screen.getByRole('link', { name: 'Appointment'}));
    await waitFor(() => screen.getByRole('link', { name: 'Service Request'}));
    await waitFor(() => screen.getByRole('link', { name: 'Diagnostic Report'}));

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Appointment'}));
    });

    await setup(`/Patient/${mockPatient.id}/Appointment/${mockAppointment.id}`);

    expect(screen.getByRole('cell', { name: 'Counselling' })).toBeInTheDocument();
  });

  test('Overview tab with mock Service Request resource link renders', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: new URL('http://localhost'),
        assign: jest.fn(),
        configurable: true,
      },
      writable: true,
    });

    await setup(`/Patient/${mockPatient.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Service Request'}));
    });

    await setup(`/Patient/${mockPatient.id}/ServiceRequest/${mockOrders.id}`);

    expect(screen.getByRole('link', { name: 'Bruce Wayne' })).toBeInTheDocument();
  });

  test('Overview tab with mock Diagnostic Report resource link renders', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: new URL('http://localhost'),
        assign: jest.fn(),
        configurable: true,
      },
      writable: true,
    });

    await setup(`/Patient/${mockPatient.id}`);
    
    await waitFor(() => screen.getByRole('link', { name: 'Diagnostic Report'}));

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Diagnostic Report'}));
    });
    
    await setup(`/Patient/${mockPatient.id}/DiagnosticReport/${mockReports.id}`);

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });
  
  test('Visits tab renders', async () => {
    await setup(`/Patient/${mockPatient.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Visits'}));
    });

    expect(screen.getByRole('cell', { name: 'Counselling' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Crisis Assistance' })).toBeInTheDocument();
    expect(screen.getByText('completed'));
  });

  test('Labs & Imaging tab renders', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: new URL('http://localhost'),
        assign: jest.fn(),
        configurable: true,
      },
      writable: true,
    });

    await setup(`/Patient/${mockPatient.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Labs & Imaging'}));
    });
    
    expect(screen.getByRole('link', { name: 'Review' })).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Review'}));
    });
    
    await setup(`/Patient/${mockPatient.id}/ServiceRequest/${mockOrders.id}`);
    
    expect(screen.getByText(`${mockOrders.id}`)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Approve'})).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve'}));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Medication tab renders', async () => {
    await setup(`/Patient/${mockPatient.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Medication'}));
    });
  });

  test('Care Plans tab', async () => {
    await setup(`/Patient/${mockPatient.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Care Plans'}));
    });

    expect(screen.getByRole('heading', { name: 'COVID-19 Assessment'})).toBeInTheDocument();
  });

  test('Clinical Notes tab navigation', async () => {
    window.open = jest.fn();
    await setup(`/Patient/${mockPatient.id}`);

    expect(screen.getByRole('tab', { name: 'Clinical Notes'}));

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Clinical Notes'}));
    });

    expect(screen.getByText(`This is a clinical note for Bruce Wayne`)).toBeInTheDocument();
    // Do not open a new browser tab
    expect(window.open).not.toHaveBeenCalled();
  });

  test('Clinical Notes tab', async () => {
    await setup(`/Patient/${mockPatient.id}/clinicalnotes?task=null`);

    expect(screen.getByText(`This is a clinical note for Bruce Wayne`)).toBeInTheDocument();

    expect(screen.getByText('Consult note - See the Joker')).toBeInTheDocument();
  });

});