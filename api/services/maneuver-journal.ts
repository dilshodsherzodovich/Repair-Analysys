import api from "../axios";
import {
  ManeuverJournalParams,
  ManeuverJournalResponse,
  ManeuverJournalCreateData,
  ManeuverJournalUpdateData,
  ManeuverJournalEntry,
} from "../types/maneuver-journal";

export const getManeuverJournals = async (params?: ManeuverJournalParams) => {
  const { data } = await api.get<ManeuverJournalResponse>(
    "/maneuver-journal/",
    { params },
  );
  return data;
};

export const createManeuverJournal = async (
  payload: ManeuverJournalCreateData,
) => {
  const { data } = await api.post<ManeuverJournalEntry>(
    "/maneuver-journal/",
    payload,
  );
  return data;
};

export const updateManeuverJournal = async (
  id: number | string,
  payload: ManeuverJournalUpdateData,
) => {
  const { data } = await api.patch<ManeuverJournalEntry>(
    `/maneuver-journal/${id}/`,
    payload,
  );
  return data;
};

export const deleteManeuverJournal = async (id: number | string) => {
  await api.delete(`/maneuver-journal/${id}/`);
};
