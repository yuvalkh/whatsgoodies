'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday } from 'date-fns'
import { 
  LogOut, Calendar, Check, X, 
  CreditCard, User, Clock, Bell, Edit3, ArrowRight, XCircle, Info
} from 'lucide-react'
import { 
  logout, toggleDayStatus, requestDay, approveRequest, 
  cancelAssignment, updateProfile, declineRequest, releaseCard 
} from '@/actions/goodies'

export default function Dashboard({ data }: { data: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(data.user.name === 'Goodies User')
  const [newName, setNewName] = useState(data.user.name === 'Goodies User' ? '' : data.user.name)
  const [profileError, setProfileError] = useState('')

  // Day Details Modal
  const [selectedDay, setSelectedDay] = useState<any>(null)

  const handleLogout = async () => {
    await logout()
    router.refresh()
  }

  const handleToggle = (date: Date, currentState: string) => {
    startTransition(async () => {
      const isUsing = currentState !== 'USING'
      await toggleDayStatus(date.toISOString(), isUsing)
      router.refresh()
      setSelectedDay(null)
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
      setSelectedDay(null)
    })
  }

  const handleDecline = (requestId: string, dayStatusId: string) => {
    startTransition(async () => {
      await declineRequest(requestId, dayStatusId)
      router.refresh()
      setSelectedDay(null)
    })
  }

  const handleCancelAssignment = (dayStatusId: string) => {
    startTransition(async () => {
      await cancelAssignment(dayStatusId)
      router.refresh()
      setSelectedDay(null)
    })
  }

  const handleRelease = (requestId: string) => {
    startTransition(async () => {
      await releaseCard(requestId)
      router.refresh()
      setSelectedDay(null)
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
          <div className="glass-card p-6 w-full max-w-md animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900">
            <h2 className="text-2xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">Welcome! What should we call you?</h2>
            <p className="text-gray-500 text-sm mb-6">Using real names makes our community much friendlier.</p>
            <input 
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Your Display Name"
              className="glass-input w-full text-lg mb-4"
              autoFocus
            />
            {profileError && <p className="text-red-500 text-sm mb-4">{profileError}</p>}
            <button onClick={handleSaveProfile} disabled={isPending || !newName.trim()} className="primary-btn w-full disabled:opacity-50">
              Save Profile
            </button>
            {data.user.name !== 'Goodies User' && (
              <button onClick={() => setShowProfileModal(false)} className="w-full text-gray-500 mt-4 hover:text-gray-800 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-2xl relative">
            <button onClick={() => setSelectedDay(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-1">{format(selectedDay.date, 'EEEE, MMMM do')}</h2>
            <div className="h-px w-full bg-gray-200 dark:bg-gray-800 my-4" />

            <div className="space-y-6">
              {/* My Card Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">My Card</h3>
                {selectedDay.status === 'USING' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-emerald-800 dark:text-emerald-400 font-bold mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> You are using it</p>
                    <button onClick={() => handleToggle(selectedDay.date, selectedDay.status)} disabled={isPending} className="w-full bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                      Mark as Available to Share
                    </button>
                  </div>
                )}

                {selectedDay.status === 'NOT_USING' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/30">
                    <p className="text-red-800 dark:text-red-400 font-bold mb-2">Available for others</p>
                    
                    {/* Pending Requests */}
                    {selectedDay.requests.filter((r: any) => r.status === 'PENDING').length > 0 ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">Pending Requests:</p>
                        {selectedDay.requests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                          <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded shadow-sm text-sm">
                            <span className="font-medium text-gray-800 dark:text-gray-200">{req.requester.name}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleApprove(req.id, selectedDay.id)} disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded transition-colors text-xs font-bold">Approve</button>
                              <button onClick={() => handleDecline(req.id, selectedDay.id)} disabled={isPending} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded transition-colors text-xs font-bold">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-3 italic">No Takers Yet.</p>
                    )}

                    <button onClick={() => handleToggle(selectedDay.date, selectedDay.status)} disabled={isPending} className="w-full mt-3 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                      Cancel Sharing (Mark Using)
                    </button>
                  </div>
                )}

                {selectedDay.status === 'ASSIGNED' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/30">
                    <p className="text-red-800 dark:text-red-400 font-bold mb-1">Shared & Assigned</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Taken by: {selectedDay.requests.find((r: any) => r.status === 'APPROVED')?.requester?.name}</p>
                    <button onClick={() => handleCancelAssignment(selectedDay.id)} disabled={isPending} className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> Revoke Assignment
                    </button>
                  </div>
                )}
              </div>

              {/* My Borrowed Cards */}
              {selectedDay.borrowings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Borrowed Cards</h3>
                  <div className="space-y-2">
                    {selectedDay.borrowings.map((borrowing: any) => (
                      <div key={borrowing.id} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800/30 flex items-center justify-between">
                        <div>
                          <p className="text-orange-800 dark:text-orange-400 font-bold text-sm">From {borrowing.dayStatus.owner.name}</p>
                        </div>
                        <button onClick={() => handleRelease(borrowing.id)} disabled={isPending} className="bg-white hover:bg-orange-100 text-orange-600 border border-orange-200 px-3 py-1.5 rounded-md transition-colors text-xs font-bold">
                          Release
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              Goodies Platform V3
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-lg">{data.user.name}</span>
              <button onClick={() => setShowProfileModal(true)} className="text-gray-400 hover:text-indigo-500 transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-medium">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      {/* Suggested Matches Widget */}
      {data.suggestions?.length > 0 && (
        <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
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
        {/* Main Column: Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-500" />
                <h2 className="text-xl font-bold">Workweek Calendar</h2>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> Using</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Shared</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400"></span> Borrowing</div>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map(d => (
                <div key={d} className="text-center text-xs font-bold uppercase tracking-wider text-gray-500 pb-2">{d}</div>
              ))}

              {data.schedule.map((day: any) => {
                const isBorrowing = day.borrowings.length > 0
                const pendingRequests = day.requests?.filter((r: any) => r.status === 'PENDING') || []
                const approvedRequest = day.requests?.find((r: any) => r.status === 'APPROVED')
                
                // Color Logic
                let bgColor = 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
                let textColor = 'text-emerald-700 dark:text-emerald-400'
                
                if (isBorrowing) {
                  bgColor = 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-900/50 border-orange-300 dark:border-orange-700 shadow-md ring-1 ring-orange-400/50'
                  textColor = 'text-orange-800 dark:text-orange-400'
                } else if (day.status === 'NOT_USING') {
                  bgColor = 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800'
                  textColor = 'text-red-700 dark:text-red-400'
                } else if (day.status === 'ASSIGNED') {
                  bgColor = 'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 border-red-300 dark:border-red-700 shadow-inner'
                  textColor = 'text-red-800 dark:text-red-300'
                }

                return (
                  <div key={day.date.toISOString()} className={`relative p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-28 group ${bgColor}`}
                       onClick={() => setSelectedDay(day)}
                  >
                    <span className={`text-2xl font-black ${textColor}`}>{format(day.date, 'd')}</span>
                    
                    {isToday(day.date) && <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow z-10">TODAY</span>}

                    {/* Borrowing State UI */}
                    {isBorrowing && (
                      <div className="absolute inset-x-1 bottom-1 text-[9px] sm:text-[10px] font-bold bg-orange-200 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded truncate">
                        Borrowing: {day.borrowings.map((b:any) => b.dayStatus.owner.name.split(' ')[0]).join(', ')}
                      </div>
                    )}

                    {/* Shared State UI */}
                    {!isBorrowing && day.status === 'NOT_USING' && (
                      <div className="absolute inset-x-1 bottom-1 flex flex-col gap-1 items-center">
                        <span className="text-[9px] font-bold text-red-600/70 dark:text-red-400/70 uppercase">No Takers</span>
                        {pendingRequests.length > 0 && (
                          <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold shadow animate-pulse">
                            {pendingRequests.length} Req
                          </span>
                        )}
                      </div>
                    )}

                    {!isBorrowing && day.status === 'ASSIGNED' && (
                      <div className="absolute inset-x-1 bottom-1 text-[9px] sm:text-[10px] font-bold bg-red-200 dark:bg-red-900/80 text-red-800 dark:text-red-200 px-1 py-0.5 rounded truncate">
                        Taken: {approvedRequest?.requester?.name.split(' ')[0]}
                      </div>
                    )}

                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Info className={`w-3.5 h-3.5 ${textColor} opacity-50`} />
                    </div>
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
              <h2 className="text-xl font-bold">Marketplace</h2>
            </div>
            
            {data.marketplace.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center py-8">
                No cards available.
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
                      <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded">
                        Requested
                      </span>
                    ) : (
                      <button onClick={() => handleRequest(md.id)} disabled={isPending} className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-3 py-1.5 rounded-md transition-colors">
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
              <h2 className="text-xl font-bold">My Sent Requests</h2>
            </div>

            {data.myRequests.length === 0 ? (
              <p className="text-gray-500 text-sm italic text-center py-8">
                You haven't requested any cards.
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {data.myRequests.map((req: any) => (
                  <div key={req.id} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between border border-transparent">
                    <div>
                      <p className="font-bold text-sm">{format(req.dayStatus.date, 'MMM do')}</p>
                      <p className="text-xs font-medium mt-1">From: {req.dayStatus.owner.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                      {req.status === 'APPROVED' && (
                        <button onClick={() => handleRelease(req.id)} disabled={isPending} className="text-[10px] text-red-500 hover:text-red-700 font-bold underline">
                          Release
                        </button>
                      )}
                    </div>
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
