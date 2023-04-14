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

export const BruceWayne: Patient = {
  resourceType: 'Patient',
  // Valid as of Medplum v2.0.12. 
  // Due to how we've configured these resources for testing, 
  // we're hardcoding an id here for createReference to link resources,
  // but also to use the id in our tests.
  // In another configuration you may allow createResoure to author an id.
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
      value: 'S99985935',
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

export const BruceAppointments: Appointment = {
  resourceType: 'Appointment',
  participant: [
    { 
      actor: createReference(BruceWayne), 
      status: 'needs-action',
    },
  ],
  id: randomUUID(),
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

export const BruceOrders: ServiceRequest = {
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

export const bruceObservation1: Observation = {
  resourceType: 'Observation',
  basedOn: [createReference(BruceOrders)],
  subject: createReference(BruceWayne),
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
  basedOn: [createReference(BruceOrders)],
  subject: createReference(BruceWayne),
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

export const BruceReports: DiagnosticReport = {
  resourceType: 'DiagnosticReport',
  basedOn: [createReference(BruceOrders)],
  subject: createReference(BruceWayne),
  id: randomUUID(),
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

export const BruceRequestGroups: RequestGroup = {
  resourceType: 'RequestGroup',
  subject: createReference(BruceWayne),
  id: randomUUID(),
  status: 'active',
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

export const BruceClinicalNotes: DocumentReference = {
  resourceType: 'DocumentReference',
  description: `This is a clinical note for Bruce Wayne`,
  subject: createReference(BruceWayne),
  id: randomUUID(),
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
      attachment: {},
    },
  ],
  status: 'current',
};
