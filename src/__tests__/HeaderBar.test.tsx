import { HeaderBar } from "../components/HeaderBar";
import { render } from '@testing-library/react';
import { Button, Group, Table } from '@mantine/core';

test("displays Worklist", async () => {
  const headerBar = render(<HeaderBar />);
  
  const worklist = await headerBar.findByTitle("Worklist")
  expect(worklist).toContain("Worklist");
})