import { useParams } from "react-router-dom";

function SinglePage() {
  const param = useParams();
  console.log(param)
  return (
    <>
      <h3>{param.name}</h3>
      <video width="320" height="240" controls>
        <source
          src={`http://localhost:3000/uploads/${param.item}`}
          type="video/mp4"
        />
      </video>
    </>
  );
}

export default SinglePage;
