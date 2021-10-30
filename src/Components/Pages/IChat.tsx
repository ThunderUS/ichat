import React, {useState} from 'react';
import "../../style/IChat.scss"
import Chats from "../moduls/IChat/Chats";
import LoginInfo from "../moduls/IChat/LoginInfo";
import Rooms from "../moduls/IChat/Rooms";
import Sender from "../moduls/IChat/Sender";
import {useSelector} from "react-redux";
import {useHistory} from "react-router-dom";
import chats from "../types/chats";
import Store from "../types/Store";
import Invite from "../moduls/IChat/Invite";
import axios from "axios";
import HOST from "../../confige/config";


function IChat() {
    const history = useHistory();
    const store: Store = useSelector((state: Store) => state)
    const [message, setMessage] = useState<chats>({
        id: 0,
        login: store.login,
        message: "",
        date: ""
    })
    const [invite, setInvite] = useState<boolean>(false);
    const [update, setUpdate] = useState<boolean>(false)

    if (store.id === 0) {
        history.push("/");
    }

    return (<>
        {invite && <Invite onClick={(value) => {
            axios.get(HOST + "/user/list").then(res => {
                res.data.map((el: {}) => {
                    return Object.values(el)
                }).flat().forEach((e: string) => {
                    if (e === value) {
                        axios.post(HOST + "/invite", {
                            userNick: value,
                            currentUser: store.login
                        }).then(res => {
                            if (res.status === 200) {
                                setInvite(false);
                                setUpdate(!update);
                            }
                        })
                    }
                })
            })
        }} func={setInvite}/>}
        <div className={"IChat"}>
            <div className="IChat_left">
                <LoginInfo invite={setInvite} name={store.name} surname={store.surname}/>
                <Rooms update={update} login={store.login}/>
            </div>
            <div className="IChat_right">
                <Chats message={message}/>
                <Sender onClick={(value) => {
                    setMessage({
                        id: 0,
                        login: store.login,
                        message: value,
                        date: ""
                    })
                }}/>
            </div>

        </div>

    </>);
}

export default IChat;