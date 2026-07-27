// Integration with the external UzGPS / EMM railway service
// (https://emm.railway.uz). This backend is separate from the main e-passport
// API: it has its own ClientId/ClientSecret auth and is called directly from
// the browser. Ported from the dejurniy project.

const EMM_BASE_URL = "https://emm.railway.uz/api";

const EMM_CREDENTIALS = {
  clientId: "search_gps",
  clientSecret: "@Ddfs@1_v@sdfsdn",
};

export interface EmmAuthResponse {
  value: string;
  expiryDate: string;
}

export interface DriverData {
  mashinist_fio: string;
  phone: string;
  lok_nomer?: string;
  lok_name?: string;
  emm_id?: number;
  yafka?: string;
  mashinist_type_id?: number;
  image_url?: string;
}

export interface DriverInfoApiResponse {
  data: DriverData[];
  code: number;
  message: string | null;
  errors: unknown[];
  isValid: boolean;
}

// One GPS fix as returned by UzGPS `GetObjectLocationList`.
export interface LocationRecord {
  id: number;
  contractId: number;
  mobjectId: number;
  mobjectName: string;
  plateNumber: string;
  imei: string;
  // Epoch milliseconds, delivered as a string.
  tpTimestamp: string;
  tpTimestampFmt: string;
  lastTrackSec: number | null;
  lat: number;
  lon: number;
  alt: number;
  speed: number;
  angle: number;
  movement: number;
  engineOn: number;
  satellites: number;
  groupId: number;
  groupName: string;
  brandName: string;
  createdAt: string;
}

interface LocationApiResponse {
  data: LocationRecord[];
}

/** Authenticate against EMM and return a bearer token string. */
export const getEmmAuthToken = async (): Promise<EmmAuthResponse> => {
  const response = await fetch(
    `${EMM_BASE_URL}/Authenticate?ClientId=${EMM_CREDENTIALS.clientId}&ClientSecret=${EMM_CREDENTIALS.clientSecret}`
  );
  if (!response.ok) {
    throw new Error(`EMM auth failed: ${response.statusText}`);
  }
  return response.json();
};

const formatEmmDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/** Current machinist(s) assigned to a locomotive on a given date. */
export const getDriverInfo = async (
  token: string,
  locomotiveNumber: string,
  modelId: number,
  forDate?: string
): Promise<DriverInfoApiResponse> => {
  const dateParam = forDate || formatEmmDate(new Date());
  const url = `${EMM_BASE_URL}/LokomotivInfo/GetMashinistForDateBylokomotiv?forDate=${encodeURIComponent(
    dateParam
  )}&lokNomer=${encodeURIComponent(locomotiveNumber)}&modelId=${modelId}`;

  const response = await fetch(url, { headers: { Authorization: token } });
  if (!response.ok) {
    throw new Error(`EMM driver info failed: ${response.statusText}`);
  }
  return response.json();
};

/** Full historical GPS fix list for an IMEI, newest first. */
export const getLocationHistory = async (
  token: string,
  imei: string
): Promise<LocationRecord[]> => {
  const response = await fetch(
    `${EMM_BASE_URL}/UzGPSEmm/GetObjectLocationList?imei_code=${encodeURIComponent(
      imei
    )}`,
    { headers: { Authorization: token } }
  );
  if (!response.ok) {
    throw new Error(`EMM location failed: ${response.statusText}`);
  }
  const json: LocationApiResponse = await response.json();
  const list = json?.data ?? [];
  return [...list].sort(
    (a, b) => Number(b.tpTimestamp) - Number(a.tpTimestamp)
  );
};

/** Most recent GPS fix for an IMEI, or null when there is no data. */
export const getLatestLocation = async (
  token: string,
  imei: string
): Promise<LocationRecord | null> => {
  const list = await getLocationHistory(token, imei);
  return list.length > 0 ? list[0] : null;
};
