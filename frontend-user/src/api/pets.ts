import api from "./axios";

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string;
  dob?: string;
  weight?: number;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PetCreate {
  name: string;
  species: string;
  breed?: string;
  dob?: string;
  weight?: number;
}

export const getMyPets = async (): Promise<Pet[]> => {
  const res = await api.get("/pets");
  return res.data;
};

export const createPet = async (data: PetCreate): Promise<Pet> => {
  const res = await api.post("/pets", data);
  return res.data;
};

export const deletePet = async (petId: string): Promise<void> => {
  await api.delete(`/pets/${petId}`);
};
