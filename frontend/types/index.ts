/**
 * 核心数据类型定义
 */

// 禅修中心
export interface Center {
  id: number;
  centerName: string;
  address: string;
  contactPhone: string;
  contactPerson: string;
  centerDescription?: string;
  status: 'OPERATING' | 'PAUSED' | 'CLOSED';
}

// 课程会期
export interface Session {
  id: number;
  centerId: number;
  sessionCode: string;
  courseType: string;
  startDate: string;
  endDate: string;
  expectedStudents?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 学员信息
export interface Student {
  id: number;
  sessionId: number;
  centerId: number;
  studentNumber?: string; // 学号/编号
  name: string;
  gender: 'M' | 'F';
  age: number;
  ageGroup: '18-30' | '30-40' | '40-55' | '60+';
  idCard?: string; // 身份证号码
  city?: string; // 城市
  phone?: string; // 手机号码
  studentType: 'monk' | 'old_student' | 'new_student';
  course10dayTimes: number;
  course4mindfulnessTimes: number;
  course20dayTimes: number;
  course30dayTimes: number;
  course45dayTimes: number;
  serviceTimes: number;
  studyTimes?: number; // 修学总次数
  practice?: string; // 练习（每周时长）
  fellowList?: string; // 同期人员
  willingToServe?: string; // 是否愿意服务
  idAddress?: string; // 证件地址
  specialNotes?: string; // 居住地址（保存在specialNotes中）
  emergencyPhone?: string; // 直系亲属电话
  priority: number;
  companion?: number; // 同伴学员ID
  status: 'registered' | 'allocated' | 'assigned_seat' | 'checked_in' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// 房间
export interface Room {
  id: number;
  centerId: number;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  roomType: 'monk' | 'old_student' | 'new_student' | 'other';
  status: 'enabled' | 'disabled';
  reserved: boolean;
  reservedFor?: string;
  notes?: string;
}

// 床位
export interface Bed {
  id: number;
  roomId: number;
  bedNumber: number;
  occupyingStudent?: number; // 分配给哪个学员
  status: 'available' | 'allocated' | 'reserved';
}

// 房间分配记录
export interface Allocation {
  id: number;
  sessionId: number;
  studentId: number;
  bedId: number;
  roomId: number;
  centerId: number;
  status: 'pending' | 'confirmed' | 'adjusted' | 'cancelled';
  conflictFlag?: string; // 冲突标志
  createdAt: string;
  updatedAt: string;
}

// 分配冲突
export interface AllocationConflict {
  id: number;
  sessionId: number;
  studentId?: number;
  allocationId?: number;
  conflictType: 'companion_separated' | 'overcapacity' | 'type_mismatch' | 'gender_mismatch';
  description: string;
  status: 'unresolved' | 'resolved';
  resolution?: string;
  createdAt: string;
}

// 禅堂配置
export interface MeditationHallConfig {
  id: number;
  centerId: number;
  regionCode: string;
  regionName: string;
  genderType: 'M' | 'F' | 'mixed';
  regionWidth: number;
  regionRows: number;
  isAutoWidth: boolean;
  isAutoRows: boolean;
  numberingType: 'sequential' | 'odd' | 'even';
  seatPrefix: string;
}

// 禅堂座位
export interface MeditationSeat {
  id: number;
  sessionId: number;
  centerId: number;
  studentId: number;
  hallConfigId: number;
  regionCode: string;
  seatNumber: string;
  rowPosition: number;
  colPosition: number;
  seatType: 'student' | 'monk' | 'dharma_worker';
  ageGroup: '18-30' | '30-40' | '40-55' | '60+';
  gender: 'M' | 'F';
  isWithCompanion: boolean;
  companionSeatId?: number;
  status: 'available' | 'allocated' | 'reserved';
  createdAt: string;
}

// 分配统计
export interface AllocationStats {
  totalStudents: number;
  allocatedStudents: number;
  pendingStudents: number;
  conflictCount: number;
  allocationRate: number;
}

// API响应包装类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp?: string;
}

// 页面状态
export interface PageState {
  loading: boolean;
  error?: string;
  success?: string;
}
