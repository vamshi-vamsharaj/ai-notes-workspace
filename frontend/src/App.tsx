import { useEffect } from "react"
import { api } from "./services/api"

function App() {
  useEffect(() => {
    api.get("/")
      .then(res => console.log(res.data))
  }, [])

  return <div>Peblo AI Notes</div>
}

export default App