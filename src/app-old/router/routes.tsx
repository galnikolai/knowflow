import { Login, Graph, Settings } from "@/views";
import { Collection } from "@/views/collection/Collection";
import { Trainer } from "@/views/trainer/Trainer";
import { Challenges } from "@/views/trainer/Challenges";
import { Graph as TrainerGraph } from "@/views/trainer/Graph";
import { Cards } from "@/views/trainer/Cards";
import { Study } from "@/views/trainer/Study";
import { ROUTES } from "@/shared/config/routes";
import { Navigate } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";

export const routes = [
  {
    path: "/",
    element: <Navigate to={ROUTES.COLLECTION} replace />,
  },
  {
    path: ROUTES.LOGIN,
    element: <Login />,
  },
  {
    path: ROUTES.COLLECTION,
    element: (
      <RequireAuth>
        <Collection />
      </RequireAuth>
    ),
  },
  {
    path: ROUTES.TRAINER,
    element: (
      <RequireAuth>
        <Trainer />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.TRAINER_CHALLENGES} replace />,
      },
      {
        path: "challenges",
        element: <Challenges />,
      },
      {
        path: "graph",
        element: <TrainerGraph />,
      },
      {
        path: "cards",
        element: <Cards />,
      },
      {
        path: "study",
        element: <Study />,
      },
    ],
  },
  {
    path: ROUTES.GRAPH,
    element: (
      <RequireAuth>
        <Graph />
      </RequireAuth>
    ),
  },
  {
    path: ROUTES.SETTINGS,
    element: (
      <RequireAuth>
        <Settings />
      </RequireAuth>
    ),
  },
];
