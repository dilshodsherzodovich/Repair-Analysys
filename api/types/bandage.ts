/** One bandage (wheel tyre) row from `/bandages/` — a KP component of a section. */
export interface Bandage {
  id: number;
  component: number;
  component_name: string;
  locomotive: number;
  locomotive_name: string;
  section: number | null;
  section_name: string | null;
  left: number | null;
  right: number | null;
}

/** Only left/right are writable; null clears the value. */
export interface UpdateBandagePayload {
  left?: number | null;
  right?: number | null;
}

export interface BandageParams {
  locomotive?: number;
  section?: number;
  component?: number;
  search?: string;
  ordering?: string;
}
