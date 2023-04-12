import { createReference } from '@medplum/core';
import {
  Patient,
  Appointment,
  ServiceRequest,
  Observation,
  DiagnosticReport,
  RequestGroup,
  DocumentReference,
} from '@medplum/fhirtypes';
import { randomUUID } from 'crypto';

// Setup mock Resources
export const BruceWayne: Patient = {
  resourceType: 'Patient',
  //  if we don't hardcode an id on the mock patient in this testing scenario the resources attached to the patient won't be able to create a reference to the patient. Passing a resource without an id to createReference() returns undefined and does not connect the resources.
  // Otherwise, id is authored on a resource during a create operation.
  id: randomUUID(),
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
      value: 'notbatman@wayneenterprises.com',
    },
  ],
  address: [
    {
      use: 'home',
      line: ['1007 Mountain Drive'],
      city: 'Gotham',
      state: 'NJ',
      postalCode: '56789'
    }
  ],
  photo: [
    {
      contentType: 'image/jpeg',
      url: 'https://m.media-amazon.com/images/M/MV5BYWM1MDM2YzEtZGVjZi00NGJjLTg1ZmEtNmQ4YjRiOGUxNDRjXkEyXkFqcGdeQXVyMDc2NTEzMw@@._V1_.jpg'
    }
  ]
};

// modelled on Medplum mock patient, 'Kay Raynor'
export const BruceWayneAppointment: Appointment = {
  resourceType: 'Appointment',
  participant: [
    { 
      actor: createReference(BruceWayne), 
      status: 'needs-action',
    },
  ],
  identifier: [
    {
      system: 'mock identifier',
      value: 'bat-aptmt',
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
};

// Service Request - Labs and Imaging resource
// partially modelled on Medplum mock patient, 'Russell Kuhn'
// passing in a random id since we use Orders as a reference in Reports
export const BruceWayneOrders: ServiceRequest = {
  resourceType: 'ServiceRequest',
  id: randomUUID(),
  subject: createReference(BruceWayne),
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
};

// Creating a Diagnostic Report
// Using pattern from simpsons.ts in Medplum mock packages to create the Observations
export const bruceObservation1: Observation = {
  resourceType: 'Observation',
  basedOn: [createReference(BruceWayneOrders)], // Connect this Observation to the ServiceRequest
  subject: createReference(BruceWayne), // Connect this Observation to the Patient
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
};
  
export const bruceObservation2: Observation = {
  resourceType: 'Observation',
  basedOn: [createReference(BruceWayneOrders)], // Connect this Observation to the ServiceRequest
  subject: createReference(BruceWayne), // Connect this Observation to the Patient
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
};

// Diagnostic Report - Labs & Imaging resource
// modeled on Medplum mock patient, 'Gerardo Green'
// using the above Observation data 
export const BruceWayneReports: DiagnosticReport = {
  resourceType: 'DiagnosticReport',
  basedOn: [createReference(BruceWayneOrders)], // Connect this DiagnosticReport to the ServiceRequest
  subject: createReference(BruceWayne), // Connect this DiagnosticReport to the Patient,
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
  result: [
    createReference(bruceObservation1),
    createReference(bruceObservation2),
  ],
};

// Request Group - Care Plans 
// modelled on mock patients, 'Ryan Baily' and 'Kay Raynor'
export const BruceWayneRequestGroups: RequestGroup = {
  resourceType: 'RequestGroup',
  subject: createReference(BruceWayne),
  status: 'draft',
  intent: 'proposal',
  code: {
    text: "COVID-19 Assessment",
  },
  action: [
    {
      id: 'action-0',
      title: 'Initial Consultation',
    },
    {
      id: 'action-1',
      title: 'COVID-19 Symptoms Assessment',
    },
    {
      id: 'action-2',
      title: 'COVID-19 PCR Test',
    },
  ]
};

// Document Reference
// partially modelled on mock patient, 'Johnathan Kemmer'
export const BruceWayneClinicalNotes: DocumentReference = {
  resourceType: 'DocumentReference',
  description: `This is a clinical note for Bruce Wayne`,
  subject: createReference(BruceWayne),
  category: [
    {
      text: 'clinical-note',
    },
  ],
  type: {
    text: 'Consult note - See Dr Harley Quinn',
    coding: [
      {
        code: '11488-4',
      },
    ],
  },
  content: [
    {
      // modelled on Medplum mock patient 'Kay Raynor'
      attachment: {
        /*
        url: 'https://storage.medplum.com/binary/6278687b-679c-40d4-a0dd-ac846191e940/99f46b2d-2d0b-46ae-ba0d-858a07289a6a?Expires=1681235171&Key-Pair-Id=K1PPSRCGJGLWV7&Signature=Qjo7T1qeRYokDfzK8Cs2AzaAMKnWHG6L2UO7ra4~Gtbyc1Q8sD4A4K8ZvJWE~y1nJayDCSsPstQYwCQ3TZ2k9w8c2lQFzeg9wlNtiBNHskXimy0pqYBKUGTHPpIiy-4cABLNzkLvl2tQYXeqpFaA8eooSNLwvOrERMfKHUubXBPpRtQSZ5GRgINugzC-TpcgGyXCuaDmkY9IYbUgc7Y80aS3w2C~qJw3UjcAS98K6wr9-77fC09d3-znP~k5lCQRqYmXg-jygHonlH8epR4Y72jgJJ-D6WzSODvta4GGDZYxuRwTX1EU4WQTGf9Gyyvwc2gbqG33VvvsdBLohoVIRg__',
        */
        title: 'Clinical Note',
      },
    },
  ],
  status: 'current',
};