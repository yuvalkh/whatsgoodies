'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, addDays } from 'date-fns'
import { 
  LogOut, Calendar, Check, X, 
  CreditCard, User, Clock, Bell, Edit3, ArrowRight, XCircle
} from 'lucide-react'
import { logout, toggleDayStatus, requestDay, approveRequest, cancelAssignment, updateProfile } from '@/actions/goodies'

export default function Dashboard({ data }: { data: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(data.user.name === 'Goodies User')
  const [newName, setNewName] = useState(data.user.name === 'Goodies User' ? '' : data.user.name)
  const [profileError, setProfileError] = useState('')

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  const handleToggle = (date: Date, currentState: string) => {
    startTransition(async () => {
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

  const handleCancelAssignment = (dayStatusId: string) => {
    startTransition(async () => {
      await cancelAssignment(dayStatusId)
      router.refresh()
    })
  }

  const handleSaveProfile = async () => {
    setProfileError('')
    if (!newName.trim()) {
      setProfileError('Name cannot be empty')
      return
    }
    startTransition(async () => {
      try {
        await updateProfile(newName)
        setShowProfileModal(false)
        router.refresh()
      } catch (err: any) {
        setProfileError(err.message)
      }
    })
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-indigo-500/30">
            <h2 className="text-2xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">Welcome! What should we call you?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Using real names makes our community much friendlier.</p>
            <input 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Your Display Name"
              className="glass-input w-full text-lg mb-4"
              autoFocus
            />
            {profileError && <p className="text-red-500 text-sm mb-4">{profileError}</p>}
            <button 
              onClick={handleSaveProfile}
              disabled={isPending || !newName.trim()}
              className="primary-btn w-full disabled:opacity-50"
            >
              Save Profile
            </button>
            {data.user.name !== 'Goodies User' && (
              <button onClick={() => setShowProfileModal(false)} className="w-full text-gray-500 mt-4 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-500/10 p-3 rounded-full hidden sm:block">
            <CreditCard className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              Goodies Platform V2
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-lg">{data.user.name}</span>
              <button onClick={() => setShowProfileModal(true)} className="text-gray-400 hover:text-indigo-500 transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({data.user.goodiesNumber})</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      {/* Suggested Matches Widget */}
      {data.suggestions?.length > 0 && (
        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-indigo-200 animate-pulse" />
            <h2 className="text-lg font-bold">Open Opportunities</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.suggestions.map((md: any) => (
              <div key={md.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col justify-between">
                <p className="text-sm text-indigo-100 mb-2">
                  Looks like <strong className="text-white">{md.owner.name}</strong> isn't using their Goodies on <strong className="text-white">{format(md.date, 'MMMM do')}</strong>!
                </p>
                <button
                  onClick={() => handleRequest(md.id)}
                  disabled={isPending}
                  className="mt-2 text-sm bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  Send Request <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: 30-Day Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold">My 30-Day Calendar</h2>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400"></span> Using</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Available</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Assigned</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {data.schedule.map((day: any) => {
                const pendingRequests = day.requests?.filter((r: any) => r.status === 'PENDING') || []
                const approvedRequest = day.requests?.find((r: any) => r.status === 'APPROVED')
                
                // Colors based on state
                let bgColor = 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-900/40 border-orange-200 dark:border-orange-800'
                let textColor = 'text-orange-700 dark:text-orange-400'
                
                if (day.status === 'NOT_USING') {
                  bgColor = 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800 shadow-sm'
                  textColor = 'text-red-700 dark:text-red-400'
                } else if (day.status === 'ASSIGNED') {
                  bgColor = 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 shadow-md'
                  textColor = 'text-emerald-700 dark:text-emerald-400'
                }

                return (
                  <div key={day.date.toISOString()} className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-28 group ${bgColor}`}
                       onClick={() => day.status !== 'ASSIGNED' && handleToggle(day.date, day.status)}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 opacity-70 ${textColor}`}>{format(day.date, 'EEE')}</span>
                    <span className={`text-2xl font-black ${textColor}`}>{format(day.date, 'd')}</span>
                    
                    {isToday(day.date) && <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">TODAY</span>}

                    {day.status === 'NOT_USING' && pendingRequests.length > 0 && (
                      <span className="absolute -bottom-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {pendingRequests.length}
                      </span>
                    )}

                    {day.status === 'ASSIGNED' && (
                      <div className="absolute -bottom-2 w-[90%] text-[10px] font-bold bg-emerald-600 text-white px-1 py-0.5 rounded shadow truncate">
                        {approvedRequest?.requester?.name.split(' ')[0]}
                      </div>
                    )}

                    {/* Hover text for default state toggle */}
                    {day.status !== 'ASSIGNED' && (
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs font-bold">
                          {day.status === 'USING' ? 'Mark Available' : 'Mark Using'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Approvals section below the grid for any days that have requests */}
            {data.schedule.some((d: any) => d.status === 'NOT_USING' && d.requests.some((r: any) => r.status === 'PENDING')) && (
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Pending Requests for Your Days</h3>
                <div className="space-y-4">
                  {data.schedule.filter((d: any) => d.status === 'NOT_USING' && d.requests.some((r: any) => r.status === 'PENDING')).map((day: any) => (
                    <div key={day.id} className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <p className="font-bold text-amber-800 dark:text-amber-500 mb-2">{format(day.date, 'EEEE, MMMM do')}</p>
                      <div className="space-y-2">
                        {day.requests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                          <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
                            <span className="font-medium text-sm flex items-center gap-2">
                              <User className="w-4 h-4 text-indigo-500" /> {req.requester.name}
                            </span>
                            <button
                              onClick={() => handleApprove(req.id, day.id)}
                              disabled={isPending}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 font-medium text-sm"
                            >
                              <Check className="w-4 h-4" /> Approve
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel Assignments Section */}
            {data.schedule.some((d: any) => d.status === 'ASSIGNED') && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Check className="w-5 h-5 text-emerald-500" /> Confirmed Assignments</h3>
                <div className="space-y-3">
                  {data.schedule.filter((d: any) => d.status === 'ASSIGNED').map((day: any) => {
                    const approvedRequest = day.requests?.find((r: any) => r.status === 'APPROVED')
                    return (
                      <div key={day.id} className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg">
                        <div>
                          <p className="font-bold text-sm text-emerald-800 dark:text-emerald-400">{format(day.date, 'MMM do')}</p>
                          <p className="text-xs font-medium mt-0.5">Assigned to {approvedRequest?.requester?.name}</p>
                        </div>
                        <button
                          onClick={() => handleCancelAssignment(day.id)}
                          disabled={isPending}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-400 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Revoke
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: Marketplace & My Requests */}
        <div className="space-y-6">
          <section className="glass-card p-6 border-t-4 border-t-indigo-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold">Marketplace</h2>
              </div>
            </div>
            
            {data.marketplace.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-8">
                No cards available in the next 30 days.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {data.marketplace.map((md: any) => (
                  <div key={md.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{format(md.date, 'MMM do (EEE)')}</p>
                      <p className="text-xs font-medium mt-1">Owner: {md.owner.name}</p>
                    </div>
                    {md.state === 'ASSIGNED' ? (
                       <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded">
                         Taken
                       </span>
                    ) : md.hasRequested ? (
                      <span className="text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                        Requested
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequest(md.id)}
                        disabled={isPending}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 rounded-md transition-colors"
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
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {data.myRequests.map((req: any) => (
                  <div key={req.id} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{format(req.dayStatus.date, 'MMM do')}</p>
                      <p className="text-xs font-medium mt-1">From: {req.dayStatus.owner.name}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
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
