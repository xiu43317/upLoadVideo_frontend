import { useRef, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";

function App() {
  const [fileInput, setFileInput] = useState({});
  const [videos, setVideos] = useState([]);
  const [isAuth, setIsAuth] = useState(false);
  const [users,setAllusers] = useState([])
  const [user, setUser] = useState({
    isManger: false,
  });
  const [account, setAccount] = useState({
    username: "example@test.com",
    password: "example",
  });
  const file = useRef(null);
  const handleLogin = async () => {
    console.log(account);
    try {
      const res = await axios.post(`http://localhost:3000/login`, account);
      console.log(res);
      alert(res.data.message);
      if (res.data.user) {
        setIsAuth(true);
        setUser(res.data.user);
        getAllUsers();
        getVideos();
      }
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
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", fileInput);
    try {
      const res = await axios.post("http://localhost:3000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert(res.data);
      file.current.value = "";
      getVideos();
    } catch (err) {
      console.log(err);
    }
  };
  const getVideos = async () => {
    try {
      const res = await axios.get("http://localhost:3000/video");
      console.log(res.data.filterFiles);
      setVideos(res.data.filterFiles);
    } catch (err) {
      console.log(err);
    }
  };
  const getAllUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/all");
      console.log(res.data);
      setAllusers(res.data)
      console.log(users)
    } catch (err) {
      console.log(err);
    }
  };
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
              <h2>使用者名單</h2>
              <ul>
                {users.map((user)=><li>
                  {user.name}
                  {user.isManger && "  管理員"}
                </li>)}
              </ul>
            </div>
          )}
          <h1>影片列表</h1>
          {videos.map((item, index) => (
            <video width="320" height="240" controls key={index}>
              <source
                src={`http://localhost:3000/uploads/${item}`}
                type="video/mp4"
              />
            </video>
          ))}
        </div>
      )}
    </>
  );
}

export default App;
