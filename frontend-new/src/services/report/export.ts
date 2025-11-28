import ExcelJS from 'exceljs'
import { apiClient } from '@/lib/http'
import type { MeditationSeat } from '@/types/domain'

async function fetchSeats(sessionId: number): Promise<MeditationSeat[]> {
  const res = await apiClient.get(`/meditation-seats/session/${sessionId}`)
  return res.data?.data?.list ?? []
}

export async function exportSeatReport(sessionId: number): Promise<Buffer> {
  const seats = await fetchSeats(sessionId)
  const workbook = new ExcelJS.Workbook()

  const buildSheet = (title: string, list: MeditationSeat[]) => {
    const sheet = workbook.addWorksheet(title)
    sheet.columns = [
      { header: '序号', key: 'idx', width: 10 },
      { header: '姓名', key: 'name', width: 20 },
    ]
    sheet.getRow(1).font = { bold: true }
    list.forEach((seat, idx) => {
      sheet.addRow({ idx: idx + 1, name: seat.studentName || '' })
    })
    // 表头说明
    sheet.spliceRows(1, 0, [title])
    sheet.mergeCells(1, 1, 1, 2)
    sheet.getCell(1, 1).font = { bold: true }
  }

  const sortSeats = (arr: MeditationSeat[]) =>
    [...arr].sort((a, b) => (a.seatNumber || '').localeCompare(b.seatNumber || '', 'zh-CN'))

  const male = sortSeats(seats.filter((s) => s.gender === 'M'))
  const female = sortSeats(seats.filter((s) => s.gender === 'F'))

  buildSheet('男众', male)
  buildSheet('女众', female)

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
