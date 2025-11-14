'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons'
import { Button, Empty, Segmented, Space } from 'antd'
import clsx from 'clsx'
import type { Room, Student } from '@/types/domain'
import { useAppContext } from '@/state/app-context'
import { useAllocations, useRooms, useStudents } from '@/hooks/queries'
import styles from './AllocationPrintPage.module.css'

type GenderFilter = 'all' | 'female' | 'male'

interface RoomCardData {
  room: Room
  occupants: {
    bedNumber?: number
    student?: Student
  }[]
}

const genderOptions = [
  { label: '全部', value: 'all' },
  { label: '女众', value: 'female' },
  { label: '男众', value: 'male' },
]

const getGenderKey = (value?: string | null): GenderFilter => {
  if (!value) return 'all'
  const normalized = value.toLowerCase()
  if (normalized.includes('女') || normalized.startsWith('f')) return 'female'
  if (normalized.includes('男') || normalized.startsWith('m')) return 'male'
  return 'all'
}

const bedSymbols = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮']

const getBedSymbol = (bed?: number) => {
  if (!bed || bed < 1) return '•'
  return bedSymbols[bed - 1] ?? `床${bed}`
}

const formatAddress = (student?: Student, maxLength: number = 10) => {
  if (!student) return null
  const raw = (student.city ?? student.idAddress)?.trim()
  if (!raw) return null
  // 移除所有空格和特殊字符，只保留中文、数字、字母
  const normalized = raw.replace(/\s+/g, '').replace(/[\/]/g, '')
  if (normalized.length <= maxLength) return normalized
  // 智能截断：优先保留省份和城市
  const parts = normalized.split(/[省市区县]/)
  if (parts.length >= 2) {
    const short = parts.slice(0, 2).join('') + (parts[1].length > 3 ? '...' : '')
    return short.length <= maxLength ? short : `${normalized.slice(0, maxLength - 1)}…`
  }
  return `${normalized.slice(0, maxLength - 1)}…`
}

const getCompanionName = (student?: Student, lookup?: Map<number, Student>) => {
  if (!student) return null
  if (student.companion && lookup?.has(student.companion)) {
    const mate = lookup.get(student.companion)
    if (mate?.name) {
      return mate.name
    }
  }
  if (student.fellowList) {
    const candidate = student.fellowList
      .split(/[,，、/\\s]+/)
      .map((name) => name.trim())
      .filter((name) => name && name !== student.name)[0]
    if (candidate) {
      return candidate
    }
  }
  return null
}

