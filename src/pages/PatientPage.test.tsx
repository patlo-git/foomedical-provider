import { indexStructureDefinitionBundle, indexSearchParameterBundle } from '@medplum/core';
import { readJson } from '@medplum/definitions';
import { Patient, Appointment, ServiceRequest, DiagnosticReport, RequestGroup, DocumentReference, Bundle, SearchParameter } from '@medplum/fhirtypes';
import { MockClient, HomerSimpson } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import crypto from 'crypto';
import React, { Suspense } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientPage } from './PatientPage';
import { Loading } from '../components/Loading';
import { BruceWayne, BruceWayneAppointment, BruceWayneOrders, BruceWayneReports, BruceWayneRequestGroups, BruceWayneClinicalNotes } from '../mocks/brucewayne';

// For ReferenceError: ResizeObserver is not defined error
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

let bruceWayne: Patient;
let bruceAppointments: Appointment;
let bruceOrders: ServiceRequest;
let bruceReports: DiagnosticReport;
let bruceRequestGroups: RequestGroup;
let bruceClinicalNotes: DocumentReference;

const medplum = new MockClient();

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
    
    // using updateResource for patient since we're hardcoding the id on them. This is a work around for testing. Passing in a patient with no id to createReference returns undefined and does not connect the resources. 
    bruceWayne = await medplum.updateResource(BruceWayne);
    bruceAppointments = await medplum.createResource(BruceWayneAppointment);
    bruceOrders = await medplum.createResource(BruceWayneOrders);
    bruceReports = await medplum.createResource(BruceWayneReports);
    bruceRequestGroups = await medplum.createResource(BruceWayneRequestGroups);
    bruceClinicalNotes = await medplum.createResource(BruceWayneClinicalNotes);
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

  test('Mock patient is created on the mock client', async () => {
    expect(bruceWayne).toBeDefined();

    const identifier = bruceWayne.identifier?.[0]?.value;

    const existingPatient = await medplum.searchOne('Patient', `identifier=${identifier}`);

    expect(existingPatient).toBeDefined();
    expect(existingPatient).toEqual(bruceWayne);
  });

  test('Mock resource that references patient exists on mock client', async () => {
    expect(bruceAppointments).toBeDefined();

    const existingAppointment = await medplum.searchOne('Appointment', `identifier=bat-aptmt`);

    expect(existingAppointment).toBeDefined();
    expect(existingAppointment).toEqual(bruceAppointments);
  });
  
  test('Verify graphql call on mockclient returns newly created mock data', async () => {
    const query = `{
      patient: Patient(id: "${bruceWayne.id}") {
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
    await setup(`/Patient/${bruceWayne.id}`);
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

    await setup(`/Patient/${bruceWayne.id}`);

    screen.getByRole('tab', {  name: 'Overview' });
    screen.getByRole('heading', { name: 'Overview' });
    
    await waitFor(() => screen.getByRole('link', { name: 'Appointment'}));
    await waitFor(() => screen.getByRole('link', { name: 'Service Request'}));
    await waitFor(() => screen.getByRole('link', { name: 'Diagnostic Report'}));

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Appointment'}));
    });

    await setup(`/Patient/${bruceWayne.id}/Appointment/${bruceAppointments.id}`);

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

    await setup(`/Patient/${bruceWayne.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Service Request'}));
    });

    await setup(`/Patient/${bruceWayne.id}/ServiceRequest/${bruceOrders.id}`);

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

    await setup(`/Patient/${bruceWayne.id}`);

    console.log('bruce reports based on: ', bruceReports.basedOn)
    
    await waitFor(() => screen.getByRole('link', { name: 'Diagnostic Report'}));

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Diagnostic Report'}));
    });
    
    await setup(`/Patient/${bruceWayne.id}/DiagnosticReport/${bruceReports.id}`);

    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });
  
  test('Visits tab renders', async () => {
    await setup(`/Patient/${bruceWayne.id}`);

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

    await setup(`/Patient/${bruceWayne.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Labs & Imaging'}));
    });
    
    expect(screen.getByRole('link', { name: 'Review' })).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Review'}));
    });
    
    await setup(`/Patient/${bruceWayne.id}/ServiceRequest/${bruceOrders.id}`);
    
    expect(screen.getByText(`${bruceOrders.id}`)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Approve'})).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve'}));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Medication tab renders', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Medication'}));
    });
  });

  test('Care Plans tab', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Care Plans'}));
    });

    expect(screen.getByRole('heading', { name: 'COVID-19 Assessment'})).toBeInTheDocument();
  });

  test('Clinical Notes tab navigation', async () => {
    window.open = jest.fn();
    await setup(`/Patient/${bruceWayne.id}`);

    expect(screen.getByRole('tab', { name: 'Clinical Notes'}));

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Clinical Notes'}));
    });

    expect(screen.getByText(`This is a clinical note for Bruce Wayne`)).toBeInTheDocument();
    // Do not open a new browser tab
    expect(window.open).not.toHaveBeenCalled();
  });

  test('Clinical Notes tab', async () => {
    await setup(`/Patient/${bruceWayne.id}/clinicalnotes?task=null`);

    expect(screen.getByText(`This is a clinical note for Bruce Wayne`)).toBeInTheDocument();

    expect(screen.getByText('Consult note - See Dr Harley Quinn')).toBeInTheDocument();
  });

});