describe("My First Test", function() {
  it("Visits the water temp", function() {
    cy.visit("http://localhost:8000");
    cy.get("h1").should("contain", "The Water Temp");
  });
});
