'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { addDays, startOfDay, format } from 'date-fns'

const COOKIE_NAME = 'goodies_session'

export async function login(number: string) {
  if (!/^\d{7}$/.test(number)) {
    throw new Error('Number must be exactly 7 digits')
  }

  let user = await prisma.user.findUnique({
    where: { goodiesNumber: number }
  })

  if (!user) {
    user = await prisma.user.create({
      data: { goodiesNumber: number }
    })
  }

  // Await the cookies() call in Next.js 15+
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })

  return user
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get(COOKIE_NAME)?.value

  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  return user
}

export async function getDashboardData() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const today = startOfDay(new Date())
  const sevenDaysFromNow = addDays(today, 6)

  // 1. My Schedule
  const myDays = await prisma.dayStatus.findMany({
    where: {
      ownerId: user.id,
      date: {
        gte: today,
        lte: sevenDaysFromNow
      }
    },
    include: {
      requests: {
        include: {
          requester: true
        }
      }
    }
  })

  // Normalize to 7 days
  const schedule = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(today, i)
    const existing = myDays.find(md => md.date.getTime() === d.getTime())
    return {
      date: d,
      status: existing ? existing.state : 'USING',
      id: existing?.id,
      requests: existing?.requests || []
    }
  })

  // 2. Marketplace (Available)
  const marketplaceDays = await prisma.dayStatus.findMany({
    where: {
      ownerId: { not: user.id },
      date: {
        gte: today,
        lte: sevenDaysFromNow
      },
      state: 'NOT_USING'
    },
    include: {
      owner: true,
      requests: {
        where: {
          requesterId: user.id
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  const marketplace = marketplaceDays.map(md => ({
    ...md,
    hasRequested: md.requests.length > 0
  }))

  // 3. My Requests
  const myRequests = await prisma.dayRequest.findMany({
    where: {
      requesterId: user.id,
      dayStatus: {
        date: {
          gte: today,
          lte: sevenDaysFromNow
        }
      }
    },
    include: {
      dayStatus: {
        include: {
          owner: true
        }
      }
    },
    orderBy: {
      dayStatus: {
        date: 'asc'
      }
    }
  })

  return { schedule, marketplace, myRequests, user }
}

export async function toggleDayStatus(dateStr: string, isUsing: boolean) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const date = startOfDay(new Date(dateStr))

  if (isUsing) {
    // Delete the explicit record, resetting to implicit "USING"
    await prisma.dayStatus.deleteMany({
      where: {
        ownerId: user.id,
        date: date
      }
    })
  } else {
    // Create or update to "NOT_USING"
    await prisma.dayStatus.upsert({
      where: {
        ownerId_date: {
          ownerId: user.id,
          date: date
        }
      },
      create: {
        ownerId: user.id,
        date: date,
        state: 'NOT_USING'
      },
      update: {
        state: 'NOT_USING'
      }
    })
  }
}

export async function requestDay(dayStatusId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  await prisma.dayRequest.create({
    data: {
      dayStatusId,
      requesterId: user.id
    }
  })
}

export async function approveRequest(requestId: string, dayStatusId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  // Verify ownership
  const dayStatus = await prisma.dayStatus.findUnique({
    where: { id: dayStatusId }
  })

  if (!dayStatus || dayStatus.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }

  // Use a transaction
  await prisma.$transaction([
    // Update the chosen request to APPROVED
    prisma.dayRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    }),
    // Update all other requests for this day to DECLINED
    prisma.dayRequest.updateMany({
      where: {
        dayStatusId: dayStatusId,
        id: { not: requestId }
      },
      data: { status: 'DECLINED' }
    }),
    // Update the day status to ASSIGNED
    prisma.dayStatus.update({
      where: { id: dayStatusId },
      data: { state: 'ASSIGNED' }
    })
  ])
}
