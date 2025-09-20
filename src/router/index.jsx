import { createHashRouter } from "react-router-dom";
import App from "../App"
import Register from "../Register"
import SinglePage from "../singlePage";

const router= createHashRouter([
    {
        path:"/",
        element:<App/>
    },
    {
        path:"/register",
        element: <Register/>
    },
    {
        path:"/singlePage/:item/title/:name/videoId/:id",
        element: <SinglePage/>
    }
])

export default router;