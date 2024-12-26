/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store.js";

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
    test("modalForm should appear when we click on the eye button", () => {
      // La fonction modal, venant de Bootstrap, ne peut pas être comprise par jest, qui n'a pas importé la bonne librairie
      // L'astuce est donc de mock la fonction modal, en la remplaçant par une fonction qui fait exactement la même chose
      $.fn.modal = jest.fn(() => {
        screen.getByTestId("dialog").className += " show";
      });

      // Recréation du contexte
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

      // Simulation d'un click sur le bouton avec l'icône d'oeil
      userEvent.click(screen.getAllByTestId("icon-eye")[0]);

      // La modal doit alors s'afficher, avec la class show
      expect(screen.getByTestId("dialog")).toHaveClass("show");
    });

    test("should see NewBill page when we click on the newBill button", () => {
      // Recréation du contexte
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

      // Simulation du click sur Nouvelle facture
      userEvent.click(screen.getByTestId("btn-new-bill"));

      // On devrait alors avoir à l'écran l'élément "form-new-bill"
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("should get same bills with store.getBills & bills", async () => {
      // Recréation du contexte
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // On crée un élément Bills, qui devrait contenir la fonction getBills, que l'on souhaite tester ici
      let myBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      // Appel de la fonction getBills, et sauvegarde du résultat
      myBills = await myBills.getBills().then((bills) => {
        return bills;
      });

      // Chaque facture répertoriée par getBills devrait avoir son équivalent, avec le même ID, dans bills
      // On parcourt donc tous les éléments de bills, et on voit si on trouve toutes les id dans myBills
      let myBool = true;
      bills.forEach((bill) => {
        if (myBills.filter((myBill) => myBill.id == bill.id).length < 1) {
          myBool = false;
        }
      });
      expect(myBool).toEqual(true);
    });
  });
});
