import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { Modal } from "bootstrap";

function App() {
  const [fileInput, setFileInput] = useState({name:""});
  const [videos, setVideos] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [users, setAllusers] = useState([]);
  const [videoInfo,setVideoInfo] = useState([])
  const [user, setUser] = useState({
    isManger: false,
  });
  const [account, setAccount] = useState({
    username: "example@test.com",
    password: "example",
  });
  const [fileName, setFileName] = useState("");
  const [tempFileName,setTempFileName] = useState({name:""})
  const file = useRef(null);
  const modalRef = useRef(null)
  const handleLogin = async () => {
    console.log(account);
    try {
      const res = await axios.post(`http://localhost:3000/login`, account, {
        withCredentials: true,
      });
      console.log(res);
      alert(res.data.message);
      check();
    } catch (err) {
      console.log(err);
    }
  };
  const handleInputChange = (e) => {
    const { value, name } = e.target;

    setAccount({
      ...account,
      [name]: value,
    });
  };
  const handleFileNameChange = (e) => {
    const { value } = e.target;
    setFileName(value);
  };
  const handleTempFileName = (e)=>{
    const {value} = e.target;
    setTempFileName({
      ...tempFileName,
      name:value
    })
  }
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", fileInput);
    try {
      const res = await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      file.current.value = "";
      await axios.post("http://localhost:3000/video",{
        name:fileName,
        fileName:fileInput.name
      })
      alert(res.data);
      getVideos();
    } catch (err) {
      console.log(err);
    }
  };
  const getVideos = async () => {
    try {
      const res = await axios.get("http://localhost:3000/video");
      console.log(res.data);
      setVideos(res.data.filterFiles);
      setVideoInfo({
        ...res.data.videoInfo,
        isRevise:false
      });
    } catch (err) {
      console.log(err);
    }
  };
  const changeTitle = async()=>{
    try{
      const res = await axios.put("http://localhost:3000/video",{
        id:tempFileName._id,
        name:tempFileName.name
      });
      console.log(res)
      handleCloseModal()
      check()
    }catch(err){
      console.log(err)
    }
  }
  const getAllUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/all");
      console.log(res.data);
      setAllusers(res.data);
      console.log(users);
    } catch (err) {
      console.log(err);
    }
  };
  const check = async () => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)user\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common.Authorization = token;
    console.log(token);
    try {
      const res = await axios.get(`http://localhost:3000/check`, {
        withCredentials: true,
      });
      console.log(res);
      setIsAuth(true);
      setUser(res.data.data);
      getAllUsers();
      getVideos();
    } catch (err) {
      console.log(err);
    }
  };
  const logout = async () => {
    const res = await axios.get(`http://localhost:3000/logout`, {
      withCredentials: true,
    });
    alert(res.data.message);
    location.reload();
  };
  const handleCloseModal = () => {
    const modalInstance = Modal.getInstance(modalRef.current);
    setTempFileName({name:""})
    modalInstance.hide();
  };
  const handleOpenModal = (fileInfo) => {
    const modalInstance = Modal.getInstance(modalRef.current);
    setTempFileName(fileInfo)
    modalInstance.show();
  };
  useEffect(() => {
    new Modal(modalRef.current, {
      backdrop: "static",
    });
    check();
  }, []);
  useEffect(() => {
    const dotIndex = fileInput.name.lastIndexOf(".");
    if (dotIndex !== -1) {
      const filenameWithoutExtension = fileInput.name.substring(
        0,
        dotIndex
      );
      console.log(filenameWithoutExtension); // 输出: myFile
      setFileName(filenameWithoutExtension)
    } else {
      console.log(fileInput); // 如果没有副檔名，则输出原始字符串
      // setFileName(fileInput)
    }
  }, [fileInput]);
  return (
    <>
      {!isAuth ? (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input
                name="username"
                type="email"
                value={account.username}
                onChange={handleInputChange}
                className="form-control"
                id="username"
                placeholder="name@example.com"
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                name="password"
                type="password"
                value={account.password}
                onChange={handleInputChange}
                className="form-control"
                id="password"
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleLogin}
            >
              登入
            </button>
          </form>
          <br />
          <NavLink to={"/register"}>沒有帳號者請先註冊</NavLink>
        </div>
      ) : (
        <div>
          {user.isManger && (
            <div>
              <h1>上傳檔案</h1>
              <form id="uploadForm" encType="multipart/form-data">
                <input
                  type="file"
                  name="file"
                  ref={file}
                  id="fileInput"
                  onChange={(e) => setFileInput(e.target.files[0])}
                />
                <label htmlFor="fileName" className="me-3">
                  影片名稱
                </label>
                <input
                  type="text"
                  name="fileName"
                  id="fileName"
                  className="me-3"
                  value={fileName}
                  onChange={handleFileNameChange}
                />
                <button type="button" onClick={uploadFile}>
                  上傳
                </button>
              </form>
              <h2 className="mt-3">使用者名單</h2>
              <ul>
                {users.map((user) => (
                  <li key={user.name}>
                    {user.name}
                    {user.isManger && "  管理員"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <h2>影片列表</h2>
          {videos.map((item, index) => (
            <div key={index} className="d-flex flex-column">
              <h3>{videoInfo[index].name} 
                <button className="btn btn-success" onClick={()=>handleOpenModal(videoInfo[index])}>修改</button>
              </h3>
              <NavLink to={`/singlePage/${item}/title/${videoInfo[index].name}`}>進入觀看</NavLink>
            </div>
          ))}
          <button type="button" onClick={logout} className="btn btn-primary d-block">
            登出
          </button>
        </div>
      )}
      <div className="modal" tabIndex="-1" ref={modalRef}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">修改標題</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={handleCloseModal}></button>
            </div>
            <div className="modal-body">
              <input type="text" className="w-100" value={tempFileName.name} onChange={handleTempFileName}/>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={handleCloseModal}>關閉</button>
              <button type="button" className="btn btn-primary" onClick={changeTitle}>確認修改</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
