export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterParams {
  search?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export type QueryParams = PaginationParams & FilterParams;

export interface CreateTransaksiDto {
  tanggal: Date;
  tipe: string;
  deskripsi?: string;
  pelangganId?: string;
  pemasokId?: string;
  mataUangId?: string;
  kurs?: number;
  detail: CreateTransaksiDetailDto[];
}

export interface CreateTransaksiDetailDto {
  akunId: string;
  deskripsi?: string;
  kuantitas: number;
  hargaSatuan: number;
  diskon?: number;
}

export interface CreateVoucherDto {
  tanggal: Date;
  tipe: string;
  deskripsi: string;
  detail: CreateVoucherDetailDto[];
}

export interface CreateVoucherDetailDto {
  akunId: string;
  deskripsi?: string;
  debit: number;
  kredit: number;
  costCenterId?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  perusahaanId: string;
  username: string;
  email: string;
  password: string;
  namaLengkap: string;
  role?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
