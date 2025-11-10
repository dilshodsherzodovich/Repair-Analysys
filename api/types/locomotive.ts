export interface LocomotiveData {
  id: number;
  name: string;
  locomotive_model: {
    id: number;
    name: string;
    code: number;
    locomotive_type: string;
  };
}
