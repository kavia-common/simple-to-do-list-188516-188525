import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app header and add form", () => {
  render(<App />);
  const heading = screen.getByRole("heading", { name: /to-do/i });
  expect(heading).toBeInTheDocument();

  const input = screen.getByLabelText(/task title/i);
  expect(input).toBeInTheDocument();
});
