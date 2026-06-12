import api from "./axios";

export interface Vaccination {
  name: string;
  date_given?: string;
  next_due?: string;
  doc_url?: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string;
  dob?: string;
  weight?: number;
  photo_url?: string;
  health_notes?: string;
  vaccinations?: Vaccination[];
  created_at: string;
  updated_at: string;
}

export const getMyPets = async (): Promise<Pet[]> => {
  const res = await api.get("/pets");
  return res.data;
};

export const createPet = async (data: FormData): Promise<Pet> => {
  const res = await api.post("/pets", data);
  return res.data;
};

export const deletePet = async (petId: string): Promise<void> => {
  await api.delete(`/pets/${petId}`);
};

export const updatePet = async (petId: string, data: FormData): Promise<Pet> => {
  const res = await api.put(`/pets/${petId}`, data);
  return res.data;
};
