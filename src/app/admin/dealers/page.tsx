import { redirect } from "next/navigation";

export default function AdminDealersPage() {
  redirect("/admin/users?tab=dealers");
}