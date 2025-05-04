import { createHashRouter } from "react-router-dom";
import App from "../App"
import Register from "../Register"

const router= createHashRouter([
    {
        path:"/",
        element:<App/>
    },
    {
        path:"/register",
        element: <Register/>
    }
])

export default router;