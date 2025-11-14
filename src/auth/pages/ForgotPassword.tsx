import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { useAuth } from '../provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

const ForgotPassword = () => {
    const { theme, systemTheme } = useTheme()
    const navigate = useNavigate()
    const auth = useAuth()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const currentTheme = theme === 'system' ? systemTheme : theme
    const logo = currentTheme === 'dark' ? '/timbal_w.svg' : '/timbal_b.svg'

    // Redirect if email/password auth is disabled
    useEffect(() => {
        if (!auth.config.methods.emailPassword) {
            navigate('/auth/login')
        }
    }, [auth.config.methods.emailPassword, navigate])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)
        setLoading(true)

        try {
            const { error } = await auth.resetPasswordForEmail(email)

            if (error) throw error
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link')
        } finally {
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
                        <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
                        <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertDescription className="text-green-600 dark:text-green-400">
                                Check your email for a reset link
                            </AlertDescription>
                        </Alert>
                    )}

                    {!success && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
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
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send reset link
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link
                        to="/auth/login"
                        className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}

export default ForgotPassword