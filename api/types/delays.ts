import { Organization } from "./organizations";

export type DelayType = "Po prosledovaniyu" | "Po otpravleniyu";

// Station names - can be extended as needed
export type Station = string;

// Delay type options for select dropdowns
export const DELAY_TYPE_OPTIONS: Array<{ value: DelayType; label: string }> = [
  { value: "Po prosledovaniyu", label: "Po prosledovaniyu" },
  { value: "Po otpravleniyu", label: "Po otpravleniyu" },
];

// Station options - sorted alphabetically (handles both Latin and Cyrillic)
export const STATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "3346-км", label: "3346-км" },
  { value: "3347-км", label: "3347-км" },
  { value: "Sariosiyo", label: "Sariosiyo" },
  { value: "Аблык", label: "Аблык" },
  { value: "Азизабод", label: "Азизабод" },
  { value: "Айратам", label: "Айратам" },
  { value: "Акалтын", label: "Акалтын" },
  { value: "Аккавак", label: "Аккавак" },
  { value: "Акча", label: "Акча" },
  { value: "Алатун", label: "Алатун" },
  { value: "Алмазор", label: "Алмазор" },
  { value: "Алмалык", label: "Алмалык" },
  { value: "Ангрен", label: "Ангрен" },
  { value: "Андижан-1", label: "Андижан-1" },
  { value: "Аранчи", label: "Аранчи" },
  { value: "Аренда", label: "Аренда" },
  { value: "Ахангаран", label: "Ахангаран" },
  { value: "Багорное", label: "Багорное" },
  { value: "Баяут", label: "Баяут" },
  { value: "Байткурган", label: "Байткурган" },
  { value: "Бахт", label: "Бахт" },
  { value: "Бекабад", label: "Бекабад" },
  { value: "Беруний", label: "Беруний" },
  { value: "Блок Пост", label: "Блок Пост" },
  { value: "Бозсу", label: "Бозсу" },
  { value: "Бой-то?", label: "Бой-то?" },
  { value: "Бувайда", label: "Бувайда" },
  { value: "Булунгур", label: "Булунгур" },
  { value: "Бунокор", label: "Бунокор" },
  { value: "Бухара", label: "Бухара" },
  { value: "Бухара-2", label: "Бухара-2" },
  { value: "Галла-Арал", label: "Галла-Арал" },
  { value: "Газалкент", label: "Газалкент" },
  { value: "Гресс", label: "Гресс" },
  { value: "Гулбаг", label: "Гулбаг" },
  { value: "Гулистон", label: "Гулистон" },
  { value: "Гумбас", label: "Гумбас" },
  { value: "Далагузар", label: "Далагузар" },
  { value: "Даштабад", label: "Даштабад" },
  { value: "Депо-Узбекистан", label: "Депо-Узбекистан" },
  { value: "Джам", label: "Джам" },
  { value: "Джанбай", label: "Джанбай" },
  { value: "Джизак", label: "Джизак" },
  { value: "Джизак-2", label: "Джизак-2" },
  { value: "Джума", label: "Джума" },
  { value: "Дустлик", label: "Дустлик" },
  { value: "Еттисай", label: "Еттисай" },
  { value: "Жалаир", label: "Жалаир" },
  { value: "Зарбдор", label: "Зарбдор" },
  { value: "Зарафшан", label: "Зарафшан" },
  { value: "Зерафшан", label: "Зерафшан" },
  { value: "Зирабулок", label: "Зирабулок" },
  { value: "Зияуддин", label: "Зияуддин" },
  { value: "Зомин", label: "Зомин" },
  { value: "Ирджарская", label: "Ирджарская" },
  { value: "Кадиря", label: "Кадиря" },
  { value: "Каканд", label: "Каканд" },
  { value: "Карши", label: "Карши" },
  { value: "Каттакурган", label: "Каттакурган" },
  { value: "Кашкадаря", label: "Кашкадаря" },
  { value: "Келес", label: "Келес" },
  { value: "Кизил-тепа", label: "Кизил-тепа" },
  { value: "Китоб", label: "Китоб" },
  { value: "Кон", label: "Кон" },
  { value: "Куканд", label: "Куканд" },
  { value: "Кул", label: "Кул" },
  { value: "Кунград", label: "Кунград" },
  { value: "Кушминор", label: "Кушминор" },
  { value: "Кучлук", label: "Кучлук" },
  { value: "Куюмазар", label: "Куюмазар" },
  { value: "Малик", label: "Малик" },
  { value: "Мараканд", label: "Мараканд" },
  { value: "Маргилан", label: "Маргилан" },
  { value: "Марджанбулак", label: "Марджанбулак" },
  { value: "Мехнат", label: "Мехнат" },
  { value: "Навруз", label: "Навруз" },
  { value: "Навои", label: "Навои" },
  { value: "Назарбек", label: "Назарбек" },
  { value: "Наманган", label: "Наманган" },
  { value: "Натес", label: "Натес" },
  { value: "Нов. янгиер", label: "Нов. янгиер" },
  { value: "Новый янгиер", label: "Новый янгиер" },
  { value: "Нурлидон", label: "Нурлидон" },
  { value: "Нурхаёт", label: "Нурхаёт" },
  { value: "Озодлик", label: "Озодлик" },
  { value: "Орзу", label: "Орзу" },
  { value: "Пахта", label: "Пахта" },
  { value: "Пахтаарал", label: "Пахтаарал" },
  { value: "Пахтакор", label: "Пахтакор" },
  { value: "ПОП-2", label: "ПОП-2" },
  { value: "Поп", label: "Поп" },
  { value: "Раустан", label: "Раустан" },
  { value: "Рахимов", label: "Рахимов" },
  { value: "РЗД-12", label: "РЗД-12" },
  { value: "Рзд -11", label: "Рзд -11" },
  { value: "Рзд-10", label: "Рзд-10" },
  { value: "Рзд-134", label: "Рзд-134" },
  { value: "Рзд-135", label: "Рзд-135" },
  { value: "Рзд-14", label: "Рзд-14" },
  { value: "Рзд-15", label: "Рзд-15" },
  { value: "Рзд-16", label: "Рзд-16" },
  { value: "Рзд-17", label: "Рзд-17" },
  { value: "Рзд-18", label: "Рзд-18" },
  { value: "Рзд-19", label: "Рзд-19" },
  { value: "Рзд-20", label: "Рзд-20" },
  { value: "Рзд-21", label: "Рзд-21" },
  { value: "Рзд-205", label: "Рзд-205" },
  { value: "Рзд-9", label: "Рзд-9" },
  { value: "Робот", label: "Робот" },
  { value: "РЭП", label: "РЭП" },
  { value: "Сайхун", label: "Сайхун" },
  { value: "Салар", label: "Салар" },
  { value: "Самарканд", label: "Самарканд" },
  { value: "Сангзор", label: "Сангзор" },
  { value: "Сары-агач", label: "Сары-агач" },
  { value: "Сергели", label: "Сергели" },
  { value: "Северный вокзал", label: "Северный вокзал" },
  { value: "Ташкент", label: "Ташкент" },
  { value: "Ташкент Пасс", label: "Ташкент Пасс" },
  { value: "Ташкент товар", label: "Ташкент товар" },
  { value: "Ташкент Южний", label: "Ташкент Южний" },
  { value: "Темирёлобод", label: "Темирёлобод" },
  { value: "Тойтепа", label: "Тойтепа" },
  { value: "Тудакуль", label: "Тудакуль" },
  { value: "Тукимачи", label: "Тукимачи" },
  { value: "Узбекистан", label: "Узбекистан" },
  { value: "Улугбек", label: "Улугбек" },
  { value: "Улус", label: "Улус" },
  { value: "Ургенч", label: "Ургенч" },
  { value: "Урта-Аул", label: "Урта-Аул" },
  { value: "Фаровон", label: "Фаровон" },
  { value: "Фархад", label: "Фархад" },
  { value: "Фергана", label: "Фергана" },
  { value: "Хаваст", label: "Хаваст" },
  { value: "Хазарасп", label: "Хазарасп" },
  { value: "Халкабад", label: "Халкабад" },
  { value: "Хамза", label: "Хамза" },
  { value: "Хива", label: "Хива" },
  { value: "Ходжикент", label: "Ходжикент" },
  { value: "Чаманзор", label: "Чаманзор" },
  { value: "Чинабад", label: "Чинабад" },
  { value: "Чинаркент", label: "Чинаркент" },
  { value: "Чинобод", label: "Чинобод" },
  { value: "Чиноз", label: "Чиноз" },
  { value: "Чирчик", label: "Чирчик" },
  { value: "Чодак", label: "Чодак" },
  { value: "Чукурсай", label: "Чукурсай" },
  { value: "Чукурсай 12", label: "Чукурсай 12" },
  { value: "Чимкурган", label: "Чимкурган" },
  { value: "Шахрисабз", label: "Шахрисабз" },
  { value: "Шарк", label: "Шарк" },
  { value: "Шуртан", label: "Шуртан" },
  { value: "Элабод", label: "Элабод" },
  { value: "Южный вокзал", label: "Южный вокзал" },
  { value: "Ялангач", label: "Ялангач" },
  { value: "Янгиер", label: "Янгиер" },
  { value: "Янгичиноз", label: "Янгичиноз" },
  { value: "Янгиюл", label: "Янгиюл" },
];

