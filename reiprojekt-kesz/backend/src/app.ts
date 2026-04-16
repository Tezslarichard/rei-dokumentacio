import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth'
import profilRoutes from './routes/profil'
import termekekRoutes from './routes/termekek'
import kategoriak from './routes/kategoriak'
import kosarRoutes from './routes/kosar'
import rendelesekRoutes from './routes/rendelesek'
import egyebRoutes from './routes/egyeb'
import adminRoutes from './routes/admin'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', authRoutes)
app.use('/api/profil', profilRoutes)
app.use('/api/termekek', termekekRoutes)
app.use('/api/kategoriak', kategoriak)
app.use('/api/kosar', kosarRoutes)
app.use('/api/rendelesek', rendelesekRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api', egyebRoutes)

export default app
