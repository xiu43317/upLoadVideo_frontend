import { useParams } from "react-router-dom";
import HlsPlayer from "./components/HlsPlayer";

function SinglePage() {
  const param = useParams();
  console.log(param)
  let split = param.item.split('.')
  split.pop()
  let fileName = split.join('.')
  console.log(fileName)
  return (
    <>
      <h3>{param.name}</h3>
      <HlsPlayer id={param.id} src={`http://localhost:3000/streams/${fileName}/${fileName}.m3u8`}/>
    </>
  );
}

export default SinglePage;