export interface ResponsibleOrgDetail {
  id: number;
  name: string;
  organization: Organization;
}

export type TrainType = "passenger" | "freight" | "electric" | "shunt" | "high_speed";

export type GroupReason =
  | "repair"
  | "speed_violation"
  | "crew_waiting"
  | "autoblock_center"
  | "driver_dispute"
  | "fuel_finished"
  | "late_loco_exit"
  | "other";

export const TRAIN_TYPE_OPTIONS: Array<{ value: TrainType; label: string }> = [
  { value: "passenger", label: "Yo'lovchi" },
  { value: "freight", label: "Yuk" },
  { value: "electric", label: "Elektr" },
  { value: "shunt", label: "Manyovr" },
  { value: "high_speed", label: "Yuqori tezlikda harakatlanuvchi" },
];

export const GROUP_REASON_OPTIONS: Array<{ value: GroupReason; label: string }> = [
  { value: "repair", label: "Lokomotiv ta'mirlash" },
  { value: "speed_violation", label: "Tezlik buzilishi" },
  { value: "crew_waiting", label: "Ekipaj kutish" },
  { value: "autoblock_center", label: "Avtoblok markazi" },
  { value: "driver_dispute", label: "Mashinist bahs-munozarasi" },
  { value: "fuel_finished", label: "Yoqilg'i tugashi" },
  { value: "late_loco_exit", label: "Lokomotiv kech chiqishi" },
  { value: "other", label: "Boshqa" },
];

