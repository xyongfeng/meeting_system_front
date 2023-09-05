import store from "../js/store";
import axios from "../js/axios";

export const initMenu = async (router,store) => {
    if (store.state.routes.length > 0)
        return;
    
    let res = await axios.get("/admins/menu")
    if(res == null) return;
    res = res.data
    // console.log(res)
    if (res){
        let Routes = formatRoutes(res)
        // console.log(Routes)

        store.commit('initRoutes',Routes)
    }
}

export const formatRoutes = (routes) => {
    let fmtRoutes = []
    if(routes == null || ! routes instanceof Array)
        return [];
    
    routes.forEach(router => {
        router.children = formatRoutes(router.children)

        let fmtrouter = {
            path:router.path,
            name:router.name,
            iconCls:router.iconCls,
            children:router.children,
        }

        fmtRoutes.push(fmtrouter)
    });
    return fmtRoutes;
}