export interface LocomotiveModel {
  id: number;
  name: string;
  code?: number;
  locomotive_type?: string;
  image?: string | null;
}

export interface LocomotiveModelParams {
  locomotive_type?: string;
}
