export type StatusFlag = "ENABLED" | "DISABLED";

export interface Center {
  id: number;
  centerName: string;
  address?: string;
  contactPhone?: string;
  contactPerson?: string;
  centerDescription?: string;
  status?: "OPERATING" | "PAUSED" | "CLOSED";
}

export interface Session {
  id: number;
  centerId: number;
  sessionCode: string;
  courseType: string;
  startDate: string;
  endDate?: string;
  expectedStudents?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Gender = "M" | "F";

export interface Student {
  id: number;
  sessionId: number;
  centerId: number;
  studentNumber?: string;
  name: string;
  gender: Gender;
  age?: number;
  idCard?: string;
  city?: string;
  phone?: string;
  studentType: "monk" | "old_student" | "new_student";
  course10dayTimes?: number;
  course4mindfulnessTimes?: number;
  course20dayTimes?: number;
  course30dayTimes?: number;
  course45dayTimes?: number;
  serviceTimes?: number;
  studyTimes?: number;
  practice?: string;
  fellowList?: string;
  willingToServe?: string;
  idAddress?: string;
  specialNotes?: string;
  emergencyPhone?: string;
  priority?: number;
  companion?: number;
  status?: "registered" | "allocated" | "assigned_seat" | "checked_in" | "completed";
  totalPractices?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type RoomType = "monk" | "old_student" | "new_student" | "other" | "学员房" | "义工房" | "老师房";
export type GenderArea = "男" | "女";

export interface Room {
  id: number;
  centerId: number;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  status: StatusFlag;
  genderArea: GenderArea;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BedPosition = "上铺" | "下铺" | "单床";
export type BedStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED";

export interface Bed {
  id: number;
  roomId: number;
  bedNumber: number;
  position?: BedPosition;
  status: BedStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Allocation {
  id: number;
  sessionId: number;
  studentId: number;
  roomId: number;
  bedNumber: number;
  allocationType?: "MANUAL" | "AUTOMATIC";
  allocationReason?: string;
  conflictFlag?: boolean;
  isTemporary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllocationWithRelations extends Allocation {
  student?: Student;
  room?: Room;
  bed?: Bed;
}

export interface AllocationStats {
  totalStudents: number;
  allocatedStudents: number;
  pendingStudents: number;
  conflictCount: number;
  allocationRate: number;
}

export interface AllocationConflict {
  id: number;
  sessionId: number;
  studentId?: number;
  conflictType: string;
  description?: string;
  status: "unresolved" | "resolved";
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SeatSectionPurpose = "MONK" | "OLD_STUDENT" | "NEW_STUDENT" | "WORKER" | "RESERVED" | "MIXED";
export type FillDirection = "ROW_MAJOR" | "COLUMN_MAJOR";

export interface NumberingConfig {
  mode?: string;
  prefix?: string;
  startNumber?: number;
}

export interface SeatSection {
  name: string;
  purpose: SeatSectionPurpose;
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
  fillDirection?: FillDirection;
  numberingOverride?: NumberingConfig;
  capacity?: number;
}

export interface ReservedSlot {
  row: number;
  col: number;
  reason?: string;
}

export interface MonkSeatConfig {
  enabled?: boolean;
  rowStart?: number;
  rowEnd?: number;
  colStart?: number;
  colEnd?: number;
}

export interface HighlightRule {
  condition?: string;
  color?: string;
}

export interface HallLayout {
  originRow?: number;
  originCol?: number;
  totalRows?: number;
  totalCols?: number;
  autoRows?: boolean;
  autoCols?: boolean;
  rowSpacing?: number;
  colSpacing?: number;
  sections?: SeatSection[];
  reservedSlots?: ReservedSlot[];
  monkSeats?: MonkSeatConfig;
  numbering?: NumberingConfig;
  highlightRules?: HighlightRule[];
  supportedGenders?: string[];
  usageMode?: string;
}

// 为了向后兼容，保留 HallSection 作为 SeatSection 的别名
export type HallSection = SeatSection;

export interface HallConfig {
  id: number;
  centerId: number;
  sessionId: number;
  regionCode: string;
  regionName?: string;
  layout: HallLayout;
}

export interface CompiledSeatCell {
  row: number;
  col: number;
  sectionName?: string;
  purpose?: SeatSectionPurpose;
  reserved?: boolean;
}

export interface CompiledLayout {
  totalRows: number;
  totalCols: number;
  cells: CompiledSeatCell[];
}

export type SeatStatus = 'available' | 'allocated' | 'reserved';
export type SeatType = 'MONK' | 'STUDENT' | 'WORKER';

export interface MeditationSeat {
  id: number;
  sessionId: number;
  centerId: number;
  hallConfigId: number;
  hallId: number;
  seatNumber: string;
  studentId?: number;
  bedCode?: string;
  seatType: SeatType;
  status: SeatStatus;
  isOldStudent?: boolean;
  ageGroup?: string;
  gender?: Gender;
  regionCode: string;
  rowIndex: number;
  colIndex: number;
  rowPosition?: number;
  colPosition?: number;
  isWithCompanion?: boolean;
  companionSeatId?: number;
  createdAt?: string;
  updatedAt?: string;
  // 前端扩展字段（用于显示）
  studentName?: string;
  age?: number;
  studyTimes?: number;
  serviceTimes?: number;
  totalCourseTimes?: number;
}

export interface SeatStatistics {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  maleSeats: number;
  femaleSeats: number;
  oldStudents: number;
  newStudents: number;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface ListResult<T> {
  list: T[];
  total?: number;
  page?: number;
  size?: number;
}
