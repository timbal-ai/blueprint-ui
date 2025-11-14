import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useAuth, type OAuthProvider } from '../provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { OAuthButtons } from '../components/OAuthButtons'

const LogIn = () => {
    const { theme, systemTheme } = useTheme()
    const navigate = useNavigate()
    const auth = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const currentTheme = theme === 'system' ? systemTheme : theme
    const logo = currentTheme === 'dark' ? '/timbal_w.svg' : '/timbal_b.svg'

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { error } = await auth.signInWithPassword(email, password)

            if (error) throw error
            navigate('/')
        } catch (err: any) {
            setError(err.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    const handleOAuthLogin = async (provider: OAuthProvider) => {
        setError(null)
        setLoading(true)

        try {
            const { error } = await auth.signInWithOAuth(provider)

            if (error) throw error
        } catch (err: any) {
            setError(err.message || 'OAuth authentication failed')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="flex justify-center mb-4 mr-1">
                <img src={logo} alt="Timbal" className="h-5 w-auto" />
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-4">

                    <div className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                        <CardDescription>Sign in to your account to continue</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {auth.config.methods.emailPassword && (
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={"********"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Link
                                to="/auth/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign in
                        </Button>
                    </form>
                    )}

                    {auth.config.methods.emailPassword && auth.config.methods.oauth && (
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                    )}

                    <OAuthButtons onOAuthClick={handleOAuthLogin} loading={loading} />
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default LogIn