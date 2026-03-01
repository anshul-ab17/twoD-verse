
import EngineClient from "./EngineClient"

export default function EnginePage({
  params,
}: {
  params: { spaceId: string }
}) {
  return <EngineClient spaceId={params.spaceId} />
}