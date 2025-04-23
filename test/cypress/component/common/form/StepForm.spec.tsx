import React from "react"
import { z } from "zod"
import StepForm from "@/src/lib/components/common/form/StepForm"

describe("<StepForm />", () => {
    // Define a simple schema for testing
    const TestSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address")
    })

    it("renders with correct step indicator", () => {
        const handleSubmit = cy.stub().as("handleSubmit")
        const handleBack = cy.stub().as("handleBack")

        cy.mount(
            <StepForm
                schema={TestSchema}
                onSubmit={handleSubmit}
                onBack={handleBack}
                currentStep={2}
                totalSteps={4}
                submitText="Next Step"
                backText="Previous Step"
                initialValues={{ name: "", email: "" }}
            >
                <div data-testid="form-content">Form Content</div>
            </StepForm>
        )

        // Check step indicator text
        cy.contains("Step 2 of 4").should("be.visible")
        
        // Check progress bar width (should be 50%)
        cy.get(".bg-primary").should("have.attr", "style", "width: 50%;")
        
        // Check form content
        cy.get("[data-testid='form-content']").should("be.visible")
        
        // Check buttons
        cy.contains("button", "Previous Step").should("be.visible")
        cy.contains("button", "Next Step").should("be.visible")
    })

    it("calls onBack when back button is clicked", () => {
        const handleSubmit = cy.stub().as("handleSubmit")
        const handleBack = cy.stub().as("handleBack")

        cy.mount(
            <StepForm
                schema={TestSchema}
                onSubmit={handleSubmit}
                onBack={handleBack}
                currentStep={2}
                totalSteps={3}
                initialValues={{ name: "", email: "" }}
            >
                <div>Form Content</div>
            </StepForm>
        )

        cy.contains("button", "Back").click()
        cy.get("@handleBack").should("have.been.called")
    })

    it("submits the form with valid data", () => {
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <StepForm
                schema={TestSchema}
                onSubmit={handleSubmit}
                currentStep={1}
                totalSteps={3}
                initialValues={{ name: "John Doe", email: "john@example.com" }}
            >
                <div className="flex flex-col gap-4">
                    <input name="name" placeholder="Name" />
                    <input name="email" placeholder="Email" />
                </div>
            </StepForm>
        )

        cy.contains("button", "Next").click()
        cy.get("@handleSubmit").should("have.been.called")
    })

    it("shows validation errors", () => {
        const handleSubmit = cy.stub().as("handleSubmit")

        cy.mount(
            <StepForm
                schema={TestSchema}
                onSubmit={handleSubmit}
                currentStep={1}
                totalSteps={3}
                initialValues={{ name: "", email: "invalid-email" }}
            >
                <div className="flex flex-col gap-4">
                    <input name="name" placeholder="Name" />
                    <input name="email" placeholder="Email" />
                </div>
            </StepForm>
        )

        // Submit the form
        cy.contains("button", "Next").click()
        
        // Check that validation errors are displayed
        cy.contains("Name is required").should("be.visible")
        cy.contains("Invalid email address").should("be.visible")
        
        // Check that onSubmit was not called
        cy.get("@handleSubmit").should("not.have.been.called")
    })

    it("doesn't show back button on first step when onBack is not provided", () => {
        cy.mount(
            <StepForm
                schema={TestSchema}
                onSubmit={() => {}}
                currentStep={1}
                totalSteps={3}
                initialValues={{ name: "", email: "" }}
            >
                <div>Form Content</div>
            </StepForm>
        )

        cy.contains("button", "Back").should("not.exist")
    })

    it("shows form error when provided", () => {
        // Create a version of the component that can set form error
        const TestComponent = () => {
            const [formError, setFormError] = React.useState<string | null>(null)
            
            const handleSubmit = async () => {
                setFormError("Something went wrong")
                return { FORM_ERROR: "Something went wrong" }
            }
            
            return (
                <StepForm
                    schema={TestSchema}
                    onSubmit={handleSubmit}
                    currentStep={1}
                    totalSteps={3}
                    initialValues={{ name: "John", email: "john@example.com" }}
                >
                    <div>Form Content</div>
                </StepForm>
            )
        }
        
        cy.mount(<TestComponent />)
        
        cy.contains("button", "Next").click()
        
        // Check that the error is displayed
        cy.contains("Something went wrong").should("be.visible")
    })
})