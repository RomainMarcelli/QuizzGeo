import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";

import QuizApp from "../../app/components/QuizApp";
import { useQuizApp } from "../../app/hooks/useQuizApp";

beforeEach(() => {
  window.localStorage.clear();
  if (typeof HTMLElement !== "undefined" && !HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
});

describe("QuizApp React", () => {
  it("initialise le hook avec le menu visible", () => {
    const { result } = renderHook(() => useQuizApp());
    expect(result.current.isMenuVisible).toBe(true);
    expect(result.current.questions).toHaveLength(0);
    expect(result.current.menuScopeOptions.length).toBeGreaterThan(0);
  });

  it("ouvre une session de quiz depuis le menu", async () => {
    const { container } = render(<QuizApp />);

    const scopeCards = container.querySelectorAll(".mode-card");
    expect(scopeCards.length).toBeGreaterThan(0);

    fireEvent.click(scopeCards[0]);

    await waitFor(() => {
      const quizSection = container.querySelector("#quizSection");
      expect(quizSection?.classList.contains("hidden")).toBe(false);
    });

    expect(container.querySelectorAll(".country-item").length).toBeGreaterThan(0);
  });

  it("le bouton Voir toggle la reponse apres validation", async () => {
    const { container } = render(<QuizApp />);

    const scopeCards = container.querySelectorAll(".mode-card");
    fireEvent.click(scopeCards[0]);

    await waitFor(() => {
      expect(container.querySelector("#input-0")).toBeTruthy();
    });

    const input = container.querySelector("#input-0");
    const checkBtn = container.querySelector("#btn-0");
    const revealBtn = container.querySelector("#reveal-0");
    const feedback = container.querySelector("#fb-0");

    fireEvent.change(input, { target: { value: "mauvaise reponse" } });
    fireEvent.click(checkBtn);
    fireEvent.click(revealBtn);

    await waitFor(() => {
      expect(feedback.textContent).toMatch(/^Reponse:\s+/);
    });

    fireEvent.click(revealBtn);
    await waitFor(() => {
      expect(feedback.textContent).toMatch(/^Faux:\s+/);
    });
  });

  it("affiche et ferme la modale drapeau", async () => {
    const { container } = render(<QuizApp />);
    fireEvent.click(container.querySelectorAll(".mode-card")[0]);

    await waitFor(() => {
      expect(container.querySelector("#flagbtn-0")).toBeTruthy();
    });

    fireEvent.click(container.querySelector("#flagbtn-0"));
    await waitFor(() => {
      const modal = container.querySelector("#flagModal");
      expect(modal.classList.contains("hidden")).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    await waitFor(() => {
      const modal = container.querySelector("#flagModal");
      expect(modal.classList.contains("hidden")).toBe(true);
    });
  });
});
