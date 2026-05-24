'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday } from 'date-fns'
import { 
  LogOut, Calendar, Check, X, 
  CreditCard, User, Clock, Bell, Edit3, XCircle, Info, Plus
} from 'lucide-react'
import { 
  logout, toggleDayStatus, requestDay, approveRequest, 
  cancelAssignment, updateProfile, declineRequest, releaseCard,
  cancelRequest
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

  const handleCancelRequest = (requestId: string) => {
    startTransition(async () => {
      await cancelRequest(requestId)
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

  // Helper to re-evaluate marketplace context dynamically when modal opens
  const getExternalCardsForDay = (date: Date) => {
    return data.marketplace.filter((md: any) => 
      new Date(md.date).getTime() === new Date(date).getTime()
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border-indigo-500/30">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-in zoom-in-95 duration-200 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setSelectedDay(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-1">{format(selectedDay.date, 'EEEE, MMMM do')}</h2>
            <div className="h-px w-full bg-gray-200 dark:bg-gray-800 my-4" />

            <div className="space-y-6">
              {/* My Borrowed Cards (Priority View) */}
              {selectedDay.borrowings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Check className="w-4 h-4 text-orange-500" /> Borrowed Cards Ready</h3>
                  <div className="space-y-2">
                    {selectedDay.borrowings.map((borrowing: any) => (
                      <div key={borrowing.id} className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-orange-900 dark:text-orange-300 font-bold text-sm">Owner: {borrowing.dayStatus.owner.name}</p>
                          <p className="text-orange-700 dark:text-orange-400 font-mono text-lg font-bold tracking-widest mt-1 bg-white/50 dark:bg-black/20 inline-block px-2 py-0.5 rounded shadow-inner">
                            {borrowing.dayStatus.owner.goodiesNumber}
                          </p>
                        </div>
                        <button onClick={() => handleRelease(borrowing.id)} disabled={isPending} className="bg-white dark:bg-slate-800 hover:bg-orange-50 text-red-600 border border-orange-200 dark:border-orange-700 px-4 py-2 rounded-lg transition-colors text-xs font-bold w-full sm:w-auto text-center shadow-sm">
                          Release
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Card Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">My Card Status</h3>
                {selectedDay.status === 'USING' && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-emerald-800 dark:text-emerald-400 font-bold mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> You are using it</p>
                    <button onClick={() => handleToggle(selectedDay.date, selectedDay.status)} disabled={isPending} className="w-full bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
                      Mark as Available to Share
                    </button>
                  </div>
                )}

                {selectedDay.status === 'NOT_USING' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                    <p className="text-red-800 dark:text-red-400 font-bold mb-2">Available for others</p>
                    
                    {/* Pending Requests */}
                    {selectedDay.requests.filter((r: any) => r.status === 'PENDING').length > 0 ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300">Pending Requests:</p>
                        {selectedDay.requests.filter((r: any) => r.status === 'PENDING').map((req: any) => (
                          <div key={req.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm text-sm border border-red-100 dark:border-red-900/30">
                            <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2"><User className="w-3.5 h-3.5 text-red-500" />{req.requester.name}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleApprove(req.id, selectedDay.id)} disabled={isPending} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-bold shadow-sm">Approve</button>
                              <button onClick={() => handleDecline(req.id, selectedDay.id)} disabled={isPending} className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-md transition-colors text-xs font-bold">Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-3 italic">No Takers Yet.</p>
                    )}

                    <button onClick={() => handleToggle(selectedDay.date, selectedDay.status)} disabled={isPending} className="w-full mt-4 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold py-2 px-4 rounded-lg transition-colors text-sm shadow-sm">
                      Cancel Sharing (Mark Using)
                    </button>
                  </div>
                )}

                {selectedDay.status === 'ASSIGNED' && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
                    <p className="text-red-800 dark:text-red-400 font-bold mb-1">Shared & Assigned</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Taken by: {selectedDay.requests.find((r: any) => r.status === 'APPROVED')?.requester?.name}</p>
                    <button onClick={() => handleCancelAssignment(selectedDay.id)} disabled={isPending} className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                      <XCircle className="w-4 h-4" /> Revoke Assignment
                    </button>
                  </div>
                )}
              </div>

              {/* Discover & Request (Marketplace for this Day) */}
              {(() => {
                const externalCards = getExternalCardsForDay(selectedDay.date)
                if (externalCards.length === 0) return null

                return (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-500" /> Available to Borrow</h3>
                    <div className="space-y-2">
                      {externalCards.map((md: any) => {
                        // md.requests contains the current user's requests
                        const userReq = md.requests.find((r: any) => r.requesterId === data.user.id && (r.status === 'PENDING' || r.status === 'APPROVED'))
                        
                        return (
                          <div key={md.id} className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between shadow-sm">
                            <span className="font-medium text-indigo-900 dark:text-indigo-300 text-sm">{md.owner.name}</span>
                            
                            {userReq?.status === 'PENDING' ? (
                              <button onClick={() => handleCancelRequest(userReq.id)} disabled={isPending} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shadow-sm">
                                Cancel Request
                              </button>
                            ) : userReq?.status === 'APPROVED' ? (
                              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-md">Approved!</span>
                            ) : (
                              <button onClick={() => handleRequest(md.id)} disabled={isPending} className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-md transition-colors shadow-sm">
                                Request
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
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
              Goodies Platform V4
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

      {/* Main Column: Calendar (Full Width Streamlined) */}
      <div className="space-y-6">
        <section className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-500" />
              <h2 className="text-xl font-bold">Workweek Booking Calendar</h2>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-gray-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm"></span> Using</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-red-500 shadow-sm"></span> Shared</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-md bg-orange-400 shadow-sm"></span> Borrowing</div>
              <div className="flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-600 pl-3"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span></span> Available to Borrow</div>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-3 md:gap-4">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map(d => (
              <div key={d} className="text-center text-sm font-bold uppercase tracking-widest text-gray-400 pb-2">{d}</div>
            ))}

            {data.schedule.map((day: any) => {
              const isBorrowing = day.borrowings.length > 0
              const pendingRequests = day.requests?.filter((r: any) => r.status === 'PENDING') || []
              const approvedRequest = day.requests?.find((r: any) => r.status === 'APPROVED')
              
              // Check if there are external cards available
              const availableExternalCards = getExternalCardsForDay(day.date)
              const canBorrow = availableExternalCards.length > 0
              
              // Color Logic
              let bgColor = 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
              let textColor = 'text-emerald-700 dark:text-emerald-400'
              
              if (isBorrowing) {
                bgColor = 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-900/50 border-orange-400 dark:border-orange-600 shadow-md ring-2 ring-orange-400/20'
                textColor = 'text-orange-800 dark:text-orange-400'
              } else if (day.status === 'NOT_USING') {
                bgColor = 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800'
                textColor = 'text-red-700 dark:text-red-400'
              } else if (day.status === 'ASSIGNED') {
                bgColor = 'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 border-red-300 dark:border-red-700 shadow-inner'
                textColor = 'text-red-800 dark:text-red-300'
              }

              return (
                <div key={day.date.toISOString()} className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-28 sm:h-32 group ${bgColor}`}
                     onClick={() => setSelectedDay(day)}
                >
                  <span className={`text-2xl sm:text-3xl font-black ${textColor}`}>{format(day.date, 'd')}</span>
                  
                  {isToday(day.date) && <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md z-10">TODAY</span>}

                  {/* Pulsing indicator if cards are available to borrow */}
                  {canBorrow && !isBorrowing && day.status !== 'NOT_USING' && day.status !== 'ASSIGNED' && (
                    <div className="absolute top-2 right-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 shadow-sm border border-white dark:border-slate-800"></span>
                      </span>
                    </div>
                  )}

                  {/* Borrowing State UI */}
                  {isBorrowing && (
                    <div className="absolute inset-x-2 bottom-2 text-[10px] sm:text-xs font-bold bg-orange-200 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200 px-1.5 py-1 rounded-md truncate shadow-sm">
                      Borrowing: {day.borrowings.map((b:any) => b.dayStatus.owner.name.split(' ')[0]).join(', ')}
                    </div>
                  )}

                  {/* Shared State UI */}
                  {!isBorrowing && day.status === 'NOT_USING' && (
                    <div className="absolute inset-x-2 bottom-2 flex flex-col gap-1 items-center">
                      <span className="text-[10px] sm:text-xs font-bold text-red-600/80 dark:text-red-400/80 uppercase tracking-tight">No Takers</span>
                      {pendingRequests.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse whitespace-nowrap">
                          {pendingRequests.length} Req
                        </span>
                      )}
                    </div>
                  )}

                  {!isBorrowing && day.status === 'ASSIGNED' && (
                    <div className="absolute inset-x-2 bottom-2 text-[10px] sm:text-xs font-bold bg-red-200 dark:bg-red-900/80 text-red-800 dark:text-red-200 px-1.5 py-1 rounded-md truncate shadow-sm">
                      Taken: {approvedRequest?.requester?.name.split(' ')[0]}
                    </div>
                  )}

                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className={`w-4 h-4 ${textColor} opacity-50`} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
