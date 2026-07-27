import { useSelector, useDispatch } from "react-redux";
import { selectPlatforms, selectSelectedPlatform, setSelectedPlatform } from "./platformsSlice";

export default function PlatformSelector() {
  const dispatch = useDispatch();
  const platforms = useSelector(selectPlatforms);
  const selected = useSelector(selectSelectedPlatform);

  return (
    <>
      <label>Select Platform</label>
      <select value={selected} onChange={(e) => dispatch(setSelectedPlatform(e.target.value))}>
        {platforms.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
    </>
  );
}
