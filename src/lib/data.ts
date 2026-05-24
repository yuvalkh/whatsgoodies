import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { addDays, startOfDay, getDay } from 'date-fns'

const COOKIE_NAME = 'goodies_session'

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
  const thirtyDaysFromNow = addDays(today, 29) // 30 days total

  // Generate the days, filtering out Friday (5) and Saturday (6)
  const workDays: Date[] = []
  for (let i = 0; i < 30; i++) {
    const d = addDays(today, i)
    const dayOfWeek = getDay(d)
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      workDays.push(d)
    }
  }

  // 1. My Schedule
  const myDays = await prisma.dayStatus.findMany({
    where: {
      ownerId: user.id,
      date: {
        gte: today,
        lte: thirtyDaysFromNow
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

  // 2. My Requests (Borrowed or Pending)
  const myRequests = await prisma.dayRequest.findMany({
    where: {
      requesterId: user.id,
      dayStatus: {
        date: {
          gte: today,
          lte: thirtyDaysFromNow
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

  // Normalize to the workDays
  const schedule = workDays.map(d => {
    const existing = myDays.find(md => md.date.getTime() === d.getTime())
    
    // Find if user is borrowing on this day
    const approvedBorrowings = myRequests.filter(req => 
      req.status === 'APPROVED' && req.dayStatus.date.getTime() === d.getTime()
    )

    return {
      date: d,
      status: existing ? existing.state : 'USING',
      id: existing?.id,
      requests: existing?.requests || [],
      borrowings: approvedBorrowings
    }
  })

  // 3. Marketplace (Available)
  const marketplaceDays = await prisma.dayStatus.findMany({
    where: {
      ownerId: { not: user.id },
      date: {
        gte: today,
        lte: thirtyDaysFromNow
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

  // Filter out weekends from marketplace just in case
  const marketplace = marketplaceDays
    .filter(md => {
      const dayOfWeek = getDay(md.date)
      return dayOfWeek !== 5 && dayOfWeek !== 6
    })
    .map(md => ({
      ...md,
      hasRequested: md.requests.length > 0
    }))

  // 4. Suggestions
  // Dates in the next 14 days where there's an available card, that user hasn't requested.
  const suggestions = marketplace
    .filter(md => !md.hasRequested && md.date <= addDays(today, 14))
    .slice(0, 5) // top 5 suggestions

  return { schedule, marketplace, myRequests, suggestions, user }
}