export interface DelayEntry {
  id: number;
  delay_type: DelayType;
  train_number: string;
  station: string;
  delay_time: string; // ISO time string
  reason: string;
  damage_amount: number;
  responsible_org: number;
  responsible_org_detail?: ResponsibleOrgDetail;
  responsible_org_name?: string;
  report?: string;
  report_filename?: string;
  incident_date: string; // YYYY-MM-DD
  status: boolean;
  archive: boolean;
  status_display?: string;
  created_at?: string; // ISO datetime string
  group_reason?: GroupReason;
  group_reason_display?: string;
  train_type?: TrainType;
  train_type_display?: string;
}

export interface DelayCreatePayload {
  delay_type: DelayType;
  train_number: string;
  station: string;
  delay_time: string; // Format: "HH:MM:SS" (e.g., "01:03:00" for 1 hour 3 minutes)
  reason: string;
  damage_amount: number;
  responsible_org: number;
  report?: File | null;
  incident_date: string; // YYYY-MM-DD
  status?: boolean; // Defaults to false when creating
  archive?: boolean; // Defaults to false when creating
  group_reason: GroupReason;
  train_type: TrainType;
}

export interface DelayUpdatePayload {
  delay_type?: DelayType;
  train_number?: string;
  station?: string;
  delay_time?: string; // Format: "HH:MM:SS" (e.g., "01:03:00" for 1 hour 3 minutes)
  reason?: string;
  damage_amount?: number;
  responsible_org?: number;
  report?: File | null;
  incident_date?: string;
  status?: boolean;
  archive?: boolean;
  group_reason?: GroupReason;
  train_type?: TrainType;
}

