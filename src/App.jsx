import { useEffect, useRef, useState } from "react";
import axios from "axios"

function App() {
  const [fileInput, setFileInput] = useState({});
  const [videos,setVideos] = useState([]);
  const file = useRef(null)
  const uploadFile = async() => {
    const formData = new FormData()
    formData.append('file',fileInput)
    try{
      const res = await axios.post('http://localhost:3000/upload',formData,{
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      alert(res.data)
      file.current.value = ""
      getVideos()
    }catch(err){
      console.log(err)
    }
  };
  const getVideos = async()=>{
    try{
      const res = await axios.get('http://localhost:3000/video')
      console.log(res.data.filterFiles)
      setVideos(res.data.filterFiles)
    }catch(err){
      console.log(err)
    }
  }
  useEffect(()=>{
    getVideos()
  },[])
  return (
    <>
      <h1>上傳檔案</h1>
      <form id="uploadForm" enctype="multipart/form-data">
        <input
          type="file"
          name="file"
          ref={file}
          id="fileInput"
          onChange={(e) => setFileInput(e.target.files[0])}
        />
        <button type="button" onClick={uploadFile}>
          上傳
        </button>
      </form>
      <h1>影片列表</h1>
      {videos.map((item,index)=>
        <video width="320" height="240" controls key={index}>
          <source src={`http://localhost:3000/uploads/${item}`} type="video/mp4"/>
        </video>
      )}
    </>
  );
}

export default App;
