import { SeasonTrackingTable } from "@/components/SeasonTrackingTable";

export const metadata = {
  title: "개척 트래킹 (고돌파)",
  description: "고돌파 기준 개척 정밀 트래킹 (선택한 시즌 기준)",
};

export default function PioneerHighTrackingPage() {
  return <SeasonTrackingTable tier="high" />;
}
