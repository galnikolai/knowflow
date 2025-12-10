import { redirect } from "next/navigation";

export default function Home() {
  // Серверный редирект на collection
  redirect("/collection");
}
