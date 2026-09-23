import { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import PreferenceOnboardingModal from "./PreferenceOnboardingModal";
import CreateStoryModal from "./CreateStoryModal";

export default function GlobalModals() {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  useEffect(() => {
    window.onOpenCreateStory = () => {
      if (!user) {
        router.visit("/login");
        return;
      }
      setIsStoryModalOpen(true);
    };
    return () => {
      delete window.onOpenCreateStory;
    };
  }, [user]);

  if (!user) return null;

  return (
    <>
      <PreferenceOnboardingModal user={user} />
      <CreateStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        onComplete={() => {
          router.reload({ only: ["stories"] });
        }}
      />
    </>
  );
}
