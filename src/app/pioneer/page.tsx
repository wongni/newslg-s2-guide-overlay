import { SeasonTrackingTable } from "@/components/SeasonTrackingTable";

export const metadata = {
  title: "개척 트래킹 (저돌파)",
  description: "저돌파 기준 개척 정밀 트래킹 (선택한 시즌 기준)",
};

export default function PioneerTrackingPage() {
  return <SeasonTrackingTable tier="low" />;
}
