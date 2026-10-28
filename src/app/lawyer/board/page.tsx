import BoardView from "@/components/lawyer/BoardView";
import LawyerIntro from "@/components/lawyer/LawyerIntro";

export default function LawyerBoardPage() {
  return (
    <>
      <LawyerIntro screen="board" />
      <BoardView />
    </>
  );
}
