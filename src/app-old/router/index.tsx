// src/app/router/index.tsx

import { useRoutes } from "react-router-dom";
import { routes } from "./routes";

export const AppRouter = () => {
  const elements = useRoutes(routes);
  return elements;
};
