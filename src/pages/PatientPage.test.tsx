import { MockClient, HomerSimpson, HomerServiceRequest } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { Appointment, ServiceRequest, Observation, DiagnosticReport, RequestGroup, DocumentReference } from '@medplum/fhirtypes';
import { act, render, waitFor, screen } from '@testing-library/react';
import crypto, { randomUUID } from 'crypto';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { PatientPage } from './PatientPage';
import { createReference } from '@medplum/core';

const mockClient = new MockClient();

// mocking graphql response for PatientPage query
mockClient.graphql = jest.fn((query: string) => {
  const data: Record<string, unknown> = {};
  data.patient = {
    resourceType: HomerSimpson.resourceType, 
    id: HomerSimpson.id,
    meta: HomerSimpson.meta,
    birthdate: [HomerSimpson.birthDate],
    name: HomerSimpson.name,
    telecom: HomerSimpson.telecom,
    address: HomerSimpson.address,
    photo: HomerSimpson.photo
  };

  console.log('patient data: ', data.patient);
  // modelled after Medplum mock patient, 'Kay Raynor'
  data.appointments = [
    {
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
    },
  ];

  // partially modelled after Medplum mock patient, 'Russell Kuhn'
  data.orders = [
    {
      resourceType: 'ServiceRequest',
      // link this ServiceRequest to the Patient
      subject: createReference(HomerSimpson),
      id: '773',
      meta: {
        lastUpdated: '2023-03-29T16:55:02.818Z'
      },
      category: {
        text: 'Imaging',
        coding: {
          code: '363679005',
          display: 'Imaging',
        }
      },
      code: {
        text: 'Cranial MRI',
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: '96894-1',
            display: 'Cranial MRI',
          },
        ],
      },
      status: 'completed',
    }
  ];

  // modeled after Medplum mock patient, 'Gerardo Green'
  data.reports = [
    {
      resourceType: 'DiagnosticReport',
      id: '0af4b01b-092e-4be6-9f7e-41bc7a134a41',
      meta:
        {
          lastUpdated: '2023-03-29T17:38:02.818Z',
        },
      code:
        {
          text: 'Diagnostic Report',
        }
    }
  ];
  
  // modelled after mock patient, 'Ryan Baily'
  data.requestGroups = [
    {
      resourceType: 'RequestGroup',
      id: randomUUID(),
      status: 'draft',
      meta:
      {
        lastUpdated: '2023-03-29T17:50:02.818Z',
      },
      code: null,
      action: [
        {
          id: null,
          title: 'Request COVID-19 Symptoms Assessment',
          resource:
          {
            reference: 'Task/7dd575f4-1444-4455-bdb9-7d630db90ce0'
          },
        }
      ]
    }
  ];
  
  data.clinicalNotes = [
    {
      resourceType: 'DocumentReference',
      id: randomUUID(),
      description: 'This is a clinical note',
      type: {
        text: 'Progress Note',
        coding:
        {
          code: '867',
        }
      },
      content: 
        {
          attachment: {
            url: 'https://hl7.org/fhir/us/core/stu3.1.1/StructureDefinition-us-core-documentreference.html',
          }
        },
    }
  ];

  return Promise.resolve({ data });
});
