'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday } from 'date-fns'
import { 
  LogOut, Calendar, Check, X, 
  CreditCard, User, Clock, Bell
} from 'lucide-react'
import { logout, toggleDayStatus, requestDay, approveRequest } from '@/actions/goodies'

export default function Dashboard({ data }: { data: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  const handleToggle = (date: Date, currentState: string) => {
    startTransition(async () => {
      // If it's NOT_USING or ASSIGNED, toggle back to USING
      const isUsing = currentState !== 'USING'
      await toggleDayStatus(date.toISOString(), isUsing)
      router.refresh()
    })
  }

  const handleRequest = (dayStatusId: string) => {
    startTransition(async () => {
      await requestDay(dayStatusId)
      router.refresh()
    })
  }

  const handleApprove = (requestId: string, dayStatusId: string) => {
    startTransition(async () => {
      await approveRequest(requestId, dayStatusId)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-full">
            <CreditCard className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              Goodies Platform
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              User: <span className="font-mono font-medium">{data.user.goodiesNumber}</span>
            </p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: My Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-bold">My Schedule</h2>
            </div>
            
            <div className="space-y-4">
              {data.schedule.map((day: any) => {
                const pendingRequests = day.requests?.filter((r: any) => r.status === 'PENDING') || []
                const approvedRequest = day.requests?.find((r: any) => r.status === 'APPROVED')
                
                return (
                  <div key={day.date.toISOString()} className={`p-4 rounded-xl border transition-all ${day.status === 'USING' ? 'bg-gray-50/50 dark:bg-gray-900/50 border-transparent' : 'bg-white dark:bg-slate-900 border-indigo-500/20 shadow-sm'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-lg flex items-center gap-2">
                          {format(day.date, 'EEEE, MMM do')}
                          {isToday(day.date) && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Today</span>}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {day.status === 'USING' && "You are using it (Hidden)"}
                          {day.status === 'NOT_USING' && "Available to public"}
                          {day.status === 'ASSIGNED' && "Assigned to a requester"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggle(day.date, day.status)}
                          disabled={isPending || day.status === 'ASSIGNED'}
                          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${day.status === 'USING' ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${day.status === 'USING' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium w-24">
                          {day.status === 'USING' ? 'Using' : 'Not Using'}
                        </span>
                      </div>
                    </div>

                    {/* Approvals Section */}
                    {day.status === 'NOT_USING' && pendingRequests.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Bell className="w-4 h-4 text-amber-500" />
                          {pendingRequests.length} Pending Request{pendingRequests.length > 1 ? 's' : ''}
                        </p>
                        <div className="space-y-2">
                          {pendingRequests.map((req: any) => (
                            <div key={req.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg text-sm">
                              <span className="font-mono flex items-center gap-2">
                                <User className="w-4 h-4" /> {req.requester.goodiesNumber}
                              </span>
                              <button
                                onClick={() => handleApprove(req.id, day.id)}
                                disabled={isPending}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1 font-medium"
                              >
                                <Check className="w-4 h-4" /> Approve
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {day.status === 'ASSIGNED' && approvedRequest && (
                      <div className="mt-4 pt-4 border-t border-emerald-500/20">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Approved for <span className="font-mono">{approvedRequest.requester.goodiesNumber}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Sidebar: Marketplace & My Requests */}
        <div className="space-y-6">
          <section className="glass-card p-6 border-t-4 border-t-indigo-500">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-bold">Available Goodies</h2>
            </div>
            
            {data.marketplace.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-8">
                No cards available in the next 7 days.
              </p>
            ) : (
              <div className="space-y-3">
                {data.marketplace.map((md: any) => (
                  <div key={md.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{format(md.date, 'MMM do (EEE)')}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">Owner: {md.owner.goodiesNumber}</p>
                    </div>
                    {md.hasRequested ? (
                      <span className="text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                        Requested
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequest(md.id)}
                        disabled={isPending}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold px-3 py-1.5 rounded-md transition-colors"
                      >
                        Request
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card p-6 border-t-4 border-t-purple-500">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-purple-500" />
              <h2 className="text-xl font-bold">My Requests</h2>
            </div>

            {data.myRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-8">
                You haven't requested any cards.
              </p>
            ) : (
              <div className="space-y-3">
                {data.myRequests.map((req: any) => (
                  <div key={req.id} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{format(req.dayStatus.date, 'MMM do')}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">From: {req.dayStatus.owner.goodiesNumber}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
