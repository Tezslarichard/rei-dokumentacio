import app from './app'
import { PORT } from './config'

app.listen(PORT, () => {
  console.log(`Backend fut: http://localhost:${PORT}`)
})
