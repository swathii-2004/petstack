from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Medicine(BaseModel):
    name: str = Field(..., description="Name of the medicine")
    dosage: str = Field(..., description="Dosage (e.g., 1 tablet)")
    frequency: str = Field(..., description="Frequency (e.g., Twice a day)")
    duration: str = Field(..., description="Duration (e.g., 5 days)")
    notes: Optional[str] = Field(None, description="Additional instructions")

class PrescriptionCreate(BaseModel):
    appointment_id: str
    medicines: List[Medicine] = Field(default_factory=list)
    general_notes: Optional[str] = None
    recommended_product_ids: List[str] = Field(default_factory=list)

class PrescriptionResponse(BaseModel):
    id: str = Field(..., alias="_id")
    appointment_id: str
    vet_id: str
    user_id: str
    pet_id: str
    medicines: List[Medicine]
    general_notes: Optional[str]
    recommended_product_ids: List[str]
    pdf_url: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
