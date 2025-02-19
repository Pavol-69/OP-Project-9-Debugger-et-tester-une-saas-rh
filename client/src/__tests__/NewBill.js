/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("Given I am connected as an employee and I am on NewBill Page", () => {
  describe("When I upload a document", () => {
    beforeEach(() => {
      // Recréation du contexte
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "email@email.fr",
        })
      );
    });
    test("Then I should find the same fileUrl in the NewBill Object I created than the one I use as input data", async () => {
      // Recréation du contexte
      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Création d'un nouveau NewBill
      let newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      // Simulation d'ajout d'un fichier dans l'input
      const file = new File(["toto"], "toto.jpg", {
        type: "application/jpg",
      });
      userEvent.upload(screen.getByTestId("file"), file);

      // On doit alors trouver le même fileUrl que celui présent dans mockStyore
      const myResult = await mockStore.bills().create();
      expect(newBill.fileUrl).toEqual(myResult.fileUrl);
    });
  });

  describe("When I complete the NewFile panel and submit it", () => {
    test("Then I should be on the Bills page", async () => {
      // Recréation du contexte
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      // On soumet notre formulaire
      userEvent.click(screen.getByTestId("btn-send-bill"));

      // On devrait donc être sur la page Bills, on doit donc pouvoir trougver le bouton Nouvelle Facture
      await waitFor(() => screen.getByTestId("btn-new-bill"));
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    });
  });
});
