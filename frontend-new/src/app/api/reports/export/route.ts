import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { exportSeatReport } from '@/services/report/export'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ code: 400, message: '缺少 sessionId' }, { status: 400 })
  }

  try {
    const buffer = await exportSeatReport(Number(sessionId))
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="seat-report.xlsx"',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '导出失败'
    return NextResponse.json({ code: 500, message }, { status: 500 })
  }
}
