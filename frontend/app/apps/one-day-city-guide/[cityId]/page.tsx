import { CITY_GUIDES } from "../data";
import CityDetailClient from "./CityDetailClient";
import { use } from "react";

export function generateStaticParams() {
  return Object.keys(CITY_GUIDES).map((cityId) => ({
    cityId,
  }));
}

export default function CityDetailPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = use(params);
  return <CityDetailClient cityId={cityId} />;
}
