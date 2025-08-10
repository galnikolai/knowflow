import { Login, Graph, Notes, Settings } from "@/pages";
import { ROUTES } from "@/shared/config/routes";
import { Navigate } from "react-router-dom";

export const routes = [
  {
    path: "/",
    element: <Navigate to={ROUTES.NOTES} replace />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.NOTES,
    element: <Notes />,
  },
  {
    path: ROUTES.GRAPH,
    element: <Graph />,
  },
  {
    path: ROUTES.SETTINGS,
    element: <Settings />,
  },
];
