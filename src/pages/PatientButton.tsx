import React from 'react';

// getting some type errors here
export function PatientButton(url): JSX.Element {

  const handleClick = (e) => {
    e.preventDefault();
    window.location.href='http://google.com';
    console.log('reached');
  };

  url = handleClick;

  return (
    <button
      type="button"
      onClick={url}
    >Click here</button>
  );
}
