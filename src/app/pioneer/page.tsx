import { TrackingTable } from "@/components/TrackingTable";
import trackingData from "@/data/tracking";

export const metadata = {
  title: "S3 개척 트래킹",
  description: "저돌파 기준 개척 정밀 트래킹 (개간·점령·소탕 액션 로그)",
};

export default function PioneerTrackingPage() {
  return <TrackingTable data={trackingData} />;
}
