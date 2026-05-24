'use server'

import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { startOfDay, getDay } from 'date-fns'
import { getCurrentUser } from '@/lib/data'

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

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  return user
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function toggleDayStatus(dateStr: string, isUsing: boolean) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const date = startOfDay(new Date(dateStr))
  
  // Prevent Fridays and Saturdays from being stored
  const dayOfWeek = getDay(date)
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    throw new Error('Weekends are not supported')
  }

  if (isUsing) {
    // Delete the explicit record, resetting to implicit "USING".
    // Due to onDelete: Cascade, all associated requests (pending/approved) are deleted.
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

  const dayStatus = await prisma.dayStatus.findUnique({
    where: { id: dayStatusId }
  })

  if (!dayStatus || dayStatus.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.$transaction([
    prisma.dayRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    }),
    prisma.dayRequest.updateMany({
      where: {
        dayStatusId: dayStatusId,
        id: { not: requestId }
      },
      data: { status: 'DECLINED' }
    }),
    prisma.dayStatus.update({
      where: { id: dayStatusId },
      data: { state: 'ASSIGNED' }
    })
  ])
}

export async function declineRequest(requestId: string, dayStatusId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const dayStatus = await prisma.dayStatus.findUnique({
    where: { id: dayStatusId }
  })

  if (!dayStatus || dayStatus.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }

  // Delete or mark declined. We will delete it to clean up the DB
  await prisma.dayRequest.delete({
    where: { id: requestId }
  })
}

export async function cancelAssignment(dayStatusId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const dayStatus = await prisma.dayStatus.findUnique({
    where: { id: dayStatusId }
  })

  if (!dayStatus || dayStatus.ownerId !== user.id) {
    throw new Error('Unauthorized')
  }

  await prisma.$transaction([
    prisma.dayRequest.deleteMany({
      where: { dayStatusId, status: 'APPROVED' }
    }),
    prisma.dayStatus.update({
      where: { id: dayStatusId },
      data: { state: 'NOT_USING' }
    })
  ])
}

export async function releaseCard(requestId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  const request = await prisma.dayRequest.findUnique({
    where: { id: requestId },
    include: { dayStatus: true }
  })

  if (!request || request.requesterId !== user.id) {
    throw new Error('Unauthorized')
  }

  // Borrower releases card. Delete the request and open the day.
  await prisma.$transaction([
    prisma.dayRequest.delete({
      where: { id: requestId }
    }),
    prisma.dayStatus.update({
      where: { id: request.dayStatusId },
      data: { state: 'NOT_USING' }
    })
  ])
}

export async function updateProfile(name: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  if (!name.trim()) throw new Error('Name cannot be empty')

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.trim() }
  })
}
