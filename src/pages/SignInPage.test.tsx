import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { SignInPage } from './SignInPage';

const medplum = new MockClient();

async function setup(url='/signin', medplum = new MockClient()): Promise<void> {
  await act(async() => {
    render(
      <MemoryRouter
        initialEntries={[url]} initialIndex={0}>
        <MedplumProvider medplum={medplum}>
          <SignInPage />
        </MedplumProvider>
      </MemoryRouter>
    );
  })
}

describe('SignInPage', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });

    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });
  });
  
  beforeEach(async () => {
    await setup();
  })

  test('Renders Sign In Page', async () => {
    expect(screen.getByText('Medplum Logo')).toBeInTheDocument();
    
    expect(screen.getByText('Sign in to Foo Provider')).toBeInTheDocument();
  });
  
  test('Successfully fires sign in page events', async () => {
    // input email
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'admin@example.com' } });
    });
    
    // click next
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    });
    
    // input invalid password
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'notpassword' } });
    });
    
    // click sign in
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
    
    expect(screen.getByText('Invalid password')).toBeInTheDocument();
    
    // input valid password
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password' } });
    });
    
    // click sign in
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));      
    });
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});