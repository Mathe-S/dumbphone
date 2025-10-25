import { DrawingCanvas } from "../../_components/DrawingCanvas";
import { currentUser } from "@clerk/nextjs/server";

export default async function UserDrawPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: pageUserId } = await params;
  const user = await currentUser();
  const currentUserId = user?.id;

  const isOwner = currentUserId === pageUserId;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <DrawingCanvas
        pageUserId={pageUserId}
        currentUserId={currentUserId ?? null}
        isOwner={isOwner}
      />
    </div>
  );
}
