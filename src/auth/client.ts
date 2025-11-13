import { createClient } from '@supabase/supabase-js'

const authUrl = import.meta.env.VITE_APP_AUTH_URL
const authKey = import.meta.env.VITE_APP_AUTH_KEY

export const authClient = createClient(authUrl, authKey) 