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
    pet_name = pet_data.get('name') or 'N/A'
    species = pet_data.get('species') or 'N/A'
    breed = pet_data.get('breed') or 'N/A'
    age = pet_data.get('age') or 'N/A'
    weight = pet_data.get('weight') or 'N/A'
    owner_name = owner_data.get('full_name') or owner_data.get('name') or 'N/A'

    pdf.cell(60, 6, f"Pet Name: {pet_name}")
    pdf.cell(60, 6, f"Species: {species}")
    pdf.cell(60, 6, f"Breed: {breed}")
    pdf.ln()
    pdf.cell(60, 6, f"Age: {age}")
    pdf.cell(60, 6, f"Weight: {weight} kg" if weight != 'N/A' else "Weight: N/A")
    pdf.cell(60, 6, f"Owner: {owner_name}")
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
    pdf.cell(50, 5, "Veterinarian Signature", align="C", ln=1)
    
    vet_name = vet_data.get('full_name') or vet_data.get('name') or ''
    if vet_name:
        pdf.set_x(140)
        pdf.set_font("helvetica", 'B', 10)
        pdf.cell(50, 5, f"Dr. {vet_name}", align="C")

    # Return bytes
    return pdf.output(dest='S')


class InvoicePDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.set_text_color(26, 95, 122)  # Teal
        self.cell(0, 10, 'PetStack Order Invoice', border=False, align='C')
        self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Thank you for shopping with PetStack! Page {self.page_no()}', 0, 0, 'C')


def generate_invoice_pdf(order_data: dict, user_data: dict) -> bytes:
    pdf = InvoicePDF()
    pdf.add_page()
    
    pdf.set_font("helvetica", size=10)
    
    # Order ID & Date
    pdf.set_font("helvetica", 'B', 12)
    order_id_str = str(order_data.get('_id', order_data.get('id', '')))
    pdf.cell(100, 7, f"Invoice Reference: {order_id_str}")
    pdf.set_font("helvetica", size=10)
    created_at = order_data.get("created_at")
    if isinstance(created_at, datetime):
        date_str = created_at.strftime("%B %d, %Y")
    else:
        date_str = str(created_at).split("T")[0]
    pdf.cell(0, 7, f"Date Placed: {date_str}", align="R")
    pdf.ln(10)
    
    # Billing Info
    pdf.set_font("helvetica", 'B', 11)
    pdf.cell(0, 8, "Customer Details:", ln=1)
    pdf.set_font("helvetica", size=10)
    pdf.cell(0, 6, f"Customer Name: {user_data.get('full_name', user_data.get('name', 'Customer'))}", ln=1)
    pdf.cell(0, 6, f"Email: {user_data.get('email')}", ln=1)
    pdf.cell(0, 6, f"Payment Method: {order_data.get('payment_method', '').upper()}", ln=1)
    pdf.ln(3)
    
    pdf.set_font("helvetica", 'B', 11)
    pdf.cell(0, 8, "Delivery Address:", ln=1)
    pdf.set_font("helvetica", size=10)
    pdf.multi_cell(0, 5, order_data.get("delivery_address", ""))
    pdf.ln(5)
    
    # Draw a line
    pdf.set_draw_color(200, 200, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # Items Table Header
    pdf.set_font("helvetica", 'B', 10)
    pdf.cell(100, 8, "Item Description", border=1)
    pdf.cell(30, 8, "Unit Price", border=1, align='C')
    pdf.cell(20, 8, "Qty", border=1, align='C')
    pdf.cell(40, 8, "Total", border=1, align='C')
    pdf.ln()
    
    # Items
    pdf.set_font("helvetica", size=10)
    for item in order_data.get("items", []):
        name = item.get("name", "Product")
        price = item.get("price", 0.0)
        qty = item.get("quantity", 0)
        total = price * qty
        
        # truncate name if too long
        if len(name) > 48:
            name = name[:45] + "..."
            
        pdf.cell(100, 8, name, border=1)
        pdf.cell(30, 8, f"INR {price:.2f}", border=1, align='C')
        pdf.cell(20, 8, str(qty), border=1, align='C')
        pdf.cell(40, 8, f"INR {total:.2f}", border=1, align='C')
        pdf.ln()
        
    # Total
    pdf.set_font("helvetica", 'B', 10)
    pdf.cell(150, 8, "Grand Total", border=1, align='R')
    pdf.cell(40, 8, f"INR {order_data.get('total_amount', 0.0):.2f}", border=1, align='C')
    pdf.ln(15)
    
    # Return bytes
    return pdf.output(dest='S')
