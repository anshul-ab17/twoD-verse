import { app } from "./app"
import { PORT } from "./config/env"

app.listen(PORT, () => {
  console.log(`http server running on http://localhost:${PORT}`)
})
