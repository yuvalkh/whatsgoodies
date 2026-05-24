import { getDashboardData } from '@/actions/goodies'
import LoginScreen from '@/components/LoginScreen'
import Dashboard from '@/components/Dashboard'

export default async function Home() {
  try {
    const data = await getDashboardData()
    return <Dashboard data={data} />
  } catch (e) {
    return <LoginScreen />
  }
}
