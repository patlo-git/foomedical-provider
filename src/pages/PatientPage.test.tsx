import { indexStructureDefinitionBundle, indexSearchParameterBundle, OperationOutcomeError } from '@medplum/core';
import { readJson } from '@medplum/definitions';
import { Patient, Appointment, ServiceRequest, DiagnosticReport, RequestGroup, DocumentReference, Bundle, SearchParameter } from '@medplum/fhirtypes';
import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PatientPage } from './PatientPage';
import { Loading } from '../components/Loading';
import { BruceWayne, BruceWayneAppointment, BruceWayneOrders, BruceWayneReports, BruceWayneRequestGroups, BruceWayneClinicalNotes } from '../mocks/brucewayne';

// For ReferenceError: ResizeObserver is not defined error
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

Object.defineProperty(window, 'location', {
  value: {
    pathname: new URL('http://localhost'),
    assign: jest.fn(),
    configurable: true,
  },
  writable: true,
});

let bruceWayne: Patient;
let bruceAppointments: Appointment;
let bruceOrders: ServiceRequest;
let bruceReports: DiagnosticReport;
let bruceRequestGroups: RequestGroup;
let bruceClinicalNotes: DocumentReference;

const medplum = new MockClient();

describe('Patient Page', () => {
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
    
    bruceWayne = await medplum.updateResource(BruceWayne);
    bruceAppointments = await medplum.createResource(BruceWayneAppointment);
    bruceOrders = await medplum.createResource(BruceWayneOrders);
    bruceReports = await medplum.createResource(BruceWayneReports);
    bruceRequestGroups = await medplum.createResource(BruceWayneRequestGroups);
    bruceClinicalNotes = await medplum.createResource(BruceWayneClinicalNotes);
  });

  test('MockClient has mock patient', async () => {
    expect(bruceWayne).toBeDefined();
    const existingPatient = await medplum.searchOne('Patient', 'identifier=S99985935');

    expect(existingPatient).toBeDefined();
    expect(existingPatient).toEqual(bruceWayne);
  });

  test('MockClient has mock patient\'s appointment', async () => {
    expect(bruceAppointments).toBeDefined();

    const existingAppointment = await medplum.searchOne('Appointment', `identifier=bat-aptmt`);

    expect(existingAppointment).toBeDefined();
    expect(existingAppointment).toEqual(bruceAppointments);
  });
  
  test('Graphql call on MockClient returns mock patient', async () => {
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

  test('Mock patient renders', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    expect(screen.getByText('Bruce Wayne')).toBeInTheDocument();
    expect(screen.getByText('notbatman@wayneenterprises.com')).toBeInTheDocument();
  });

  test('Patient Page tabs render', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    expect(screen.getByRole('tab', { name: 'Overview'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('tab', {  name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', {  name: 'Visits' })).toBeInTheDocument();
    expect(screen.getByRole('tab', {  name: 'Labs & Imaging' })).toBeInTheDocument();
    expect(screen.getByRole('tab', {  name: 'Medication' })).toBeInTheDocument();
    expect(screen.getByRole('tab', {  name: 'Care Plans' })).toBeInTheDocument();
    expect(screen.getByRole('tab', {  name: 'Forms' })).toBeInTheDocument();
    expect(screen.getByRole('tab', {  name: 'Clinical Notes' })).toBeInTheDocument();
  })

  test('Patient Page home and Overview tab renders', async () => {
    await setup(`/Patient/${bruceWayne.id}`);

    expect(screen.getByRole('tab', {  name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Appointment'})).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Service Request'})).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diagnostic Report'})).toBeInTheDocument();
  })
  
  test('Overview tab renders with Appointment link', async () => {
    await setup(`/Patient/${bruceWayne.id}/overview?task=null`);

    expect(screen.getByRole('tab', { name: 'Overview'})).toHaveAttribute('aria-selected', 'true');

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Appointment'}));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Overview tab renders Service Request link', async () => {
    await setup(`/Patient/${bruceWayne.id}/overview?task=null`);

    expect(screen.getByRole('tab', { name: 'Overview'})).toHaveAttribute('aria-selected', 'true');

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Service Request'}));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Overview tab renders Diagnostic Report link', async () => {
    await setup(`/Patient/${bruceWayne.id}/overview?task=null`);

    expect(screen.getByRole('tab', { name: 'Overview'})).toHaveAttribute('aria-selected', 'true');

    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Diagnostic Report'}));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Visits tab renders on click', async () => {
    await setup(`/Patient/${bruceWayne.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Visits'}));
    });

    expect(screen.getByRole('tab', { name: 'Visits'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('cell', { name: 'Counselling' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Crisis Assistance' })).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  test('Visits tab renders with Appointments', async () => {
    await setup(`/Patient/${bruceWayne.id}/Appointment/${bruceAppointments.id}`);

    expect(screen.getByRole('cell', { name: 'Counselling' })).toBeInTheDocument();
  });

  test('Visits tab renders with No Appointments', async () => {
    const bruceAppointmentsId = bruceAppointments.id as string;

    await medplum.deleteResource('Appointment', bruceAppointmentsId);

    try {
      await medplum.readResource('Appointment', bruceAppointmentsId);
      fail('Should have thrown');
    } catch (err) {
      const outcome = (err as OperationOutcomeError).outcome;
      expect(outcome.id).toEqual('not-found');
    } finally {
      await setup(`/Patient/${bruceWayne.id}/visits?task=null`);
      expect(screen.getByText('No appointments found')).toBeInTheDocument();
    }
  });

  test('Labs & Imaging tab renders on click', async () => {
    await setup(`/Patient/${bruceWayne.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Labs & Imaging'}));
    });
    
    expect(screen.getByRole('tab', { name: 'Labs & Imaging'})).toHaveAttribute('aria-selected', 'true');

    // Displays Service Request if orders exists
    expect(screen.getByText('Imaging')).toBeInTheDocument();
    expect(screen.getByText('Cranial MRI')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Review' })).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Review'}));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Labs & Imaging tab renders with Service Request', async () => {
    // The result of click on Service Request at Overview tab or click on Review link at Labs & Imaging tab when orders exist
    await setup(`/Patient/${bruceWayne.id}/ServiceRequest/${bruceOrders.id}`);

    expect(screen.getByRole('tab', { name: 'Labs & Imaging'})).toHaveAttribute('aria-selected', 'true');
    
    expect(screen.getByRole('heading', {  name: 'Service Request'})).toBeInTheDocument();
    
    expect(screen.getByText(`${bruceOrders.id}`)).toBeInTheDocument();
    expect(screen.getByText(`completed`)).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Approve'}));
    });

    expect(screen.getByRole('link', { name: 'Bruce Wayne' })).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Bruce Wayne' }));
    });

    expect(window.location.assign).toHaveBeenCalled();
  });

  test('Labs & Imaging tab renders with No Orders', async () => {
    const ordersId = bruceOrders.id as string;

    await medplum.deleteResource('ServiceRequest', ordersId);

    try {
      await medplum.readResource('ServiceRequest', ordersId);
      fail('Should have thrown');
    } catch (err) {
      const outcome = (err as OperationOutcomeError).outcome;
      expect(outcome.id).toEqual('not-found');
    } finally {
      await setup(`/Patient/${bruceWayne.id}/labreports?task=null`);
      expect(screen.getAllByText('No orders found')).toHaveLength(2);
    }
  });

  test('Labs & Imaging tab renders with Diagnostic Report', async () => {
    // result of click on Diagnostic Report link at Overview tab
    await setup(`/Patient/${bruceWayne.id}/DiagnosticReport/${bruceReports.id}`);

    expect(screen.getByRole('tab', { name: 'Labs & Imaging'})).toHaveAttribute('aria-selected', 'true');

    // Approve button renders if there's a report
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  test('Medication tab renders on click', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Medication'}));
    });

    expect(screen.getByRole('tab', { name: 'Medication'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('link', {  name: 'Order'})).toBeInTheDocument();

    // takes users from /Patient to /Questionnaire
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Order'}));
    });

    expect(window.location.assign).toBeCalled();
  });

  test('Care Plans tab renders on click', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Care Plans'}));
    });

    expect(screen.getByRole('tab', { name: 'Care Plans'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('heading', { name: 'COVID-19 Assessment'})).toBeInTheDocument();
  });

  test('Care Plans tab renders', async () => {
    await setup(`/Patient/${bruceWayne.id}/careplans?task=null`);

    expect(screen.getByRole('tab', { name: 'Care Plans'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByText('Initial Consultation')).toBeInTheDocument();
    expect(screen.getByText('COVID-19 Symptoms Assessment')).toBeInTheDocument();
    expect(screen.getByText('COVID-19 PCR Test')).toBeInTheDocument();
  });

  test('Forms tab renders on click', async () => {
    await setup(`/Patient/${bruceWayne.id}`);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Forms'}));
    });

    expect(screen.getByRole('tab', { name: 'Forms'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('tabpanel', {  name: 'Forms'})).toBeInTheDocument();
  });

  test('Forms tab renders', async () => {
    await setup(`/Patient/${bruceWayne.id}/forms?task=null`);

    expect(screen.getByRole('tab', { name: 'Forms'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('heading', { name: 'Forms'})).toBeInTheDocument();

    expect(screen.getByText('Questionnaire')).toBeInTheDocument();
    expect(screen.getByText('QuestionnaireResponse')).toBeInTheDocument();
  });

  test('Clinical Notes tab renders on click', async () => {
    await setup(`/Patient/${bruceWayne.id}`);

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Clinical Notes'}));
    });

    expect(screen.getByRole('tab', { name: 'Clinical Notes'})).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByText(`This is a clinical note for Bruce Wayne`)).toBeInTheDocument();

    expect(screen.getByText('Consult note - See Dr Harley Quinn')).toBeInTheDocument();
  });

  test('Clinical Notes tab with no url renders', async () => {
    const notesId = bruceClinicalNotes.id as string;
    
    await medplum.patchResource('DocumentReference', notesId, [
      {op: 'replace', path: '/content/0/attachment', value: {}},
    ]);
    
    await setup(`/Patient/${bruceWayne.id}/clinicalnotes?task=null`);

    expect(screen.getByRole('tab', { name: 'Clinical Notes'})).toHaveAttribute('aria-selected', 'true');
    
    // default lorem ipsum if no content.attachment.url on notes
    expect(screen.getByText('Labore et dolore magna aliqua. Orci phasellus egestas tellus rutrum tellus pellentesque eu.')).toBeInTheDocument();
  });
});
