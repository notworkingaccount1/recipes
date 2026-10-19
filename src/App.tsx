import { useRecipes } from "./hooks/useRecipes";
import Page from "./Page";

export default function App() {
  const R = useRecipes();
  if (!R.ready) return null;
  return <Page R={R} />;
}
