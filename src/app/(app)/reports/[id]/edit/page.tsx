import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/actions/reports";
import { ReportBuilder } from "./report-builder";

export const instant = false;

export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection();

  const result = await getReport(id);
  if ("error" in result && result.error) notFound();
  if (!("data" in result) || !result.data) notFound();

  return <ReportBuilder data={result.data} />;
}
