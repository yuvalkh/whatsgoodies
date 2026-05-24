import { getCurrentUser, getDashboardData } from '@/lib/data'
import LoginScreen from '@/components/LoginScreen'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <LoginScreen />
  }

  const data = await getDashboardData()
  return <Dashboard data={data} />
}