export function AllocationPrintPage() {
  const router = useRouter()
  const { currentCenter, currentSession } = useAppContext()
  const allocationsQuery = useAllocations(currentSession?.id)
  const roomsQuery = useRooms(currentCenter?.id)
  const studentsQuery = useStudents(currentSession?.id)
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('female')
  const [denseMode, setDenseMode] = useState(false)

  const studentMap = useMemo(
    () => new Map(studentsQuery.data?.map((student) => [student.id, student]) ?? []),
    [studentsQuery.data],
  )

  const roomCards: RoomCardData[] = useMemo(() => {
    if (!roomsQuery.data) return []
    return roomsQuery.data.map((room) => {
      const occupants =
        allocationsQuery.data
          ?.filter((alloc) => alloc.roomId === room.id)
          .map((alloc) => ({
            bedNumber: alloc.bedNumber,
            student: studentMap.get(alloc.studentId),
          }))
          .sort((a, b) => (a.bedNumber ?? 0) - (b.bedNumber ?? 0)) ?? []
      return { room, occupants }
    })
  }, [roomsQuery.data, allocationsQuery.data, studentMap])

  const filteredRoomCards = useMemo(() => {
    if (genderFilter === 'all') return roomCards
    return roomCards.filter((card) => getGenderKey(card.room.genderArea) === genderFilter)
  }, [roomCards, genderFilter])

  const floors = useMemo(() => {
    const floorMap = new Map<number, RoomCardData[]>()
    filteredRoomCards.forEach((card) => {
      const floorKey = card.room.floor ?? 0
      const list = floorMap.get(floorKey) ?? []
      list.push(card)
      floorMap.set(floorKey, list)
    })
    return Array.from(floorMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([floor, cards]) => ({
        floor,
        cards: cards.sort((a, b) => a.room.roomNumber.localeCompare(b.room.roomNumber, 'zh-CN', { numeric: true })),
      }))
  }, [filteredRoomCards])

  const stats = useMemo(() => {
    const roomCount = filteredRoomCards.length
    const studentCount = filteredRoomCards.reduce((total, card) => total + card.occupants.length, 0)
    const occupiedRooms = filteredRoomCards.filter((card) => card.occupants.length > 0).length
    return { roomCount, studentCount, occupiedRooms }
  }, [filteredRoomCards])

  const renderRoomCard = (card: RoomCardData) => {
    const { room, occupants } = card
    const occupancyRate = occupants.length / room.capacity
    const isFull = occupancyRate >= 1
    const isEmpty = occupants.length === 0

    const cardClassName = clsx(styles.roomCard, {
      [styles.roomCardFull]: isFull,
      [styles.roomCardEmpty]: isEmpty,
      [styles.roomCardPartial]: !isFull && !isEmpty,
    })

    return (
      <div key={room.id} className={cardClassName}>
        <div className={styles.roomCardHeader}>
          <div className={styles.roomNumber}>{room.roomNumber}</div>
          <div className={styles.roomMeta}>
            <span className={styles.roomType}>{room.roomType ?? '其他'}</span>
            <span className={styles.roomCapacity}>
              {occupants.length}/{room.capacity}
            </span>
          </div>
        </div>
        <div className={styles.roomBody}>
          {isEmpty ? (
            <div className={styles.roomEmptyState}>空房</div>
          ) : (
            <table className={styles.residentTable}>
              <tbody>
                {occupants.map((occ, index) => {
                  const mateName = getCompanionName(occ.student, studentMap)
                  const studentName = occ.student?.name ?? '未登记'
                  const ageLabel = occ.student?.age ? `${occ.student.age}岁` : ''
                  const addr = formatAddress(occ.student, denseMode ? 8 : 10)

                  return (
                    <tr key={`${room.id}-${occ.bedNumber ?? index}`} className={styles.residentRow}>
                      <td className={styles.bedCell}>{getBedSymbol(occ.bedNumber)}</td>
                      <td className={styles.nameCell}>
                        <div className={styles.namePrimary}>
                          {studentName}
                          {mateName && <span className={styles.companionTag}>伴</span>}
                        </div>
                        {mateName && <div className={styles.nameCompanion}>{mateName}</div>}
                      </td>
                      <td className={styles.ageCell}>{ageLabel}</td>
                      <td className={styles.addrCell}>{addr || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

  if (!currentCenter || !currentSession) {
    return (
      <div className={styles.fallback}>
        <div className={styles.fallbackTitle}>打印版房间表</div>
        <Empty description="请选择中心与会期" />
      </div>
    )
  }

  const pageClassName = clsx(styles.page, denseMode && styles.pageCompact)

  return (
    <div className={styles.shell}>
      <div className={styles.controls}>
        <Space size={12} wrap>
          <Segmented
            options={genderOptions}
            value={genderFilter}
            onChange={(value) => setGenderFilter(value as GenderFilter)}
          />
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/allocations')}>
            返回分配页面
          </Button>
          <Segmented
            style={{ marginLeft: 8 }}
            value={denseMode ? 'compact' : 'standard'}
            onChange={(value) => setDenseMode(value === 'compact')}
            options={[
              { label: '标准', value: 'standard' },
              { label: '紧凑', value: 'compact' },
            ]}
          />
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印当前视图
          </Button>
        </Space>
      </div>

      <div className={pageClassName}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.headerCenter}>{currentCenter.centerName}</div>
            <div className={styles.headerSession}>
              {currentSession.sessionCode ?? '未命名期次'} · {currentSession.courseType ?? '未设置课程'}
            </div>
            <div className={styles.headerSubtitle}>
              {genderFilter === 'female' ? '女众' : genderFilter === 'male' ? '男众' : '全部'}房间分配结果
            </div>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>房间</div>
              <div className={styles.statValue}>{stats.roomCount}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>学员</div>
              <div className={styles.statValue}>{stats.studentCount}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>已入住房间</div>
              <div className={styles.statValue}>{stats.occupiedRooms}</div>
            </div>
          </div>
        </header>

        {floors.length === 0 ? (
          <div className={styles.emptyHolder}>
            <Empty description="没有匹配的房间记录" />
          </div>
        ) : (
          floors.map((floor, index) => (
            <section key={floor.floor} className={styles.floorSection} data-floor-index={index}>
              <div className={styles.floorTitle}>第 {floor.floor} 层</div>
              <div className={styles.roomGrid}>{floor.cards.map((card) => renderRoomCard(card))}</div>
            </section>
          ))
        )}

        <footer className={styles.footer}>
          禅修中心智能排床系统 · {new Date().toLocaleDateString('zh-CN')}
        </footer>
      </div>
    </div>
  )
}


