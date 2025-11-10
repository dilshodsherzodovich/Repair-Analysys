export interface ClassificatorElement {
  id: string;
  name: string;
}

export interface Classificator {
  id: string;
  name: string;
  elements: ClassificatorElement[];
  created: string;
}

export interface ClassificatorGetParams {
  page?: number;
}

export interface ClassificatorCreateParams {
  name: string;
  elements: {
    name: string;
  }[];
}

export interface ClassificatorUpdateParams {
  id: string;
  data: {
    name: string;
    elements: {
      name: string;
    }[];
  };
}
