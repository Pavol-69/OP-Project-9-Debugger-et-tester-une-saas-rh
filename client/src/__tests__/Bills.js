/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
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
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // Ajout de l'expect : si l'élément est highlighted, alors il a la class "active-icon"
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
    test("Then modalForm should appear when we click on the eye button", () => {
      // Mock de la fonction modal, que les tests ne peuvent pas connaître
      $.fn.modal = jest.fn();

      window.onNavigate(ROUTES_PATH.Bills);

      // Simulation d'un click sur le bouton avec l'icône d'oeil
      userEvent.click(screen.getAllByTestId("icon-eye")[0]);

      // La modal a dû être appelée
      expect($.fn.modal).toHaveBeenCalled();
    });

    test("Then I should see NewBill page when we click on the newBill button", () => {
      window.onNavigate(ROUTES_PATH.Bills);

      // Simulation du click sur Nouvelle facture
      userEvent.click(screen.getByTestId("btn-new-bill"));

      // On devrait alors avoir à l'écran l'élément "form-new-bill"
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("Then I should get same bills with mockStore.getBills & bills data", async () => {
      // Recréation du contexte
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // On crée un élément Bills, qui devrait contenir la fonction getBills, que l'on souhaite tester ici
      const myBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      // Appel de la fonction getBills, et sauvegarde du résultat
      const getBillsResult = await myBills.getBills().then((bills) => {
        return bills;
      });

      // Chaque facture répertoriée par getBills devrait avoir son équivalent, avec le même ID, dans bills
      // On parcourt donc tous les éléments de bills, et on voit si on trouve toutes les id dans myBills
      let myBool = true;
      bills.forEach((bill) => {
        if (
          getBillsResult.filter(
            (billFromGetBills) => billFromGetBills.id == bill.id
          ).length < 1
        ) {
          myBool = false;
        }
      });
      expect(myBool).toEqual(true);
    });
  });
  describe("When we fetch API and fail with an error message (like 404 or 500 error)", () => {
    test("Then we should be on Error Page with the error message displayed", async () => {
      // Recréation du contexte
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const errorMsg = "Erreur 404/500";

      // Mock de bills pour être sûr qu'une erreur soit renvoyée
      const mockError = {
        bills: jest.fn(() => ({
          list: jest.fn().mockRejectedValue(new Error("Erreur 404/500")),
        })),
      };

      // On crée un élément Bills, qui devrait nous renvoyer l'erreur 404 dès qu'on essaye d'accéder à une bill
      const myBills = new Bills({
        document,
        onNavigate,
        store: mockError,
        localStorage,
      });

      let myError = "";

      try {
        await myBills.getBills();
      } catch (error) {
        myError = error.message;
      }

      // Si on appelle BillsUI avec notre erreur, on doit être sur la page Erreur, avec le message Erreur 404
      document.body.innerHTML = BillsUI({ error: myError });
      expect(screen.getByTestId("error-message").innerHTML).toEqual(errorMsg);
    });
  });
});
