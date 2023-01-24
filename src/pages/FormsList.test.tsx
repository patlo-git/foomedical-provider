import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { TextEncoder } from 'util';
import { FormsList } from './FormsList';

async function setup(url='/forms', medplum = new MockClient()): Promise<void> {
  await act(async() => {
    render(
      <MemoryRouter
        initialEntries={[url]} initialIndex={0}>
        <MedplumProvider medplum={medplum}>
          <FormsList />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('Forms list page', () => {
  beforeEach(() => {
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

  test('Forms header', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Forms' })).toBeInTheDocument;
  });
  
  test('Title table header', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
  });
  
  test('Publisher table header', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Publisher' })).toBeInTheDocument();
  });
  
  test('Last Updated table header', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Last Updated' })).toBeInTheDocument();
  });

  
  test('Renders "New" button', async () => {
    await setup();
    const newButton = screen.getByRole('button', { name: 'New' });

    expect(newButton).toBeInTheDocument();
  });
  
  test('Renders "Import" button', async () => {
    await setup();
    const importButton = screen.getByRole('button', { name: 'Import' });
    
    expect(importButton).toBeInTheDocument();
  });
});