export interface DelayListParams {
  page?: number;
  page_size?: number;
  search?: string;
  delay_type?: DelayType;
  station?: string;
  responsible_org?: number | string;
  status?: boolean;
  archive?: boolean;
  incident_date?: string;
  from_date?: string;
  end_date?: string;
  train_type?: TrainType | string;
  group_reason?: GroupReason | string;
}

// Delay Reports Types
export interface DelayReportCategory {
  count: number;
  total_delay_time_minutes: number;
  total_delay_time: string; // Format: "HH:MM:SS"
  total_damage: number;
}

export interface DelayReportRow {
  depo: string;
  po_otpravleniyu: DelayReportCategory;
  po_prosledovaniyu: DelayReportCategory;
  total: DelayReportCategory;
}

export interface DelayReportTotal {
  po_otpravleniyu: DelayReportCategory;
  po_prosledovaniyu: DelayReportCategory;
  total: DelayReportCategory;
  depo: string; // "Всего"
}

export interface DelayReportResponse {
  rows: DelayReportRow[];
  total: DelayReportTotal;
}

// Freight Report Types (with additional "v_tom_chisle" breakdown)
export interface DelayReportSubCategory {
  count: number;
  total_delay_time_minutes: number;
  total_delay_time: string; // Format: "HH:MM:SS"
}

export interface DelayReportVTomChisle {
  net_elektrovaza: DelayReportSubCategory; // нет электровоза
  net_teplovaza: DelayReportSubCategory; // нет тепловоза
  po_vine_depo: DelayReportSubCategory; // по вине депо
}

export interface DelayReportFreightRow {
  depo: string;
  po_otpravleniyu: DelayReportCategory;
  po_prosledovaniyu: DelayReportCategory;
  total: DelayReportCategory;
  v_tom_chisle: DelayReportVTomChisle;
}

export interface DelayReportFreightTotal {
  po_otpravleniyu: DelayReportCategory;
  po_prosledovaniyu: DelayReportCategory;
  total: DelayReportCategory;
  v_tom_chisle: DelayReportVTomChisle;
  depo: string; // "Итого"
}

export interface DelayReportFreightResponse {
  rows: DelayReportFreightRow[];
  total: DelayReportFreightTotal;
}

// Depot Reason Reports Types
export interface DepotReasonReportRow {
  reason: string;
  reason_label: string;
  // Dynamic depot/summary columns like "depo", "shch", "total"
  [key: string]: string | number;
}

export interface DepotReasonReportTotal extends DepotReasonReportRow {}

export interface DepotReasonReportSummary {
  total_cases: number;
  total_hours: number;
  total_minutes: number;
  total_delay_time_formatted: string;
}

export interface DepotReasonReportResponse {
  headers: string[];
  rows: DepotReasonReportRow[];
  total: DepotReasonReportTotal;
  summary: DepotReasonReportSummary;
}

export interface DelayReportParams {
  start_date: string; // Required, format: "YYYY-MM-DD"
  end_date: string; // Required, format: "YYYY-MM-DD"
  organizations?: string; // Optional, comma-separated IDs like "1,2"
  train_types?: string; // Optional, comma-separated train types like "passenger,electric,high_speed"
  train_type?: string; // Optional, single train type like "freight" for detailed reports
}
