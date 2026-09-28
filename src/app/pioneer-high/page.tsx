import { TrackingTable } from "@/components/TrackingTable";
import trackingDataHigh from "@/data/tracking-high";

export const metadata = {
  title: "S3 개척 트래킹 (고돌파)",
  description: "고돌파 기준 개척 정밀 트래킹 (개간·점령·소탕 액션 로그)",
};

export default function PioneerHighTrackingPage() {
  return (
    <TrackingTable
      data={trackingDataHigh}
      storageKey="s3-pioneer-tracking-high-progress"
    />
  );
}
