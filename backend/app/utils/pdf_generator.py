from fpdf import FPDF
from datetime import datetime

class PrescriptionPDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.set_text_color(44, 62, 80)
        self.cell(0, 10, 'PetStack Veterinary Prescription', border=False, align='C')
        self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_prescription_pdf(
    prescription_data: dict,
    vet_data: dict,
    owner_data: dict,
    pet_data: dict,
    recommended_products: list[dict]
) -> bytes:
    pdf = PrescriptionPDF()
    pdf.add_page()
    
    # Fonts
    pdf.set_font("helvetica", size=10)
    
    # Vet Details (Left) and Date (Right)
    pdf.set_font("helvetica", 'B', 12)
    pdf.cell(100, 7, f"Dr. {vet_data.get('full_name', vet_data.get('name', ''))}")
    pdf.set_font("helvetica", size=10)
    date_str = datetime.utcnow().strftime("%B %d, %Y")
    pdf.cell(0, 7, f"Date: {date_str}", align="R")
    pdf.ln(5)
    
    pdf.set_font("helvetica", size=10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(100, 5, f"License: {vet_data.get('license_number', 'N/A')}")
    pdf.ln(5)
    pdf.cell(100, 5, f"Clinic: {vet_data.get('clinic_name', 'N/A')}")
    pdf.ln(10)
    
    # Draw a line
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # Patient Details
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("helvetica", 'B', 11)
    pdf.cell(0, 8, "Patient Details", ln=1)
    
    pdf.set_font("helvetica", size=10)
    pdf.cell(50, 6, f"Pet Name: {pet_data.get('name', '')}")
    pdf.cell(50, 6, f"Species: {pet_data.get('species', '')}")
    pdf.cell(50, 6, f"Breed: {pet_data.get('breed', '')}")
    pdf.ln()
    pdf.cell(50, 6, f"Age: {pet_data.get('age', '')}")
    pdf.cell(50, 6, f"Weight: {pet_data.get('weight', '')} kg")
    pdf.cell(50, 6, f"Owner: {owner_data.get('full_name', owner_data.get('name', ''))}")
    pdf.ln(10)
    
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # Rx Symbol
    pdf.set_font("helvetica", 'B', 16)
    pdf.cell(0, 10, "Rx", ln=1)
    
    # Medicines
    pdf.set_font("helvetica", size=10)
    for idx, med in enumerate(prescription_data.get("medicines", [])):
        pdf.set_font("helvetica", 'B', 11)
        pdf.cell(0, 6, f"{idx + 1}. {med.get('name')}", ln=1)
        
        pdf.set_font("helvetica", size=10)
        pdf.set_x(15)
        pdf.cell(0, 5, f"Dosage: {med.get('dosage')} | Frequency: {med.get('frequency')} | Duration: {med.get('duration')}", ln=1)
        
        if med.get('notes'):
            pdf.set_x(15)
            pdf.cell(0, 5, f"Instructions: {med.get('notes')}", ln=1)
        pdf.ln(3)
        
    # General Notes
    if prescription_data.get("general_notes"):
        pdf.ln(5)
        pdf.set_font("helvetica", 'B', 11)
        pdf.cell(0, 8, "General Notes:", ln=1)
        pdf.set_font("helvetica", size=10)
        pdf.multi_cell(0, 5, prescription_data.get("general_notes"))
        
    # Recommended Products
    if recommended_products:
        pdf.ln(10)
        pdf.set_font("helvetica", 'B', 11)
        pdf.cell(0, 8, "Recommended Products (Available on PetStack):", ln=1)
        pdf.set_font("helvetica", size=10)
        for prod in recommended_products:
            pdf.cell(0, 5, f"- {prod.get('name')}", ln=1)
            
    # Signature line
    pdf.ln(20)
    pdf.set_y(-40)
    pdf.line(140, pdf.get_y(), 190, pdf.get_y())
    pdf.set_y(pdf.get_y() + 2)
    pdf.set_x(140)
    pdf.set_font("helvetica", size=10)
    pdf.cell(50, 5, "Veterinarian Signature", align="C")

    # Return bytes
    return pdf.output(dest='S')
