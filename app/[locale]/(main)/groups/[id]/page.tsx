import { GroupDetailScreen } from "@/features/groups";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params;
  return <GroupDetailScreen groupId={id} />;
}
