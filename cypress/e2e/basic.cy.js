describe("app portfolio", () => {
  it("opens the homepage and shows the apps grid", () => {
    cy.visit("/");
    cy.get("a[href='/apps/knowyourplate/']").should("exist");
  });

  it("navigates to an app's landing page", () => {
    cy.visit("/");
    cy.get("a[href='/apps/knowyourplate/']").eq(0).click();
    cy.url().should("include", "/apps/knowyourplate/");
    cy.get("h1").contains("KnowYourPlate");
  });

  it("opens the app's support page", () => {
    cy.visit("/support/knowyourplate/");
    cy.get("h1").contains("KnowYourPlate");
  });
});
