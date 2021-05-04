import app from "./app"
import { config } from "./config"

app.listen(config.port, () => {
    console.log(`Parser app listening at http://localhost:${config.port}`)
})

