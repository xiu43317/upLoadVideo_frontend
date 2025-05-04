import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function Register() {
  const navigate = useNavigate();
  const [account, setAccount] = useState({
    username: "Rock",
    email: "example@test.com",
    password: "example",
    isManger: false
  });
  const handleRegister = async() => {
    try{
        const res = await axios.post(`http://localhost:3000/register`,account)
        alert(res.data)
        navigate("/")
    }catch(err){
        console.log(err)
    }
  };
  const handleInputChange = (e) => {
    const { value, name, checked, type } = e.target;

    setAccount({
      ...account,
      [name]: type==="checkbox" ? checked : value
    });
  };
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <h1 className="mb-5">註冊頁面</h1>
      <form className="d-flex flex-column gap-3">
      <div className="form-floating mb-3">
          <input
            name="username"
            type="text"
            value={account.username}
            onChange={handleInputChange}
            className="form-control"
            id="username"
            placeholder="name@example.com"
          />
          <label htmlFor="username">User name</label>
        </div>
        <div className="form-floating mb-3">
          <input
            name="email"
            type="email"
            value={account.email}
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
        <button type="button" className="btn btn-primary" onClick={handleRegister}>
          註冊
        </button>
      </form>
      <br />
      <NavLink to={"/"}>有帳號者請至首頁</NavLink>
      <br />
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          name="isManger"
          onChange={handleInputChange}
        />
        <label className="form-check-label" htmlFor="flexCheckDefault">
          是否為管理員
        </label>
      </div>
    </div>
  );
}

export default Register;
