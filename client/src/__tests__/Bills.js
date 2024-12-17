/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {
  screen,
  waitFor,
  fireEvent,
  getByRole,
  getByTestId,
  getAllByTestId,
} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";

/*beforeAll(() => {
  window.$ = jest.fn().mockImplementation(() => {
    return {
      modal: jest.fn(),
      click: jest.fn(),
      width: jest.fn(),
    };
  });
});*/

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // Ajout except => Highlighted element = avec class "active-icon"
      expect(windowIcon.className).toEqual("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    /*Completion du test d'intégration pour augmenter le coverage*/
    test("modalForm should appear when we click on the eye button", async () => {
      const root = document.createElement("div");
      //const user = userEvent.setup();
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const eyeBtn = screen.getAllByTestId("icon-eye")[0];
      await waitFor(() => userEvent.click(eyeBtn));

      const myModal = screen.getByTestId("dialog");
      //await waitFor(() => myModal.toHaveClass("show"));
      //expect(modal).toEqual("toto");
      expect(myModal).toEqual("show");
      //expect(screen.findByRole("dialog")).toHaveClass("show");
    });
  });
});
