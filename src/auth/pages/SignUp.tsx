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

const SignUp = () => {
    const { theme, systemTheme } = useTheme()
    const navigate = useNavigate()
    const auth = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const currentTheme = theme === 'system' ? systemTheme : theme
    const logo = currentTheme === 'dark' ? '/timbal_w.svg' : '/timbal_b.svg'

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            const { error } = await auth.signUp(email, password)

            if (error) throw error
            navigate('/')
        } catch (err: any) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    const handleOAuthSignUp = async (provider: OAuthProvider) => {
        setError(null)
        setLoading(true)

        try {
            const { error } = await auth.signInWithOAuth(provider)

            if (error) throw error
        } catch (err: any) {
            setError(err.message || 'OAuth sign up failed')
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
                        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                        <CardDescription>Get started with your free account</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {auth.config.methods.emailPassword && (
                    <form onSubmit={handleEmailSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
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
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder={"********"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create account
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

                    <OAuthButtons onOAuthClick={handleOAuthSignUp} loading={loading} />
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/auth/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default SignUp
