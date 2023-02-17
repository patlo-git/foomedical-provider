import { act, fireEvent, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { TextEncoder } from 'util';
import { PatientButton } from './PatientButton';


async function setup(url): Promise<void> {
  await act(async() => {
    render(
      // was hoping to use this so I could possibly pass in another url value from mock
      <PatientButton url={url} />
    );
  })
}

/**
 * Want to test that when a button is clicked, the page at the url associated with the click renders
 * - Sub problems:
 * [x] get target button
 * [x] can click targeted button
 * [ ] verify that a page renders
 * [ ] verify that page at url on button click is rendered
 * [ ] is it easier to test that a url from a mocked button is rendered instead?
 *
 * */ 

describe('Button test', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await setup();
  });

  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });

    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });
  });
  
  test('Get button', async () => {
    // this passes. We get the button and it's in the doc.
    const button = screen.getByRole('button');
  
    
    fireEvent.click(button);
    
    expect(button).toBeInTheDocument();
    
  });
  
  test('View button goes somewhere', async () => {
    // this does not pass and I don't expect it to right now.
    
    // we have the button
    // we can click the button
    // I want to verify that it goes to google.com
    
    // I wanted was to somehow pass in a separate url to either the mock or the button to test where it's going
    // syntax is wrong, but something like this?
    // const testClick = jest.fn(viewButton onClick={url=`google.com`});
    const mock = jest.fn();

    const button = screen.getByRole('button');

    fireEvent.click(button); // and maybe here we'd pass in testClick to the button to use our mock?

    expect(window.location.href).toEqual('google.com');     // currently getting => 'http://localhost/'
  });

});
